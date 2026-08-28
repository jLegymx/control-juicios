-- ════════════════════════════════════════════════════════════════
-- Programa el envío diario de recordatorios llamando a la Edge
-- Function `send-reminders` vía pg_cron + pg_net.
--
-- IMPORTANTE — antes de correr esto:
--   1. Reemplaza <PROJECT_REF> por la referencia de tu proyecto
--      (la parte de https://<PROJECT_REF>.supabase.co).
--   2. Reemplaza <CRON_SECRET> por el mismo valor que configures
--      como secreto CRON_SECRET de la función send-reminders.
--   3. Ajusta la hora si quieres otro horario (cron corre en UTC;
--      '0 14 * * *' = 08:00 hora de Ciudad de México en horario
--      estándar UTC-6; ajusta si tu proyecto usa otra zona horaria
--      o en horario de verano).
-- ════════════════════════════════════════════════════════════════

create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

select cron.schedule(
  'recordatorios-diarios',
  '0 14 * * *',
  $$
  select net.http_post(
    url := 'https://<PROJECT_REF>.supabase.co/functions/v1/send-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', '<CRON_SECRET>'
    ),
    body := '{}'::jsonb
  );
  $$
);

-- Para desactivar el cron más adelante:
-- select cron.unschedule('recordatorios-diarios');
