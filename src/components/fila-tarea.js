/**
 * Componente: fila de una tarea en una lista (se usa en Hoy y en Tareas).
 *
 * Los componentes con lógica se escriben como funciones que DEVUELVEN TEXTO HTML.
 * Se usan así:  contenedor.innerHTML = tareas.map((t) => filaTarea(t, materia)).join('')
 */
import {
  NIVELES_URGENCIA,
  TIPOS_TAREA,
  calcularUrgencia,
  escaparHtml,
  textoVencimiento,
  formatearFecha,
} from '../utils/utils.js'

/**
 * Construye el HTML de una fila de tarea. Es un enlace a `tarea.html?id=...`.
 *
 * @param {import('../services/tareas.service.js').Tarea} tarea Tarea a mostrar.
 * @param {import('../services/materias.service.js').Materia|undefined} materia Materia de la tarea.
 * @returns {string} HTML de la fila.
 */
export function filaTarea(tarea, materia) {
  const urgencia = NIVELES_URGENCIA[calcularUrgencia(tarea.dueDate)]
  const terminada = tarea.progress >= 100
  return `
    <a class="fila-tarea urgencia-${urgencia.color} ${terminada ? 'terminada' : ''}" href="/tarea.html?id=${tarea.id}">
      <div class="flex flex-col gap-1.5">
        <span class="fila-titulo">${escaparHtml(tarea.title)}</span>
        <span class="meta">
          ${escaparHtml(materia?.code ?? 'Sin materia')} · ${TIPOS_TAREA[tarea.type] ?? 'Otro'} ·
          ${terminada ? 'Terminada' : `${textoVencimiento(tarea.dueDate)} (${formatearFecha(tarea.dueDate)})`}
        </span>
      </div>
      <div class="flex flex-col gap-2">
        <div class="flex items-center justify-between gap-3">
          <span class="chip chip-${urgencia.color}">${urgencia.etiqueta}</span>
          <span class="text-sm font-bold">${tarea.progress} %</span>
        </div>
        <div class="barra" role="progressbar" aria-label="Avance" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${tarea.progress}">
          <span style="width:${tarea.progress}%"></span>
        </div>
      </div>
    </a>`
}
