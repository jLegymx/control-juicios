# Recordatorios por correo y Telegram

Recordatorios diarios (correo + Telegram) de: plazos de contestación,
audiencias próximas, vencimientos de cumplimiento de sentencia,
tareas de agenda y expedientes marcados como urgentes.

## Estado actual — ya desplegado en el proyecto real

Vía el conector MCP de Supabase, ya quedó aplicado directamente sobre
el proyecto **Consulta de Juicios** (`maqokevnoorpajxjtswg`):

- ✅ Migraciones corridas: columnas de preferencias en `profiles`,
  tabla `reminder_log`, funciones `set_notification_prefs`,
  `generate_telegram_link_code` y `unlink_telegram` (con los permisos
  de ejecución acotados sólo a usuarios con sesión — se detectó y
  corrigió que Supabase otorga `EXECUTE` a `anon` por defecto en
  funciones nuevas).
- ✅ Edge Functions `send-reminders` y `telegram-webhook` desplegadas.
- ✅ Cron diario programado (`recordatorios-diarios`, 08:00 hora CDMX
  = 14:00 UTC — México no tiene horario de verano desde 2022, así que
  no hace falta ajustar por temporada).
- ✅ Probado extremo a extremo contra los datos reales: encontró
  correctamente los pendientes y los 3 usuarios a notificar (sin
  mandar nada real porque aún faltan los secretos del paso 2).

## Lo que falta — sólo tú puedes hacerlo

Nada de esto se pudo hacer por MCP: los secretos de Edge Functions no
son parte de la base de datos, así que hace falta el dashboard de
Supabase o el CLI.

### 1. Configurar los secretos de las Edge Functions

Ve a tu proyecto → **Project Settings → Edge Functions → Secrets** (o
usa `supabase secrets set` con el CLI si lo prefieres) y agrega:

| Secreto | Valor |
|---|---|
| `CRON_SECRET` | el valor que te compartí por chat al desplegar esto — ya está usado en el `cron.job` programado en la base, así que **no lo cambies** o el cron dejará de poder llamar a la función (nunca se guarda en el repo) |
| `TELEGRAM_WEBHOOK_SECRET` | el otro valor que te compartí por chat — lo usarás también en el paso 3 (tampoco se guarda en el repo) |
| `RESEND_API_KEY` | la API key que generes en el paso 2 |
| `RESEND_FROM` | p.ej. `Control de Juicios <recordatorios@tu-dominio.mx>` |
| `TELEGRAM_BOT_TOKEN` | el token que te da @BotFather en el paso 3 |

Si vas a omitir un canal (por ejemplo no quieres Telegram), no
configures ese secreto — la función detecta que falta y no manda por
ese canal, sin error.

### 2. Cuenta de Resend (para correo)

1. Crea cuenta en [resend.com](https://resend.com) y verifica un
   dominio propio (o usa el dominio de pruebas `resend.dev` mientras
   evalúas — sólo entrega a tu propio correo verificado con ese
   dominio).
2. Genera una **API key** y ponla en `RESEND_API_KEY` (paso 1).

### 3. Bot de Telegram (para Telegram)

1. En Telegram, habla con [@BotFather](https://t.me/BotFather).
2. `/newbot`, elige nombre y usuario (debe terminar en `bot`, p.ej.
   `ControlJuiciosBot`).
3. Guarda el **token** que te da y ponlo en `TELEGRAM_BOT_TOKEN`
   (paso 1).
4. Registra el webhook (reemplaza `<TELEGRAM_BOT_TOKEN>` por el
   token real, y `<TELEGRAM_WEBHOOK_SECRET>` por el valor que te
   compartí por chat — el mismo que pusiste en `TELEGRAM_WEBHOOK_SECRET`):
   ```bash
   curl "https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/setWebhook" \
     -d "url=https://maqokevnoorpajxjtswg.supabase.co/functions/v1/telegram-webhook" \
     -d "secret_token=<TELEGRAM_WEBHOOK_SECRET>"
   ```
5. Ya vinculado, en cualquier momento puedes escribirle `/hoy` (o
   `/resumen`) al bot para recibir el resumen actual al instante, sin
   esperar al cron de las 08:00.
6. En `app.js`, junto a `SUPABASE_URL`, reemplaza:
   ```js
   const TELEGRAM_BOT_USERNAME = ''; // ← pon aquí el usuario del bot (sin la @)
   ```
   por el usuario del bot (p.ej. `'ControlJuiciosBot'`), y sube el
   cambio (commit + push) para que el botón "Vincular Telegram" de la
   app aparezca.

### 4. Probar

- Abre la app, entra a "Notificaciones" (icono de campana junto a tu
  nombre), activa correo y/o Telegram, y si activas Telegram sigue el
  enlace para vincular tu cuenta.
- Para probar el envío sin esperar al cron de las 08:00, invócalo a
  mano (reemplaza `<CRON_SECRET>` por el valor que te compartí por
  chat):
  ```bash
  curl -X POST "https://maqokevnoorpajxjtswg.supabase.co/functions/v1/send-reminders" \
    -H "x-cron-secret: <CRON_SECRET>"
  ```

## Ajustar qué dispara un recordatorio

Las ventanas de aviso (cuántos días antes se avisa de cada cosa)
están al principio de `functions/send-reminders/index.ts`
(`WINDOW_CONTESTACION`, `WINDOW_AUDIENCIA`, `WINDOW_CUMPLIMIENTO`,
`WINDOW_TAREA`) — si cambias este archivo, hay que volver a
desplegar la función. Los expedientes urgentes se avisan en cada
corrida del cron (por defecto, diario) — si eso resulta demasiado
frecuente, la forma más simple de bajarle la frecuencia es cambiar el
horario del cron:

```sql
select cron.alter_job(
  (select jobid from cron.job where jobname = 'recordatorios-diarios'),
  schedule := '0 14 * * 1'  -- sólo lunes
);
```

## Si necesitas reconstruir esto en otro proyecto de Supabase

Los archivos en `migrations/` sirven para eso (`supabase db push`
tras `supabase link`), pero **`0002_cron_recordatorios.sql` trae
marcadores** `<PROJECT_REF>` y `<CRON_SECRET>` que hay que reemplazar
antes de aplicarlo — en este proyecto ya se aplicó directamente con
los valores reales por MCP, así que ese archivo no refleja lo que
está corriendo en `maqokevnoorpajxjtswg` (usa `cron.job` en la base
para ver el job real).
