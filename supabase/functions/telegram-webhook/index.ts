// ════════════════════════════════════════════════════════════════
// Webhook de Telegram — completa la vinculación de una cuenta y
// atiende el comando /hoy.
//
// El usuario abre en la app "Vincular Telegram", que lo manda a
// https://t.me/<bot>?start=<codigo>. Telegram le envía a este webhook
// un mensaje "/start <codigo>"; buscamos ese código en `profiles`
// (mientras no haya expirado) y guardamos el chat_id para poder
// escribirle después desde send-reminders.
//
// Ya vinculado, el usuario puede escribirle "/hoy" al bot para recibir
// el resumen actual al instante, sin esperar al cron diario de las
// 08:00 — usa la misma lógica que send-reminders (importada de
// ../_shared/reminder-items.ts) pero no toca reminder_log, así que no
// interfiere con el envío automático del día.
//
// Despliegue y registro del webhook: ver supabase/README.md
// ════════════════════════════════════════════════════════════════
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { construirItems, construirItemsBoletin, itemsATextoHtml } from '../_shared/reminder-items.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN')!;
// Secreto opcional (recomendado) que Telegram reenvía en cada request
// si se configuró con `secret_token` al registrar el webhook.
const WEBHOOK_SECRET = Deno.env.get('TELEGRAM_WEBHOOK_SECRET') || '';

const sb = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function sendMessage(chatId: string | number, text: string) {
  await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
  }).catch(() => {});
}

async function enviarResumenAhora(chatId: number) {
  const { data: profile } = await sb
    .from('profiles')
    .select('id')
    .eq('telegram_chat_id', String(chatId))
    .maybeSingle();
  if (!profile) {
    await sendMessage(chatId, 'Todavía no vinculas tu cuenta. Abre "Vincular Telegram" en el Sistema de Control de Juicios para obtener tu enlace.');
    return;
  }

  const [{ data: exps, error: expError }, { data: boletinHits, error: boletinError }] = await Promise.all([
    sb
      .from('expedientes')
      .select(
        'id, numero_juicio, demandante, sala, prioridad, fecha_contestacion, fecha_proxima_audiencia, fecha_vencimiento_cumplimiento, tareas'
      ),
    sb
      .from('boletin_hits')
      .select('expediente_id, sala, demandado, actor, sintesis, keyword_match, tipo_actuacion, expediente, revisado'),
  ]);
  if (expError) {
    await sendMessage(chatId, '⚠ No se pudo armar el resumen ahora mismo. Intenta de nuevo en un rato.');
    return;
  }
  if (boletinError) console.error('Error leyendo boletin_hits:', boletinError);

  const items = [...construirItems(exps || []), ...construirItemsBoletin(boletinHits || [])];
  if (items.length === 0) {
    await sendMessage(chatId, '✅ Nada pendiente por ahora.');
    return;
  }
  await sendMessage(chatId, `📋 <b>Resumen — Control de Juicios</b>\n\n${itemsATextoHtml(items)}`);
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('ok', { status: 200 });

  if (WEBHOOK_SECRET) {
    const got = req.headers.get('X-Telegram-Bot-Api-Secret-Token');
    if (got !== WEBHOOK_SECRET) return new Response('forbidden', { status: 403 });
  }

  let update: any;
  try {
    update = await req.json();
  } catch {
    return new Response('ok', { status: 200 });
  }

  const msg = update?.message;
  const text: string = msg?.text || '';
  const chatId = msg?.chat?.id;
  if (!chatId) return new Response('ok', { status: 200 });

  if (text.startsWith('/hoy') || text.startsWith('/resumen')) {
    await enviarResumenAhora(chatId);
    return new Response('ok', { status: 200 });
  }

  if (!text.startsWith('/start')) return new Response('ok', { status: 200 });

  const code = text.replace('/start', '').trim();
  if (!code) {
    await sendMessage(chatId, 'Abre "Vincular Telegram" en el Sistema de Control de Juicios para obtener tu enlace.');
    return new Response('ok', { status: 200 });
  }

  const { data: profile, error } = await sb
    .from('profiles')
    .select('id, nombre, telegram_link_code_expires')
    .eq('telegram_link_code', code)
    .maybeSingle();

  if (error || !profile) {
    await sendMessage(chatId, '⚠ Código inválido o ya usado. Genera uno nuevo desde la app.');
    return new Response('ok', { status: 200 });
  }
  if (profile.telegram_link_code_expires && new Date(profile.telegram_link_code_expires) < new Date()) {
    await sendMessage(chatId, '⚠ Este código expiró. Genera uno nuevo desde la app.');
    return new Response('ok', { status: 200 });
  }

  await sb
    .from('profiles')
    .update({
      telegram_chat_id: String(chatId),
      telegram_reminders: true,
      telegram_link_code: null,
      telegram_link_code_expires: null,
    })
    .eq('id', profile.id);

  await sendMessage(
    chatId,
    `✅ Telegram vinculado${profile.nombre ? ', ' + profile.nombre : ''}. A partir de ahora recibirás aquí los recordatorios de plazos, audiencias y tareas.`
  );

  return new Response('ok', { status: 200 });
});
