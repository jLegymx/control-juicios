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
//   - Novedades pendientes del Boletín Jurisdiccional (TFJA) que sean
//     relevantes (enlazadas a un expediente propio o que mencionen
//     Baja California), igual que la pestaña Boletín dentro de la app
// y le manda un solo resumen diario, por cada canal que tenga
// habilitado, a cada usuario con recordatorios activados. El
// contenido es el mismo para todos los usuarios (igual que el
// banner de notificaciones dentro de la app, que tampoco filtra
// por abogado responsable).
//
// El armado del resumen (construirItems/construirItemsBoletin) vive en
// ../_shared/reminder-items.ts, compartido con telegram-webhook (comando
// /hoy, que manda el mismo resumen a demanda).
// ════════════════════════════════════════════════════════════════
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Item, construirItems, construirItemsBoletin, itemsAHtml, itemsATextoHtml } from '../_shared/reminder-items.ts';

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

async function enviarTelegram(chatId: string, items: Item[]): Promise<{ ok: boolean; detail: string }> {
  if (!TELEGRAM_BOT_TOKEN) return { ok: false, detail: `TELEGRAM_BOT_TOKEN vacío (largo=${TELEGRAM_BOT_TOKEN.length})` };
  const texto = `📋 <b>Recordatorios — Control de Juicios</b>\n\n${itemsATextoHtml(items)}`;
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

    const { data: boletinHits, error: boletinError } = await sb
      .from('boletin_hits')
      .select('expediente_id, sala, demandado, actor, sintesis, keyword_match, tipo_actuacion, expediente, revisado');
    // La tabla la llena un agente aparte; si aún no existe o falla la
    // consulta, no debe tumbar el resto de los recordatorios.
    if (boletinError) console.error('Error leyendo boletin_hits:', boletinError);

    const items = [...construirItems(exps || []), ...construirItemsBoletin(boletinHits || [])];
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
