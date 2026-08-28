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

    if (e.fecha_contestacion) {
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

function itemsATexto(items: Item[]): string {
  return items.map((it) => `${it.urgente ? '⚠ ' : '• '}${it.texto}`).join('\n');
}

function escapeHtml(s: string): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// ── Reserva en reminder_log: true si "gano" el envío de hoy ────────
async function reservarEnvio(itemKey: string): Promise<boolean> {
  const { error } = await sb.from('reminder_log').insert({ item_key: itemKey });
  // Violación de la restricción unique (item_key, send_date) = ya enviado hoy
  return !error;
}

async function enviarCorreo(to: string, items: Item[]) {
  if (!RESEND_API_KEY) return;
  const html = `
    <div style="font-family:sans-serif;max-width:560px">
      <h2 style="color:#0f2044">Recordatorios — Sistema de Control de Juicios</h2>
      <p style="color:#64748b;font-size:13px">${items.length} pendiente${items.length !== 1 ? 's' : ''} que requieren tu atención:</p>
      ${itemsAHtml(items)}
    </div>`;
  await fetch('https://api.resend.com/emails', {
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
  }).catch((err) => console.error('Error enviando correo:', err));
}

async function enviarTelegram(chatId: string, items: Item[]) {
  if (!TELEGRAM_BOT_TOKEN) return;
  const texto = `📋 *Recordatorios — Control de Juicios*\n\n${itemsATexto(items)}`;
  await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text: texto, parse_mode: 'Markdown' }),
  }).catch((err) => console.error('Error enviando Telegram:', err));
}

Deno.serve(async (req) => {
  if (CRON_SECRET && req.headers.get('x-cron-secret') !== CRON_SECRET) {
    return new Response('forbidden', { status: 403 });
  }
  try {
    const { data: exps, error: expError } = await sb
      .from('expedientes')
      .select(
        'id, numero_juicio, demandante, sala, prioridad, fecha_contestacion, fecha_proxima_audiencia, fecha_vencimiento_cumplimiento, tareas'
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

    for (const p of profiles || []) {
      if (p.email_reminders && p.email) {
        if (await reservarEnvio(`email:${p.id}`)) {
          await enviarCorreo(p.email, items);
          emailsEnviados++;
        }
      }
      if (p.telegram_reminders && p.telegram_chat_id) {
        if (await reservarEnvio(`telegram:${p.id}`)) {
          await enviarTelegram(p.telegram_chat_id, items);
          telegramsEnviados++;
        }
      }
    }

    return new Response(
      JSON.stringify({ ok: true, items: items.length, emailsEnviados, telegramsEnviados }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('Error en send-reminders:', err);
    return new Response(JSON.stringify({ ok: false, error: String(err) }), { status: 500 });
  }
});
