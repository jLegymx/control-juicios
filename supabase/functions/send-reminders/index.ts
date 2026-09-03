// ════════════════════════════════════════════════════════════════
// Recordatorios diarios — correo (Resend) y Telegram
//
// Pensado para correr una vez al día vía pg_cron (ver
// supabase/README.md). Junta, para TODOS los expedientes activos:
//   - Plazos de contestación vencidos o próximos (≤3 días)
//   - Audiencias próximas (0-3 días)
//   - Vencimientos de cumplimiento de sentencia (≤10 días)
//   - Tareas de agenda vencidas o próximas (≤2 días)
//   - Expedientes con prioridad "urgente" (aviso permanente)
// y le manda un solo resumen diario, por cada canal que tenga
// habilitado, a cada usuario con recordatorios activados. El
// contenido es el mismo para todos los usuarios (igual que el
// banner de notificaciones dentro de la app, que tampoco filtra
// por abogado responsable).
// ════════════════════════════════════════════════════════════════
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') || '';
const RESEND_FROM = Deno.env.get('RESEND_FROM') || 'Control de Juicios <recordatorios@resend.dev>';
const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN') || '';
// Compartido con el job de pg_cron que dispara esta función (ver
// supabase/README.md) — evita que cualquiera con la URL pública
// pueda disparar el envío masivo de recordatorios.
const CRON_SECRET = Deno.env.get('CRON_SECRET') || '';

const sb = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

// ── Ventanas de aviso (en días) ────────────────────────────────────
const WINDOW_CONTESTACION = 3;
const WINDOW_AUDIENCIA = 3;
const WINDOW_CUMPLIMIENTO = 10;
const WINDOW_TAREA = 2;

function diasDesdeHoy(fechaISO: string): number {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const f = new Date(fechaISO + 'T00:00:00');
  return Math.round((f.getTime() - hoy.getTime()) / 86400000);
}

function fmtDias(d: number): string {
  if (d < 0) return `vencido hace ${Math.abs(d)}d`;
  if (d === 0) return 'vence hoy';
  return `vence en ${d}d`;
}

type Item = { tipo: string; texto: string; urgente: boolean };

function construirItems(exps: any[]): Item[] {
  const items: Item[] = [];

  for (const e of exps) {
    const numero = e.numero_juicio || '(sin número)';

    // Si ya se presentó la contestación (hay oficio de respuesta registrado),
    // ya no es un pendiente aunque la fecha límite siga guardada en el
    // expediente — de lo contrario el aviso nunca deja de salir.
    if (e.fecha_contestacion && !e.oficio_contestacion) {
      const d = diasDesdeHoy(e.fecha_contestacion);
      if (d <= WINDOW_CONTESTACION) {
        items.push({
          tipo: 'contestacion',
          texto: `Contestación ${fmtDias(d)} — ${numero} (${e.demandante || 's/d'})`,
          urgente: d < 0,
        });
      }
    }

    if (e.fecha_proxima_audiencia) {
      const d = diasDesdeHoy(e.fecha_proxima_audiencia);
      if (d >= 0 && d <= WINDOW_AUDIENCIA) {
        items.push({
          tipo: 'audiencia',
          texto: `Audiencia ${fmtDias(d)} — ${numero}${e.sala ? ' · ' + e.sala : ''}`,
          urgente: d === 0,
        });
      }
    }

    if (e.fecha_vencimiento_cumplimiento) {
      const d = diasDesdeHoy(e.fecha_vencimiento_cumplimiento);
      if (d <= WINDOW_CUMPLIMIENTO) {
        items.push({
          tipo: 'cumplimiento',
          texto: `Cumplimiento de sentencia ${fmtDias(d)} — ${numero}`,
          urgente: d < 0,
        });
      }
    }

    const tareas = Array.isArray(e.tareas) ? e.tareas : [];
    for (const t of tareas) {
      if (t.completada || !t.fechaLimite) continue;
      const d = diasDesdeHoy(t.fechaLimite);
      if (d <= WINDOW_TAREA) {
        items.push({
          tipo: 'tarea',
          texto: `Tarea "${t.titulo}" ${fmtDias(d)} — ${numero}`,
          urgente: d < 0,
        });
      }
    }

    if (e.prioridad === 'urgente') {
      items.push({
        tipo: 'urgente',
        texto: `Expediente marcado URGENTE — ${numero} (${e.demandante || 's/d'})`,
        urgente: true,
      });
    }
  }
  return items;
}

function itemsAHtml(items: Item[]): string {
  const li = (it: Item) =>
    `<li style="margin-bottom:4px;${it.urgente ? 'color:#991b1b;font-weight:700' : ''}">${escapeHtml(it.texto)}</li>`;
  return `<ul style="padding-left:18px;margin:8px 0">${items.map(li).join('')}</ul>`;
}

function escapeHtml(s: string): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// ── Reserva en reminder_log: true si "gano" el envío de hoy ────────
// Se llama DESPUÉS de confirmar que el envío tuvo éxito (no antes), para
// que un fallo de Resend/Telegram pueda reintentarse en una corrida
// posterior el mismo día en vez de darse por "ya enviado" sin haberlo
// mandado de verdad.
async function reservarEnvio(itemKey: string): Promise<boolean> {
  const { error } = await sb.from('reminder_log').insert({ item_key: itemKey });
  // Violación de la restricción unique (item_key, send_date) = ya enviado hoy
  return !error;
}

async function enviarCorreo(to: string, items: Item[]): Promise<boolean> {
  if (!RESEND_API_KEY) return false;
  const html = `
    <div style="font-family:sans-serif;max-width:560px">
      <h2 style="color:#0f2044">Recordatorios — Sistema de Control de Juicios</h2>
      <p style="color:#64748b;font-size:13px">${items.length} pendiente${items.length !== 1 ? 's' : ''} que requieren tu atención:</p>
      ${itemsAHtml(items)}
    </div>`;
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: RESEND_FROM,
        to: [to],
        subject: `${items.length} recordatorio${items.length !== 1 ? 's' : ''} — Control de Juicios`,
        html,
      }),
    });
    if (!res.ok) {
      console.error('Resend respondió error:', res.status, await res.text().catch(() => ''));
      return false;
    }
    return true;
  } catch (err) {
    console.error('Error enviando correo:', err);
    return false;
  }
}

// Telegram rechaza mensajes de más de 4096 caracteres ("message is too
// long") — con muchos expedientes pendientes un solo mensaje lo rebasa
// fácilmente, así que se reparte en varios mensajes por debajo del límite.
const TELEGRAM_MAX_CHARS = 3500;
function agruparLineasEnMensajes(lineas: string[], maxChars: number): string[] {
  const mensajes: string[] = [];
  let actual = '';
  for (const linea of lineas) {
    const candidato = actual ? actual + '\n' + linea : linea;
    if (candidato.length > maxChars && actual) {
      mensajes.push(actual);
      actual = linea;
    } else {
      actual = candidato;
    }
  }
  if (actual) mensajes.push(actual);
  return mensajes;
}

async function enviarMensajeTelegram(chatId: string, texto: string): Promise<{ ok: boolean; detail: string }> {
  try {
    const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: texto, parse_mode: 'HTML' }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      return { ok: false, detail: `Telegram HTTP ${res.status}: ${body}` };
    }
    return { ok: true, detail: 'ok' };
  } catch (err) {
    return { ok: false, detail: `Excepción: ${String(err)}` };
  }
}

async function enviarTelegram(chatId: string, items: Item[]): Promise<{ ok: boolean; detail: string }> {
  if (!TELEGRAM_BOT_TOKEN) return { ok: false, detail: `TELEGRAM_BOT_TOKEN vacío (largo=${TELEGRAM_BOT_TOKEN.length})` };
  const lineas = items.map((it) => (it.urgente ? `⚠️ <b>${escapeHtml(it.texto)}</b>` : `• ${escapeHtml(it.texto)}`));
  const partes = agruparLineasEnMensajes(lineas, TELEGRAM_MAX_CHARS);
  for (let i = 0; i < partes.length; i++) {
    const encabezado = partes.length > 1
      ? `📋 <b>Recordatorios — Control de Juicios (${i + 1}/${partes.length})</b>\n\n`
      : `📋 <b>Recordatorios — Control de Juicios</b>\n\n`;
    const r = await enviarMensajeTelegram(chatId, encabezado + partes[i]);
    if (!r.ok) return r;
  }
  return { ok: true, detail: 'ok' };
}

Deno.serve(async (req) => {
  if (CRON_SECRET && req.headers.get('x-cron-secret') !== CRON_SECRET) {
    return new Response('forbidden', { status: 403 });
  }
  try {
    const { data: exps, error: expError } = await sb
      .from('expedientes')
      .select(
        'id, numero_juicio, demandante, sala, prioridad, fecha_contestacion, oficio_contestacion, fecha_proxima_audiencia, fecha_vencimiento_cumplimiento, tareas'
      );
    if (expError) throw expError;

    const items = construirItems(exps || []);
    if (items.length === 0) {
      return new Response(JSON.stringify({ ok: true, items: 0, mensaje: 'Nada pendiente hoy' }), { status: 200 });
    }

    const { data: profiles, error: profError } = await sb
      .from('profiles')
      .select('id, nombre, email, email_reminders, telegram_reminders, telegram_chat_id')
      .or('email_reminders.eq.true,telegram_reminders.eq.true');
    if (profError) throw profError;

    let emailsEnviados = 0;
    let telegramsEnviados = 0;
    const debug: string[] = [];

    for (const p of profiles || []) {
      if (p.email_reminders && p.email) {
        const { data: yaEnviado } = await sb
          .from('reminder_log')
          .select('id')
          .eq('item_key', `email:${p.id}`)
          .eq('send_date', new Date().toISOString().slice(0, 10))
          .maybeSingle();
        if (!yaEnviado) {
          const ok = await enviarCorreo(p.email, items);
          if (ok) {
            await reservarEnvio(`email:${p.id}`);
            emailsEnviados++;
          } else {
            debug.push(`email a ${p.nombre || p.id}: falló (RESEND_API_KEY vacío o Resend rechazó)`);
          }
        }
      }
      if (p.telegram_reminders && p.telegram_chat_id) {
        const { data: yaEnviado } = await sb
          .from('reminder_log')
          .select('id')
          .eq('item_key', `telegram:${p.id}`)
          .eq('send_date', new Date().toISOString().slice(0, 10))
          .maybeSingle();
        if (!yaEnviado) {
          const r = await enviarTelegram(p.telegram_chat_id, items);
          if (r.ok) {
            await reservarEnvio(`telegram:${p.id}`);
            telegramsEnviados++;
          } else {
            debug.push(`telegram a ${p.nombre || p.id}: ${r.detail}`);
          }
        }
      }
    }

    return new Response(
      JSON.stringify({ ok: true, items: items.length, emailsEnviados, telegramsEnviados, debug }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('Error en send-reminders:', err);
    return new Response(JSON.stringify({ ok: false, error: String(err) }), { status: 500 });
  }
});
