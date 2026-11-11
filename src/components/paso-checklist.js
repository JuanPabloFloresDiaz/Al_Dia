/**
 * Componente: un paso del checklist de una tarea (se usa en tarea.html).
 */
import { escaparHtml, formatearFecha } from '../utils/utils.js'

/**
 * Construye el HTML de un paso: casilla, descripción, fecha y responsable.
 *
 * La casilla lleva `data-paso-id` para que el controlador sepa qué paso se marcó
 * (ver la tarea pendiente "marcar paso" en tarea.controller.js).
 *
 * @param {import('../services/pasos.service.js').Paso} paso Paso a mostrar.
 * @returns {string} HTML del paso.
 */
export function pasoChecklist(paso) {
  return `
    <li class="flex items-start gap-3 border-b border-linea py-3">
      <input class="casilla mt-0.5" type="checkbox" id="paso-${paso.id}" data-paso-id="${paso.id}"
             ${paso.completed ? 'checked' : ''} />
      <label for="paso-${paso.id}" class="flex flex-1 cursor-pointer flex-col gap-0.5">
        <span class="${paso.completed ? 'text-suave line-through' : 'font-bold'}">${escaparHtml(paso.description)}</span>
        <span class="meta">
          Para el ${formatearFecha(paso.dueDate)}${paso.responsible ? ` · Responsable: ${escaparHtml(paso.responsible)}` : ''}
        </span>
      </label>
      <button type="button" class="btn-secundario !min-h-9 !px-3 !text-sm" data-accion="editar-paso" data-paso-id="${paso.id}">Editar</button>
    </li>`
}
