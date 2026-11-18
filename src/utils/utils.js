/**
 * Funciones de ayuda que se usan en VARIAS partes del sitio.
 * Si una función la necesitas en más de un archivo, su lugar es este.
 *
 * Secciones: 1) Fechas (Day.js)  2) Urgencia y progreso  3) Texto y HTML  4) URL  5) Avisos en pantalla
 * 6) Avisos por porcentaje de tiempo
 */
import dayjs from 'dayjs'
import 'dayjs/locale/es'
import isoWeek from 'dayjs/plugin/isoWeek'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.locale('es')
dayjs.extend(isoWeek) // semanas de lunes a domingo
dayjs.extend(relativeTime)

/* ------------------------------------------------------------------ */
/* 1) FECHAS                                                          */
/* ------------------------------------------------------------------ */

/**
 * Devuelve la fecha y hora de este momento (se puede cambiar en pruebas).
 * @returns {import('dayjs').Dayjs}
 */
export function ahora() {
  return dayjs()
}

/**
 * Convierte un texto ISO (o Date) en un objeto Day.js.
 * @param {string|Date} fecha Fecha tal como está guardada en IndexedDB.
 * @returns {import('dayjs').Dayjs}
 */
export function aFecha(fecha) {
  return dayjs(fecha)
}

/**
 * Formatea una fecha para mostrarla.
 * @param {string|Date} fecha Fecha a mostrar.
 * @param {string} [formato='D [de] MMMM'] Formato de Day.js (https://day.js.org/docs/en/display/format).
 * @returns {string} Ej.: "30 de noviembre".
 */
export function formatearFecha(fecha, formato = 'D [de] MMMM') {
  return dayjs(fecha).format(formato)
}

/**
 * Convierte una fecha al valor que entiende un `<input type="date">`.
 * @param {string|Date} fecha Fecha a convertir.
 * @returns {string} Formato "AAAA-MM-DD".
 */
export function aValorDeInputFecha(fecha) {
  return dayjs(fecha).format('YYYY-MM-DD')
}

/**
 * Cuántos días faltan para una fecha, contando por días de calendario.
 * @param {string|Date} fecha Fecha de entrega.
 * @returns {number} Positivo = faltan días, 0 = es hoy, negativo = ya pasó.
 */
export function diasRestantes(fecha) {
  return dayjs(fecha).startOf('day').diff(dayjs().startOf('day'), 'day')
}

/**
 * Texto corto y natural para decir cuándo vence algo.
 * @param {string|Date} fecha Fecha de entrega.
 * @returns {string} "Venció hace 2 días", "Vence hoy", "Vence mañana", "Vence en 5 días".
 */
export function textoVencimiento(fecha) {
  const dias = diasRestantes(fecha)
  if (dias < -1) return `Venció hace ${Math.abs(dias)} días`
  if (dias === -1) return 'Venció ayer'
  if (dias === 0) return 'Vence hoy'
  if (dias === 1) return 'Vence mañana'
  return `Vence en ${dias} días`
}

/**
 * Los 7 días (lunes a domingo) de la semana en la que cae una fecha.
 * @param {string|Date} [fecha] Cualquier día de la semana (por defecto, hoy).
 * @returns {import('dayjs').Dayjs[]} Siete objetos Day.js.
 */
export function diasDeLaSemana(fecha = dayjs()) {
  const lunes = dayjs(fecha).startOf('isoWeek')
  return Array.from({ length: 7 }, (_, i) => lunes.add(i, 'day'))
}

/**
 * Indica si dos fechas caen el mismo día de calendario.
 * @param {string|Date} a Primera fecha.
 * @param {string|Date} b Segunda fecha.
 * @returns {boolean}
 */
export function esMismoDia(a, b) {
  return dayjs(a).isSame(dayjs(b), 'day')
}

/**
 * Convierte el valor de un <input type="date"> a texto ISO en UTC, tomando el FINAL de ese día
 * en hora local. Sin esto, "30 de noviembre" se guardaría como 29 en El Salvador.
 * @param {string} valor Valor del input, formato "AAAA-MM-DD".
 * @returns {string} Ej.: "2026-12-01T05:59:59.999Z" (= 30 de nov a las 23:59 en El Salvador).
 */
export function deInputAFechaIso(valor) {
  return dayjs(valor).endOf('day').toISOString()
}

/**
 * Reparte una tarea en partes con fechas iguales entre hoy y la entrega.
 * La última parte cae el día de la entrega.
 * @param {number} partes Cuántas partes. Ej.: 5.
 * @param {string} nombre Cómo se llama cada parte. Ej.: "Capítulo".
 * @param {string} fechaEntrega Valor del input, formato "AAAA-MM-DD".
 * @returns {{description: string, fecha: string}[]} Ej.: [{ description: "Capítulo 1", fecha: "2026-11-18" }, ...]
 */
export function dividirEnPartes(partes, nombre, fechaEntrega) {
  const hoy = ahora().startOf('day')
  const entrega = dayjs(fechaEntrega).startOf('day')
  const totalDias = entrega.diff(hoy, 'day')
  const lista = []

  for (let i = 1; i <= partes; i++) {
    const dias = Math.round((totalDias / partes) * i)
    lista.push({ description: `${nombre} ${i}`, fecha: hoy.add(dias, 'day').format('YYYY-MM-DD') })
  }
  return lista
}

/* ------------------------------------------------------------------ */
/* 2) URGENCIA Y PROGRESO                                             */
/* ------------------------------------------------------------------ */

/**
 * Niveles de urgencia guardados en la base de datos (`tasks.urgencyLevel`) y cómo se muestran.
 * El PDF del proyecto pide tres colores (verde, amarillo, rojo): "high" y "urgent" comparten el rojo.
 * La clave `color` coincide con las clases `.chip-verde`, `.chip-amarillo` y `.chip-rojo` de main.css.
 */
export const NIVELES_URGENCIA = {
  low: { etiqueta: 'Con tiempo', color: 'verde' },
  medium: { etiqueta: 'Atención', color: 'amarillo' },
  high: { etiqueta: 'Urgente', color: 'rojo' },
  urgent: { etiqueta: 'Para ya', color: 'rojo' },
}

/** Tipos de actividad que se pueden registrar (`tasks.type`). */
export const TIPOS_TAREA = {
  lectura: 'Lectura',
  proyecto: 'Proyecto',
  examen: 'Examen',
  otro: 'Otro',
}

/**
 * Calcula el nivel de urgencia según el tiempo que falta (regla sugerida para el equipo).
 * - Ya pasó o falta 1 día o menos  -> "urgent"
 * - Faltan 2 o 3 días              -> "high"
 * - Faltan de 4 a 7 días           -> "medium"
 * - Faltan más de 7 días           -> "low"
 * Puedes ajustar los límites si el equipo decide otra regla.
 *
 * @param {string|Date} fechaEntrega Fecha límite de la tarea.
 * @returns {'low'|'medium'|'high'|'urgent'}
 */
export function calcularUrgencia(fechaEntrega) {
  const dias = diasRestantes(fechaEntrega)
  if (dias <= 1) return 'urgent'
  if (dias <= 3) return 'high'
  if (dias <= 7) return 'medium'
  return 'low'
}

/**
 * Porcentaje de avance a partir de una lista de pasos.
 * @param {{completed: boolean}[]} pasos Pasos de la tarea.
 * @returns {number} Entero de 0 a 100 (0 si la lista está vacía).
 */
export function calcularProgreso(pasos) {
  if (!pasos.length) return 0
  return Math.round((pasos.filter((p) => p.completed).length / pasos.length) * 100)
}

/* ------------------------------------------------------------------ */
/* 3) TEXTO Y HTML                                                    */
/* ------------------------------------------------------------------ */

/**
 * Escapa texto para meterlo dentro de HTML sin riesgo.
 * ÚSALA SIEMPRE que pongas texto escrito por el usuario (título, responsable...) dentro de una
 * plantilla con `innerHTML`; si no, alguien podría escribir `<script>` y ejecutarlo en el sitio.
 *
 * @param {unknown} texto Valor a escapar.
 * @returns {string} Texto seguro.
 */
export function escaparHtml(texto) {
  return String(texto ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

/**
 * Pone la primera letra en mayúscula.
 * @param {string} texto Texto de entrada.
 * @returns {string}
 */
export function capitalizar(texto) {
  return texto ? texto.charAt(0).toUpperCase() + texto.slice(1) : ''
}

/**
 * Elige singular o plural según la cantidad.
 * @param {number} cantidad Cantidad de elementos.
 * @param {string} singular Texto para 1. Ej.: "tarea".
 * @param {string} plural Texto para el resto. Ej.: "tareas".
 * @returns {string} Ej.: "3 tareas".
 */
export function pluralizar(cantidad, singular, plural) {
  return `${cantidad} ${cantidad === 1 ? singular : plural}`
}

/* ------------------------------------------------------------------ */
/* 4) URL                                                             */
/* ------------------------------------------------------------------ */

/**
 * Lee un parámetro de la dirección de la página. Ej.: en `tarea.html?id=3`, `leerParametro('id')` da "3".
 * @param {string} nombre Nombre del parámetro.
 * @returns {string|null} El valor, o null si no está.
 */
export function leerParametro(nombre) {
  return new URLSearchParams(window.location.search).get(nombre)
}

/* ------------------------------------------------------------------ */
/* 5) AVISOS EN PANTALLA                                              */
/* ------------------------------------------------------------------ */

/**
 * Muestra un mensaje en la parte de abajo de la pantalla.
 * Normalmente se quita solo a los 4 segundos. Con `{ fijo: true }` se queda hasta que el usuario
 * lo cierra con su botón (útil para avisos importantes, como el resumen de la semana).
 *
 * @param {string} texto Mensaje a mostrar.
 * @param {'info'|'error'} [tipo='info'] "error" lo muestra en rojo.
 * @param {{fijo?: boolean}} [opciones={}] `fijo: true` = no desaparece solo y lleva un botón "Cerrar".
 * @returns {void}
 */
export function mostrarAviso(texto, tipo = 'info', { fijo = false } = {}) {
  const aviso = document.createElement('div')
  aviso.setAttribute('role', 'status')
  aviso.className =
    'fixed inset-x-4 bottom-24 z-50 mx-auto flex max-w-md items-center justify-between gap-3 rounded-lg border-2 px-4 py-3 font-bold shadow-lg md:bottom-6 ' +
    (tipo === 'error'
      ? 'border-[var(--c-rojo)] bg-[var(--c-rojo-fondo)] text-[var(--c-rojo)]'
      : 'border-tinta bg-superficie text-tinta')

  const mensaje = document.createElement('span')
  mensaje.textContent = texto
  aviso.append(mensaje)

  if (fijo) {
    const cerrar = document.createElement('button')
    cerrar.type = 'button'
    cerrar.textContent = 'Cerrar'
    cerrar.className = (tipo === 'error' ? 'btn-peligro' : 'btn-secundario') + ' shrink-0 !min-h-9 !px-3 !text-sm'
    cerrar.addEventListener('click', () => aviso.remove())
    aviso.append(cerrar)
  } else {
    setTimeout(() => aviso.remove(), 4000)
  }

  document.body.append(aviso)
}

/**
 * Avisa que una función todavía no está programada. Se usa en los lugares marcados con
 * `TODO(equipo)`: BORRA la llamada a esta función cuando termines de programar esa parte.
 *
 * @param {string} accion Nombre de lo que falta. Ej.: "Guardar tarea".
 * @returns {void}
 */
export function avisarPendiente(accion) {
  console.info(`[pendiente] ${accion} todavía no está programado.`)
  mostrarAviso(`Pendiente de programar: ${accion}`)
}

/* ------------------------------------------------------------------ */
/* 6) AVISOS POR PORCENTAJE DE TIEMPO                                 */
/* ------------------------------------------------------------------ */

/**
 * Porcentajes del tiempo transcurrido (entre que se crea la tarea y su entrega) en los que
 * se avisa al usuario. Al llegar al 100 % la tarea está atrasada.
 */
export const HITOS_AVISO = [25, 33, 50, 66, 75, 100]

/**
 * Qué porcentaje del tiempo entre la creación y la entrega ya pasó.
 * Si la entrega es igual o anterior a la creación, vale 100 cuando ya llegó y 0 si no.
 * El resultado puede pasar de 100 (tarea atrasada).
 *
 * @param {string|Date} creada Fecha en que se registró la tarea (`createdAt`).
 * @param {string|Date} entrega Fecha límite (`dueDate`).
 * @param {import('dayjs').Dayjs} [referencia] Momento a evaluar (por defecto, ahora).
 * @returns {number} Porcentaje, 0 o más. Ej.: 50 = ya pasó la mitad del tiempo.
 */
export function porcentajeTranscurrido(creada, entrega, referencia = ahora()) {
  const inicio = dayjs(creada).valueOf()
  const fin = dayjs(entrega).valueOf()
  const actual = referencia.valueOf()
  const total = fin - inicio
  if (total <= 0) return actual >= fin ? 100 : 0
  return Math.max(0, ((actual - inicio) / total) * 100)
}

/**
 * El hito de aviso más alto que ya se alcanzó.
 * @param {number} porcentaje Resultado de `porcentajeTranscurrido`.
 * @returns {number} Uno de `HITOS_AVISO`, o 0 si todavía no se alcanza ninguno.
 */
export function hitoAlcanzado(porcentaje) {
  return HITOS_AVISO.filter((h) => porcentaje >= h).at(-1) ?? 0
}

/**
 * Arma el texto del aviso de un hito.
 * - 25, 33 y 50 %: recordatorio tranquilo («aún tienes tiempo»).
 * - 66 y 75 %: «¡queda poco tiempo!».
 * - 100 %: la tarea está retrasada.
 *
 * @param {number} hito Uno de `HITOS_AVISO`.
 * @param {string} titulo Título de la tarea.
 * @param {string|Date} entrega Fecha límite.
 * @param {import('dayjs').Dayjs} [referencia] Momento desde el que se cuenta lo que falta (por defecto, ahora).
 * @returns {{nivel: 'info'|'alerta'|'atrasada', titulo: string, mensaje: string}}
 */
export function textoDeAviso(hito, titulo, entrega, referencia = ahora()) {
  if (hito >= 100) {
    return {
      nivel: 'atrasada',
      titulo: 'Tarea retrasada',
      mensaje: `«${titulo}» está retrasada: la fecha de entrega ya pasó. Márcala como terminada si ya la completaste.`,
    }
  }
  const falta = dayjs(entrega).from(referencia, true)
  if (hito >= 66) {
    return {
      nivel: 'alerta',
      titulo: '¡Queda poco tiempo!',
      mensaje: `¡Queda poco tiempo para realizar «${titulo}»! Ya pasó el ${hito} % del plazo y faltan ${falta}.`,
    }
  }
  return {
    nivel: 'info',
    titulo: 'Recordatorio de tarea',
    mensaje: `Ya pasó el ${hito} % del plazo de «${titulo}». Aún tienes ${falta}: recuerda marcarla como terminada cuando la completes.`,
  }
}

/**
 * Pide permiso para mostrar avisos del sistema (los que salen fuera de la página, como los de Outlook).
 * Debe llamarse desde un clic o un cambio del usuario; si no, el navegador la ignora.
 * Si el navegador no los soporta o el usuario los rechaza, el sitio sigue avisando dentro de la página.
 *
 * @returns {Promise<'granted'|'denied'|'default'|'unsupported'>}
 */
export async function pedirPermisoAvisosDelSistema() {
  if (typeof Notification === 'undefined') return 'unsupported'
  if (Notification.permission !== 'default') return Notification.permission
  try {
    return await Notification.requestPermission()
  } catch {
    return Notification.permission
  }
}
