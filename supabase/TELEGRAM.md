# Estado de los recordatorios (correo + Telegram)

**Estado: funcionando en producción**, verificado de punta a punta el
28-ago-2026. Este documento es el resumen para retomar el tema sin
tener que releer toda la conversación donde se construyó.

## Qué hace

Cada expediente se revisa a diario buscando:
- Plazo de contestación vencido o a ≤3 días
- Audiencia próxima en 0-3 días
- Vencimiento de cumplimiento de sentencia a ≤10 días
- Tareas de agenda vencidas o a ≤2 días
- Expedientes con prioridad "urgente" (se avisan siempre)

Y manda **un resumen diario** (mismo contenido para todos los
usuarios, igual que el banner dentro de la app) por cada canal que el
usuario tenga activado en el icono de campana 🔔 de la app.

## Estado por canal

- **Telegram: activo y probado.** Francisco Meza vinculado
  (`@Jurisconsultobot`), recibió el resumen de prueba correctamente.
- **Correo: no configurado a propósito.** El usuario decidió usar
  sólo Telegram por ahora. `RESEND_API_KEY` está vacío — la función
  detecta esto y simplemente no manda correos, sin error real (el
  mensaje "falló" en el debug es normal/esperado en este estado). Para
  activarlo más adelante: crear cuenta en resend.com, sacar API key,
  guardarla como secreto `RESEND_API_KEY` (y `RESEND_FROM`).

## Piezas desplegadas (proyecto Supabase `maqokevnoorpajxjtswg`, "Consulta de Juicios")

- Migraciones `0001_recordatorios.sql` (columnas de preferencias en
  `profiles`, tabla `reminder_log`, funciones
  `set_notification_prefs`/`generate_telegram_link_code`/
  `unlink_telegram`) y `0002_cron_recordatorios.sql` (cron diario a
  las 08:00 hora CDMX / 14:00 UTC) — aplicadas directamente sobre el
  proyecto.
- Edge Function `telegram-webhook` — recibe el `/start <código>` de
  Telegram y guarda el `chat_id` en `profiles`. Webhook registrado y
  confirmado con `getWebhookInfo` (sin errores pendientes).
- Edge Function `send-reminders` — arma el resumen diario y lo manda
  por correo/Telegram. Incluye un array `debug` en su respuesta JSON
  con el detalle exacto de cualquier fallo por usuario/canal (útil
  para diagnosticar sin necesitar los logs del dashboard).
- Bot de Telegram: `@Jurisconsultobot`.

## Bugs que se encontraron y corrigieron en el camino

1. **`gen_random_bytes` no encontrada** — `pgcrypto` vive en el
   esquema `extensions` de este proyecto, no en `public`; la función
   `generate_telegram_link_code` tenía `search_path` sin incluirlo.
   Corregido.
2. **`EXECUTE` abierto a `anon`** — Postgres/Supabase otorgan
   `EXECUTE` a `anon` por privilegio por defecto en funciones nuevas
   del esquema `public`, aparte de `PUBLIC`. Se revocó explícitamente
   en las tres funciones nuevas (sólo `authenticated` puede llamarlas).
3. **Caché del navegador** — `index.html` cargaba `app.js`/`styles.css`
   sin cache-busting, así que un deploy nuevo no se veía hasta un
   refresco forzado. Ahora cargan con `?v=<APP_VERSION>`.
4. **Telegram con Markdown se rompía en silencio** — `parse_mode:
   'Markdown'` truena si el texto (nombres, folios reales) trae `_`,
   `*` o `[` sin escapar, y `fetch()` no lanza excepción por un HTTP
   4xx — el código original contaba el envío como exitoso sin serlo.
   Se cambió a `parse_mode: 'HTML'` con escape, y ahora sí se revisa
   `response.ok` antes de contar un envío como exitoso.
5. **`TELEGRAM_BOT_TOKEN` corrupto al guardarlo** — el causante final
   de que no llegaran los mensajes: el secreto guardado no coincidía
   exactamente con el token real (algún caracter de más/menos al
   copiar). Se detectó gracias al campo `debug` (recibía `404 Not
   Found` de Telegram) y se resolvió borrando y volviendo a pegar el
   secreto con cuidado.

## Cómo volver a probar sin abrir la app

En el SQL Editor de Supabase:

```sql
-- Limpia el registro de "ya enviado hoy" para poder reintentar
delete from public.reminder_log where send_date = current_date;

-- Dispara la función manualmente
select net.http_post(
  url := 'https://maqokevnoorpajxjtswg.supabase.co/functions/v1/send-reminders',
  headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'x-cron-secret', '<CRON_SECRET — pedírselo a Claude o revisar los secretos de la función>'
  ),
  body := '{}'::jsonb
) as request_id;

-- Ver la respuesta (incluye el array `debug` si algo falla)
select status_code, content from net._http_response order by id desc limit 1;
```

## Nota sobre el conector MCP de Supabase

Durante esta sesión el conector MCP de Supabase se desconectó varias
veces a media conversación (mostraba `enabledInChat: false` pese a
estar activado del lado del usuario) y no se pudo reconectar pese a
varios intentos — de ahí que buena parte de este trabajo se hizo
pidiéndole al usuario que corriera las consultas SQL directamente y
pegara los resultados. Si en la próxima sesión el conector si funciona
desde el inicio, todo esto se puede hacer directo sin ese ida y
vuelta.
