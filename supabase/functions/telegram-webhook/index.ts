// ════════════════════════════════════════════════════════════════
// Webhook de Telegram — completa la vinculación de una cuenta.
//
// El usuario abre en la app "Vincular Telegram", que lo manda a
// https://t.me/<bot>?start=<codigo>. Telegram le envía a este webhook
// un mensaje "/start <codigo>"; buscamos ese código en `profiles`
// (mientras no haya expirado) y guardamos el chat_id para poder
// escribirle después desde send-reminders.
//
// Despliegue y registro del webhook: ver supabase/README.md
// ════════════════════════════════════════════════════════════════
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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
  if (!chatId || !text.startsWith('/start')) return new Response('ok', { status: 200 });

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
