# Recordatorios por correo y Telegram

Esta carpeta agrega recordatorios diarios (correo + Telegram) de:
plazos de contestación, audiencias próximas, vencimientos de
cumplimiento de sentencia, tareas de agenda y expedientes marcados
como urgentes. No se generó desde el Supabase de este proyecto (esta
sesión no tiene acceso a tu proyecto), así que hay que desplegarlo a
mano siguiendo estos pasos.

## 1. Requisitos

- [Supabase CLI](https://supabase.com/docs/guides/cli) instalado y con
  `supabase login` hecho.
- Una cuenta en [Resend](https://resend.com) (recordatorios por
  correo) — plan gratis alcanza (3,000 correos/mes).
- Un bot de Telegram (recordatorios por Telegram) — opcional, se
  puede desplegar solo con correo si prefieres.

## 2. Correr las migraciones

Desde la raíz del proyecto:

```bash
supabase link --project-ref <TU_PROJECT_REF>
supabase db push
```

Esto agrega a `profiles` las columnas de preferencias de
notificación y Telegram, la tabla `reminder_log`, y las funciones
`set_notification_prefs`, `generate_telegram_link_code` y
`unlink_telegram` que usa la app.

**Nota:** el archivo `0002_cron_recordatorios.sql` trae dos
marcadores (`<PROJECT_REF>` y `<CRON_SECRET>`) que debes reemplazar
**antes** de aplicarlo — ver el paso 5.

## 3. Crear el bot de Telegram (opcional)

1. En Telegram, habla con [@BotFather](https://t.me/BotFather).
2. `/newbot`, elige nombre y usuario (debe terminar en `bot`, p.ej.
   `ControlJuiciosBot`).
3. Guarda el **token** que te da (algo como
   `123456:ABC-DEF1234...`).
4. Anota también el **usuario del bot** (p.ej. `ControlJuiciosBot`,
   sin la @) — lo necesitas para el botón "Vincular Telegram" de la
   app.

## 4. Configurar Resend (opcional, para correo)

1. Crea cuenta en resend.com y verifica un dominio propio (o usa el
   dominio de pruebas `resend.dev` mientras evalúas, aunque sólo
   entrega a tu propio correo verificado).
2. Genera una **API key**.

## 5. Configurar secretos de las Edge Functions

```bash
supabase secrets set \
  RESEND_API_KEY=re_xxxxxxxx \
  RESEND_FROM="Control de Juicios <recordatorios@tu-dominio.mx>" \
  TELEGRAM_BOT_TOKEN=123456:ABC-DEF1234... \
  TELEGRAM_WEBHOOK_SECRET=$(openssl rand -hex 20) \
  CRON_SECRET=$(openssl rand -hex 20)
```

Guarda en un lugar seguro los valores de `TELEGRAM_WEBHOOK_SECRET` y
`CRON_SECRET` que generaste — los necesitas en los pasos 6 y 2
(edita `supabase/migrations/0002_cron_recordatorios.sql` y reemplaza
`<PROJECT_REF>` y `<CRON_SECRET>` con esos valores **antes** de
correr `supabase db push`).

Si vas a omitir un canal (por ejemplo no quieres Telegram), no hace
falta dejar de correr el `secrets set`: basta con no configurar ese
secreto — la función detecta que falta y no manda por ese canal.

## 6. Desplegar las funciones

```bash
supabase functions deploy send-reminders
supabase functions deploy telegram-webhook --no-verify-jwt
```

`--no-verify-jwt` es necesario en `telegram-webhook` porque Telegram
llama a esa URL directamente, sin un token de Supabase.

## 7. Registrar el webhook de Telegram

```bash
curl "https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/setWebhook" \
  -d "url=https://<PROJECT_REF>.supabase.co/functions/v1/telegram-webhook" \
  -d "secret_token=<TELEGRAM_WEBHOOK_SECRET>"
```

Usa el mismo `TELEGRAM_WEBHOOK_SECRET` que configuraste en el paso 5.

## 8. Conectar la app

En `app.js`, junto a `SUPABASE_URL`/`SUPABASE_ANON_KEY`, hay dos
constantes nuevas:

```js
const TELEGRAM_BOT_USERNAME = 'TU_BOT_username'; // sin la @
```

Reemplázala por el usuario del bot que creaste en el paso 3. Si no
vas a usar Telegram, déjala vacía (`''`) y el botón "Vincular
Telegram" no se mostrará.

## 9. Probar

- Invoca la función a mano para probar sin esperar al cron:
  ```bash
  curl -X POST "https://<PROJECT_REF>.supabase.co/functions/v1/send-reminders" \
    -H "x-cron-secret: <CRON_SECRET>"
  ```
- Abre la app, entra a "Notificaciones" (icono de campana junto a tu
  nombre), activa correo y/o Telegram, y si activas Telegram sigue el
  enlace para vincular tu cuenta.

## Ajustar qué dispara un recordatorio

Las ventanas de aviso (cuántos días antes se avisa de cada cosa)
están al principio de `functions/send-reminders/index.ts`
(`WINDOW_CONTESTACION`, `WINDOW_AUDIENCIA`, `WINDOW_CUMPLIMIENTO`,
`WINDOW_TAREA`). Los expedientes urgentes se avisan en cada corrida
del cron (por defecto, diario) — si eso resulta demasiado frecuente,
la forma más simple de bajarle la frecuencia es cambiar el horario
del cron en `0002_cron_recordatorios.sql` (por ejemplo, sólo lunes:
`'0 14 * * 1'`).
