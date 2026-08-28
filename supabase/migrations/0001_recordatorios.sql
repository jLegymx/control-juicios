-- ════════════════════════════════════════════════════════════════
-- Recordatorios por correo y Telegram
-- Agrega a `profiles` las preferencias de notificación de cada
-- usuario y la vinculación con Telegram, más una tabla de registro
-- para no enviar el mismo recordatorio dos veces el mismo día.
-- ════════════════════════════════════════════════════════════════

create extension if not exists pgcrypto with schema extensions;

alter table public.profiles
  add column if not exists email_reminders boolean not null default true,
  add column if not exists telegram_reminders boolean not null default false,
  add column if not exists telegram_chat_id text,
  add column if not exists telegram_link_code text,
  add column if not exists telegram_link_code_expires timestamptz;

-- Código de vinculación único (mientras esté vigente)
create unique index if not exists profiles_telegram_link_code_idx
  on public.profiles (telegram_link_code)
  where telegram_link_code is not null;

-- Un chat_id de Telegram sólo puede estar vinculado a un usuario
create unique index if not exists profiles_telegram_chat_id_idx
  on public.profiles (telegram_chat_id)
  where telegram_chat_id is not null;

-- Registro de recordatorios ya enviados, para no repetir el mismo
-- aviso el mismo día si el cron corre más de una vez o se reintenta.
create table if not exists public.reminder_log (
  id bigint generated always as identity primary key,
  item_key text not null,        -- p.ej. 'expediente:123:contestacion'
  send_date date not null default current_date,
  created_at timestamptz not null default now(),
  unique (item_key, send_date)
);

alter table public.reminder_log enable row level security;

-- Sólo el service role (usado por la Edge Function) puede leer/escribir
-- la bitácora de envíos; los usuarios normales no la necesitan.
drop policy if exists "reminder_log_service_only" on public.reminder_log;
create policy "reminder_log_service_only" on public.reminder_log
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- Los usuarios configuran sus propias preferencias vía estas funciones
-- (en vez de una política RLS de UPDATE sobre toda la fila de `profiles`,
-- que dejaría a cualquier usuario capaz de reescribir también su propia
-- columna `role` y auto-promoverse a admin). SECURITY DEFINER: corren con
-- privilegios del dueño de la función, pero sólo tocan columnas de
-- notificaciones y siempre acotado a auth.uid().

create or replace function public.set_notification_prefs(
  p_email_reminders boolean,
  p_telegram_reminders boolean
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'No autenticado';
  end if;
  update public.profiles
    set email_reminders = p_email_reminders,
        telegram_reminders = p_telegram_reminders
    where id = auth.uid();
end;
$$;

grant execute on function public.set_notification_prefs(boolean, boolean) to authenticated;
-- Supabase otorga EXECUTE a `anon` por defecto en funciones nuevas del
-- esquema public (privilegios por defecto), aparte de PUBLIC — hay que
-- revocarlo explícitamente de ambos o cualquier visitante sin sesión
-- podría invocar la función (aunque internamente la rechace por
-- auth.uid() null, mejor no depender sólo de eso).
revoke execute on function public.set_notification_prefs(boolean, boolean) from public, anon;

-- Genera (o renueva) el código de un solo uso para vincular Telegram.
-- El usuario lo recibe y lo manda al bot con /start <código>; el
-- webhook de Telegram completa la vinculación guardando el chat_id.
create or replace function public.generate_telegram_link_code()
returns text
language plpgsql
security definer
-- pgcrypto (gen_random_bytes) vive en el esquema `extensions` en este
-- proyecto, no en `public` — hay que incluirlo en el search_path o la
-- función falla con "function gen_random_bytes(integer) does not exist".
set search_path = public, extensions
as $$
declare
  v_code text;
begin
  if auth.uid() is null then
    raise exception 'No autenticado';
  end if;
  v_code := encode(gen_random_bytes(9), 'base64');
  v_code := replace(replace(replace(v_code, '/', '_'), '+', '-'), '=', '');
  update public.profiles
    set telegram_link_code = v_code,
        telegram_link_code_expires = now() + interval '15 minutes'
    where id = auth.uid();
  return v_code;
end;
$$;

grant execute on function public.generate_telegram_link_code() to authenticated;
revoke execute on function public.generate_telegram_link_code() from public, anon;

-- Desvincula Telegram (botón "Desvincular" en la app).
create or replace function public.unlink_telegram()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'No autenticado';
  end if;
  update public.profiles
    set telegram_chat_id = null,
        telegram_reminders = false,
        telegram_link_code = null,
        telegram_link_code_expires = null
    where id = auth.uid();
end;
$$;

grant execute on function public.unlink_telegram() to authenticated;
revoke execute on function public.unlink_telegram() from public, anon;
