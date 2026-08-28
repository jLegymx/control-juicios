// ════════════════════════════════════════════════════════════════
// CONFIGURACIÓN — REEMPLAZA ESTOS DOS VALORES CON LOS DE TU PROYECTO
// Supabase → Settings → API → Project URL y anon/public key
// ════════════════════════════════════════════════════════════════
const SUPABASE_URL     = 'https://maqokevnoorpajxjtswg.supabase.co'; // ← CAMBIA ESTO
const SUPABASE_ANON_KEY = 'sb_publishable_Ne9opVMzKFWXvl3w5p3hCg_BGSQ_AaA';                    // ← CAMBIA ESTO

// ════════════════════════════════════════════════════════════════
// VERSIÓN DE LA APP
// Esquema: MAYOR.MENOR.CAMBIO — el tercer número sube en cada cambio
// (1.2.1, 1.2.2 … 1.2.9); al llegar a 9 se reinicia a 0 y sube MENOR
// (1.2.9 → 1.3.0).
// ════════════════════════════════════════════════════════════════
const APP_VERSION = '1.3.1';

// ════════════════════════════════════════════════════════════════
// CONSTANTES DE LA APP
// ════════════════════════════════════════════════════════════════
const ESTATUS=['En trámite','Sentencia favorable','Sentencia desfavorable','Sobreseído','Desistido','En cumplimiento','Cumplimentado','En revisión'];
const EFECTO_SENTENCIA=['','Validez','Emitir resolución con efectos','Desecha','Sobresee'];
const TRAMITE=['Juicio de Amparo','Juicio Contencioso Administrativo','Recurso de Revisión','Recurso de Inconformidad','Otro'];
const SUSP=['Sí','No','En trámite'];
const TIPO_JUICIO=['Juicio de Nulidad','Juicio Agrario','Juicio Laboral'];
const VIA_NULIDAD=['Ordinario','Sumario','En Línea'];
const TJ_COLORS={'Juicio de Nulidad':{bg:'#fef3c7',c:'#92400e'},'Juicio Agrario':{bg:'#d1fae5',c:'#065f46'},'Juicio Laboral':{bg:'#ede9fe',c:'#5b21b6'}};
const PRIORIDAD=[
  {v:'urgente',l:'🔴 Urgente',c:'#dc2626',bg:'#fee2e2'},
  {v:'alta',   l:'🟠 Alta',   c:'#ea580c',bg:'#ffedd5'},
  {v:'normal', l:'🔵 Normal', c:'#2563eb',bg:'#dbeafe'},
  {v:'baja',   l:'⚪ Baja',   c:'#64748b',bg:'#f1f5f9'}
];
const PR_MAP=Object.fromEntries(PRIORIDAD.map(p=>[p.v,p]));
const EF={numeroJuicio:'',numeroExpedienteInterno:'',demandante:'',sala:'',unidadAdministrativa:'',actoImpugnado:'',tituloConcesion:'',numeroExpedienteAdministrativo:'',tipoJuicio:'',viaProcesal:'',tipoTramite:'',temaFondo:'',resolucionImpugnada:'',fechaEmisionResolucion:'',cuantia:'',autoridadDemandada:'',autoridadVinculada:'',fechaEmplazamiento:'',fechaContestacion:'',suspension:'No',fechaNotificacionSuspension:'',efectosSuspension:'',fechaSentencia:'',efectoSentencia:'',fechaNotificacionSentencia:'',fechaFirmeza:'',fechaVencimientoCumplimiento:'',estatus:'En trámite',fechaEstatus:'',numeroRequerimientos:'',numeroApercibimientos:'',fechaUltimoApercibimiento:'',abogadoResponsable:'',fechaProximaAudiencia:'',numeroMemo:'',fechaMemo:'',resumenActuaciones:'',notas:'',prioridad:'normal',
  oficioContestacion:'',fechaOficioContestacion:'',
  oficioAmpliacion:'',fechaOficioAmpliacion:'',
  oficioAlegatos:'',fechaOficioAlegatos:'',
  tareas:[]};
const SC={'En trámite':{bg:'#dbeafe',c:'#1e40af'},'Sentencia favorable':{bg:'#d1fae5',c:'#065f46'},'Sentencia desfavorable':{bg:'#fee2e2',c:'#991b1b'},'Sobreseído':{bg:'#f1f5f9',c:'#475569'},'Desistido':{bg:'#f8fafc',c:'#64748b'},'En cumplimiento':{bg:'#fef3c7',c:'#92400e'},'Cumplimentado':{bg:'#ccfbf1',c:'#065f46'},'En revisión':{bg:'#ede9fe',c:'#5b21b6'}};

// ════════════════════════════════════════════════════════════════
// CÁLCULO DE PLAZOS PROCESALES
// Calcula automáticamente la fecha para dar contestación a partir
// de la fecha de emplazamiento, según el tipo de juicio:
//   • Juicio de Nulidad (Contencioso Administrativo):
//       LFPCA Arts. 19, 70 y 74 — 30 días hábiles tras surtir efectos
//   • Juicio Agrario:
//       Ley Agraria Art. 170 — audiencia entre 5 y 10 días
// ════════════════════════════════════════════════════════════════

// Días inhábiles del Tribunal Federal de Justicia Administrativa (TFJA)
// Fuente: https://www.tfja.gob.mx/servicios/dinh2025/  y  /dinh2026/
const DIAS_INHABILES_TFJA = {
  2025: [
    '2025-01-01',                                                                  // Año Nuevo
    '2025-02-03',                                                                  // Conm. 5 feb (1er lunes)
    '2025-03-17',                                                                  // Conm. 21 mar (3er lunes)
    '2025-04-16','2025-04-17','2025-04-18',                                        // Semana Santa
    '2025-05-01','2025-05-02','2025-05-05',                                        // Día del Trabajo y Batalla de Puebla
    // Primer periodo vacacional: del lunes 14 al jueves 31 de julio
    '2025-07-14','2025-07-15','2025-07-16','2025-07-17','2025-07-18',
    '2025-07-21','2025-07-22','2025-07-23','2025-07-24','2025-07-25',
    '2025-07-28','2025-07-29','2025-07-30','2025-07-31',
    '2025-08-01','2025-08-25',                                                     // Conm. 27 ago, día del empleado del TFJA
    '2025-09-15','2025-09-16',                                                     // Independencia
    '2025-11-17',                                                                  // Conm. 20 nov
    // Segundo periodo vacacional: del lunes 15 al miércoles 31 de diciembre
    '2025-12-15','2025-12-16','2025-12-17','2025-12-18','2025-12-19',
    '2025-12-22','2025-12-23','2025-12-24','2025-12-25','2025-12-26',
    '2025-12-29','2025-12-30','2025-12-31',
    '2026-01-01','2026-01-02'                                                      // Extensión del 2do periodo (SS_22_2025)
  ],
  2026: [
    '2026-02-02',                                                                  // Conm. 5 feb
    '2026-03-16',                                                                  // Conm. 21 mar
    '2026-04-01','2026-04-02','2026-04-03',                                        // Semana Santa
    '2026-05-01','2026-05-04','2026-05-05',                                        // Trabajo y Batalla de Puebla
    // Primer periodo vacacional: del 13 al 31 de julio
    '2026-07-13','2026-07-14','2026-07-15','2026-07-16','2026-07-17',
    '2026-07-20','2026-07-21','2026-07-22','2026-07-23','2026-07-24',
    '2026-07-27','2026-07-28','2026-07-29','2026-07-30','2026-07-31',
    '2026-08-28',                                                                  // Día del empleado del TFJA
    '2026-09-14','2026-09-15','2026-09-16',                                        // Independencia
    '2026-10-12',
    '2026-11-02','2026-11-16',                                                     // Día de Muertos / Conm. 20 nov
    // Segundo periodo vacacional: del 14 al 31 de diciembre + 1 enero 2027
    '2026-12-14','2026-12-15','2026-12-16','2026-12-17','2026-12-18',
    '2026-12-21','2026-12-22','2026-12-23','2026-12-24','2026-12-25',
    '2026-12-28','2026-12-29','2026-12-30','2026-12-31',
    '2027-01-01'
  ]
};

// Días inhábiles / de suspensión de los Tribunales Agrarios
// Fuente: Acuerdo General 18/2024 del H. Pleno del Tribunal Superior Agrario
// (DOF 18/12/2024) y Acuerdo General 19/2024 (días 2 y 3 enero 2025).
// Nota: la Ley Agraria, en su Art. 193, establece que "no hay días ni horas
// inhábiles" para las actuaciones ante los Tribunales Agrarios; no obstante,
// el acuerdo declara expresamente que durante los días listados
// "no correrán plazos ni términos concernientes a los procedimientos agrarios".
// Por ello se cuentan días naturales y sólo se omiten los del acuerdo
// (incluyendo los fines de semana comprendidos en los periodos vacacionales).
const DIAS_INHABILES_AGRARIO = {
  2025: [
    '2025-01-01','2025-01-02','2025-01-03',                                        // Año Nuevo + acuerdo 19/2024
    '2025-02-03',                                                                  // 1er lunes feb (conm. 5 feb)
    '2025-03-17',                                                                  // 3er lunes mar (conm. 21 mar)
    '2025-04-17','2025-04-18',                                                     // Semana Santa (confirm. acuerdo CJEF)
    '2025-05-01','2025-05-05',                                                     // Trabajo, Batalla de Puebla
    // Primer periodo vacacional (típico TSA: del 16 al 31 de julio, inclusive fines de semana)
    '2025-07-16','2025-07-17','2025-07-18','2025-07-19','2025-07-20',
    '2025-07-21','2025-07-22','2025-07-23','2025-07-24','2025-07-25',
    '2025-07-26','2025-07-27',
    '2025-07-28','2025-07-29','2025-07-30','2025-07-31',
    '2025-09-16',                                                                  // Independencia
    '2025-11-02',                                                                  // Día de Muertos
    '2025-11-17',                                                                  // 3er lunes nov (conm. 20 nov)
    '2025-12-12',                                                                  // Virgen de Guadalupe
    // Segundo periodo vacacional (típico TSA: del 16 al 31 de diciembre)
    '2025-12-16','2025-12-17','2025-12-18','2025-12-19','2025-12-20','2025-12-21',
    '2025-12-22','2025-12-23','2025-12-24','2025-12-25','2025-12-26','2025-12-27',
    '2025-12-28','2025-12-29','2025-12-30','2025-12-31'
  ],
  2026: [
    '2026-01-01',
    '2026-02-02','2026-03-16',
    '2026-04-02','2026-04-03',                                                     // Semana Santa
    '2026-05-01','2026-05-05',
    // Primer periodo vacacional estimado
    '2026-07-16','2026-07-17','2026-07-18','2026-07-19',
    '2026-07-20','2026-07-21','2026-07-22','2026-07-23','2026-07-24','2026-07-25','2026-07-26',
    '2026-07-27','2026-07-28','2026-07-29','2026-07-30','2026-07-31',
    '2026-09-16',
    '2026-11-02','2026-11-16',
    '2026-12-12',
    // Segundo periodo vacacional estimado
    '2026-12-16','2026-12-17','2026-12-18','2026-12-19','2026-12-20',
    '2026-12-21','2026-12-22','2026-12-23','2026-12-24','2026-12-25','2026-12-26',
    '2026-12-28','2026-12-29','2026-12-30','2026-12-31'
  ]
};

// — Helpers de fecha —
function parseISODate(s) {
  if (!s) return null;
  const m = String(s).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const d = new Date(+m[1], +m[2]-1, +m[3]);
  return isNaN(d.getTime()) ? null : d;
}
function formatISODate(d) {
  const y = d.getFullYear();
  const mm = String(d.getMonth()+1).padStart(2,'0');
  const dd = String(d.getDate()).padStart(2,'0');
  return `${y}-${mm}-${dd}`;
}

// — TFJA: sábado, domingo o día inhábil oficial —
function esInhabilTFJA(fecha) {
  const dow = fecha.getDay();
  if (dow === 0 || dow === 6) return true;
  const lista = DIAS_INHABILES_TFJA[fecha.getFullYear()] || [];
  return lista.includes(formatISODate(fecha));
}

// — Tribunales Agrarios: SOLO días del acuerdo (Art. 193 LA → no hay días inhábiles
//   para los plazos, salvo los del acuerdo de suspensión de labores) —
function esSuspendidoAgrario(fecha) {
  const lista = DIAS_INHABILES_AGRARIO[fecha.getFullYear()] || [];
  return lista.includes(formatISODate(fecha));
}

// — Avanza n días hábiles (TFJA) —
function avanzarHabilesTFJA(inicio, n) {
  const d = new Date(inicio);
  let c = 0;
  while (c < n) {
    d.setDate(d.getDate() + 1);
    if (!esInhabilTFJA(d)) c++;
  }
  return d;
}

// — Avanza n días naturales en materia agraria, saltando los días suspendidos
//   por el acuerdo del Tribunal Superior Agrario —
function avanzarDiasAgrario(inicio, n) {
  const d = new Date(inicio);
  let c = 0;
  while (c < n) {
    d.setDate(d.getDate() + 1);
    if (!esSuspendidoAgrario(d)) c++;
  }
  return d;
}

// — Cálculo principal del plazo para contestar —
function calcularPlazoContestacion(fechaEmplazamiento, tipoJuicio, viaProcesal) {
  if (!fechaEmplazamiento) return null;
  const f = parseISODate(fechaEmplazamiento);
  if (!f) return null;

  // ── Juicio Contencioso Administrativo ─────────────────────────
  // Diferencia por vía procesal:
  //  • Ordinario  (LFPCA Art. 19):       30 días hábiles, notif. surte efectos
  //                                       día hábil siguiente (Art. 70)
  //  • Sumario    (LFPCA Art. 58-2 fr.II): 15 días hábiles, notif. surte efectos
  //                                       día hábil siguiente (Art. 70)
  //  • En Línea   (LFPCA Art. 19, 58-N):  30 días hábiles, notif. por Boletín
  //                                       Electrónico surte efectos al 3er día
  //                                       hábil siguiente al envío (Art. 65),
  //                                       salvo apertura previa del archivo
  if (tipoJuicio === 'Juicio de Nulidad') {
    const via = viaProcesal || 'Ordinario';
    let diasSurteEfectos, diasPlazo, basesLegales;
    if (via === 'Sumario') {
      diasSurteEfectos = 1;
      diasPlazo        = 15;
      basesLegales     = 'LFPCA Arts. 19, 58-2 fr.II, 70 y 74';
    } else if (via === 'En Línea') {
      diasSurteEfectos = 3;
      diasPlazo        = 30;
      basesLegales     = 'LFPCA Arts. 19, 58-N, 65 y 74';
    } else { // Ordinario
      diasSurteEfectos = 1;
      diasPlazo        = 30;
      basesLegales     = 'LFPCA Arts. 19, 70 y 74';
    }
    const surteEfectos = avanzarHabilesTFJA(f, diasSurteEfectos);
    const inicioPlazo  = avanzarHabilesTFJA(surteEfectos, 1);            // día 1 del plazo
    const fechaLimite  = avanzarHabilesTFJA(inicioPlazo, diasPlazo - 1); // día N del plazo
    return {
      tipo: 'contencioso',
      via:  via,
      diasPlazo: diasPlazo,
      diasSurteEfectos: diasSurteEfectos,
      basesLegales: basesLegales,
      fechaLimite:  formatISODate(fechaLimite),
      surteEfectos: formatISODate(surteEfectos),
      inicioPlazo:  formatISODate(inicioPlazo)
    };
  }

  // ── Juicio Agrario ────────────────────────────────────────────
  // Ley Agraria Art. 170: "...la audiencia, la que deberá tener lugar dentro
  // de un plazo no menor a cinco ni mayor a diez días, contado a partir de
  // la fecha en que se practique el emplazamiento..."
  // Ley Agraria Art. 178: "El demandado contestará la demanda a más tardar
  // en la audiencia..."
  if (tipoJuicio === 'Juicio Agrario') {
    const fechaMin = avanzarDiasAgrario(f, 5);
    const fechaMax = avanzarDiasAgrario(f, 10);
    return {
      tipo: 'agrario',
      fechaMin: formatISODate(fechaMin),
      fechaMax: formatISODate(fechaMax)
    };
  }

  return null;
}

// — Aplica el cálculo automático al estado actual del formulario.
//   Se invoca al abrir el formulario (nuevo o edición) y cuando cambia
//   la fecha de emplazamiento o el tipo de juicio.
function aplicarPlazoAutomatico(){
  const tj = S.form.tipoJuicio;
  const fe = S.form.fechaEmplazamiento;
  const vp = S.form.viaProcesal;
  if (!fe || (tj !== 'Juicio de Nulidad' && tj !== 'Juicio Agrario')) return false;
  const r = calcularPlazoContestacion(fe, tj, vp);
  if (!r) return false;
  S.form.fechaContestacion = r.tipo === 'contencioso' ? r.fechaLimite : r.fechaMax;
  return true;
}

// — HTML del recuadro informativo bajo el campo de contestación —
function plazoInfoHTML(fechaEmplazamiento, tipoJuicio, viaProcesal) {
  // Sin fecha de emplazamiento: si ya hay tipo, indicarle al usuario
  if (!fechaEmplazamiento) {
    if (tipoJuicio === 'Juicio de Nulidad' || tipoJuicio === 'Juicio Agrario') {
      return `<div class="plazo-info warn">⚠ Captura la <b>Fecha de Emplazamiento</b> para que se calcule automáticamente el plazo de contestación.</div>`;
    }
    return '';
  }
  // Hay emplazamiento pero no se seleccionó tipo de juicio (o no es soportado)
  if (!tipoJuicio) {
    return `<div class="plazo-info warn">⚠ Selecciona el <b>Tipo de Juicio</b> (Juicio de Nulidad o Juicio Agrario) para calcular automáticamente el plazo de contestación.</div>`;
  }
  if (tipoJuicio !== 'Juicio de Nulidad' && tipoJuicio !== 'Juicio Agrario') {
    return `<div class="plazo-info warn">⚠ El cálculo automático sólo está implementado para <b>Juicio de Nulidad</b> y <b>Juicio Agrario</b>.<span class="law">Para «${esc(tipoJuicio)}» captura la fecha límite manualmente conforme a la normativa aplicable.</span></div>`;
  }
  // Para Juicio de Nulidad, exigir vía procesal
  if (tipoJuicio === 'Juicio de Nulidad' && !viaProcesal) {
    return `<div class="plazo-info warn">⚠ Selecciona la <b>Vía Procesal</b> (Ordinario, Sumario o En Línea) para calcular el plazo de contestación.<span class="law">El plazo varía: 30 días hábiles en ordinario / en línea, 15 días hábiles en sumario.</span></div>`;
  }
  const r = calcularPlazoContestacion(fechaEmplazamiento, tipoJuicio, viaProcesal);
  if (!r) return '';
  if (r.tipo === 'contencioso') {
    const surteLbl = r.diasSurteEfectos === 1
      ? 'Surte efectos (día hábil siguiente):'
      : `Surte efectos (al ${r.diasSurteEfectos}º día hábil):`;
    return `<div class="plazo-info contencioso">
      <b>Vía ${esc(r.via)} · Plazo:</b> ${r.diasPlazo} días hábiles para contestar.
      ${surteLbl} <span class="pf">${fd(r.surteEfectos)}</span>
      Inicio del plazo: <span class="pf">${fd(r.inicioPlazo)}</span>
      <b>Vencimiento:</b> <span class="pf">${fd(r.fechaLimite)}</span>
      <span class="law">${esc(r.basesLegales)} · Calendario de días inhábiles del TFJA.</span>
    </div>`;
  }
  // agrario
  return `<div class="plazo-info agrario">
    <b>Audiencia:</b> debe celebrarse entre <span class="pf">${fd(r.fechaMin)}</span> (mín. 5 días) y <span class="pf">${fd(r.fechaMax)}</span> (máx. 10 días).
    La contestación se da a más tardar en la audiencia.
    <span class="law">Ley Agraria Arts. 170 y 178 · Acuerdo General 18/2024 del Tribunal Superior Agrario (días de suspensión de labores).</span>
  </div>`;
}

// ════════════════════════════════════════════════════════════════
// ESTADO GLOBAL
// ════════════════════════════════════════════════════════════════
let SB = null; // Supabase client
let S = {
  view:'lista', exps:[], form:{...EF}, editId:null,
  sq:'', srs:[], sdone:false, rep:'estatus', delC:null,
  lf:'', det:null, sortBy:'reg-desc', statusFilter:'',
  role:null, userEmail:'', userName:'', loading:false,
  selected: new Set(),
  bitacora:[], bitacoraLoading:false,
  atenOpen: false,
  // Calendario
  calMonth: new Date().getMonth(), calYear: new Date().getFullYear(),
  // Detalle: tabs
  detTab: 'info',
  // Notificaciones
  notifDismissed: false, notifEnabled: false, notifEventos: [],
  // Documentos cache: expId -> array | null
  docs: {}, docsLoading: false,
  // Boletin TFJA
  boletinHits: [], boletinLoaded: false, boletinFilter: 'pendientes',
  // Modal de detalle de tarjeta del dashboard
  dashModal: null
};

const isAdmin  = () => S.role === 'admin';
// canWrite: admin y editor pueden crear/editar, pero sólo admin puede eliminar
const canWrite = () => S.role === 'admin' || S.role === 'editor';

// ════════════════════════════════════════════════════════════════
// CONVERSIÓN DB (snake_case) ↔ JS (camelCase)
// ════════════════════════════════════════════════════════════════
function dbToJs(r) {
  return {
    id: r.id,
    numeroJuicio:                   r.numero_juicio                    || '',
    numeroExpedienteInterno:        r.numero_expediente_interno        || '',
    demandante:                     r.demandante                       || '',
    sala:                           r.sala                             || '',
    unidadAdministrativa:           r.unidad_administrativa            || '',
    actoImpugnado:                  r.acto_impugnado                   || '',
    tituloConcesion:                r.titulo_concesion                 || '',
    numeroExpedienteAdministrativo: r.numero_expediente_administrativo || '',
    tipoJuicio:                     r.tipo_juicio                      || '',
    viaProcesal:                    r.via_procesal                     || '',
    tipoTramite:                    r.tipo_tramite                     || '',
    temaFondo:                      r.tema_fondo                       || '',
    resolucionImpugnada:            r.resolucion_impugnada             || '',
    fechaEmisionResolucion:         r.fecha_emision_resolucion         || '',
    cuantia:                        r.cuantia                          || '',
    autoridadDemandada:             r.autoridad_demandada              || '',
    autoridadVinculada:             r.autoridad_vinculada              || '',
    fechaEmplazamiento:             r.fecha_emplazamiento              || '',
    fechaContestacion:              r.fecha_contestacion               || '',
    suspension:                     r.suspension                       || 'No',
    fechaNotificacionSuspension:    r.fecha_notificacion_suspension    || '',
    efectosSuspension:              r.efectos_suspension               || '',
    fechaSentencia:                 r.fecha_sentencia                  || '',
    efectoSentencia:                r.efecto_sentencia                 || '',
    fechaNotificacionSentencia:     r.fecha_notificacion_sentencia     || '',
    fechaFirmeza:                   r.fecha_firmeza                    || '',
    fechaVencimientoCumplimiento:   r.fecha_vencimiento_cumplimiento   || '',
    estatus:                        r.estatus                          || 'En trámite',
    fechaEstatus:                   r.fecha_estatus                    || '',
    numeroRequerimientos:           r.numero_requerimientos            || '',
    numeroApercibimientos:          r.numero_apercibimientos           || '',
    fechaUltimoApercibimiento:      r.fecha_ultimo_apercibimiento      || '',
    abogadoResponsable:             r.abogado_responsable              || '',
    fechaProximaAudiencia:          r.fecha_proxima_audiencia          || '',
    numeroMemo:                     r.numero_memo                      || '',
    fechaMemo:                      r.fecha_memo                       || '',
    resumenActuaciones:             r.resumen_actuaciones              || '',
    notas:                          r.notas                            || '',
    prioridad:                      r.prioridad                        || 'normal',
    oficioContestacion:             r.oficio_contestacion              || '',
    fechaOficioContestacion:        r.fecha_oficio_contestacion        || '',
    oficioAmpliacion:               r.oficio_ampliacion                || '',
    fechaOficioAmpliacion:          r.fecha_oficio_ampliacion          || '',
    oficioAlegatos:                 r.oficio_alegatos                  || '',
    fechaOficioAlegatos:            r.fecha_oficio_alegatos            || '',
    tareas:                         Array.isArray(r.tareas) ? r.tareas : []
  };
}

function jsToDb(e) {
  const dt = v => (v && String(v).trim()) ? String(v).trim() : null;
  return {
    id:                               e.id,
    numero_juicio:                    e.numeroJuicio                   || '',
    numero_expediente_interno:        dt(e.numeroExpedienteInterno),
    demandante:                       dt(e.demandante),
    sala:                             dt(e.sala),
    unidad_administrativa:            dt(e.unidadAdministrativa),
    acto_impugnado:                   dt(e.actoImpugnado),
    titulo_concesion:                 dt(e.tituloConcesion),
    numero_expediente_administrativo: dt(e.numeroExpedienteAdministrativo),
    tipo_juicio:                      dt(e.tipoJuicio),
    via_procesal:                     dt(e.viaProcesal),
    tipo_tramite:                     dt(e.tipoTramite),
    tema_fondo:                       dt(e.temaFondo),
    resolucion_impugnada:             dt(e.resolucionImpugnada),
    fecha_emision_resolucion:         dt(e.fechaEmisionResolucion),
    cuantia:                          dt(e.cuantia),
    autoridad_demandada:              dt(e.autoridadDemandada),
    autoridad_vinculada:              dt(e.autoridadVinculada),
    fecha_emplazamiento:              dt(e.fechaEmplazamiento),
    fecha_contestacion:               dt(e.fechaContestacion),
    suspension:                       e.suspension || 'No',
    fecha_notificacion_suspension:    dt(e.fechaNotificacionSuspension),
    efectos_suspension:               dt(e.efectosSuspension),
    fecha_sentencia:                  dt(e.fechaSentencia),
    efecto_sentencia:                 dt(e.efectoSentencia),
    fecha_notificacion_sentencia:     dt(e.fechaNotificacionSentencia),
    fecha_firmeza:                    dt(e.fechaFirmeza),
    fecha_vencimiento_cumplimiento:   dt(e.fechaVencimientoCumplimiento),
    estatus:                          e.estatus || 'En trámite',
    fecha_estatus:                    dt(e.fechaEstatus),
    numero_requerimientos:            dt(e.numeroRequerimientos),
    numero_apercibimientos:           dt(e.numeroApercibimientos),
    fecha_ultimo_apercibimiento:      dt(e.fechaUltimoApercibimiento),
    abogado_responsable:              dt(e.abogadoResponsable),
    fecha_proxima_audiencia:          dt(e.fechaProximaAudiencia),
    numero_memo:                      dt(e.numeroMemo),
    fecha_memo:                       dt(e.fechaMemo),
    resumen_actuaciones:              dt(e.resumenActuaciones),
    notas:                            dt(e.notas),
    prioridad:                        e.prioridad || 'normal',
    oficio_contestacion:              dt(e.oficioContestacion),
    fecha_oficio_contestacion:        dt(e.fechaOficioContestacion),
    oficio_ampliacion:                dt(e.oficioAmpliacion),
    fecha_oficio_ampliacion:          dt(e.fechaOficioAmpliacion),
    oficio_alegatos:                  dt(e.oficioAlegatos),
    fecha_oficio_alegatos:            dt(e.fechaOficioAlegatos),
    tareas:                           Array.isArray(e.tareas) ? e.tareas : []
  };
}

// ════════════════════════════════════════════════════════════════
// AUTENTICACIÓN
// ════════════════════════════════════════════════════════════════
async function initSupabase() {
  // Detectar configuración pendiente
  if (SUPABASE_URL.includes('TU-PROYECTO') || SUPABASE_ANON_KEY.includes('TU-ANON')) {
    document.getElementById('loginConfigWarning').style.display = 'block';
    document.getElementById('loginNormal').style.display = 'none';
    return;
  }

  SB = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // ⚠️ Registrar SIEMPRE el listener primero — si se registra después
  // de getSession(), el evento SIGNED_OUT no se captura al hacer logout.
  SB.auth.onAuthStateChange(async (event, session) => {
    // FIX: Solo llamar onLogin desde aquí si aún no hay sesión activa.
    // doLogin ya llama a onLogin directamente; este handler cubre restauración de sesión.
    if (event === 'SIGNED_IN'  && session && !S.userEmail) await onLogin(session.user);
    if (event === 'SIGNED_OUT')            onLogout();
  });

  // Restaurar sesión existente (si el usuario ya había iniciado sesión)
  try {
    const { data: { session } } = await SB.auth.getSession();
    if (session) await onLogin(session.user);
  } catch(e) { /* sin sesión, mostrar login */ }
}

async function doLogin() {
  const email    = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  const errEl    = document.getElementById('loginErr');
  const btn      = document.getElementById('loginBtn');

  if (!email || !password) { errEl.textContent = 'Ingresa tu correo y contraseña.'; return; }
  errEl.textContent = '';
  btn.disabled = true; btn.textContent = 'Iniciando sesión…';

  try {
    // FIX: Extraer también `data` para llamar onLogin directamente.
    // No depender solo de onAuthStateChange: Supabase no espera callbacks async,
    // por lo que errores en onLogin se pierden silenciosamente como unhandled rejections.
    const { data, error } = await SB.auth.signInWithPassword({ email, password });
    if (error) throw error;
    if (data?.user) {
      await onLogin(data.user);
    } else {
      throw new Error('No se pudo obtener la sesión. Intenta de nuevo.');
    }
  } catch(e) {
    const msg = e.message?.toLowerCase() || '';
    errEl.textContent = (msg.includes('invalid') || msg.includes('credentials'))
      ? '❌ Correo o contraseña incorrectos.'
      : '❌ Error: ' + e.message;
    btn.disabled = false; btn.textContent = 'Iniciar sesión';
  }
}

async function onLogin(user) {
  // FIX: Guardia contra doble ejecución. onAuthStateChange puede disparar SIGNED_IN
  // al mismo tiempo que doLogin llama a onLogin directamente.
  if (S.userEmail) return;

  // Obtener perfil y rol
  try {
    const { data, error } = await SB.from('profiles').select('role,nombre').eq('id', user.id).single();
    if (!error && data) {
      S.role     = data.role  || 'readonly';
      S.userName = data.nombre || user.email;
    } else {
      S.role = 'readonly'; S.userName = user.email;
    }
  } catch { S.role = 'readonly'; S.userName = user.email; }

  S.userEmail = user.email;

  // Mostrar app
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('hdr').style.display = 'block';
  document.getElementById('main').style.display = 'block';

  await loadData();
  initNotificaciones();
}

async function logout() {
  if (!confirm('¿Cerrar sesión?')) return;
  await SB.auth.signOut();
}

function onLogout() {
  S.role = null; S.userEmail = ''; S.userName = ''; S.exps = [];
  document.getElementById('loginScreen').style.display = 'flex';
  document.getElementById('hdr').style.display = 'none';
  document.getElementById('main').style.display = 'none';
  document.getElementById('loginErr').textContent = '';
  document.getElementById('loginBtn').disabled = false;
  document.getElementById('loginBtn').textContent = 'Iniciar sesión';
  document.getElementById('loginEmail').value = '';
  document.getElementById('loginPassword').value = '';
}

// ════════════════════════════════════════════════════════════════
// OPERACIONES DE DATOS (Supabase)
// ════════════════════════════════════════════════════════════════
function showLoading(v) {
  S.loading = v;
  document.getElementById('loadingOverlay').style.display = v ? 'flex' : 'none';
}

async function loadData() {
  showLoading(true);
  try {
    const { data, error } = await SB.from('expedientes').select('*').order('id', { ascending: false });
    if (error) throw error;
    S.exps = (data || []).map(dbToJs);
    loadBoletin();  // segundo plano: no bloquea el login
  } catch(e) {
    showToast('Error al cargar datos: ' + e.message, true);
  }
  showLoading(false);
  render();
}

async function saveRecord(rec, isEdit) {
  try {
    const row = jsToDb(rec);
    if (isEdit) {
      const { error } = await SB.from('expedientes').update(row).eq('id', rec.id);
      if (error) throw error;
      // Calcular qué cambió
      const oldRec = S.exps.find(e => e.id === rec.id);
      const diff   = oldRec ? diffRecords(oldRec, rec) : { nota: 'Sin registro previo' };
      await logBitacora(rec.id, rec.numeroJuicio, 'EDITAR', diff || { nota: 'Sin cambios detectados' });
    } else {
      const { data, error } = await SB.from('expedientes').insert([row]).select('id').single();
      if (error) throw error;
      await logBitacora(data?.id || null, rec.numeroJuicio, 'CREAR', { nota: 'Expediente registrado por primera vez' });
    }
    return true;
  } catch(e) {
    showToast('Error al guardar: ' + e.message, true);
    return false;
  }
}

async function deleteRecord(id) {
  try {
    const rec = S.exps.find(e => e.id === id);
    const { error } = await SB.from('expedientes').delete().eq('id', id);
    if (error) throw error;
    if (rec) await logBitacora(id, rec.numeroJuicio, 'ELIMINAR', {
      demandante: rec.demandante || '—',
      estatus:    rec.estatus    || '—',
      nota:       'Expediente eliminado permanentemente'
    });
    return true;
  } catch(e) {
    showToast('Error al eliminar: ' + e.message, true);
    return false;
  }
}

async function batchInsert(recs) {
  const CHUNK = 500;
  const failed = [];
  let okCount = 0;
  for (let i = 0; i < recs.length; i += CHUNK) {
    const slice = recs.slice(i, i + CHUNK);
    const { error } = await SB.from('expedientes').insert(slice.map(jsToDb));
    if (!error) { okCount += slice.length; continue; }
    // El lote falló: es un INSERT único con varias filas, así que basta con
    // que UNA fila viole una restricción para que Postgres rechace TODO el
    // lote. Reintentamos fila por fila para no perder las que sí son válidas.
    for (const rec of slice) {
      const { error: e2 } = await SB.from('expedientes').insert([jsToDb(rec)]);
      if (e2) failed.push({ numeroJuicio: rec.numeroJuicio || '(sin número)', error: e2.message });
      else okCount++;
    }
  }
  return { okCount, failed };
}

// ════════════════════════════════════════════════════════════════
// UTILIDADES
// ════════════════════════════════════════════════════════════════
const fd  = d => d ? new Date(d+'T00:00:00').toLocaleDateString('es-MX',{day:'2-digit',month:'long',year:'numeric'}) : '—';
const esc = s => String(s??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const bdg = (s,sm) => { const c=SC[s]||{bg:'#f1f5f9',c:'#64748b'}; return`<span class="badge${sm?' badge-sm':''}" style="background:${c.bg};color:${c.c}">${esc(s)||'—'}</span>`; };
const prBdg = (p) => { const x=PR_MAP[p||'normal']; return`<span class="prio" style="background:${x.bg};color:${x.c}"><span class="prio-dot" style="background:${x.c}"></span>${x.l.replace(/^[^\s]+\s/,'')}</span>`; };
const prBar = (p) => { const x=PR_MAP[p||'normal']; return`<span class="prio-bar" style="background:${x.c}" title="${x.l}"></span>`; };
const tjBdg = (t,sm) => { if(!t)return'<span style="color:#cbd5e1;font-size:10.5px">—</span>'; const c=TJ_COLORS[t]||{bg:'#f1f5f9',c:'#475569'}; return`<span class="badge${sm?' badge-sm':''}" style="background:${c.bg};color:${c.c}">${esc(t)}</span>`; };
const secT = t => `<div class="st"><span>${t}</span><hr></div>`;
const fRow = (l,v) => `<div class="dr"><div class="dl">${l}</div><div class="dv">${esc(v)||'—'}</div></div>`;
const lbl  = (t,req) => `<label class="lbl">${t}${req?'<span style="color:red;margin-left:2px">*</span>':''}</label>`;
const fld  = (l,h,req,span) => `<div${span?' class="span2"':''}>${lbl(l,req)}${h}</div>`;
const inp  = (k,pl) => `<input value="${esc(S.form[k]||'')}" placeholder="${pl||''}" oninput="sf('${k}',this.value)">`;
const di   = k => `<input type="date" value="${esc(S.form[k]||'')}" onchange="sf('${k}',this.value)">`;
const sl   = (k,arr,ph) => `<select onchange="sf('${k}',this.value)">${ph?'<option value="">Seleccionar…</option>':''}${arr.map(o=>`<option value="${esc(o)}"${S.form[k]===o?' selected':''}>${esc(o)}</option>`).join('')}</select>`;

let _toastTimer = null;
function showToast(m, err, warn) {
  if (_toastTimer) clearTimeout(_toastTimer);
  const t = document.getElementById('toast');
  t.textContent = (err ? '✕ ' : '✓ ') + m;
  t.className = 'toast ' + (err ? 'toast-err' : warn ? 'toast-warn' : 'toast-ok');
  t.style.display = 'block';
  _toastTimer = setTimeout(() => t.style.display = 'none', 3500);
}

// Campos que requieren re-render inmediato (afectan la estructura del formulario)
const SF_IMMEDIATE = new Set(['tipoJuicio','viaProcesal','suspension','fechaEmplazamiento','efectoSentencia','fechaSentencia','fechaNotificacionSentencia','fechaFirmeza','prioridad','estatus']);
let _sfTimer = null;

function sf(k, v) {
  S.form[k] = v;
  if (k === 'tipoJuicio' && v !== 'Juicio de Nulidad') S.form.viaProcesal = '';
  if (k === 'fechaEmplazamiento' || k === 'tipoJuicio' || k === 'viaProcesal') {
    aplicarPlazoAutomatico(); render(); return;
  }
  if (k === 'suspension') { render(); return; }
  if (SF_IMMEDIATE.has(k)) { render(); return; }
  // Campos de texto libre: debounce 600ms para no re-renderizar en cada tecla
  clearTimeout(_sfTimer);
  _sfTimer = setTimeout(() => { render(); }, 600);
}
function sv(v){ S.delC=null; S.view=v; if(v==='bitacora' && !S.bitacora.length) refreshBitacora(); else render(); }

let _filterTimer = null;
function setFilter(val) {
  S.lf = val;
  clearTimeout(_filterTimer);
  _filterTimer = setTimeout(() => {
    render();
    // Restaurar foco y posición del cursor en el input de filtro
    const el = document.getElementById('listaFilter');
    if (el) { el.focus(); el.setSelectionRange(el.value.length, el.value.length); }
  }, 350);
}

// ════════════════════════════════════════════════════════════════
// OPERACIONES CRUD (con rol check)
// ════════════════════════════════════════════════════════════════
async function doSave() {
  if (!canWrite()) return showToast('Sin permisos de edición', true);
  if (!S.form.numeroJuicio.trim()) return showToast('El número de juicio es obligatorio', true);

  const wasEdit = !!S.editId;
  const newId   = Date.now().toString();

  if (!wasEdit) {
    if (S.exps.find(e => e.numeroJuicio.trim().toLowerCase() === S.form.numeroJuicio.trim().toLowerCase()))
      return showToast('Ya existe un expediente con ese número', true);
  }

  const rec = { ...S.form, id: wasEdit ? S.editId : newId };
  showToast('Guardando…');
  showLoading(true);

  const ok = await saveRecord(rec, wasEdit);
  showLoading(false);
  if (!ok) return;

  if (wasEdit) {
    S.exps = S.exps.map(e => e.id === S.editId ? rec : e);
  } else {
    S.exps.unshift(rec);
  }

  showToast(wasEdit ? '✓ Expediente actualizado' : '✓ Expediente registrado');
  S.form = {...EF}; S.editId = null; S.view = 'lista';
  render();
}

function doEdit(id) {
  if (!canWrite()) return showToast('Sin permisos de edición', true);
  const e = S.exps.find(x => x.id === id);
  if (!e) return;
  S.form = {...e}; S.editId = id; S.det = null; S.view = 'form';
  aplicarPlazoAutomatico();
  render();
}

async function doDel(id) {
  if (!isAdmin()) return showToast('Sin permisos de eliminación', true);
  showLoading(true);
  const ok = await deleteRecord(id);
  showLoading(false);
  if (!ok) return;
  S.exps = S.exps.filter(e => e.id !== id);
  S.selected.delete(id);
  S.delC = null;
  if (S.det?.id === id) { S.det = null; S.view = 'lista'; }
  showToast('✓ Expediente eliminado');
  render();
}

// ── Navegación horizontal de tablas anchas (botones + arrastre) ─
function tblScroll(btn, dir) {
  const wrap = btn.closest('.card, .mt-wrap')?.querySelector('.tbl-scroll');
  if (wrap) wrap.scrollBy({ left: dir * 260, behavior: 'smooth' });
}
function tblDragStart(e, el) {
  if (e.button !== 0 || e.target.closest('button,a,input,select,textarea')) return;
  e.preventDefault();
  const startX = e.pageX, startLeft = el.scrollLeft;
  el.classList.add('grabbing');
  function onMove(ev) { el.scrollLeft = startLeft - (ev.pageX - startX); }
  function onUp() {
    el.classList.remove('grabbing');
    window.removeEventListener('mousemove', onMove);
    window.removeEventListener('mouseup', onUp);
  }
  window.addEventListener('mousemove', onMove);
  window.addEventListener('mouseup', onUp);
}

// ── Selección masiva ──────────────────────────────────────────
function toggleSelect(id) {
  if (S.selected.has(id)) S.selected.delete(id);
  else S.selected.add(id);
  const cb  = document.getElementById('cb_'+id);
  const row = document.getElementById('row_'+id);
  if (cb)  cb.checked = S.selected.has(id);
  if (row) row.classList.toggle('sel', S.selected.has(id));
  updateBulkBar();
}

function toggleSelectAll() {
  const checkboxes = document.querySelectorAll('.row-cb');
  const allChecked = S.selected.size >= checkboxes.length && checkboxes.length > 0;
  checkboxes.forEach(cb => {
    const id = cb.dataset.id;
    if (allChecked) S.selected.delete(id);
    else            S.selected.add(id);
    cb.checked = !allChecked;
    const row = document.getElementById('row_'+id);
    if (row) row.classList.toggle('sel', !allChecked);
  });
  const selAll = document.getElementById('cbSelectAll');
  if (selAll) selAll.indeterminate = false, selAll.checked = !allChecked;
  updateBulkBar();
}

function updateBulkBar() {
  const bar = document.getElementById('bulkBar');
  const cnt = document.getElementById('bulkCount');
  const selAll = document.getElementById('cbSelectAll');
  const total  = document.querySelectorAll('.row-cb').length;
  if (!bar) return;
  bar.style.display = S.selected.size > 0 ? 'flex' : 'none';
  if (cnt) cnt.textContent = `${S.selected.size} expediente${S.selected.size!==1?'s':''} seleccionado${S.selected.size!==1?'s':''}`;
  if (selAll) {
    selAll.checked = S.selected.size === total && total > 0;
    selAll.indeterminate = S.selected.size > 0 && S.selected.size < total;
  }
}

async function doDelSelected() {
  if (!isAdmin()) return showToast('Sin permisos de eliminación', true);
  if (S.selected.size === 0) return;
  const n = S.selected.size;
  if (!confirm(`¿Eliminar ${n} expediente${n!==1?'s':''} seleccionado${n!==1?'s':''}?\n\nEsta acción NO se puede deshacer.`)) return;
  showLoading(true);
  const ids = [...S.selected];
  try {
    const { error } = await SB.from('expedientes').delete().in('id', ids);
    if (error) throw error;
    S.exps = S.exps.filter(e => !ids.includes(e.id));
    S.selected.clear();
    showToast(`✓ ${n} expediente${n!==1?'s':''} eliminado${n!==1?'s':''}`);
  } catch(e) {
    showToast('Error al eliminar: ' + e.message, true);
  }
  showLoading(false);
  render();
}

function doSearch() {
  const q = S.sq.trim().toLowerCase();
  if (!q) { S.sdone = false; S.srs = []; render(); return; }
  S.sdone = true;
  S.srs = S.exps.filter(e => {
    return (e.numeroJuicio||'').toLowerCase().includes(q)
        || (e.demandante||'').toLowerCase().includes(q)
        || (e.numeroExpedienteInterno||'').toLowerCase().includes(q);
  });
  render();
}

function showDet(id){ const prev=S.det?.id; S.det=S.exps.find(e=>e.id===id)||null; if(prev!==id){S.detTab='info';} S.view='detalle'; render(); }
function goNew(){ if(!canWrite()){showToast('Sin permisos para crear expedientes',true);return;} S.form={...EF}; S.editId=null; S.view='form'; render(); }

// ── Modal de tarjetas del dashboard: revisar los expedientes detrás de cada métrica ──
function openDashModal(type){ S.dashModal=type; render(); }
function closeDashModal(){ S.dashModal=null; render(); }
function dashModalData(type){
  const today=new Date(); today.setHours(0,0,0,0);
  const in7=new Date(today); in7.setDate(in7.getDate()+7);
  const in10=new Date(today); in10.setDate(in10.getDate()+10);
  const getFL = window._getFechaLimitePlazo || (()=>null);
  const defs = {
    urgente:     { title:'Expedientes Urgentes', ref:e=>prBdg(e.prioridad),
                   filter:e=>e.prioridad==='urgente' },
    audienciasHoy:{ title:'Audiencias de Hoy', ref:e=>fd(e.fechaProximaAudiencia),
                   filter:e=>{ if(!e.fechaProximaAudiencia)return false; const d=new Date(e.fechaProximaAudiencia+'T00:00:00'); return d.getTime()===today.getTime(); } },
    semana:      { title:'Audiencias en los Próximos 7 Días', ref:e=>fd(e.fechaProximaAudiencia),
                   filter:e=>{ if(!e.fechaProximaAudiencia)return false; const d=new Date(e.fechaProximaAudiencia+'T00:00:00'); return d>=today&&d<=in7; } },
    plazoVenc:   { title:'Contestaciones Vencidas', ref:e=>fd(getFL(e)),
                   filter:e=>{ const fl=getFL(e); return fl && new Date(fl+'T00:00:00')<today; } },
    plazoProx:   { title:'Contestaciones — Próximos 10 Días', ref:e=>fd(getFL(e)),
                   filter:e=>{ const fl=getFL(e); if(!fl)return false; const d=new Date(fl+'T00:00:00'); return d>=today&&d<=in10; } },
    plazoProc:   { title:'Contestaciones en Proceso', ref:e=>fd(getFL(e)),
                   filter:e=>{ const fl=getFL(e); return fl && new Date(fl+'T00:00:00')>in10; } },
    cumplVenc:   { title:'Cumplimientos Vencidos (Art. 58 LFPCA)', ref:e=>fd(e.fechaVencimientoCumplimiento),
                   filter:e=>e.fechaVencimientoCumplimiento && isParaEfectos(e.efectoSentencia) && diasParaFecha(e.fechaVencimientoCumplimiento)<0 },
    cumplProx:   { title:'Cumplimientos Próximos 30 Días (Art. 58 LFPCA)', ref:e=>fd(e.fechaVencimientoCumplimiento),
                   filter:e=>{ if(!e.fechaVencimientoCumplimiento||!isParaEfectos(e.efectoSentencia))return false; const d=diasParaFecha(e.fechaVencimientoCumplimiento); return d!==null&&d>=0&&d<=30; } },
    total:       { title:'Todos los Expedientes', ref:e=>bdg(e.estatus,true), filter:()=>true }
  };
  const d = defs[type] || defs.total;
  return { title:d.title, ref:d.ref, list:S.exps.filter(d.filter) };
}
function rDashModal(){
  if(!S.dashModal) return '';
  const { title, list, ref } = dashModalData(S.dashModal);
  return `<div class="dmodal-bg" onclick="if(event.target===this)closeDashModal()">
    <div class="dmodal">
      <div class="dmodal-hd">
        <div><div style="font-weight:900;font-size:16px;color:#0f2044">${esc(title)}</div><div style="font-size:11.5px;color:#64748b;margin-top:2px">${list.length} expediente${list.length!==1?'s':''}</div></div>
        <button class="dmodal-close" onclick="closeDashModal()">✕</button>
      </div>
      ${list.length===0 ? '<p style="text-align:center;color:#94a3b8;padding:36px;font-size:12.5px">No hay expedientes en esta categoría.</p>' : `
      <div style="overflow-x:auto"><table class="tbl">
        <thead><tr><th>N° Juicio</th><th>Demandante</th><th>Sala</th><th>Abogado</th><th>Estatus</th><th>Referencia</th><th>Acciones</th></tr></thead>
        <tbody>${list.map(e=>`<tr>
          <td style="font-weight:800;color:#1e3a5f;white-space:nowrap">${esc(e.numeroJuicio)}</td>
          <td style="max-width:170px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(e.demandante)||'—'}</td>
          <td style="color:#64748b;white-space:nowrap">${esc(e.sala)||'—'}</td>
          <td style="color:#64748b;white-space:nowrap">${esc(e.abogadoResponsable)||'—'}</td>
          <td>${bdg(e.estatus,true)}</td>
          <td style="white-space:nowrap">${ref(e)}</td>
          <td><div style="display:flex;gap:6px;font-size:10.5px;white-space:nowrap"><button class="link-btn" style="color:#2563eb" onclick="closeDashModal();showDet('${e.id}')">Ver</button>${canWrite()?`<span style="color:#e2e8f0">|</span><button class="link-btn" style="color:#d97706" onclick="closeDashModal();doEdit('${e.id}')">Editar</button>`:''}</div></td>
        </tr>`).join('')}</tbody>
      </table></div>`}
    </div>
  </div>`;
}

// ════════════════════════════════════════════════════════════════
// RENDER — HEADER
// ════════════════════════════════════════════════════════════════
function rHdr() {
  const ad = isAdmin();
  const wr = canWrite();
  const roleBg    = ad ? '#fef3c7' : wr ? '#dcfce7' : '#e0e7ff';
  const roleColor = ad ? '#92400e' : wr ? '#166534' : '#3730a3';
  const roleLabel = ad ? '🔑 Administrador' : wr ? '✏️ Editor' : '👁 Solo lectura';

  const ns = [
    ['lista','▤ Expedientes'],
    ...(wr ? [['form','+ Nuevo']] : []),
    ['buscar','⌕ Buscar'],
    ['calendario','📅 Calendario'],
    ['reportes','◫ Reportes'],
    ['boletin', boletinNavLabel()],
    ...(ad ? [['bitacora','📋 Bitácora']] : [])
  ];

  document.getElementById('hdr').innerHTML = `
    <div class="header">
      <div class="header-top">
        <div class="logo">⚖</div>
        <div>
          <div class="hdr-title">Sistema de Control de Juicios</div>
          <div class="hdr-sub">Organismo Desconcentrado · Administración Pública Federal</div>
        </div>
        <div class="hdr-stats">
          <div class="hdr-stat">
            <div class="hdr-stat-lbl">Expedientes totales</div>
            <div class="hdr-stat-num">${S.exps.length}</div>
          </div>
          <div class="hdr-user">
            <div class="hdr-user-name">${esc(S.userName)}</div>
            <span class="hdr-role" style="background:${roleBg};color:${roleColor}">${roleLabel}</span>
          </div>
          <button onclick="logout()" class="hdr-logout">⏏ Salir</button>
        </div>
      </div>
      <div class="file-bar">
        <div class="dot dot-green"></div>
        <span style="color:#a5f3c7;font-weight:700">Supabase · PostgreSQL</span>
        <span style="opacity:.6">· Sincronizado en la nube · Acceso desde cualquier dispositivo · v${APP_VERSION}</span>
        ${S.loading ? '<span style="margin-left:auto;color:#fbbf24;font-size:10.5px;animation:pulse 1s infinite">⏳ Cargando…</span>' : ''}
        <button onclick="loadData()" style="margin-left:auto;background:none;border:1px solid rgba(255,255,255,0.2);border-radius:6px;padding:2px 10px;font-size:10.5px;font-weight:700;color:#93c5fd;cursor:pointer;font-family:inherit">↺ Recargar</button>
      </div>
      ${!ad && !wr ? `<div class="readonly-bar">👁 Modo de solo lectura — puedes consultar y exportar, pero no modificar expedientes</div>` : ''}
      ${!ad && wr  ? `<div class="readonly-bar" style="border-left-color:#4ade80;color:#bbf7d0">✏️ Modo Editor — puedes registrar y editar expedientes, pero no eliminarlos</div>` : ''}
      <div class="nav">${ns.map(([id,l]) => `<button class="${S.view===id||(id==='form'&&S.view==='form')?'active':''}" onclick="${id==='form'?'goNew()':'sv(\''+id+'\')'}">${l}</button>`).join('')}</div>
    </div>`;
}

// ════════════════════════════════════════════════════════════════
// RENDER — LISTA
// ════════════════════════════════════════════════════════════════
function rLista() {
  let arr = S.lf.trim()
    ? S.exps.filter(e => [e.numeroJuicio,e.demandante,e.abogadoResponsable].some(v=>(v||'').toLowerCase().includes(S.lf.toLowerCase())))
    : [...S.exps];

  // Filtro por estatus (independiente del filtro de texto)
  if (S.statusFilter) {
    arr = arr.filter(e => (e.estatus || 'En trámite') === S.statusFilter);
  }

  const cmpJ = (a,b) => String(a.numeroJuicio||'').localeCompare(String(b.numeroJuicio||''),'es',{numeric:true,sensitivity:'base'});
  const cmpE = (a,b) => String(a.estatus||'').localeCompare(String(b.estatus||''),'es',{sensitivity:'base'});
  const PR_ORDER = {urgente:0,alta:1,normal:2,baja:3};
  if(S.sortBy==='reg-desc')   arr.sort((a,b)=>Number(b.id||0)-Number(a.id||0));
  else if(S.sortBy==='reg-asc')    arr.sort((a,b)=>Number(a.id||0)-Number(b.id||0));
  else if(S.sortBy==='juicio-desc') arr.sort((a,b)=>cmpJ(b,a));
  else if(S.sortBy==='juicio-asc')  arr.sort((a,b)=>cmpJ(a,b));
  else if(S.sortBy==='prio')  arr.sort((a,b)=>(PR_ORDER[a.prioridad||'normal'])-(PR_ORDER[b.prioridad||'normal']));
  else if(S.sortBy==='estatus-asc')  arr.sort((a,b)=>cmpE(a,b));
  else if(S.sortBy==='estatus-desc') arr.sort((a,b)=>cmpE(b,a));

  const today=new Date(); today.setHours(0,0,0,0);
  const in7=new Date(today); in7.setDate(in7.getDate()+7);
  const in10=new Date(today); in10.setDate(in10.getDate()+10);
  const todayStr=today.toLocaleDateString('es-MX',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
  const urgCount=S.exps.filter(e=>e.prioridad==='urgente').length;
  const todayHearings=S.exps.filter(e=>{if(!e.fechaProximaAudiencia)return false;const d=new Date(e.fechaProximaAudiencia+'T00:00:00');return d.getTime()===today.getTime();}).length;
  const weekHearings=S.exps.filter(e=>{if(!e.fechaProximaAudiencia)return false;const d=new Date(e.fechaProximaAudiencia+'T00:00:00');return d>=today&&d<=in7;}).length;

  // Expedientes atendidos: tienen al menos un oficio registrado
  const isAtendido = e => !!(e.oficioContestacion || e.oficioAmpliacion || e.oficioAlegatos);
  const atendidos  = S.exps.filter(isAtendido);
  const atenCount  = atendidos.length;

  // Cumplimientos próximos (para efectos, Art. 58 LFPCA)
  const cumplProx = S.exps.filter(e => {
    if (!e.fechaVencimientoCumplimiento || !isParaEfectos(e.efectoSentencia)) return false;
    const dias = diasParaFecha(e.fechaVencimientoCumplimiento);
    return dias !== null && dias >= 0 && dias <= 30;
  }).length;
  const cumplVenc = S.exps.filter(e => {
    if (!e.fechaVencimientoCumplimiento || !isParaEfectos(e.efectoSentencia)) return false;
    return diasParaFecha(e.fechaVencimientoCumplimiento) < 0;
  }).length;
  // Plazos de contestación: calcula la fecha límite de cada expediente activo
  // Se consideran expedientes En trámite con fechaEmplazamiento definida
  // Para Juicio de Nulidad y Juicio Agrario se usa la lógica de calcularPlazoContestacion;
  // para otros tipos se usa fechaContestacion si está capturada manualmente.
  function _getFechaLimitePlazo(e) {
    if (e.estatus !== 'En trámite') return null;
    // Si ya se contestó la demanda (oficio de contestación registrado), el plazo
    // de contestación ya quedó cumplido: deja de contar como vencido / pendiente.
    if ((e.oficioContestacion && String(e.oficioContestacion).trim()) ||
        (e.fechaOficioContestacion && String(e.fechaOficioContestacion).trim())) return null;
    if (e.tipoJuicio === 'Juicio de Nulidad' || e.tipoJuicio === 'Juicio Agrario') {
      if (!e.fechaEmplazamiento) return null;
      // Para Juicio de Nulidad sin vía procesal capturada, usar Ordinario por defecto
      const r = calcularPlazoContestacion(e.fechaEmplazamiento, e.tipoJuicio, e.viaProcesal);
      if (!r) return null;
      return r.tipo === 'contencioso' ? r.fechaLimite : r.fechaMax;
    }
    return e.fechaContestacion || null;
  }
  // Exponer helper globalmente para reutilizarlo al renderizar filas
  window._getFechaLimitePlazo = _getFechaLimitePlazo;
  const plazoVenc = S.exps.filter(e => {
    const fl = _getFechaLimitePlazo(e);
    if (!fl) return false;
    return new Date(fl+'T00:00:00') < today;
  }).length;
  const plazoProx = S.exps.filter(e => {
    const fl = _getFechaLimitePlazo(e);
    if (!fl) return false;
    const d = new Date(fl+'T00:00:00');
    return d >= today && d <= in10;
  }).length;
  const plazoProc = S.exps.filter(e => {
    const fl = _getFechaLimitePlazo(e);
    if (!fl) return false;
    return new Date(fl+'T00:00:00') > in10;
  }).length;
  const ad = isAdmin();
  const wr = canWrite();

  return `<div>
    <div class="dash">
      <div class="dash-info">
        <div class="dash-date"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>${todayStr}</div>
        <div class="dash-rem"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>Recuerda revisar diariamente esta base de datos para no perder audiencias ni vencimientos</div>
      </div>
      <div class="dash-metrics">
        <div class="metric m-urg${urgCount===0?' zero':''}" onclick="openDashModal('urgente')" title="Ver expedientes urgentes"><div class="metric-num">${urgCount}</div><div class="metric-lbl">Urgentes</div></div>
        <div class="metric m-today${todayHearings===0?' zero':''}" onclick="openDashModal('audienciasHoy')" title="Ver audiencias de hoy"><div class="metric-num">${todayHearings}</div><div class="metric-lbl">Audiencias hoy</div></div>
        <div class="metric m-week" onclick="openDashModal('semana')" title="Ver audiencias de los próximos 7 días"><div class="metric-num">${weekHearings}</div><div class="metric-lbl">Próx. 7 días</div></div>
        <div class="metric m-plazo-venc${plazoVenc===0?' zero':''}" onclick="openDashModal('plazoVenc')" title="Ver contestaciones vencidas"><div class="metric-num">${plazoVenc}</div><div class="metric-lbl">Contest. vencidas</div></div>
        <div class="metric m-plazo-prox${plazoProx===0?' zero':''}" onclick="openDashModal('plazoProx')" title="Ver contestaciones con vencimiento en los próximos 10 días"><div class="metric-num">${plazoProx}</div><div class="metric-lbl">Contest. próx. 10d</div></div>
        <div class="metric m-plazo-proc${plazoProc===0?' zero':''}" onclick="openDashModal('plazoProc')" title="Ver contestaciones en proceso"><div class="metric-num">${plazoProc}</div><div class="metric-lbl">Contest. en proceso</div></div>
        <div class="metric" onclick="sv('boletin')" style="border-left-color:#4338ca"><div class="metric-num" style="color:#4338ca">${S.boletinHits.filter(h=>esBoletinRelevante(h) && !h.revisado).length}</div><div class="metric-lbl">Boletin pend.</div></div>
        <div class="metric m-aten${atenCount===0?' zero':''}" onclick="S.atenOpen=!S.atenOpen;render()" title="Ver expedientes atendidos"><div class="metric-num">${atenCount}</div><div class="metric-lbl">Atendidos</div></div>
        <div class="metric m-cumpl${cumplVenc>0?' urgent':cumplProx===0?' zero':''}" onclick="openDashModal(${cumplVenc>0?"'cumplVenc'":"'cumplProx'"})" title="Art. 58 LFPCA — sentencias para efectos"><div class="metric-num">${cumplVenc>0?cumplVenc:cumplProx}</div><div class="metric-lbl">${cumplVenc>0?'Cumpl. VENCIDOS':'Cumpl. próx. 30d'}</div></div>
        <div class="metric m-total" onclick="openDashModal('total')" title="Ver todos los expedientes"><div class="metric-num">${S.exps.length}</div><div class="metric-lbl">Total</div></div>
      </div>
    </div>

    ${atenCount > 0 ? `
    <div class="aten-banner">
      <div class="aten-header" onclick="S.atenOpen=!S.atenOpen;render()">
        <div class="aten-icon">✅</div>
        <div class="aten-title">Expedientes ya atendidos con oficio</div>
        <span class="aten-count">${atenCount} expediente${atenCount!==1?'s':''}</span>
        <span class="aten-chevron${S.atenOpen?' open':''}">▼</span>
      </div>
      ${S.atenOpen ? `
      <div class="aten-body">
        <div class="aten-head-row" style="display:grid;grid-template-columns:140px 1fr 1fr 1fr;gap:6px;padding:5px 8px 7px;border-bottom:1px solid #bbf7d0">
          <span style="font-size:10.5px;font-weight:900;color:#94a3b8;text-transform:uppercase;letter-spacing:.08em">N° Juicio</span>
          <span style="font-size:10.5px;font-weight:900;color:#94a3b8;text-transform:uppercase;letter-spacing:.08em">Contestación</span>
          <span style="font-size:10.5px;font-weight:900;color:#94a3b8;text-transform:uppercase;letter-spacing:.08em">Amp. Demanda</span>
          <span style="font-size:10.5px;font-weight:900;color:#94a3b8;text-transform:uppercase;letter-spacing:.08em">Alegatos</span>
        </div>
        ${atendidos.map(e=>{
          const ofCell = (oficio, fecha, lbl) => oficio
            ? `<div class="aten-oficio"><span class="aten-oficio-tag">${lbl}</span><span class="aten-oficio-val">📄 ${esc(oficio)}</span>${fecha?`<span class="aten-oficio-date">${fd(fecha)}</span>`:''}</div>`
            : `<div class="aten-oficio"><span class="aten-oficio-tag">${lbl}</span><span class="aten-oficio-empty">—</span></div>`;
          return `<div class="aten-row">
            <div>
              <button class="link-btn" style="color:#2563eb;font-size:11.5px;font-weight:800" onclick="showDet('${e.id}')">${esc(e.numeroJuicio)}</button>
              <div style="font-size:10.5px;color:#94a3b8;margin-top:1px">${esc(e.demandante)||'—'}</div>
            </div>
            ${ofCell(e.oficioContestacion, e.fechaOficioContestacion, 'Contestación')}
            ${ofCell(e.oficioAmpliacion,   e.fechaOficioAmpliacion,   'Amp. Demanda')}
            ${ofCell(e.oficioAlegatos,     e.fechaOficioAlegatos,     'Alegatos')}
          </div>`;
        }).join('')}
      </div>` : ''}
    </div>` : ''}

    <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;flex-wrap:wrap">
      <div class="sbar" style="margin-bottom:0">
        <div class="sbar-line"></div>
        <span class="sbar-title">Expedientes</span>
        <span style="font-size:10.5px;font-weight:800;background:#dbeafe;color:#1e40af;padding:2px 9px;border-radius:999px">${arr.length}${arr.length!==S.exps.length?` / ${S.exps.length}`:''}</span>
      </div>
      <div style="margin-left:auto;display:flex;gap:8px;flex-wrap:wrap">
        <select onchange="S.statusFilter=this.value;render()" style="width:auto;cursor:pointer" title="Filtrar por estatus">
          <option value="">⚙ Todos los estatus</option>
          ${ESTATUS.map(s=>{
            const n=S.exps.filter(e=>(e.estatus||'En trámite')===s).length;
            return `<option value="${esc(s)}"${S.statusFilter===s?' selected':''}>${esc(s)} (${n})</option>`;
          }).join('')}
        </select>
        <select onchange="S.sortBy=this.value;render()" style="width:auto;cursor:pointer">
          <option value="reg-desc"${S.sortBy==='reg-desc'?' selected':''}>📅 Registro: más reciente</option>
          <option value="reg-asc"${S.sortBy==='reg-asc'?' selected':''}>📅 Registro: más antiguo</option>
          <option value="juicio-desc"${S.sortBy==='juicio-desc'?' selected':''}>⚖ N° Juicio: descendente</option>
          <option value="juicio-asc"${S.sortBy==='juicio-asc'?' selected':''}>⚖ N° Juicio: ascendente</option>
          <option value="prio"${S.sortBy==='prio'?' selected':''}>🔴 Prioridad: urgentes primero</option>
          <option value="estatus-asc"${S.sortBy==='estatus-asc'?' selected':''}>📑 Estatus: A → Z</option>
          <option value="estatus-desc"${S.sortBy==='estatus-desc'?' selected':''}>📑 Estatus: Z → A</option>
        </select>
        <input id="listaFilter" value="${esc(S.lf)}" oninput="setFilter(this.value)" placeholder="Filtrar por juicio, demandante o abogado…" style="width:240px">
        ${wr ? `
          <button class="btn btn-secondary" onclick="downloadTemplate()" style="border-color:#c7d2fe;color:#3730a3;background:#eef2ff" title="Descarga un Excel vacío con las columnas correctas">📋 Plantilla</button>
          <button class="btn btn-secondary" onclick="document.getElementById('importFile').click()" style="border-color:#a7f3d0;color:#065f46;background:#f0fdf4">📥 Importar Excel</button>
          <button class="btn btn-primary" onclick="goNew()">+ Nuevo</button>
        ` : ''}
      </div>
    </div>
    ${S.statusFilter ? `<div style="margin-bottom:12px;padding:8px 12px;background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;display:flex;align-items:center;gap:10px;font-size:11.5px"><span style="color:#1e40af;font-weight:700">Filtrando por estatus:</span>${bdg(S.statusFilter,true)}<button class="link-btn" style="color:#dc2626;font-size:11.5px;margin-left:auto" onclick="S.statusFilter='';render()">✕ Quitar filtro</button></div>` : ''}

    ${S.exps.length===0 ? `
      <div class="card empty">
        <div class="empty-icon">📂</div>
        <p style="color:#94a3b8;font-size:13px;margin-bottom:12px">No hay expedientes registrados.</p>
        ${wr ? `<button class="btn btn-primary" onclick="goNew()">Registrar el primero</button>` : ''}
      </div>` :
      arr.length === 0 ? `<div class="card empty"><div class="empty-icon">🔍</div><p style="color:#94a3b8">No hay resultados para el filtro.</p></div>` :
      `<div>
        ${ad ? `
        <div id="bulkBar" style="display:${S.selected.size>0?'flex':'none'};align-items:center;gap:10px;background:#1e3a5f;border-radius:10px;padding:10px 16px;margin-bottom:10px;flex-wrap:wrap">
          <span id="bulkCount" style="font-size:12.5px;font-weight:800;color:#93c5fd">${S.selected.size} expedientes seleccionados</span>
          <div style="margin-left:auto;display:flex;gap:8px">
            <button class="btn btn-secondary btn-sm" style="border-color:rgba(255,255,255,0.2);color:#93c5fd;background:rgba(255,255,255,0.08)" onclick="S.selected.clear();render()">✕ Deseleccionar todo</button>
            <button class="btn btn-danger btn-sm" onclick="doDelSelected()">🗑 Eliminar seleccionados</button>
          </div>
        </div>` : ''}
        <div class="card" style="padding:0;overflow:hidden">
          <div class="tbl-nav">
            <button class="tbl-nav-btn" onclick="tblScroll(this,-1)" title="Desplazar a la izquierda">‹</button>
            <button class="tbl-nav-btn" onclick="tblScroll(this,1)" title="Desplazar a la derecha">›</button>
          </div>
          <div class="tbl-scroll" onmousedown="tblDragStart(event,this)">
          <table class="tbl">
            <thead><tr>
              <th class="sticky-col" style="width:4px;padding:0;left:0"></th>
              ${ad ? `<th class="sticky-col" style="width:36px;text-align:center;padding:0 8px;left:4px"><input type="checkbox" id="cbSelectAll" onclick="toggleSelectAll()" title="Seleccionar todo" style="width:15px;height:15px;cursor:pointer"></th>` : ''}
              <th class="sticky-col edge-l" style="left:${ad?40:4}px">N° Juicio</th><th>N° CNA</th><th>Tipo de Juicio</th>
              <th>Demandante</th><th>Sala</th><th>Abogado</th><th>Estatus</th><th>Plazo Cont.</th><th class="sticky-col edge-r" style="right:0">Acciones</th>
            </tr></thead>
            <tbody>${arr.map(e => {
              const p   = PR_MAP[e.prioridad||'normal'];
              const sel = S.selected.has(e.id);
              // Badge de plazo de contestación
              const _todayMs = new Date(); _todayMs.setHours(0,0,0,0);
              const _in10Ms  = new Date(_todayMs); _in10Ms.setDate(_in10Ms.getDate()+10);
              const _fl = window._getFechaLimitePlazo ? window._getFechaLimitePlazo(e) : null;
              const _yaContestada = (e.oficioContestacion && String(e.oficioContestacion).trim()) ||
                                    (e.fechaOficioContestacion && String(e.fechaOficioContestacion).trim());
              let plazoBadge = _yaContestada
                ? `<span class="plazo-badge plazo-ok">✓ Contestada${e.fechaOficioContestacion?' · '+fd(e.fechaOficioContestacion):''}</span>`
                : '<span style="color:#cbd5e1;font-size:10.5px">—</span>';
              if (_fl) {
                const _fd = new Date(_fl+'T00:00:00');
                const _diffMs = _fd - _todayMs;
                const _days = Math.round(_diffMs / 86400000);
                // Etiqueta de vía procesal para identificar el régimen del plazo
                const _viaLabel = (e.tipoJuicio === 'Juicio de Nulidad' && e.viaProcesal)
                  ? `<div style="font-size:8px;font-weight:700;color:#64748b;margin-top:2px;letter-spacing:.02em">${esc(e.viaProcesal)}</div>`
                  : (e.tipoJuicio === 'Juicio Agrario' ? `<div style="font-size:8px;font-weight:700;color:#64748b;margin-top:2px">Agrario</div>` : '');
                let _chip;
                if (_fd < _todayMs) {
                  _chip = `<span class="plazo-badge plazo-venc">⚠ Vencida hace ${Math.abs(_days)}d</span>`;
                } else if (_fd <= _in10Ms) {
                  _chip = `<span class="plazo-badge plazo-prox">⏰ ${_days === 0 ? 'Hoy' : _days+'d restantes'}</span>`;
                } else {
                  _chip = `<span class="plazo-badge plazo-proc">📋 ${_days}d restantes</span>`;
                }
                plazoBadge = `<div>${_chip}${_viaLabel}</div>`;
              }
              return `<tr id="row_${e.id}" class="${sel?'sel':''}">
                <td class="sticky-col" style="left:0;background:${p.c};padding:0;width:4px;border-bottom-color:${p.c}"></td>
                ${ad ? `<td class="sticky-col" style="left:4px;text-align:center;padding:0 8px"><input type="checkbox" id="cb_${e.id}" data-id="${e.id}" class="row-cb" ${sel?'checked':''} onclick="toggleSelect('${e.id}')" style="width:15px;height:15px;cursor:pointer"></td>` : ''}
                <td class="sticky-col edge-l" style="left:${ad?40:4}px;font-weight:800;color:#1e3a5f;white-space:nowrap">${esc(e.numeroJuicio)}</td>
                <td style="color:#64748b;white-space:nowrap">${esc(e.numeroExpedienteInterno)||'—'}</td>
                <td style="white-space:nowrap">${tjBdg(e.tipoJuicio,true)}</td>
                <td style="max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(e.demandante)||'—'}</td>
                <td style="color:#64748b;white-space:nowrap">${esc(e.sala)||'—'}</td>
                <td style="color:#64748b;white-space:nowrap">${esc(e.abogadoResponsable)||'—'}</td>
                <td><span style="cursor:pointer" title="Click para filtrar por este estatus" onclick="S.statusFilter='${esc(e.estatus||'En trámite')}';render()">${bdg(e.estatus,true)}</span></td>
                <td style="white-space:nowrap">${plazoBadge}</td>
                <td class="sticky-col edge-r" style="right:0">
                  <div style="display:flex;gap:6px;font-size:10.5px;font-weight:800;white-space:nowrap">
                    <button class="link-btn" style="color:#2563eb" onclick="showDet('${e.id}')">Ver</button>
                    ${wr ? `<span style="color:#e2e8f0">|</span><button class="link-btn" style="color:#d97706" onclick="doEdit('${e.id}')">Editar</button>` : ''}
                    ${ad ? `<span style="color:#e2e8f0">|</span><button class="link-btn" style="color:#ef4444" onclick="if(confirm('¿Eliminar ${esc(e.numeroJuicio)}?'))doDel('${e.id}')">Eliminar</button>` : ''}
                  </div>
                </td>
              </tr>`;
            }).join('')}</tbody>
          </table>
        </div></div>
      </div>`
    }
  </div>`;
}

// ════════════════════════════════════════════════════════════════
// RENDER — FORMULARIO
// ════════════════════════════════════════════════════════════════
function rForm() {
  if (!canWrite()) return `
    <div class="card" style="padding:40px;text-align:center">
      <div style="font-size:36px;margin-bottom:12px">⛔</div>
      <p style="color:#dc2626;font-weight:800;font-size:14px">Sin permisos de edición</p>
      <p style="color:#94a3b8;font-size:12.5px;margin:8px 0 16px">Tu cuenta tiene acceso de solo lectura.</p>
      <button class="btn btn-secondary" onclick="sv('lista')">Volver a la lista</button>
    </div>`;

  const ss = S.form.suspension === 'Sí';
  return `<div style="max-width:680px;margin:0 auto">
    <div class="sbar">
      <div class="sbar-line"></div>
      <span class="sbar-title">${S.editId ? 'Editar Expediente' : 'Nuevo Expediente'}</span>
    </div>
    <div class="card">
      ${secT('Identificación del Juicio')}
      <div class="grid2">
        ${fld('Número de Juicio',inp('numeroJuicio','Ej. 123/2024'),true)}
        ${fld('N° Expediente Interno / CNA',inp('numeroExpedienteInterno'))}
        ${fld('Tipo de Juicio',sl('tipoJuicio',TIPO_JUICIO,true),false,true)}
        ${S.form.tipoJuicio === 'Juicio de Nulidad' ? fld('Vía Procesal',sl('viaProcesal',VIA_NULIDAD,true),true,true) : ''}
        ${fld('Demandante',inp('demandante'))}
        ${fld('Sala',inp('sala'))}
        ${fld('Unidad Administrativa',inp('unidadAdministrativa'))}
        ${fld('Tipo de Trámite',sl('tipoTramite',TRAMITE,true))}
        ${fld('Acto Impugnado',inp('actoImpugnado'),false,true)}
        ${fld('Título de Concesión',inp('tituloConcesion'))}
        ${fld('N° Exp. Administrativo (D.A.A.)',inp('numeroExpedienteAdministrativo'))}
      </div>
      ${secT('Materia y Cuantía')}
      <div class="grid2">
        ${fld('Tema de Fondo',`<textarea oninput="sf('temaFondo',this.value)" placeholder="Describe el tema sustantivo del juicio…">${esc(S.form.temaFondo)}</textarea>`,false,true)}
        ${fld('Resolución Impugnada',inp('resolucionImpugnada','Identificación de la resolución…'),false,true)}
        ${fld('Fecha de Emisión de la Resolución',di('fechaEmisionResolucion'))}
        ${fld('Cuantía',inp('cuantia','Ej. $100,000.00 MXN o Indeterminada'))}
      </div>
      ${secT('Autoridades y Responsable')}
      <div class="grid2">
        ${fld('Autoridad Demandada',inp('autoridadDemandada'))}
        ${fld('Autoridad Vinculada',inp('autoridadVinculada'))}
        ${fld('Abogado Responsable',inp('abogadoResponsable'))}
      </div>
      ${secT('Fechas y Audiencias')}
      <div class="grid2">
        ${fld('Fecha de Emplazamiento',di('fechaEmplazamiento'))}
        ${fld('Fecha para dar Contestación',di('fechaContestacion')+plazoInfoHTML(S.form.fechaEmplazamiento,S.form.tipoJuicio,S.form.viaProcesal))}
        ${fld('Fecha de Próxima Audiencia',di('fechaProximaAudiencia'))}
        ${fld('Fecha de Sentencia',`<input type="date" value="${S.form.fechaSentencia||''}" onchange="sf('fechaSentencia',this.value);recalcFirmeza()">`)}
        ${fld('Efecto de la Sentencia',`<select onchange="sf('efectoSentencia',this.value);recalcFirmeza()">${EFECTO_SENTENCIA.map(o=>`<option value="${esc(o)}"${S.form.efectoSentencia===o?' selected':''}>${o||'Seleccionar…'}</option>`).join('')}</select>`)}
        ${fld('Fecha de Notificación de Sentencia',`<input type="date" value="${S.form.fechaNotificacionSentencia||''}" onchange="sf('fechaNotificacionSentencia',this.value);recalcFirmeza()">`,false,false,true)}
        ${fld('Fecha de Firmeza','<span style="font-size:10.5px;color:#94a3b8;font-style:italic">Se calcula en el panel inferior — editable</span>')}
      </div>
      ${firmezaPanelHTML(S.form, true)}
      ${secT('Suspensión')}
      <div class="grid2">
        ${fld('Suspensión',sl('suspension',SUSP))}
        ${ss ? fld('Fecha de Notif. de Suspensión',di('fechaNotificacionSuspension')) : ''}
        ${ss ? fld('Efectos de la Suspensión',inp('efectosSuspension'),false,true) : ''}
      </div>
      ${secT('Estatus y Seguimiento')}
      <div class="grid2">
        ${fld('Prioridad / Urgencia',`<select onchange="sf('prioridad',this.value)">${PRIORIDAD.map(p=>`<option value="${p.v}"${(S.form.prioridad||'normal')===p.v?' selected':''}>${p.l}</option>`).join('')}</select>`)}
        ${fld('Estatus',sl('estatus',ESTATUS,true))}
        ${fld('Fecha de Estatus',di('fechaEstatus'))}
        ${fld('N° Requerimientos de Cumplimiento',`<input type="number" min="0" value="${esc(S.form.numeroRequerimientos)}" oninput="sf('numeroRequerimientos',this.value)">`)}
        ${fld('N° de Apercibimientos',`<input type="number" min="0" value="${esc(S.form.numeroApercibimientos)}" oninput="sf('numeroApercibimientos',this.value)">`)}
        ${fld('Fecha del Último Apercibimiento',di('fechaUltimoApercibimiento'))}
      </div>
      ${secT('Informe al Área')}
      <div class="grid2">
        ${fld('N° de Memo de Informe',inp('numeroMemo','Ej. MEMO-001/2024'))}
        ${fld('Fecha del Memo de Informe',di('fechaMemo'))}
      </div>
      ${secT('Respuestas con Oficio')}
      <p style="font-size:11.5px;color:#64748b;margin-bottom:10px;margin-top:-4px">Registra el número de oficio y fecha con que se dio respuesta a cada etapa procesal. Todos los campos son optativos.</p>
      <div class="grid2">
        ${fld('N° Oficio — Contestación de Demanda',inp('oficioContestacion','Ej. CNA-DGAJ-001/2024'))}
        ${fld('Fecha del Oficio de Contestación',di('fechaOficioContestacion'))}
        ${fld('N° Oficio — Ampliación de Demanda',inp('oficioAmpliacion','Ej. CNA-DGAJ-002/2024'))}
        ${fld('Fecha del Oficio de Ampliación',di('fechaOficioAmpliacion'))}
        ${fld('N° Oficio — Alegatos',inp('oficioAlegatos','Ej. CNA-DGAJ-003/2024'))}
        ${fld('Fecha del Oficio de Alegatos',di('fechaOficioAlegatos'))}
      </div>
      ${secT('Resumen Procesal')}
      <textarea oninput="sf('resumenActuaciones',this.value)" placeholder="Resumen de actuaciones y estado procesal: emplazamiento, contestación, pruebas, alegatos, sentencia, recursos, cumplimiento…" style="min-height:110px">${esc(S.form.resumenActuaciones)}</textarea>
      ${secT('Notas y Observaciones')}
      <textarea oninput="sf('notas',this.value)" placeholder="Observaciones relevantes…">${esc(S.form.notas)}</textarea>
      <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:18px;padding-top:14px;border-top:1px solid #f1f5f9">
        <button class="btn btn-secondary" onclick="S.form={...EF};S.editId=null;sv('lista')">Cancelar</button>
        <button class="btn btn-primary" onclick="doSave()">${S.editId ? 'Guardar Cambios' : 'Registrar Expediente'}</button>
      </div>
    </div>
  </div>`;
}

// ════════════════════════════════════════════════════════════════
// RENDER — DETALLE
// ════════════════════════════════════════════════════════════════
function detB(e){
  const tab   = S.detTab || 'info';
  const tareas = Array.isArray(e.tareas) ? e.tareas : [];
  const pend   = tareas.filter(t=>!t.completada).length;
  const wr     = canWrite();

  const tabs = `<div class="det-tabs">
    <button class="det-tab${tab==='info'?'  active':''}"     onclick="S.detTab='info';render()">📋 Información</button>
    <button class="det-tab${tab==='timeline'?' active':''}"  onclick="S.detTab='timeline';render()">📊 Actuaciones</button>
    <button class="det-tab${tab==='tareas'?'  active':''}"   onclick="S.detTab='tareas';render()">✅ Tareas${pend>0?` <span style="background:#dc2626;color:white;font-size:10.5px;padding:1px 6px;border-radius:999px;margin-left:3px">${pend}</span>`:''}</button>
    <button class="det-tab${tab==='docs'?'    active':''}"   onclick="S.detTab='docs';loadDocs('${e.id}');render()">📎 Documentos</button>
  </div>`;

  let body = '';
  if (tab === 'info') body = `
    ${secT('Identificación')}${fRow('Tipo de Juicio',e.tipoJuicio)}${e.tipoJuicio==='Juicio de Nulidad'?fRow('Vía Procesal',e.viaProcesal):''}${fRow('N° Exp. Interno / CNA',e.numeroExpedienteInterno)}${fRow('Demandante',e.demandante)}${fRow('Sala',e.sala)}${fRow('Unidad Administrativa',e.unidadAdministrativa)}${fRow('Acto Impugnado',e.actoImpugnado)}${fRow('Título de Concesión',e.tituloConcesion)}${fRow('N° Exp. Admvo. (D.A.A.)',e.numeroExpedienteAdministrativo)}${fRow('Tipo de Trámite',e.tipoTramite)}
    ${(e.temaFondo||e.resolucionImpugnada||e.fechaEmisionResolucion||e.cuantia)?secT('Materia y Cuantía')+fRow('Tema de Fondo',e.temaFondo)+fRow('Resolución Impugnada',e.resolucionImpugnada)+fRow('Fecha de Emisión de la Resolución',fd(e.fechaEmisionResolucion))+fRow('Cuantía',e.cuantia):''}
    ${secT('Autoridades')}${fRow('Autoridad Demandada',e.autoridadDemandada)}${fRow('Autoridad Vinculada',e.autoridadVinculada)}${fRow('Abogado Responsable',e.abogadoResponsable)}
    ${secT('Fechas')}${fRow('Fecha de Emplazamiento',fd(e.fechaEmplazamiento))}${fRow('Fecha para dar Contestación',fd(e.fechaContestacion))}${(e.fechaEmplazamiento&&(e.tipoJuicio==='Juicio de Nulidad'||e.tipoJuicio==='Juicio Agrario'))?`<div class="dr"><div class="dl"></div><div class="dv" style="padding:0">${plazoInfoHTML(e.fechaEmplazamiento,e.tipoJuicio,e.viaProcesal)}</div></div>`:''}${fRow('Fecha de Próx. Audiencia',fd(e.fechaProximaAudiencia))}${fRow('Fecha de Sentencia',fd(e.fechaSentencia))}${e.efectoSentencia?fRow('Efecto de la Sentencia',e.efectoSentencia):''}${e.fechaNotificacionSentencia?fRow('Notificación de Sentencia',fd(e.fechaNotificacionSentencia)):''}
    ${firmezaPanelHTML(e, false)}
    ${secT('Suspensión')}${fRow('Suspensión',e.suspension)}${fRow('Fecha de Notificación',fd(e.fechaNotificacionSuspension))}${fRow('Efectos de la Suspensión',e.efectosSuspension)}
    ${secT('Seguimiento')}${fRow('Estatus',e.estatus)}${fRow('Fecha de Estatus',fd(e.fechaEstatus))}${fRow('N° Requerimientos',e.numeroRequerimientos||'—')}${fRow('N° Apercibimientos',e.numeroApercibimientos||'—')}${fRow('Fecha Último Apercibimiento',fd(e.fechaUltimoApercibimiento))}
    ${(e.numeroMemo||e.fechaMemo)?secT('Informe al Área')+fRow('N° de Memo',e.numeroMemo||'—')+fRow('Fecha del Memo',fd(e.fechaMemo)):''}
    ${(e.oficioContestacion||e.oficioAmpliacion||e.oficioAlegatos)?secT('Respuestas con Oficio')+
      (e.oficioContestacion?fRow('Oficio Contestación',e.oficioContestacion+(e.fechaOficioContestacion?' · '+fd(e.fechaOficioContestacion):'')):'') +
      (e.oficioAmpliacion  ?fRow('Oficio Amp. Demanda', e.oficioAmpliacion  +(e.fechaOficioAmpliacion  ?' · '+fd(e.fechaOficioAmpliacion)  :'')):'') +
      (e.oficioAlegatos    ?fRow('Oficio Alegatos',     e.oficioAlegatos    +(e.fechaOficioAlegatos    ?' · '+fd(e.fechaOficioAlegatos)    :'')):'')
    :''}
    ${e.resumenActuaciones?secT('Resumen Procesal')+`<p style="font-size:12.5px;color:#1e293b;white-space:pre-wrap;line-height:1.6;margin-top:4px">${esc(e.resumenActuaciones)}</p>`:''}
    ${e.notas?secT('Notas')+`<p style="font-size:12.5px;color:#1e293b;white-space:pre-wrap;line-height:1.6;margin-top:4px">${esc(e.notas)}</p>`:''}
    ${secT('Historial de Cambios')}
    <div id="detHistory" style="min-height:40px">
      <button onclick="loadDetHistory('${e.id}')" style="font-size:11.5px;color:#2563eb;background:none;border:1px dashed #bfdbfe;border-radius:7px;padding:6px 16px;cursor:pointer;width:100%;font-family:inherit">📋 Cargar historial de este expediente</button>
    </div>`;
  else if (tab === 'timeline') body = rTimeline(e);
  else if (tab === 'tareas')   body = rTareas(e);
  else if (tab === 'docs')     body = rDocumentos(e);

  return tabs + body;
}

function rDetalle(){
  const e = S.det;
  if (!e) return `<button class="link-btn" style="color:#2563eb" onclick="sv('lista')">← Volver</button>`;
  const ad = isAdmin();
  const wr = canWrite();
  return `<div style="max-width:680px;margin:0 auto">
    <button class="link-btn" style="color:#2563eb;font-size:12.5px;display:block;margin-bottom:14px" onclick="S.delC=null;sv('lista')">← Volver a la lista</button>
    <div class="card">
      <div style="display:flex;align-items:start;justify-content:space-between;margin-bottom:12px;flex-wrap:wrap;gap:10px">
        <div>
          <div style="font-size:18px;font-weight:900;color:#0f2044">${esc(e.numeroJuicio)}</div>
          <div style="font-size:11.5px;color:#94a3b8;margin-top:4px;display:flex;align-items:center;gap:6px;flex-wrap:wrap">${tjBdg(e.tipoJuicio,true)}<span>${esc(e.tipoTramite)||'Tipo no especificado'}</span></div>
        </div>
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
          ${prBdg(e.prioridad)}${bdg(e.estatus)}
          ${wr ? `<button class="btn btn-secondary btn-sm" style="border-color:#fde68a;color:#d97706" onclick="doEdit('${e.id}')">Editar</button>` : ''}
          ${ad ? `<button class="btn btn-secondary btn-sm" style="border-color:#fecaca;color:#ef4444" onclick="S.delC='det';render()">Eliminar</button>` : ''}
        </div>
      </div>
      ${S.delC==='det' && ad ? `
        <div class="confirm-box" style="margin-bottom:14px">
          <p style="font-size:12.5px;font-weight:800;color:#991b1b;margin-bottom:8px">¿Eliminar <strong>${esc(e.numeroJuicio)}</strong>? Esta acción no se puede deshacer.</p>
          <div style="display:flex;gap:8px">
            <button class="btn btn-danger btn-sm" onclick="doDel('${e.id}')">Sí, eliminar</button>
            <button class="btn btn-secondary btn-sm" onclick="S.delC=null;render()">Cancelar</button>
          </div>
        </div>` : ''}
      ${detB(e)}
    </div>
  </div>`;
}

// ════════════════════════════════════════════════════════════════
// RENDER — BUSCAR
// ════════════════════════════════════════════════════════════════
function rBuscar(){
  const q   = S.sq.trim();
  const res = S.srs;
  const ad  = isAdmin();
  const wr  = canWrite();
  return`<div style="max-width:860px;margin:0 auto">
    <div class="sbar"><div class="sbar-line"></div><span class="sbar-title">Buscar Expediente</span></div>
    <div class="card" style="margin-bottom:14px">
      <p style="font-size:12.5px;color:#64748b;margin-bottom:10px">Busca por <strong>número de juicio</strong>, <strong>nombre del demandante</strong> o <strong>número de expediente CNA</strong>.</p>
      <div style="display:flex;gap:8px">
        <input value="${esc(S.sq)}" oninput="S.sq=this.value;S.sdone=false;S.srs=[]" onkeydown="if(event.key==='Enter')doSearch()"
          placeholder="Escribe el N° de juicio, nombre del demandante o N° CNA…" style="flex:1">
        <button class="btn btn-primary" onclick="doSearch()">Buscar</button>
        ${S.sdone ? `<button class="btn btn-secondary" onclick="S.sq='';S.sdone=false;S.srs=[];render()">✕ Limpiar</button>` : ''}
      </div>
    </div>
    ${S.sdone && !res.length ? `
      <div class="card empty">
        <div class="empty-icon">🔍</div>
        <p style="color:#94a3b8;font-size:12.5px">No se encontraron expedientes que coincidan con <strong>"${esc(q)}"</strong>.</p>
      </div>` : ''}
    ${S.sdone && res.length ? `
      <div style="margin-bottom:10px;display:flex;align-items:center;gap:8px">
        <span style="font-size:12.5px;font-weight:700;color:#0f2044">${res.length} resultado${res.length!==1?'s':''} encontrado${res.length!==1?'s':''}</span>
        <span style="font-size:11.5px;color:#94a3b8">para "<strong>${esc(q)}</strong>"</span>
      </div>
      ${res.length===1 ? `
        <div class="card">
          <div style="display:flex;align-items:start;justify-content:space-between;margin-bottom:10px;flex-wrap:wrap;gap:8px">
            <div>
              <div style="font-size:16px;font-weight:900;color:#0f2044">${esc(res[0].numeroJuicio)}</div>
              <div style="font-size:11.5px;color:#94a3b8;margin-top:4px;display:flex;align-items:center;gap:6px;flex-wrap:wrap">
                ${tjBdg(res[0].tipoJuicio,true)}<span>${esc(res[0].tipoTramite)||'Tipo no especificado'}</span>
              </div>
            </div>
            <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
              ${prBdg(res[0].prioridad)}${bdg(res[0].estatus)}
              ${wr ? `<button class="btn btn-secondary btn-sm" style="border-color:#fde68a;color:#d97706" onclick="doEdit('${res[0].id}')">Editar</button>` : ''}
            </div>
          </div>
          ${detB(res[0])}
        </div>` : `
        <div class="card" style="padding:0;overflow:hidden">
          <div class="tbl-nav">
            <button class="tbl-nav-btn" onclick="tblScroll(this,-1)" title="Desplazar a la izquierda">‹</button>
            <button class="tbl-nav-btn" onclick="tblScroll(this,1)" title="Desplazar a la derecha">›</button>
          </div>
          <div class="tbl-scroll" onmousedown="tblDragStart(event,this)">
          <table class="tbl">
            <thead><tr>
              <th class="sticky-col" style="width:4px;padding:0;left:0"></th>
              <th class="sticky-col edge-l" style="left:4px">N° Juicio</th><th>N° CNA</th><th>Tipo de Juicio</th>
              <th>Demandante</th><th>Sala</th><th>Abogado</th><th>Estatus</th><th class="sticky-col edge-r" style="right:0">Acciones</th>
            </tr></thead>
            <tbody>${res.map(e => {
              const p = PR_MAP[e.prioridad||'normal'];
              const ql = q.toLowerCase();
              const hi = t => {
                if(!t) return '—';
                const idx = t.toLowerCase().indexOf(ql);
                if(idx<0) return esc(t);
                return esc(t.slice(0,idx))+'<mark style="background:#fef08a;padding:0;border-radius:2px">'+esc(t.slice(idx,idx+ql.length))+'</mark>'+esc(t.slice(idx+ql.length));
              };
              return `<tr>
                <td class="sticky-col" style="left:0;background:${p.c};padding:0;width:4px;border-bottom-color:${p.c}"></td>
                <td class="sticky-col edge-l" style="left:4px;font-weight:800;color:#1e3a5f;white-space:nowrap">${hi(e.numeroJuicio)}</td>
                <td style="color:#64748b;white-space:nowrap">${hi(e.numeroExpedienteInterno)||'—'}</td>
                <td style="white-space:nowrap">${tjBdg(e.tipoJuicio,true)}</td>
                <td style="max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${hi(e.demandante)||'—'}</td>
                <td style="color:#64748b;white-space:nowrap">${esc(e.sala)||'—'}</td>
                <td style="color:#64748b;white-space:nowrap">${esc(e.abogadoResponsable)||'—'}</td>
                <td>${bdg(e.estatus,true)}</td>
                <td class="sticky-col edge-r" style="right:0">
                  <div style="display:flex;gap:6px;font-size:10.5px;font-weight:800;white-space:nowrap">
                    <button class="link-btn" style="color:#2563eb" onclick="showDet('${e.id}')">Ver</button>
                    ${wr ? `<span style="color:#e2e8f0">|</span><button class="link-btn" style="color:#d97706" onclick="doEdit('${e.id}')">Editar</button>` : ''}
                  </div>
                </td>
              </tr>`;
            }).join('')}</tbody>
          </table>
        </div></div>`}` : ''}
  </div>`;
}

// ════════════════════════════════════════════════════════════════
// RENDER — REPORTES
// ════════════════════════════════════════════════════════════════
function rReportes(){
  const today=new Date();today.setHours(0,0,0,0);
  const in30=new Date(today);in30.setDate(in30.getDate()+30);
  const bySt=ESTATUS.reduce((a,s)=>({...a,[s]:S.exps.filter(e=>e.estatus===s)}),{});
  const prox=[...S.exps].filter(e=>{if(!e.fechaProximaAudiencia)return false;const d=new Date(e.fechaProximaAudiencia+'T00:00:00');return d>=today&&d<=in30;}).sort((a,b)=>new Date(a.fechaProximaAudiencia)-new Date(b.fechaProximaAudiencia));
  const byAb=S.exps.reduce((a,e)=>{const k=e.abogadoResponsable||'Sin asignar';if(!a[k])a[k]=[];a[k].push(e);return a;},{});
  const mT=(rows,cols,hdrs,dc)=>`<div class="mt-wrap"><table class="mt"><thead><tr>${hdrs.map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.map((r,i)=>`<tr style="background:${i%2?'#fafbfc':'white'}">${cols.map(c=>`<td style="${c==='numeroJuicio'?'font-weight:800;color:#1e3a5f':'color:#374151'}">${c==='estatus'?bdg(r[c],true):c===dc?fd(r[c]):esc(r[c])||'—'}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  const none='<p style="text-align:center;color:#94a3b8;padding:36px;font-size:12.5px">No hay expedientes registrados.</p>';
  const tabs=[['estatus','📊 Por Estatus'],['audiencias','📅 Audiencias Próximas'],['abogado','👤 Por Abogado'],['general','📋 Listado General']];
  let body='';
  if(S.rep==='estatus'){
    body=`<b style="color:#0f2044">Juicios por Estatus</b><div style="font-size:11.5px;color:#94a3b8;margin:3px 0 14px">Total: ${S.exps.length}</div>${S.exps.length===0?none:ESTATUS.map(s=>{const l=bySt[s]||[];return l.length?`<div style="margin-bottom:18px"><div style="display:flex;align-items:center;gap:8px;margin-bottom:5px">${bdg(s)}<span style="font-size:10.5px;color:#94a3b8;font-weight:700">${l.length} exp.</span></div>${mT(l,['numeroJuicio','demandante','abogadoResponsable','fechaEstatus'],['N° Juicio','Demandante','Abogado','Fecha Estatus'],'fechaEstatus')}</div>`:''}).join('')}${S.exps.length?`<div style="border-top:1px solid #f1f5f9;padding-top:14px;margin-top:6px"><p style="font-size:10.5px;font-weight:900;color:#94a3b8;text-transform:uppercase;letter-spacing:.12em;margin-bottom:10px">Resumen</p><div style="display:grid;grid-template-columns:1fr 1fr;gap:7px">${ESTATUS.map(s=>{const n=(bySt[s]||[]).length;return n?`<div style="display:flex;align-items:center;justify-content:space-between;background:#f8fafc;border-radius:9px;padding:7px 12px">${bdg(s,true)}<span style="font-size:13px;font-weight:900;color:#0f2044">${n}</span></div>`:''}).join('')}</div></div>`:''}`;
  }else if(S.rep==='audiencias'){
    body=`<b style="color:#0f2044">Audiencias Próximas</b><div style="font-size:11.5px;color:#94a3b8;margin:3px 0 14px">Próximos 30 días · hasta el ${in30.toLocaleDateString('es-MX',{day:'2-digit',month:'long',year:'numeric'})}</div>${prox.length===0?'<div style="text-align:center;padding:44px"><div style="font-size:32px;margin-bottom:10px">📅</div><p style="color:#94a3b8;font-size:12.5px">No hay audiencias en los próximos 30 días.</p></div>':`<div style="margin-bottom:10px"><span style="background:#fee2e2;color:#991b1b;font-size:10.5px;font-weight:800;padding:3px 12px;border-radius:999px">${prox.length} audiencia(s) próxima(s)</span></div>${mT(prox,['fechaProximaAudiencia','numeroJuicio','demandante','abogadoResponsable','estatus'],['Fecha','N° Juicio','Demandante','Abogado','Estatus'],'fechaProximaAudiencia')}`}`;
  }else if(S.rep==='abogado'){
    body=`<b style="color:#0f2044">Por Abogado Responsable</b><div style="font-size:11.5px;color:#94a3b8;margin:3px 0 14px">${Object.keys(byAb).length} abogado(s)</div>${S.exps.length===0?none:Object.entries(byAb).sort((a,b)=>b[1].length-a[1].length).map(([ab,l])=>`<div style="margin-bottom:18px"><div style="display:flex;align-items:center;gap:8px;margin-bottom:7px"><div style="width:26px;height:26px;border-radius:50%;background:#dbeafe;display:flex;align-items:center;justify-content:center;font-size:11.5px;font-weight:900;color:#1e40af">${(ab[0]||'?').toUpperCase()}</div><span style="font-size:12.5px;font-weight:900;color:#0f2044">${esc(ab)}</span><span style="font-size:10.5px;color:#94a3b8;font-weight:700">${l.length} juicio(s)</span></div>${mT(l,['numeroJuicio','demandante','tipoTramite','estatus'],['N° Juicio','Demandante','Tipo Trámite','Estatus'])}</div>`).join('')}`;
  }else{
    body=`<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;margin-bottom:14px"><div><b style="color:#0f2044">Listado General</b><div style="font-size:11.5px;color:#94a3b8;margin-top:3px">Total: ${S.exps.length} expediente(s)</div></div>${S.exps.length>0?`<button class="btn btn-success" onclick="exportToExcel()" style="display:flex;align-items:center;gap:6px"><span style="font-size:14px">📊</span> Exportar a Excel</button>`:''}</div>${S.exps.length===0?none:`<div style="overflow-x:auto"><table class="tbl" style="font-size:10.5px"><thead><tr>${['N° Juicio','Exp. Interno','Demandante','Sala','U. Admva.','Tipo Trámite','Abogado','F. Emplazamiento','F. Sentencia','Suspensión','Estatus'].map(h=>`<th style="font-size:8px">${h}</th>`).join('')}</tr></thead><tbody>${S.exps.map((e,i)=>`<tr style="background:${i%2?'#fafbfc':'white'}"><td style="font-weight:800;color:#1e3a5f">${esc(e.numeroJuicio)}</td><td style="color:#64748b">${esc(e.numeroExpedienteInterno)||'—'}</td><td style="max-width:100px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(e.demandante)||'—'}</td><td>${esc(e.sala)||'—'}</td><td>${esc(e.unidadAdministrativa)||'—'}</td><td>${esc(e.tipoTramite)||'—'}</td><td>${esc(e.abogadoResponsable)||'—'}</td><td>${fd(e.fechaEmplazamiento)}</td><td>${fd(e.fechaSentencia)}</td><td><span style="font-size:10.5px;font-weight:800;padding:2px 7px;border-radius:999px;background:${e.suspension==='Sí'?'#fef3c7':'#f1f5f9'};color:${e.suspension==='Sí'?'#92400e':'#64748b'}">${esc(e.suspension)||'—'}</span></td><td>${bdg(e.estatus,true)}</td></tr>`).join('')}</tbody></table></div>`}`;
  }
  return `<div><div class="sbar"><div class="sbar-line"></div><span class="sbar-title">Reportes</span></div><div class="rtabs">${tabs.map(([id,l])=>`<button class="rtab${S.rep===id?' active':''}" onclick="S.rep='${id}';render()">${l}</button>`).join('')}</div><div class="card">${body}</div></div>`;
}

// ════════════════════════════════════════════════════════════════
// RENDER — BITÁCORA
// ════════════════════════════════════════════════════════════════
function fmtFecha(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('es-MX',{day:'2-digit',month:'short',year:'numeric'}) + ' ' +
         d.toLocaleTimeString('es-MX',{hour:'2-digit',minute:'2-digit'});
}

function renderCambios(cambios) {
  if (!cambios || typeof cambios !== 'object') return '<span style="color:#94a3b8">Sin detalle</span>';
  if (cambios.nota) return `<span style="color:#64748b;font-style:italic">${esc(cambios.nota)}</span>`;
  return Object.entries(cambios).map(([campo, val]) => {
    if (typeof val !== 'object' || !val.antes) return '';
    return `<div style="margin-bottom:4px">
      <span style="font-weight:700;color:#334155">${esc(campo)}:</span>
      <span style="background:#fee2e2;color:#991b1b;padding:1px 6px;border-radius:4px;font-size:10.5px;text-decoration:line-through">${esc(String(val.antes))}</span>
      <span style="color:#94a3b8;margin:0 3px">→</span>
      <span style="background:#d1fae5;color:#065f46;padding:1px 6px;border-radius:4px;font-size:10.5px">${esc(String(val.despues))}</span>
    </div>`;
  }).join('');
}

function accionBdg(accion) {
  const map = {
    CREAR:    {bg:'#d1fae5',c:'#065f46',icon:'✚'},
    EDITAR:   {bg:'#dbeafe',c:'#1e40af',icon:'✎'},
    ELIMINAR: {bg:'#fee2e2',c:'#991b1b',icon:'✕'},
    IMPORTAR: {bg:'#ede9fe',c:'#5b21b6',icon:'⬇'}
  };
  const x = map[accion] || {bg:'#f1f5f9',c:'#64748b',icon:'•'};
  return `<span style="background:${x.bg};color:${x.c};font-weight:800;font-size:10.5px;padding:2px 8px;border-radius:999px;white-space:nowrap">${x.icon} ${accion}</span>`;
}

function rBitacoraList(rows) {
  if (!rows.length) return '<div style="text-align:center;padding:44px 0"><div style="font-size:28px;margin-bottom:8px">📋</div><p style="color:#94a3b8;font-size:12.5px">No hay registros en la bitácora.</p></div>';
  return rows.map(r => `
    <div style="display:grid;grid-template-columns:auto 1fr;gap:12px;align-items:start;padding:12px 0;border-bottom:1px solid #f1f5f9">
      <div style="display:flex;flex-direction:column;align-items:center;gap:5px;min-width:70px">
        ${accionBdg(r.accion)}
        <span style="font-size:10.5px;color:#94a3b8;text-align:center;white-space:nowrap">${fmtFecha(r.fecha)}</span>
      </div>
      <div>
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;flex-wrap:wrap">
          <span style="font-weight:900;font-size:11.5px;color:#1e3a5f">${esc(r.numero_juicio)||'—'}</span>
          <span style="font-size:10.5px;color:#64748b;background:#f8fafc;padding:1px 7px;border-radius:4px">👤 ${esc(r.usuario)}</span>
        </div>
        <div style="font-size:10.5px;line-height:1.7">${renderCambios(r.cambios)}</div>
      </div>
    </div>`).join('');
}

function rBitacora() {
  const rows = S.bitacora;
  const loading = S.bitacoraLoading;
  return `<div>
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;flex-wrap:wrap;gap:8px">
      <div class="sbar" style="margin-bottom:0">
        <div class="sbar-line"></div>
        <span class="sbar-title">Bitácora de Cambios</span>
        ${rows.length ? `<span style="font-size:10.5px;font-weight:800;background:#dbeafe;color:#1e40af;padding:2px 9px;border-radius:999px">${rows.length}</span>` : ''}
      </div>
      <button class="btn btn-secondary" onclick="refreshBitacora()" style="font-size:11.5px">↺ Actualizar</button>
    </div>
    <div class="card">
      <p style="font-size:10.5px;color:#94a3b8;margin-bottom:14px">Registro completo de quién creó, editó o eliminó cada expediente y qué campos cambiaron.</p>
      ${loading
        ? '<div style="text-align:center;padding:32px;color:#94a3b8;font-size:12.5px">⏳ Cargando bitácora…</div>'
        : rBitacoraList(rows)
      }
    </div>
  </div>`;
}

async function refreshBitacora() {
  S.bitacoraLoading = true; render();
  S.bitacora = await loadBitacora();
  S.bitacoraLoading = false; render();
}

async function loadDetHistory(expedienteId) {
  const el = document.getElementById('detHistory');
  if (!el) return;
  el.innerHTML = '<div style="text-align:center;padding:20px;color:#94a3b8;font-size:11.5px">⏳ Cargando historial…</div>';
  const rows = await loadBitacora(expedienteId);
  el.innerHTML = rows.length
    ? rBitacoraList(rows)
    : '<p style="color:#94a3b8;font-size:11.5px;text-align:center;padding:16px">Sin movimientos registrados para este expediente.</p>';
}

// ════════════════════════════════════════════════════════════════
// RENDER PRINCIPAL
// ════════════════════════════════════════════════════════════════
// ════════════════════════════════════════════════════════════════
// BOLETÍN JURISDICCIONAL TFJA — panel de novedades
// ════════════════════════════════════════════════════════════════
async function loadBoletin(){
  try{
    const q = SB.from('boletin_hits').select('*').order('created_at',{ascending:false});
    const timeout = new Promise((_,rej)=>setTimeout(()=>rej(new Error('timeout boletin_hits')),12000));
    const { data, error } = await Promise.race([q, timeout]);
    if(error) throw error;
    S.boletinHits = data || [];
  }catch(e){
    console.warn('Boletín no disponible:', e.message);
  }finally{
    S.boletinLoaded = true;
    if(document.getElementById('hdr')) render();  // refresca badge/panel cuando cargue
  }
}

function boletinNavLabel(){
  const p = S.boletinHits.filter(h=>esBoletinRelevante(h) && !h.revisado).length;
  return '📢 Boletín' + (p ? ` <span style="background:#ef4444;color:#fff;border-radius:999px;padding:0 6px;font-size:10.5px;font-weight:900">${p}</span>` : '');
}

function setBoletinFilter(f){ S.boletinFilter = f; render(); }

function esBoletinRelevante(h){
  // (a) enlazado a un expediente tuyo
  if(h.expediente_id) return true;
  // (b) menciona Baja California / BCS en el texto de la fila
  const txt = (h.sala||'')+' '+(h.demandado||'')+' '+(h.actor||'')+' '+(h.sintesis||'')+' '+(h.keyword_match||'');
  const n = txt.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  return n.includes('baja california');
}

function boletinFiltrados(){
  // Base: solo lo relevante (BC/BCS o enlazado a un expediente tuyo).
  let arr = S.boletinHits.filter(esBoletinRelevante);
  if(S.boletinFilter==='pendientes') arr = arr.filter(h=>!h.revisado);
  else if(S.boletinFilter==='mios')  arr = arr.filter(h=>h.expediente_id);
  return arr;
}

async function marcarRevisado(id, val){
  try{
    const { error } = await SB.from('boletin_hits').update({revisado: val}).eq('id', id);
    if(error) throw error;
    const h = S.boletinHits.find(x=>x.id===id); if(h) h.revisado = val;
    render();
  }catch(e){ showToast('No se pudo actualizar: '+e.message, true); }
}

function verExpBoletin(id){
  if(S.exps.find(e=>String(e.id)===String(id))) showDet(id);
  else showToast('El expediente enlazado no está en tu lista actual', false, true);
}

function exportBoletin(){
  const arr = boletinFiltrados();
  if(!arr.length) return showToast('No hay novedades para exportar', false, true);
  const escCSV=v=>{const t=String(v??'');return /[;"\n,]/.test(t)?'"'+t.replace(/"/g,'""')+'"':t;};
  const cols=[['fecha_boletin','Fecha'],['sala','Sala'],['expediente','Expediente'],['actor','Actor'],['demandado','Demandado'],['tipo_actuacion','Tipo'],['sintesis','Sintesis'],['keyword_match','Coincidencia'],['revisado','Revisado']];
  const rows=[cols.map(c=>c[1]).join(';')];
  arr.forEach(h=>rows.push(cols.map(c=>escCSV(h[c[0]])).join(';')));
  const blob=new Blob(['\ufeff'+rows.join('\n')],{type:'text/csv;charset=utf-8'});
  const a=document.createElement('a'); a.href=URL.createObjectURL(blob);
  a.download='boletin_tfja_'+new Date().toISOString().slice(0,10)+'.csv'; a.click();
}

function rBoletin(){
  const rel   = S.boletinHits.filter(esBoletinRelevante);
  const total = rel.length;
  const pend  = rel.filter(h=>!h.revisado).length;
  const mios  = rel.filter(h=>h.expediente_id).length;
  const arr   = boletinFiltrados();
  const f     = S.boletinFilter;
  const chip=(id,l,n,col)=>`<button onclick="setBoletinFilter('${id}')" style="padding:6px 13px;border-radius:999px;border:1px solid ${f===id?col:'#e2e8f0'};background:${f===id?col:'#fff'};color:${f===id?'#fff':'#475569'};font-size:11.5px;font-weight:800;cursor:pointer;font-family:inherit">${l} (${n})</button>`;

  const empty = !S.boletinLoaded
    ? `<div style="text-align:center;padding:44px;color:#94a3b8;font-size:12.5px">⏳ Cargando novedades…</div>`
    : `<div style="text-align:center;padding:44px"><div style="font-size:32px;margin-bottom:10px">📭</div><p style="color:#94a3b8;font-size:12.5px">No hay novedades para este filtro.</p>${total===0?'<p style="color:#cbd5e1;font-size:10.5px;margin-top:6px">Si el agente ya corrió y esto sigue vacío, revisa la política RLS de lectura sobre la tabla boletin_hits.</p>':''}</div>`;

  const filas = arr.map(h=>{
    const rev = !!h.revisado;
    const linked = !!h.expediente_id;
    return `<tr style="background:${rev?'#fafafa':'white'};opacity:${rev?'.6':'1'}">
      <td style="white-space:nowrap;color:#475569">${fd(h.fecha_boletin)}</td>
      <td style="color:#475569">${esc(h.sala)||'—'}</td>
      <td style="font-weight:800;color:#1e3a5f;white-space:nowrap">${esc(h.expediente)||'—'}${linked?' <span title="Enlazado a un expediente tuyo" style="color:#059669">●</span>':''}</td>
      <td style="max-width:220px">${esc(h.demandado)||'—'}</td>
      <td style="max-width:320px;color:#374151">${esc((h.sintesis||'').slice(0,240))}</td>
      <td style="white-space:nowrap">
        ${linked?`<button class="link-btn" style="color:#2563eb;font-weight:800" onclick="verExpBoletin('${esc(h.expediente_id)}')">Ver exp.</button> <span style="color:#e2e8f0">|</span> `:''}
        ${rev
          ?`<button class="link-btn" style="color:#94a3b8" onclick="marcarRevisado('${h.id}',false)">↩ Reabrir</button>`
          :`<button class="link-btn" style="color:#059669;font-weight:800" onclick="marcarRevisado('${h.id}',true)">✓ Revisado</button>`}
      </td></tr>`;
  }).join('');

  return `
  <div style="background:white;border-radius:14px;border:1px solid #e2e8f0;padding:18px 20px;margin-bottom:16px">
    <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;margin-bottom:6px">
      <div>
        <b style="color:#0f2044;font-size:15px">📢 Novedades del Boletín Jurisdiccional (TFJA)</b>
        <div style="font-size:11.5px;color:#94a3b8;margin-top:3px">Acuerdos que mencionan a CONAGUA / OCPBC en la Península. La notificación surte efectos al 3er día hábil siguiente a la publicación.</div>
      </div>
      <button class="btn btn-success" onclick="exportBoletin()" style="display:flex;align-items:center;gap:6px"><span style="font-size:14px">📊</span> Exportar CSV</button>
    </div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin:12px 0 14px">
      ${chip('pendientes','Pendientes',pend,'#ef4444')}
      ${chip('mios','Mis expedientes',mios,'#059669')}
      ${chip('todas','Todas',total,'#4338ca')}
    </div>
    ${arr.length===0 ? empty : `<div style="overflow-x:auto"><table class="tbl" style="font-size:11.5px"><thead><tr>
      <th style="font-size:10.5px">Fecha</th><th style="font-size:10.5px">Sala</th><th style="font-size:10.5px">Expediente</th><th style="font-size:10.5px">Demandado</th><th style="font-size:10.5px">Síntesis</th><th style="font-size:10.5px">Acciones</th>
    </tr></thead><tbody>${filas}</tbody></table></div>
    <div style="font-size:10.5px;color:#cbd5e1;margin-top:10px">Mostrando ${arr.length} de ${total} · ● = enlazado a un expediente tuyo</div>`}
  </div>`;
}

function render(){
  rHdr();
  const v={lista:rLista,form:rForm,detalle:rDetalle,buscar:rBuscar,reportes:rReportes,importar:rImportar,bitacora:rBitacora,calendario:rCalendario,boletin:rBoletin};
  document.getElementById('main').innerHTML = `<div id="importMain">${renderNotifBanner()}${(v[S.view]||rLista)()}</div>${rDashModal()}`;
}

// ════════════════════════════════════════════════════════════════
// IMPORTAR / EXPORTAR EXCEL (sin cambios funcionales)
// ════════════════════════════════════════════════════════════════
function normStr(s){return String(s??'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]/g,'').trim();}
function getCellVal(cell){if(!cell||cell.value==null)return'';let v=cell.value;if(v instanceof Date)return v;if(typeof v==='object'){if(Array.isArray(v.richText))return v.richText.map(r=>r.text||'').join('');if(v.result!=null)return v.result;if(v.text!=null)return v.text;if(v.hyperlink)return v.hyperlink;if(v.error)return'';}return v;}
function parseDateFlex(v){if(!v)return'';if(v instanceof Date&&!isNaN(v))return v.toISOString().slice(0,10);const s=String(v).trim();if(/^\d{4}-\d{2}-\d{2}$/.test(s))return s;let m=s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);if(m){const[_,d,mo,y]=m;return`${y}-${mo.padStart(2,'0')}-${d.padStart(2,'0')}`;}m=s.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);if(m){const[_,y,mo,d]=m;return`${y}-${mo.padStart(2,'0')}-${d.padStart(2,'0')}`;}try{const d=new Date(s);if(!isNaN(d.getTime()))return d.toISOString().slice(0,10);}catch{}return'';}

const FM={numerodejuicio:'numeroJuicio',numerojuicio:'numeroJuicio',ndejuicio:'numeroJuicio',njuicio:'numeroJuicio',nodejuicio:'numeroJuicio',numjuicio:'numeroJuicio',juicio:'numeroJuicio',nexpinternocna:'numeroExpedienteInterno',nexpedienteinternocna:'numeroExpedienteInterno',nexpinterno:'numeroExpedienteInterno',expedienteinterno:'numeroExpedienteInterno',expedienteinternocna:'numeroExpedienteInterno',cna:'numeroExpedienteInterno',vna:'numeroExpedienteInterno',demandante:'demandante',actor:'demandante',sala:'sala',unidadadministrativa:'unidadAdministrativa',uadmva:'unidadAdministrativa',actoimpugnado:'actoImpugnado',tituloconcesion:'tituloConcesion',titulodeconcesion:'tituloConcesion',nexpadmvodaa:'numeroExpedienteAdministrativo',nexpadmvo:'numeroExpedienteAdministrativo',nexpedienteadministrativo:'numeroExpedienteAdministrativo',expedienteadministrativodaa:'numeroExpedienteAdministrativo',tipodejuicio:'tipoJuicio',tipojuicio:'tipoJuicio',tipodetramite:'tipoTramite',tipotramite:'tipoTramite',tramite:'tipoTramite',temadefondo:'temaFondo',temafondo:'temaFondo',tema:'temaFondo',materia:'temaFondo',resolucionimpugnada:'resolucionImpugnada',resolucion:'resolucionImpugnada',fechadeemisiondelaresolucion:'fechaEmisionResolucion',fechaemisionresolucion:'fechaEmisionResolucion',fechaemisionresoluciondelaresolucion:'fechaEmisionResolucion',fechaderesolucion:'fechaEmisionResolucion',fechaemision:'fechaEmisionResolucion',cuantia:'cuantia',monto:'cuantia',valor:'cuantia',autoridaddemandada:'autoridadDemandada',autoridadvinculada:'autoridadVinculada',abogadoresponsable:'abogadoResponsable',abogado:'abogadoResponsable',responsable:'abogadoResponsable',fechadeemplazamiento:'fechaEmplazamiento',fechaemplazamiento:'fechaEmplazamiento',fechadecontestacion:'fechaContestacion',fechacontestacion:'fechaContestacion',contestacion:'fechaContestacion',fechadeproximaaudiencia:'fechaProximaAudiencia',fechaproximaaudiencia:'fechaProximaAudiencia',audiencia:'fechaProximaAudiencia',fechadesentencia:'fechaSentencia',fechasentencia:'fechaSentencia',efectodelasentencia:'efectoSentencia',efectosentencia:'efectoSentencia',efectosentencias:'efectoSentencia',suspension:'suspension',fechadenotificaciondesuspension:'fechaNotificacionSuspension',fechanotificacionsuspension:'fechaNotificacionSuspension',efectosdelasuspension:'efectosSuspension',efectossuspension:'efectosSuspension',estatus:'estatus',estado:'estatus',status:'estatus',fechadeestatus:'fechaEstatus',fechaestatus:'fechaEstatus',nrequerimientos:'numeroRequerimientos',numerorequerimientos:'numeroRequerimientos',napercibimientos:'numeroApercibimientos',numeroapercibimientos:'numeroApercibimientos',fultimoapercibimiento:'fechaUltimoApercibimiento',fechaultimoapercibimiento:'fechaUltimoApercibimiento',numeromemoinforme:'numeroMemo',numeromemo:'numeroMemo',nmemoinforme:'numeroMemo',nmemo:'numeroMemo',memo:'numeroMemo',fechamemoinforme:'fechaMemo',fechamemo:'fechaMemo',fmemoinforme:'fechaMemo',resumendeactuaciones:'resumenActuaciones',resumenactuaciones:'resumenActuaciones',resumenprocesal:'resumenActuaciones',resumendeactuacionesyestadoprocesal:'resumenActuaciones',estadoprocesal:'resumenActuaciones',actuaciones:'resumenActuaciones',notas:'notas',notasyobservaciones:'notas',observaciones:'notas',prioridad:'prioridad'};
const SYS_FIELDS=[{k:'numeroJuicio',l:'N° de Juicio',req:true},{k:'tipoJuicio',l:'Tipo de Juicio'},{k:'numeroExpedienteInterno',l:'N° Exp. Interno / CNA'},{k:'demandante',l:'Demandante'},{k:'sala',l:'Sala'},{k:'unidadAdministrativa',l:'Unidad Administrativa'},{k:'actoImpugnado',l:'Acto Impugnado'},{k:'tituloConcesion',l:'Título de Concesión'},{k:'numeroExpedienteAdministrativo',l:'N° Exp. Admvo. (D.A.A.)'},{k:'tipoTramite',l:'Tipo de Trámite'},{k:'temaFondo',l:'Tema de Fondo'},{k:'resolucionImpugnada',l:'Resolución Impugnada'},{k:'fechaEmisionResolucion',l:'Fecha de Emisión de la Resolución'},{k:'cuantia',l:'Cuantía'},{k:'autoridadDemandada',l:'Autoridad Demandada'},{k:'autoridadVinculada',l:'Autoridad Vinculada'},{k:'abogadoResponsable',l:'Abogado Responsable'},{k:'fechaEmplazamiento',l:'Fecha de Emplazamiento'},{k:'fechaContestacion',l:'Fecha para dar Contestación'},{k:'fechaProximaAudiencia',l:'Fecha de Próxima Audiencia'},{k:'fechaSentencia',l:'Fecha de Sentencia'},{k:'efectoSentencia',l:'Efecto de la Sentencia'},{k:'suspension',l:'Suspensión (Sí/No)'},{k:'fechaNotificacionSuspension',l:'F. Notificación Suspensión'},{k:'efectosSuspension',l:'Efectos de la Suspensión'},{k:'estatus',l:'Estatus'},{k:'fechaEstatus',l:'Fecha de Estatus'},{k:'numeroRequerimientos',l:'N° Requerimientos'},{k:'numeroApercibimientos',l:'N° Apercibimientos'},{k:'fechaUltimoApercibimiento',l:'F. Último Apercibimiento'},{k:'numeroMemo',l:'N° Memo de Informe'},{k:'fechaMemo',l:'Fecha del Memo de Informe'},{k:'resumenActuaciones',l:'Resumen de Actuaciones y Estado Procesal'},{k:'notas',l:'Notas y Observaciones'},{k:'prioridad',l:'Prioridad'}];

// Mapa de etiquetas legibles para la bitácora
const FIELD_LABELS = Object.fromEntries(SYS_FIELDS.map(f => [f.k, f.l]));

// ════════════════════════════════════════════════════════════════
// BITÁCORA — Registro de auditoría
// ════════════════════════════════════════════════════════════════
function diffRecords(oldRec, newRec) {
  const skip = new Set(['id']);
  const changes = {};
  for (const key of Object.keys(newRec)) {
    if (skip.has(key)) continue;
    const ov = String(oldRec[key] ?? '');
    const nv = String(newRec[key] ?? '');
    if (ov !== nv) {
      changes[FIELD_LABELS[key] || key] = { antes: ov || '—', despues: nv || '—' };
    }
  }
  return Object.keys(changes).length ? changes : null;
}

async function logBitacora(expedienteId, numeroJuicio, accion, cambios) {
  try {
    const { error } = await SB.from('bitacora').insert([{
      expediente_id: expedienteId ? String(expedienteId) : null,
      numero_juicio: numeroJuicio || '',
      accion,
      usuario: S.userEmail || S.userName || 'desconocido',
      cambios: cambios || {}
    }]);
    if (error) throw error;
  } catch(e) {
    console.warn('Bitácora error:', e.message);
    showToast('⚠️ Cambio guardado pero no se registró en bitácora: ' + e.message, true);
  }
}

async function loadBitacora(expedienteId) {
  try {
    let q = SB.from('bitacora').select('*').order('fecha', { ascending: false }).limit(200);
    if (expedienteId) q = q.eq('expediente_id', expedienteId);
    const { data, error } = await q;
    if (error) throw error;
    return data || [];
  } catch(e) { return []; }
}

let importData = null;

async function importFromExcel(file){
  if(!isAdmin()) return showToast('Sin permisos para importar', true);
  if(!file) return;
  if(typeof ExcelJS==='undefined') return showToast('Función requiere internet. Recarga la página.',true);
  try{
    const buf=await file.arrayBuffer();
    const wb=new ExcelJS.Workbook();
    await wb.xlsx.load(buf);
    const ws=wb.worksheets[0];
    if(!ws) return showToast('El archivo no contiene hojas válidas.',true);
    let hRowNum=1,maxCells=0;
    for(let r=1;r<=Math.min(5,ws.rowCount);r++){let cnt=0;ws.getRow(r).eachCell(c=>{if(String(getCellVal(c)||'').trim())cnt++;});if(!cnt){for(let c=1;c<=50;c++){if(String(getCellVal(ws.getRow(r).getCell(c))||'').trim())cnt++;else if(c>5)break;}}if(cnt>maxCells){maxCells=cnt;hRowNum=r;}}
    const headers=[];
    const hRow=ws.getRow(hRowNum);
    hRow.eachCell((cell,col)=>{const v=String(getCellVal(cell)||'').trim();if(v)headers.push({col,name:v});});
    if(!headers.length){for(let c=1;c<=50;c++){const v=String(getCellVal(hRow.getCell(c))||'').trim();if(!v&&c>3)break;if(v)headers.push({col:c,name:v});}}
    if(!headers.length) return showToast('No se pudieron leer los encabezados.',true);
    const colMap={};
    headers.forEach(h=>{const k=normStr(h.name);if(FM[k]&&!colMap[FM[k]])colMap[FM[k]]=h.col;});
    const rows=[];
    for(let r=hRowNum+1;r<=ws.rowCount;r++){const rowData={};headers.forEach(h=>{rowData[h.col]=getCellVal(ws.getRow(r).getCell(h.col));});if(Object.values(rowData).some(v=>v!==''&&v!=null))rows.push(rowData);}
    if(rows.length===0) return showToast('El archivo no tiene filas de datos.',true);
    importData={headers,rows,colMap};
    S.view='importar';
    render();
  }catch(err){showToast('Error al leer el archivo: '+err.message,true);}
}

function rImportar(){
  if(!importData) return '';
  if(!isAdmin()) return `<div class="card" style="padding:40px;text-align:center"><p style="color:#dc2626;font-weight:800">Sin permisos para importar.</p><button class="btn btn-secondary" style="margin-top:12px" onclick="sv('lista')">Volver</button></div>`;
  const{headers,rows,colMap}=importData;
  const mapped=Object.keys(colMap).filter(k=>colMap[k]).length;
  const colOpts='<option value="">— No importar —</option>'+headers.map(h=>`<option value="${h.col}">${esc(h.name)}</option>`).join('');
  const getOpts=(field)=>colOpts.replace(`value="${colMap[field]||''}"`,`value="${colMap[field]||''}" selected`);
  return`<div style="max-width:800px;margin:0 auto">
    <div class="sbar"><div class="sbar-line"></div><span class="sbar-title">Importar desde Excel</span>
      <span style="font-size:11.5px;color:#64748b">· ${rows.length} filas · ${headers.length} columnas detectadas</span>
    </div>
    <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:14px 18px;margin-bottom:14px;font-size:12.5px;color:#1e40af;line-height:1.6">
      <strong>Se detectaron ${headers.length} columnas y se mapearon automáticamente ${mapped}.</strong><br>
      Revisa el mapeo y ajusta los que estén incorrectos. <strong>Solo "N° de Juicio" es obligatorio.</strong><br>
      Si un N° de Juicio ya existe en el sistema, ese expediente se <strong>actualizará</strong> con los campos que traiga el archivo (los campos que dejes vacíos conservan su valor actual); si no existe, se dará de alta como nuevo.
    </div>
    <div class="card" style="padding:0;overflow:hidden">
      <table style="width:100%;border-collapse:collapse;font-size:12.5px">
        <thead><tr style="background:#0f2044;color:white">
          <th style="padding:10px 14px;text-align:left;font-size:10.5px;font-weight:800;text-transform:uppercase;width:40%">Campo del sistema</th>
          <th style="padding:10px 14px;text-align:left;font-size:10.5px;font-weight:800;text-transform:uppercase">Columna de tu Excel</th>
        </tr></thead>
        <tbody>
          ${SYS_FIELDS.map((f,i)=>{const isMapped=!!colMap[f.k];return`<tr style="border-bottom:1px solid #f8fafc;background:${i%2===0?'white':'#fafbfc'}"><td style="padding:8px 14px"><span style="font-weight:${f.req?800:600};color:${f.req?'#1e3a5f':'#374151'}">${f.l}</span>${f.req?'<span style="color:#dc2626;margin-left:2px;font-size:11.5px">*</span>':''}</td><td style="padding:8px 14px"><select style="width:100%;font-size:11.5px;border-radius:7px;padding:5px 8px;border:1px solid ${isMapped?'#86efac':'#e2e8f0'};background:${isMapped?'#f0fdf4':'white'};cursor:pointer" onchange="importData.colMap['${f.k}']=this.value===''?'':parseInt(this.value)||this.value;document.getElementById('importMain').innerHTML=document.getElementById('importMain').innerHTML">${getOpts(f.k)}</select></td></tr>`;}).join('')}
        </tbody>
      </table>
      <div style="padding:16px 20px;border-top:1px solid #f1f5f9;display:flex;align-items:center;gap:10px;flex-wrap:wrap">
        <span style="font-size:11.5px;color:#94a3b8">Columnas: ${headers.map(h=>`<strong>${esc(h.name)}</strong>`).join(', ')}</span>
        <div style="margin-left:auto;display:flex;gap:8px">
          <button class="btn btn-secondary" onclick="importData=null;sv('lista')">Cancelar</button>
          <button class="btn btn-primary" onclick="doImport()">✓ Importar ${rows.length} expedientes</button>
        </div>
      </div>
    </div>
  </div>`;
}

async function batchUpdate(updates){
  const failed=[];
  const okItems=[];
  for(const item of updates){
    const {merged}=item;
    const row=jsToDb(merged);
    const {error}=await SB.from('expedientes').update(row).eq('id', merged.id);
    if(error) failed.push({numeroJuicio:merged.numeroJuicio||'(sin número)', error:error.message});
    else okItems.push(item);
  }
  return {okItems, failed};
}

async function doImport(){
  if(!isAdmin()) return showToast('Sin permisos para importar', true);
  if(!importData) return;
  const{rows,colMap}=importData;
  if(!colMap['numeroJuicio']) return showToast('Debes asignar la columna "N° de Juicio"',true);
  const dateFields=['fechaEmplazamiento','fechaContestacion','fechaProximaAudiencia','fechaSentencia','fechaNotificacionSuspension','fechaEstatus','fechaUltimoApercibimiento','fechaEmisionResolucion','fechaMemo'];
  const recs=[];
  rows.forEach(rowData=>{
    // "partial" solo contiene los campos que el Excel realmente trae para esta fila;
    // así, al actualizar un expediente existente, no pisamos con valores por defecto
    // (EF) los campos que el archivo dejó en blanco.
    const partial={};
    Object.entries(colMap).forEach(([field,col])=>{
      if(!col&&col!==0)return;
      let val=rowData[col];
      if(val==null||val==='')return;
      if(dateFields.includes(field)){val=parseDateFlex(val);}
      else if(val instanceof Date){val=parseDateFlex(val);}
      else{val=String(val).trim();}
      if(field==='suspension'){const l=val.toLowerCase();if(l==='si'||l==='sí'||l==='yes'||l==='1')val='Sí';else if(l==='no'||l==='false'||l==='0')val='No';else if(l.includes('tramite')||l.includes('trámite'))val='En trámite';}
      if(field==='estatus'){const f=ESTATUS.find(e=>normStr(e)===normStr(val));if(f)val=f;}
      if(field==='tipoJuicio'){const nv=normStr(val);if(nv.includes('nulidad'))val='Juicio de Nulidad';else if(nv.includes('agrari'))val='Juicio Agrario';else if(nv.includes('laboral'))val='Juicio Laboral';}
      if(field==='tipoTramite'){const f=TRAMITE.find(t=>normStr(t)===normStr(val));if(f)val=f;}
      if(field==='prioridad'){const nv=normStr(val);if(nv.includes('urgente'))val='urgente';else if(nv.includes('alta'))val='alta';else if(nv.includes('baja'))val='baja';else val='normal';}
      if(val!=='')partial[field]=val;
    });
    if(partial.numeroJuicio)recs.push(partial);
  });
  if(recs.length===0) return showToast('No se encontraron filas con N° de Juicio válido.',true);

  const existingByKey={};
  S.exps.forEach(e=>{existingByKey[e.numeroJuicio.trim().toLowerCase()]=e;});

  const toInsert=[];
  const toUpdate=[];
  recs.forEach((partial,i)=>{
    const key=partial.numeroJuicio.trim().toLowerCase();
    const oldRec=existingByKey[key];
    if(oldRec){
      // Se conserva todo lo ya capturado (oldRec) y solo se sobreescriben
      // los campos que la fila del Excel sí trae (partial).
      const merged={...oldRec, ...partial, id:oldRec.id};
      toUpdate.push({merged, oldRec});
    }else{
      toInsert.push({...EF, ...partial, id:(Date.now()+i).toString(), prioridad:partial.prioridad||'normal'});
    }
  });

  if(toInsert.length===0 && toUpdate.length===0) return showToast('No hay expedientes para importar.',true);

  let msg='';
  if(toInsert.length>0) msg+=`Se importarán ${toInsert.length} expediente(s) nuevo(s).`;
  if(toUpdate.length>0){
    if(msg)msg+='\n';
    msg+=`${toUpdate.length} expediente(s) ya existentes se ACTUALIZARÁN con los datos del archivo (solo se sobreescriben los campos que trae el Excel; lo demás se conserva tal cual).`;
  }
  if(!confirm(msg+'\n\n¿Continuar?'))return;

  showLoading(true);
  let insResult={okCount:0, failed:[]};
  let updResult={okItems:[], failed:[]};
  if(toInsert.length>0){
    insResult=await batchInsert(toInsert);
  }
  if(toUpdate.length>0){
    updResult=await batchUpdate(toUpdate);
    // Bitácora solo para lo que sí se guardó
    for(const {merged, oldRec} of updResult.okItems){
      const diff=diffRecords(oldRec, merged);
      await logBitacora(merged.id, merged.numeroJuicio, 'EDITAR', diff || { nota:'Importación: sin cambios detectados' });
    }
  }
  showLoading(false);

  // Reflejar en memoria solo los que realmente se guardaron en la base
  const insertedJuicios=new Set(toInsert.map(r=>(r.numeroJuicio||'').trim().toLowerCase()));
  insResult.failed.forEach(f=>insertedJuicios.delete((f.numeroJuicio||'').trim().toLowerCase()));
  toInsert.forEach(r=>{
    if(insertedJuicios.has((r.numeroJuicio||'').trim().toLowerCase())) S.exps.unshift(r);
  });
  updResult.okItems.forEach(({merged})=>{
    const idx=S.exps.findIndex(e=>e.id===merged.id);
    if(idx>=0) S.exps[idx]=merged;
  });

  importData=null;

  const totalFailed=insResult.failed.length+updResult.failed.length;
  let okMsg='';
  if(insResult.okCount>0) okMsg+=`${insResult.okCount} expediente(s) nuevo(s) importado(s)`;
  if(insResult.okCount>0 && updResult.okItems.length>0) okMsg+=' · ';
  if(updResult.okItems.length>0) okMsg+=`${updResult.okItems.length} expediente(s) actualizado(s)`;
  if(!okMsg) okMsg='No se guardó ningún expediente.';

  if(totalFailed>0){
    const detalle=[...insResult.failed.map(f=>`• ${f.numeroJuicio} (alta): ${f.error}`),
                   ...updResult.failed.map(f=>`• ${f.numeroJuicio} (actualización): ${f.error}`)].join('\n');
    showToast(`${okMsg} · ${totalFailed} fallaron. Revisa el detalle.`, true);
    alert(`Se guardaron: ${okMsg || 'ninguno'}.\n\n${totalFailed} expediente(s) NO se pudieron guardar:\n\n${detalle}\n\nCorrígelos en el Excel y vuelve a importar solo esas filas.`);
  }else{
    showToast('✓ '+okMsg);
  }
  S.view='lista';
  render();
}

function downloadTemplate(){
  if(typeof ExcelJS==='undefined') return showToast('Requiere internet para generar la plantilla.',true);
  (async()=>{
    const wb=new ExcelJS.Workbook();
    const ws=wb.addWorksheet('Expedientes');
    const headers=['Numero de Juicio','Tipo de Juicio','Expediente Interno CNA','Demandante','Sala','Unidad Administrativa','Acto Impugnado','Titulo de Concesion','Expediente Administrativo DAA','Tipo de Tramite','Tema de Fondo','Resolucion Impugnada','Fecha de Emision de la Resolucion','Cuantia','Autoridad Demandada','Autoridad Vinculada','Abogado Responsable','Fecha de Emplazamiento','Fecha de Contestacion','Fecha de Proxima Audiencia','Fecha de Sentencia','Efecto de la Sentencia','Suspension','Fecha Notificacion Suspension','Efectos de la Suspension','Estatus','Fecha de Estatus','Numero Requerimientos','Numero Apercibimientos','Fecha Ultimo Apercibimiento','Numero Memo Informe','Fecha Memo Informe','Resumen de Actuaciones y Estado Procesal','Notas y Observaciones','Prioridad'];
    ws.columns=headers.map(h=>({header:h,width:20}));
    ws.getRow(1).eachCell(cell=>{cell.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF0F2044'}};cell.font={bold:true,color:{argb:'FFFFFFFF'},size:10};cell.alignment={vertical:'middle',horizontal:'center',wrapText:true};});
    ws.getRow(1).height=32;
    ws.addRow(['123/2024','Juicio de Nulidad','CNA-001','Nombre del demandante','Sala Superior','Dirección General','Acto administrativo...','','','Juicio de Amparo','Tema sustantivo del juicio...','Resolución RES-001/2024','2024-01-10','$100,000.00 MXN','','','Lic. Apellido','2024-01-15','2024-02-15','2024-03-20','','','No','','','En trámite','2024-01-15','0','0','','','','Resumen narrativo de actuaciones...','','normal']);
    ws.getRow(2).font={italic:true,color:{argb:'FF94A3B8'},size:9};
    const buf=await wb.xlsx.writeBuffer();
    const blob=new Blob([buf],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');a.href=url;a.download='plantilla-expedientes.xlsx';
    document.body.appendChild(a);a.click();document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Plantilla descargada.');
  })();
}

async function exportToExcel(){
  if(S.exps.length===0) return showToast('No hay expedientes para exportar',true);
  const today=new Date().toISOString().slice(0,10);
  const fname=`expedientes-juicios-${today}`;
  const cols=[['Prioridad','prioridad',0,12],['N° de Juicio','numeroJuicio',0,15],['Tipo de Juicio','tipoJuicio',0,18],['N° Exp. Interno / CNA','numeroExpedienteInterno',0,18],['Demandante','demandante',0,28],['Sala','sala',0,16],['Unidad Administrativa','unidadAdministrativa',0,24],['Acto Impugnado','actoImpugnado',0,32],['Título de Concesión','tituloConcesion',0,20],['N° Exp. Admvo. (D.A.A.)','numeroExpedienteAdministrativo',0,20],['Tipo de Trámite','tipoTramite',0,24],['Tema de Fondo','temaFondo',0,36],['Resolución Impugnada','resolucionImpugnada',0,32],['F. Emisión Resolución','fechaEmisionResolucion',0,16,1],['Cuantía','cuantia',0,18],['Autoridad Demandada','autoridadDemandada',1,24],['Autoridad Vinculada','autoridadVinculada',1,24],['Abogado Responsable','abogadoResponsable',1,22],['F. Emplazamiento','fechaEmplazamiento',2,15,1],['F. Contestación','fechaContestacion',2,15,1],['F. Próx. Audiencia','fechaProximaAudiencia',2,15,1],['F. Sentencia','fechaSentencia',2,15,1],['Efecto de la Sentencia','efectoSentencia',2,28],['F. Notif. Sentencia','fechaNotificacionSentencia',2,15,1],['F. Firmeza','fechaFirmeza',2,15,1],['F. Vencimiento Cumplimiento','fechaVencimientoCumplimiento',2,18,1],['Suspensión','suspension',3,13],['F. Notif. Suspensión','fechaNotificacionSuspension',3,15,1],['Efectos de la Suspensión','efectosSuspension',3,28],['Estatus','estatus',4,20],['F. Estatus','fechaEstatus',4,15,1],['N° Requerimientos','numeroRequerimientos',4,15],['N° Apercibimientos','numeroApercibimientos',4,15],['F. Último Apercibimiento','fechaUltimoApercibimiento',4,17,1],['N° Memo Informe','numeroMemo',4,20],['F. Memo Informe','fechaMemo',4,15,1],['Oficio Contestación','oficioContestacion',5,22],['F. Oficio Contestación','fechaOficioContestacion',5,18,1],['Oficio Amp. Demanda','oficioAmpliacion',5,22],['F. Oficio Amp. Demanda','fechaOficioAmpliacion',5,18,1],['Oficio Alegatos','oficioAlegatos',5,22],['F. Oficio Alegatos','fechaOficioAlegatos',5,18,1],['Resumen Procesal','resumenActuaciones',6,50],['Notas y Observaciones','notas',6,40]];
  const groups=[{name:'IDENTIFICACIÓN',color:'FF1E40AF',light:'FFDBEAFE'},{name:'AUTORIDADES',color:'FF065F46',light:'FFD1FAE5'},{name:'FECHAS',color:'FF92400E',light:'FFFEF3C7'},{name:'SUSPENSIÓN',color:'FFC2410C',light:'FFFED7AA'},{name:'SEGUIMIENTO',color:'FF5B21B6',light:'FFEDE9FE'},{name:'OFICIOS DE RESPUESTA',color:'FF065F46',light:'FFCCFBF1'},{name:'OBSERVACIONES',color:'FF475569',light:'FFF1F5F9'}];
  const sCol={'En trámite':{bg:'FFDBEAFE',fg:'FF1E40AF'},'Sentencia favorable':{bg:'FFD1FAE5',fg:'FF065F46'},'Sentencia desfavorable':{bg:'FFFEE2E2',fg:'FF991B1B'},'Sobreseído':{bg:'FFF1F5F9',fg:'FF475569'},'Desistido':{bg:'FFF8FAFC',fg:'FF64748B'},'En cumplimiento':{bg:'FFFEF3C7',fg:'FF92400E'},'Cumplimentado':{bg:'FFCCFBF1',fg:'FF065F46'},'En revisión':{bg:'FFEDE9FE',fg:'FF5B21B6'}};
  if(typeof ExcelJS!=='undefined'){
    try{
      const wb=new ExcelJS.Workbook();wb.creator='Sistema de Control de Juicios';wb.created=new Date();
      const ws=wb.addWorksheet('Expedientes',{views:[{state:'frozen',xSplit:1,ySplit:3}],pageSetup:{orientation:'landscape',fitToPage:true,fitToWidth:1,paperSize:9}});
      const tb={style:'thin',color:{argb:'FFE2E8F0'}};const cb={top:tb,left:tb,bottom:tb,right:tb};
      ws.mergeCells(1,1,1,cols.length);const tc=ws.getCell(1,1);tc.value='SISTEMA DE CONTROL DE JUICIOS — Listado General de Expedientes';tc.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF0F2044'}};tc.font={bold:true,color:{argb:'FFFBBF24'},size:14};tc.alignment={vertical:'middle',horizontal:'center'};ws.getRow(1).height=30;
      let cIdx=1;for(let g=0;g<groups.length;g++){const gc=cols.filter(c=>c[2]===g);if(gc.length===0)continue;const sc=cIdx,ec=cIdx+gc.length-1;if(sc!==ec)ws.mergeCells(2,sc,2,ec);const cell=ws.getCell(2,sc);cell.value=groups[g].name;cell.fill={type:'pattern',pattern:'solid',fgColor:{argb:groups[g].light}};cell.font={bold:true,color:{argb:groups[g].color},size:10};cell.alignment={vertical:'middle',horizontal:'center'};cell.border=cb;if(sc!==ec){for(let i=sc+1;i<=ec;i++){const c=ws.getCell(2,i);c.border=cb;c.fill={type:'pattern',pattern:'solid',fgColor:{argb:groups[g].light}};}}cIdx=ec+1;}
      ws.getRow(2).height=22;
      cols.forEach(([h,k,g,w,isDate],i)=>{const cell=ws.getCell(3,i+1);cell.value=h;cell.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF0F2044'}};cell.font={bold:true,color:{argb:'FFFFFFFF'},size:10};cell.alignment={vertical:'middle',horizontal:'center',wrapText:true};cell.border={top:{style:'thin',color:{argb:'FFFFFFFF'}},left:{style:'thin',color:{argb:'FFFFFFFF'}},bottom:{style:'medium',color:{argb:'FFD4A017'}},right:{style:'thin',color:{argb:'FFFFFFFF'}}};ws.getColumn(i+1).width=w;});ws.getRow(3).height=36;
      S.exps.forEach((e,idx)=>{const rn=4+idx;const zb=idx%2===0?'FFFFFFFF':'FFF8FAFC';cols.forEach(([h,k,g,w,isDate],i)=>{const cell=ws.getCell(rn,i+1);const val=e[k];const isNum=k==='numeroRequerimientos'||k==='numeroApercibimientos';if(isDate&&val){cell.value=new Date(val+'T00:00:00');cell.numFmt='dd/mm/yyyy';}else if(isNum&&val!==''&&val!=null){cell.value=Number(val)||0;}else{cell.value=val||'';}cell.fill={type:'pattern',pattern:'solid',fgColor:{argb:zb}};cell.font={size:10,color:{argb:'FF1E293B'}};cell.alignment={vertical:'middle',horizontal:(isDate||isNum)?'center':'left',wrapText:true};cell.border=cb;if(k==='numeroJuicio'){cell.font={size:10,bold:true,color:{argb:'FF1E3A5F'}};cell.alignment={vertical:'middle',horizontal:'left',wrapText:true};}if(k==='prioridad'){const prMap={urgente:{bg:'FFFEE2E2',fg:'FF991B1B',l:'🔴 Urgente'},alta:{bg:'FFFFEDD5',fg:'FF9A3412',l:'🟠 Alta'},normal:{bg:'FFDBEAFE',fg:'FF1E40AF',l:'🔵 Normal'},baja:{bg:'FFF1F5F9',fg:'FF475569',l:'⚪ Baja'}};const pInfo=prMap[val||'normal'];cell.value=pInfo.l;cell.fill={type:'pattern',pattern:'solid',fgColor:{argb:pInfo.bg}};cell.font={size:10,bold:true,color:{argb:pInfo.fg}};cell.alignment={vertical:'middle',horizontal:'center',wrapText:true};}if(k==='tipoJuicio'&&val){const tjMap={'Juicio de Nulidad':{bg:'FFFEF3C7',fg:'FF92400E'},'Juicio Agrario':{bg:'FFD1FAE5',fg:'FF065F46'},'Juicio Laboral':{bg:'FFEDE9FE',fg:'FF5B21B6'}};const tjInfo=tjMap[val];if(tjInfo){cell.fill={type:'pattern',pattern:'solid',fgColor:{argb:tjInfo.bg}};cell.font={size:10,bold:true,color:{argb:tjInfo.fg}};cell.alignment={vertical:'middle',horizontal:'center',wrapText:true};}}if(k==='estatus'&&sCol[val]){cell.fill={type:'pattern',pattern:'solid',fgColor:{argb:sCol[val].bg}};cell.font={size:10,bold:true,color:{argb:sCol[val].fg}};cell.alignment={vertical:'middle',horizontal:'center',wrapText:true};}if(k==='suspension'&&val==='Sí'){cell.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FFFEF3C7'}};cell.font={size:10,bold:true,color:{argb:'FF92400E'}};}});ws.getRow(rn).height=26;});
      ws.autoFilter={from:{row:3,column:1},to:{row:3+S.exps.length,column:cols.length}};
      const buf=await wb.xlsx.writeBuffer();const blob=new Blob([buf],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=fname+'.xlsx';document.body.appendChild(a);a.click();document.body.removeChild(a);URL.revokeObjectURL(url);
      showToast('Excel exportado: '+fname+'.xlsx');
      return;
    }catch(err){console.error('Error al exportar:',err);}
  }
  const escCSV=v=>{const s=String(v??'');return/[;"\n,]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s;};
  let csv='\uFEFF'+cols.map(c=>c[0]).join(';')+'\n';
  S.exps.forEach(e=>{csv+=cols.map(([,k])=>escCSV(e[k])).join(';')+'\n';});
  const blob=new Blob([csv],{type:'text/csv;charset=utf-8'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=fname+'.csv';document.body.appendChild(a);a.click();document.body.removeChild(a);URL.revokeObjectURL(url);
  showToast('CSV exportado: '+fname+'.csv');
}

// ════════════════════════════════════════════════════════════════
// CÁLCULO JURÍDICO — DÍAS HÁBILES Y FIRMEZA (LFPCA)
// ════════════════════════════════════════════════════════════════

/**
 * Festivos oficiales México (Ley Federal del Trabajo + días que el TFJFA
 * suspende actividades por decreto). Incluye fijos y móviles (primer/tercer
 * lunes de mes).
 */
function festivosMX(year) {
  const nth = (month, n) => {           // n-ésimo lunes del mes (base 1)
    const d = new Date(year, month, 1);
    const off = (8 - d.getDay()) % 7;  // días hasta el primer lunes
    return new Date(year, month, 1 + off + (n-1)*7).toISOString().slice(0,10);
  };
  return new Set([
    `${year}-01-01`,   // Año Nuevo
    nth(1, 1),         // Constitución — 1er lunes febrero
    nth(2, 3),         // Natalicio Benito Juárez — 3er lunes marzo
    `${year}-05-01`,   // Día del Trabajo
    `${year}-09-16`,   // Independencia
    nth(10, 3),        // Revolución — 3er lunes noviembre
    `${year}-12-01`,   // Transmisión del Ejecutivo (cada 6 años, se incluye)
    `${year}-12-25`,   // Navidad
  ]);
}

/**
 * Suma n días hábiles (lunes-viernes, excluye festivos MX) a una fecha ISO.
 * Art. 63 LFPCA — el recurso de revisión se interpone en 15 días hábiles.
 */
function addHabiles(dateStr, n) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  let hols = festivosMX(d.getFullYear());
  let count = 0;
  while (count < n) {
    d.setDate(d.getDate() + 1);
    // Recalcular festivos si cruzamos año
    if (d.getMonth() === 0 && d.getDate() === 1) hols = festivosMX(d.getFullYear());
    const dow = d.getDay();
    const ds  = d.toISOString().slice(0,10);
    if (dow !== 0 && dow !== 6 && !hols.has(ds)) count++;
  }
  return d.toISOString().slice(0,10);
}

/**
 * Suma n meses calendario a una fecha ISO.
 * Art. 58 LFPCA — 4 meses para cumplimiento de sentencia para efectos.
 */
function addMeses(dateStr, n) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  d.setMonth(d.getMonth() + n);
  return d.toISOString().slice(0,10);
}

/** Detecta si el efecto de la sentencia implica cumplimiento de 4 meses. */
function isParaEfectos(efectoSentencia) {
  return (efectoSentencia || '').toLowerCase().includes('efecto');
}

/**
 * Calcula firmeza estimada y fecha de cumplimiento.
 * Base legal:
 *   - Firmeza: notificación sentencia + 15 días hábiles (Art. 63 LFPCA)
 *   - Cumplimiento: firmeza + 4 meses (Art. 58 LFPCA) si es "para efectos"
 */
function calcFirmeza(fechaSentencia, fechaNotifSentencia, efectoSentencia, firmezaManual) {
  const base     = fechaNotifSentencia || fechaSentencia;
  const firmeza  = firmezaManual || (base ? addHabiles(base, 15) : '');
  const paraEf   = isParaEfectos(efectoSentencia);
  const cumpl    = (paraEf && firmeza) ? addMeses(firmeza, 4) : '';
  return { firmeza, cumpl, paraEf, base };
}

/** Retorna días naturales entre hoy y una fecha ISO (+positivo = futuro). */
function diasParaFecha(dateStr) {
  if (!dateStr) return null;
  const today = new Date(); today.setHours(0,0,0,0);
  const d     = new Date(dateStr + 'T00:00:00');
  return Math.round((d - today) / 86400000);
}

/**
 * Renderiza el panel de firmeza + cumplimiento en el FORMULARIO.
 * Se llama vía recalcFirmeza() cuando cambian fechaSentencia / efectoSentencia
 * / fechaNotificacionSentencia / fechaFirmeza.
 */
function recalcFirmeza() {
  const f  = S.form;
  const cf = calcFirmeza(f.fechaSentencia, f.fechaNotificacionSentencia, f.efectoSentencia, f.fechaFirmeza);
  // Auto-sugerir firmeza si no hay una manual
  if (!f.fechaFirmeza && cf.firmeza) { f.fechaFirmeza = cf.firmeza; }
  // Auto-actualizar cumplimiento
  f.fechaVencimientoCumplimiento = cf.cumpl;
  render();
}

/** HTML del panel firmeza para formulario y detalle. */
function firmezaPanelHTML(e, editable) {
  const cf   = calcFirmeza(e.fechaSentencia, e.fechaNotificacionSentencia, e.efectoSentencia, e.fechaFirmeza);
  if (!cf.firmeza && !e.fechaSentencia) return '';

  const diasC = diasParaFecha(cf.cumpl);
  const diasF = diasParaFecha(cf.firmeza);
  const today = new Date().toISOString().slice(0,10);

  let panelClass = 'neutral';
  let cumplBadge = '';
  if (cf.paraEf && cf.cumpl) {
    if (diasC === null || diasC > 30)    { panelClass = 'normal'; }
    else if (diasC > 10)                 { panelClass = 'warn'; }
    else                                 { panelClass = 'urgent'; }

    const cumplIcon = diasC < 0 ? '🔴' : diasC <= 10 ? '🟠' : diasC <= 30 ? '🟡' : '🟢';
    const cumplTxt  = diasC < 0
      ? `Vencido hace ${Math.abs(diasC)} días`
      : diasC === 0 ? 'Vence HOY'
      : `Vence en ${diasC} días`;
    const cumplCls  = diasC < 0 ? 'cumpl-rojo' : diasC <= 10 ? 'cumpl-rojo' : diasC <= 30 ? 'cumpl-amarillo' : 'cumpl-verde';
    cumplBadge = `<span class="cumpl-badge ${cumplCls}">${cumplIcon} Cumplimiento: ${fd(cf.cumpl)} — ${cumplTxt}</span>`;
  }

  const firmezaFutura = cf.firmeza > today;

  return `<div class="firmeza-panel ${panelClass}" style="margin-top:10px">
    <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
      <span style="font-size:13px">⚖</span>
      <span style="font-size:12.5px;font-weight:900;color:#0f2044">Firmeza y Cumplimiento (LFPCA)</span>
      ${firmezaFutura ? '<span style="font-size:10.5px;font-weight:800;background:#e0f2fe;color:#0369a1;padding:2px 8px;border-radius:999px">Estimada</span>' : '<span style="font-size:10.5px;font-weight:800;background:#d1fae5;color:#065f46;padding:2px 8px;border-radius:999px">Vigente</span>'}
    </div>
    <div class="firmeza-grid">
      <div class="firmeza-item">
        <span class="firmeza-lbl">Base de cálculo</span>
        <span class="firmeza-val">${fd(cf.base) || '—'}</span>
        <span class="firmeza-sub">${e.fechaNotificacionSentencia ? 'Fecha notificación sentencia' : 'Fecha de sentencia (referencia)'}</span>
      </div>
      <div class="firmeza-item">
        <span class="firmeza-lbl">Firmeza estimada <span style="font-weight:500;font-size:10.5px">(+15 días hábiles · Art. 63)</span></span>
        ${editable
          ? `<input type="date" value="${e.fechaFirmeza||''}" onchange="sf('fechaFirmeza',this.value);recalcFirmeza()" style="font-size:13px;font-weight:900;color:#0f2044;border:none;border-bottom:2px solid #d4a017;background:transparent;padding:2px 0;width:100%;font-family:inherit">`
          : `<span class="firmeza-val">${fd(e.fechaFirmeza || cf.firmeza) || '—'}</span>`}
        <span class="firmeza-sub">Art. 63 LFPCA — período para interponer recurso de revisión</span>
      </div>
      ${cf.paraEf ? `
      <div class="firmeza-item" style="grid-column:1/-1">
        <span class="firmeza-lbl">Vencimiento de cumplimiento <span style="font-weight:500;font-size:10.5px">(+4 meses · Art. 58)</span></span>
        <span class="firmeza-val" style="font-size:15px;color:${diasC!==null&&diasC<=10?'#dc2626':diasC!==null&&diasC<=30?'#b45309':'#065f46'}">${fd(cf.cumpl) || '—'}</span>
        <span class="firmeza-sub">Art. 58 LFPCA — plazo para que la autoridad demandada emita la resolución</span>
        ${cumplBadge}
      </div>` : `
      <div class="firmeza-item" style="grid-column:1/-1">
        <span class="firmeza-lbl">Cumplimiento</span>
        <span style="font-size:11.5px;color:#94a3b8;font-style:italic">No aplica — el efecto de la sentencia no implica plazo de cumplimiento (Art. 58 LFPCA)</span>
      </div>`}
    </div>
    ${editable ? `<p style="font-size:10.5px;color:#94a3b8;margin-top:10px;border-top:1px solid rgba(0,0,0,.06);padding-top:8px">💡 La firmeza es editable. Si ya se interpuso recurso de revisión, ajusta la fecha manualmente una vez que sea resuelta. El campo se guarda con el expediente.</p>` : ''}
  </div>`;
}

// ════════════════════════════════════════════════════════════════
// FEATURE 5 — NOTIFICACIONES
// ════════════════════════════════════════════════════════════════
async function initNotificaciones() {
  if ('Notification' in window && Notification.permission === 'default') {
    const p = await Notification.requestPermission();
    S.notifEnabled = p === 'granted';
  } else {
    S.notifEnabled = Notification?.permission === 'granted';
  }
}

function checkEventos() {
  const today = new Date(); today.setHours(0,0,0,0);
  const in3   = new Date(today); in3.setDate(today.getDate()+3);
  const evs   = [];
  S.exps.forEach(e => {
    if (e.fechaProximaAudiencia) {
      const d = new Date(e.fechaProximaAudiencia+'T00:00:00');
      const diff = Math.round((d - today) / 86400000);
      if (diff === 0) evs.push({tipo:'red',  msg:'🎤 Audiencia HOY: '+e.numeroJuicio+(e.sala?' · '+e.sala:''), expId:e.id});
      else if (diff > 0 && diff <= 3) evs.push({tipo:'yellow', msg:`🎤 Audiencia en ${diff}d: `+e.numeroJuicio, expId:e.id});
    }
    const fl = window._getFechaLimitePlazo ? window._getFechaLimitePlazo(e) : null;
    if (fl) {
      const d = new Date(fl+'T00:00:00');
      const diff = Math.round((d - today) / 86400000);
      if (diff < 0)             evs.push({tipo:'red',    msg:`⚠ Plazo vencido hace ${Math.abs(diff)}d: `+e.numeroJuicio, expId:e.id});
      else if (diff <= 3)       evs.push({tipo:'yellow', msg:`⏰ Plazo vence en ${diff||'hoy'}: `+e.numeroJuicio, expId:e.id});
    }
    const tareas = Array.isArray(e.tareas) ? e.tareas : [];
    tareas.filter(t=>!t.completada && t.fechaLimite).forEach(t => {
      const d = new Date(t.fechaLimite+'T00:00:00');
      const diff = Math.round((d - today) / 86400000);
      if (diff < 0)       evs.push({tipo:'red',    msg:`📋 Tarea vencida: ${t.titulo} (${e.numeroJuicio})`, expId:e.id});
      else if (diff <= 2) evs.push({tipo:'yellow', msg:`📋 Tarea próxima: ${t.titulo}`, expId:e.id});
    });
    // Cumplimiento de sentencia (Art. 58 LFPCA)
    if (e.fechaVencimientoCumplimiento && isParaEfectos(e.efectoSentencia)) {
      const d    = new Date(e.fechaVencimientoCumplimiento+'T00:00:00');
      const diff = Math.round((d - today) / 86400000);
      if (diff < 0)        evs.push({tipo:'red',    msg:`⚖ Cumpl. VENCIDO hace ${Math.abs(diff)}d: `+e.numeroJuicio, expId:e.id});
      else if (diff <= 10) evs.push({tipo:'red',    msg:`⚖ Cumpl. en ${diff}d: `+e.numeroJuicio, expId:e.id});
      else if (diff <= 30) evs.push({tipo:'yellow', msg:`⚖ Cumpl. en ${diff}d: `+e.numeroJuicio, expId:e.id});
    }
  });
  S.notifEventos = evs;
  return evs;
}

function renderNotifBanner() {
  if (S.notifDismissed) return '';
  const evs = checkEventos();
  if (!evs.length) return '';
  const reds = evs.filter(e=>e.tipo==='red');
  const yels = evs.filter(e=>e.tipo==='yellow');
  const show = [...reds, ...yels].slice(0, 8);
  return `<div class="notif-banner" style="margin:-20px -20px 20px">
    <div class="notif-body">
      <div class="notif-title">🔔 ${evs.length} alerta${evs.length!==1?'s':''} hoy</div>
      <div class="notif-chips">
        ${show.map(e=>`<span class="notif-chip ${e.tipo==='red'?'nc-red':'nc-yellow'}" onclick="showDet('${e.expId}')">${esc(e.msg)}</span>`).join('')}
        ${evs.length > 8 ? `<span style="font-size:10.5px;color:#fde68a;align-self:center">+${evs.length-8} más</span>` : ''}
      </div>
    </div>
    <button onclick="S.notifDismissed=true;render()" style="background:none;border:none;color:#93c5fd;font-size:20px;cursor:pointer;line-height:1;padding:2px;flex-shrink:0">×</button>
  </div>`;
}

// ════════════════════════════════════════════════════════════════
// FEATURE 1 — CALENDARIO VISUAL
// ════════════════════════════════════════════════════════════════
function rCalendario() {
  const today = new Date(); today.setHours(0,0,0,0);
  const yr = S.calYear, mo = S.calMonth;
  const todayStr = formatISODate(today);

  // Mapa fecha → eventos
  const evMap = {};
  const addEv = (ds, cls, lbl, expId) => {
    if (!ds) return;
    const k = ds.slice(0,10);
    if (!evMap[k]) evMap[k] = [];
    evMap[k].push({cls, lbl, expId});
  };
  S.exps.forEach(e => {
    addEv(e.fechaProximaAudiencia,      'ev-a', '🎤 '+e.numeroJuicio, e.id);
    addEv(e.fechaContestacion,          'ev-c', '⏰ Cont. '+e.numeroJuicio, e.id);
    addEv(e.fechaEmplazamiento,         'ev-e', '📬 Emplaz. '+e.numeroJuicio, e.id);
    addEv(e.fechaSentencia,             'ev-s', '⚖ Sent. '+e.numeroJuicio, e.id);
    addEv(e.fechaNotificacionSuspension,'ev-x', '⛔ Susp. '+e.numeroJuicio, e.id);
    addEv(e.fechaOficioContestacion,    'ev-o', '📄 Oficio Cont.', e.id);
    addEv(e.fechaOficioAmpliacion,      'ev-o', '📄 Oficio Amp.', e.id);
    addEv(e.fechaOficioAlegatos,        'ev-o', '📄 Oficio Aleg.', e.id);
  });

  const DAY_NAMES = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'];
  const first = new Date(yr, mo, 1);
  const last  = new Date(yr, mo+1, 0);
  const startOff = (first.getDay() + 6) % 7; // Lunes=0
  const monthLabel = first.toLocaleDateString('es-MX',{month:'long',year:'numeric'});

  const cells = [];
  for (let i = startOff-1; i >= 0; i--) cells.push({d: new Date(yr, mo, -i), other: true});
  for (let d = 1; d <= last.getDate(); d++) cells.push({d: new Date(yr, mo, d), other: false});
  const rem = cells.length % 7; if (rem) for (let d = 1; d <= 7-rem; d++) cells.push({d: new Date(yr, mo+1, d), other: true});

  return `<div>
    <div class="sbar"><div class="sbar-line"></div><span class="sbar-title">Calendario</span></div>
    <div class="cal-wrap">
      <div class="cal-nav">
        <button class="cal-nav-btn" onclick="if(S.calMonth--<1){S.calMonth=11;S.calYear--;}render()">‹</button>
        <span class="cal-month-title">${monthLabel}</span>
        <button class="cal-nav-btn" onclick="if(S.calMonth++>10){S.calMonth=0;S.calYear++;}render()">›</button>
        <button class="cal-nav-btn" onclick="S.calMonth=${today.getMonth()};S.calYear=${today.getFullYear()};render()">Hoy</button>
      </div>
      <div class="cal-grid">
        ${DAY_NAMES.map(n=>`<div class="cal-head">${n}</div>`).join('')}
        ${cells.map(({d, other}) => {
          const ds   = formatISODate(d);
          const evs  = evMap[ds] || [];
          const isTd = ds === todayStr;
          return `<div class="cal-cell${other?' other':''}${isTd?' today':''}">
            <div class="cal-num">${d.getDate()}</div>
            ${evs.slice(0,3).map(ev=>`<span class="cal-ev ${ev.cls}" onclick="showDet('${ev.expId}')" title="${esc(ev.lbl)}">${esc(ev.lbl)}</span>`).join('')}
            ${evs.length>3 ? `<span style="font-size:10.5px;color:#94a3b8;font-weight:700">+${evs.length-3}</span>` : ''}
          </div>`;
        }).join('')}
      </div>
      <div class="cal-legend">
        <div class="cal-leg"><div class="cal-leg-dot" style="background:#dbeafe"></div>Audiencia</div>
        <div class="cal-leg"><div class="cal-leg-dot" style="background:#fef3c7"></div>Emplazamiento</div>
        <div class="cal-leg"><div class="cal-leg-dot" style="background:#fee2e2"></div>Contestación</div>
        <div class="cal-leg"><div class="cal-leg-dot" style="background:#d1fae5"></div>Sentencia</div>
        <div class="cal-leg"><div class="cal-leg-dot" style="background:#ffedd5"></div>Suspensión</div>
        <div class="cal-leg"><div class="cal-leg-dot" style="background:#ede9fe"></div>Oficio</div>
      </div>
    </div>
  </div>`;
}

// ════════════════════════════════════════════════════════════════
// FEATURE 2 — TAREAS / CHECKLIST
// ════════════════════════════════════════════════════════════════
const TAREA_TIPOS = [
  {v:'contestacion',l:'Contestación', c:'#1e40af',bg:'#dbeafe'},
  {v:'ampliacion',  l:'Amp. Demanda', c:'#92400e',bg:'#fef3c7'},
  {v:'pruebas',     l:'Pruebas',      c:'#065f46',bg:'#d1fae5'},
  {v:'alegatos',    l:'Alegatos',     c:'#5b21b6',bg:'#ede9fe'},
  {v:'recurso',     l:'Recurso',      c:'#9a3412',bg:'#ffedd5'},
  {v:'cumplimiento',l:'Cumplimiento', c:'#0369a1',bg:'#e0f2fe'},
  {v:'general',     l:'General',      c:'#475569',bg:'#f1f5f9'}
];
const TT_MAP = Object.fromEntries(TAREA_TIPOS.map(t=>[t.v,t]));
const TMPL = [
  ['Preparar contestación','contestacion'],
  ['Recopilar pruebas','pruebas'],
  ['Redactar alegatos','alegatos'],
  ['Presentar ampliación','ampliacion'],
  ['Interponer recurso','recurso'],
  ['Dar cumplimiento','cumplimiento']
];

function rTareas(e) {
  const tareas = Array.isArray(e.tareas) ? e.tareas : [];
  const pend   = tareas.filter(t=>!t.completada).length;
  const done   = tareas.filter(t=> t.completada).length;
  const wr     = canWrite();
  return `<div>
    <div style="display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap">
      <span style="font-size:10.5px;font-weight:800;background:#fef3c7;color:#92400e;padding:2px 10px;border-radius:999px">${pend} pendiente${pend!==1?'s':''}</span>
      <span style="font-size:10.5px;font-weight:800;background:#d1fae5;color:#065f46;padding:2px 10px;border-radius:999px">${done} completada${done!==1?'s':''}</span>
    </div>
    ${tareas.length===0 ? `<div style="text-align:center;padding:30px 0"><div style="font-size:28px;margin-bottom:8px">✅</div><p style="color:#94a3b8;font-size:12.5px">Sin tareas registradas.</p></div>` :
      tareas.map(t => {
        const ti = TT_MAP[t.tipo||'general'];
        return `<div class="tarea-item${t.completada?' done':''}">
          ${wr ? `<input type="checkbox" class="tarea-cb" ${t.completada?'checked':''} onchange="doToggleTarea('${e.id}','${t.id}')">` : `<span style="font-size:14px;margin-top:1px">${t.completada?'✅':'⬜'}</span>`}
          <div class="tarea-info">
            <div class="tarea-titulo">${esc(t.titulo)}</div>
            <div class="tarea-meta">
              <span class="tarea-bdg" style="background:${ti.bg};color:${ti.c}">${ti.l}</span>
              ${t.fechaLimite ? `<span>📅 ${fd(t.fechaLimite)}</span>` : ''}
              ${t.completada && t.completadaEn ? `<span>✓ ${new Date(t.completadaEn).toLocaleDateString('es-MX',{day:'2-digit',month:'short'})}</span>` : ''}
            </div>
          </div>
          ${wr ? `<button onclick="doDelTarea('${e.id}','${t.id}')" style="background:none;border:none;cursor:pointer;color:#cbd5e1;font-size:16px;padding:0 2px;line-height:1" title="Eliminar tarea">×</button>` : ''}
        </div>`;
      }).join('')}
    ${wr ? `
    <div class="tarea-add-row" style="margin-top:12px">
      <input id="tIn_${e.id}" placeholder="Nueva tarea…" style="flex:1;min-width:110px" onkeydown="if(event.key==='Enter')doAddTarea('${e.id}')">
      <select id="tTp_${e.id}" style="width:auto">
        ${TAREA_TIPOS.map(t=>`<option value="${t.v}">${t.l}</option>`).join('')}
      </select>
      <input type="date" id="tFe_${e.id}" style="width:auto">
      <button class="btn btn-primary btn-sm" onclick="doAddTarea('${e.id}')">+ Agregar</button>
    </div>
    <div style="margin-top:10px;border-top:1px solid #f1f5f9;padding-top:8px">
      <p style="font-size:10.5px;color:#94a3b8;font-weight:700;margin-bottom:6px">Plantillas rápidas:</p>
      <div class="tmpl-grid">
        ${TMPL.map(([t,ti])=>`<button class="btn btn-secondary btn-sm" onclick="doAddTareaQ('${e.id}','${t}','${ti}')">${t}</button>`).join('')}
      </div>
    </div>` : ''}
  </div>`;
}

function doAddTarea(expId) {
  const inp = document.getElementById('tIn_'+expId);
  const tp  = document.getElementById('tTp_'+expId);
  const fe  = document.getElementById('tFe_'+expId);
  if (!inp?.value.trim()) return showToast('Escribe el título de la tarea', true);
  const t = {id:Date.now().toString(), titulo:inp.value.trim(), tipo:tp?.value||'general', fechaLimite:fe?.value||'', completada:false, completadaEn:null};
  const exp = S.exps.find(e=>e.id===expId); if (!exp) return;
  saveTareas(expId, [...(exp.tareas||[]), t]);
}

function doAddTareaQ(expId, titulo, tipo) {
  const exp = S.exps.find(e=>e.id===expId); if (!exp) return;
  const t = {id:Date.now().toString(), titulo, tipo, fechaLimite:'', completada:false, completadaEn:null};
  saveTareas(expId, [...(exp.tareas||[]), t]);
}

function doToggleTarea(expId, tareaId) {
  const exp = S.exps.find(e=>e.id===expId); if (!exp||!canWrite()) return;
  const tareas = (exp.tareas||[]).map(t => t.id===tareaId
    ? {...t, completada:!t.completada, completadaEn:!t.completada?new Date().toISOString():null} : t);
  saveTareas(expId, tareas);
}

function doDelTarea(expId, tareaId) {
  if (!canWrite()) return;
  const exp = S.exps.find(e=>e.id===expId); if (!exp) return;
  saveTareas(expId, (exp.tareas||[]).filter(t=>t.id!==tareaId));
}

async function saveTareas(expId, tareas) {
  const exp = S.exps.find(e=>e.id===expId); if (!exp) return;
  try {
    const {error} = await SB.from('expedientes').update({tareas}).eq('id', expId);
    if (error) throw error;
    exp.tareas = tareas;
    if (S.det?.id===expId) S.det.tareas = tareas;
    render();
  } catch(err) { showToast('Error al guardar tareas: '+err.message, true); }
}

// ════════════════════════════════════════════════════════════════
// FEATURE 3 — DOCUMENTOS ADJUNTOS (Supabase Storage)
// ════════════════════════════════════════════════════════════════
const DOC_BUCKET = 'docs-juicios';

function rDocumentos(e) {
  const docs    = S.docs[e.id];
  const loading = S.docsLoading;
  const wr      = canWrite();
  const eid     = e.id;

  if (loading) return `<div style="text-align:center;padding:30px;color:#94a3b8;font-size:12.5px">⏳ Cargando documentos…</div>`;

  const docList = Array.isArray(docs)
    ? (docs.length===0 ? `<div style="text-align:center;padding:20px"><div style="font-size:26px;margin-bottom:8px">📂</div><p style="color:#94a3b8;font-size:12.5px">No hay documentos adjuntos.</p></div>`
      : docs.map(doc => {
          const ext  = (doc.name.split('.').pop()||'').toLowerCase();
          const icon = {pdf:'📄',doc:'📝',docx:'📝',png:'🖼',jpg:'🖼',jpeg:'🖼',xlsx:'📊',xls:'📊'}[ext] || '📎';
          const sz   = doc.metadata?.size ? (doc.metadata.size<1e6 ? Math.round(doc.metadata.size/1024)+'KB' : (doc.metadata.size/1048576).toFixed(1)+'MB') : '';
          const dt   = doc.created_at ? new Date(doc.created_at).toLocaleDateString('es-MX',{day:'2-digit',month:'short',year:'numeric'}) : '';
          return `<div class="doc-item">
            <div class="doc-icon">${icon}</div>
            <div class="doc-info">
              <div class="doc-name" title="${esc(doc.name)}">${esc(doc.name)}</div>
              <div class="doc-meta">${sz}${sz&&dt?' · ':''}${dt}</div>
            </div>
            <div style="display:flex;gap:5px">
              <button class="btn btn-secondary btn-sm" onclick="downloadDoc('${eid}','${esc(doc.name)}')">⬇ Descargar</button>
              ${wr?`<button class="btn btn-secondary btn-sm" style="color:#dc2626;border-color:#fecaca" onclick="delDoc('${eid}','${esc(doc.name)}')">✕</button>`:''}
            </div>
          </div>`;
        }).join(''))
    : `<div style="text-align:center;padding:24px"><button class="btn btn-secondary" onclick="loadDocs('${eid}')">📂 Cargar documentos</button></div>`;

  return `<div>
    ${wr ? `
    <div class="drop-zone" onclick="document.getElementById('fInp_${eid}').click()"
      ondragover="event.preventDefault();this.classList.add('drag-over')"
      ondragleave="this.classList.remove('drag-over')"
      ondrop="event.preventDefault();this.classList.remove('drag-over');uploadDoc('${eid}',event.dataTransfer.files[0])">
      <div style="font-size:22px;margin-bottom:5px">📎</div>
      <p style="font-size:12.5px;font-weight:700;color:#374151">Arrastra un archivo o haz clic para seleccionar</p>
      <p style="font-size:10.5px;color:#94a3b8;margin-top:3px">PDF, Word, Excel, imágenes · Máx 10 MB</p>
    </div>
    <input type="file" id="fInp_${eid}" style="display:none" accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg" onchange="uploadDoc('${eid}',this.files[0]);this.value=''">` : ''}
    <div>${docList}</div>
    <div style="margin-top:10px;padding:7px 11px;background:#f8fafc;border-radius:8px;font-size:10.5px;color:#94a3b8;line-height:1.5">
      💡 Requiere bucket <b>docs-juicios</b> en Supabase Storage con políticas de lectura/escritura para usuarios autenticados.
    </div>
  </div>`;
}

async function loadDocs(expId) {
  S.docsLoading = true; render();
  try {
    const {data, error} = await SB.storage.from(DOC_BUCKET).list(expId+'/', {sortBy:{column:'created_at',order:'desc'}});
    if (error) throw error;
    S.docs[expId] = (data||[]).filter(f=>f.name!=='.emptyFolderPlaceholder');
  } catch(err) {
    S.docs[expId] = [];
    if (!err.message.includes('not found') && !err.message.includes('Bucket')) showToast('Error docs: '+err.message, true);
  }
  S.docsLoading = false; render();
}

async function uploadDoc(expId, file) {
  if (!file) return;
  if (file.size > 10*1024*1024) return showToast('El archivo supera los 10 MB', true);
  showToast('Subiendo '+file.name+'…', false, true);
  const safe = file.name.replace(/[^a-zA-Z0-9._\-]/g,'_');
  const path = expId+'/'+Date.now()+'_'+safe;
  try {
    const {error} = await SB.storage.from(DOC_BUCKET).upload(path, file, {upsert:true});
    if (error) throw error;
    await loadDocs(expId);
    showToast('✓ '+file.name+' subido');
  } catch(err) { showToast('Error al subir: '+err.message, true); }
}

async function downloadDoc(expId, name) {
  try {
    const {data, error} = await SB.storage.from(DOC_BUCKET).download(expId+'/'+name);
    if (error) throw error;
    const url = URL.createObjectURL(data);
    const a = document.createElement('a'); a.href=url; a.download=name;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch(err) { showToast('Error al descargar: '+err.message, true); }
}

async function delDoc(expId, name) {
  if (!confirm('¿Eliminar "'+name+'"?')) return;
  try {
    const {error} = await SB.storage.from(DOC_BUCKET).remove([expId+'/'+name]);
    if (error) throw error;
    await loadDocs(expId);
    showToast('✓ Documento eliminado');
  } catch(err) { showToast('Error: '+err.message, true); }
}

// ════════════════════════════════════════════════════════════════
// FEATURE 4 — TIMELINE DE ACTUACIONES
// ════════════════════════════════════════════════════════════════
function rTimeline(e) {
  const today = new Date().toISOString().slice(0,10);
  const evs   = [];
  const add   = (date, icon, label, sub, color) => { if (date) evs.push({date, icon, label, sub, color}); };

  add(e.fechaEmisionResolucion,      '📋', 'Emisión de Resolución',         e.resolucionImpugnada||'',     '#f59e0b');
  add(e.fechaEmplazamiento,          '📬', 'Emplazamiento',                  e.sala||'',                   '#3b82f6');
  add(e.fechaContestacion,           '⏰', 'Vencimiento Contestación',       e.tipoJuicio||'',              '#ef4444');
  add(e.fechaOficioContestacion,     '📄', 'Oficio Contestación',            e.oficioContestacion||'',      '#8b5cf6');
  add(e.fechaOficioAmpliacion,       '📄', 'Oficio Amp. de Demanda',         e.oficioAmpliacion||'',        '#8b5cf6');
  add(e.fechaOficioAlegatos,         '📄', 'Oficio de Alegatos',             e.oficioAlegatos||'',          '#8b5cf6');
  add(e.fechaNotificacionSentencia, '📨', 'Notificación de Sentencia',      '',                            '#0ea5e9');
  add(e.fechaFirmeza,               '🔒', 'Firmeza de la Sentencia',         'Art. 63 LFPCA',               '#0f2044');
  add(e.fechaVencimientoCumplimiento&&isParaEfectos(e.efectoSentencia)?e.fechaVencimientoCumplimiento:'', '⏳', 'Vencimiento Cumplimiento', 'Art. 58 LFPCA — 4 meses', '#dc2626');
  add(e.fechaProximaAudiencia,       '🎤', 'Próxima Audiencia',              e.sala||'',                   '#06b6d4');
  add(e.fechaSentencia,              '⚖',  'Sentencia',                      e.efectoSentencia||'',         '#10b981');
  add(e.fechaUltimoApercibimiento,   '⚠',  'Último Apercibimiento',          '',                            '#dc2626');
  add(e.fechaMemo,                   '📊', 'Memo de Informe',                e.numeroMemo||'',              '#0369a1');
  add(e.fechaEstatus,                '📌', 'Actualización de Estatus',       e.estatus||'',                 '#64748b');

  (Array.isArray(e.tareas)?e.tareas:[]).filter(t=>t.completada&&t.completadaEn).forEach(t=>{
    add(t.completadaEn.slice(0,10), '✅', 'Tarea completada: '+t.titulo, '', '#059669');
  });

  if (!evs.length) return `<div style="text-align:center;padding:30px 0"><div style="font-size:28px;margin-bottom:8px">📊</div><p style="color:#94a3b8;font-size:12.5px">No hay actuaciones con fecha registrada.</p></div>`;

  evs.sort((a,b)=>a.date.localeCompare(b.date));

  return `<div class="tl">
    ${evs.map((ev, i) => {
      const isPast   = ev.date < today;
      const isToday  = ev.date === today;
      const isFuture = ev.date > today;
      const dotBg = isPast ? ev.color : isFuture ? 'white' : ev.color;
      return `<div class="tl-row">
        <div class="tl-axis">
          <div class="tl-dot" style="color:${ev.color};background:${dotBg};box-shadow:0 0 0 2px ${ev.color}"></div>
          ${i<evs.length-1 ? `<div class="tl-line"></div>` : ''}
        </div>
        <div class="tl-body">
          <div class="tl-fecha" style="${isToday?'color:#2563eb':isFuture?'color:#94a3b8':''}">${isToday?'🔵 HOY · ':isFuture?'🔜 ':''}${fd(ev.date)}</div>
          <div class="tl-label">${ev.icon} ${esc(ev.label)}</div>
          ${ev.sub ? `<div class="tl-sub">${esc(ev.sub)}</div>` : ''}
        </div>
      </div>`;
    }).join('')}
  </div>`;
}

// ════════════════════════════════════════════════════════════════
// INICIO
// ════════════════════════════════════════════════════════════════
initSupabase();
