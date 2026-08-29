// ════════════════════════════════════════════════════════════════
// Lógica compartida para armar el resumen de recordatorios (plazos,
// audiencias, tareas, urgentes y novedades del Boletín TFJA).
// Usada por send-reminders (envío diario vía cron) y por
// telegram-webhook (comando /hoy, envío a demanda).
// ════════════════════════════════════════════════════════════════

export type Item = { tipo: string; texto: string; urgente: boolean };

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

export function construirItems(exps: any[]): Item[] {
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

// Misma regla que esBoletinRelevante() en app.js (pestaña Boletín):
// una fila del boletín se avisa si está enlazada a un expediente propio
// o si su texto menciona Baja California.
function boletinEsRelevante(h: any): boolean {
  if (h.expediente_id) return true;
  const txt = [h.sala, h.demandado, h.actor, h.sintesis, h.keyword_match].filter(Boolean).join(' ');
  const n = txt
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  return n.includes('baja california');
}

export function construirItemsBoletin(hits: any[]): Item[] {
  return hits
    .filter((h) => !h.revisado && boletinEsRelevante(h))
    .map((h) => ({
      tipo: 'boletin',
      texto: `Boletín TFJA — ${h.tipo_actuacion || 'actuación'} · exp. ${h.expediente || 's/d'}${h.sala ? ' · ' + h.sala : ''}`,
      urgente: false,
    }));
}

export function escapeHtml(s: string): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function itemsAHtml(items: Item[]): string {
  const li = (it: Item) =>
    `<li style="margin-bottom:4px;${it.urgente ? 'color:#991b1b;font-weight:700' : ''}">${escapeHtml(it.texto)}</li>`;
  return `<ul style="padding-left:18px;margin:8px 0">${items.map(li).join('')}</ul>`;
}

// Texto plano con HTML escapado — Telegram con parse_mode HTML sólo
// reconoce <b>/<i>/etc como entidades; el resto se muestra literal, así
// que a diferencia de Markdown, un nombre o folio con "_", "*" o "["
// nunca rompe el mensaje completo.
export function itemsATextoHtml(items: Item[]): string {
  return items
    .map((it) => (it.urgente ? `⚠️ <b>${escapeHtml(it.texto)}</b>` : `• ${escapeHtml(it.texto)}`))
    .join('\n');
}
