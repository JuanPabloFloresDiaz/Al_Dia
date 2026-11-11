/**
 * Servicio de pasos del checklist (tabla `steps` de IndexedDB). Ver materias.service.js.
 *
 * @typedef {Object} Paso
 * @property {number} id Identificador (se genera solo).
 * @property {number} taskId Id de la tarea a la que pertenece.
 * @property {string} description Qué hay que hacer. Ej.: "Capítulo 2".
 * @property {string} dueDate Fecha sugerida para terminarlo (ISO, UTC).
 * @property {boolean} completed `true` si ya se hizo.
 * @property {string} responsible Nombre de quien se encarga (puede estar vacío).
 */
import { db } from '../db/db.js'

/**
 * Lista los pasos de una tarea, por fecha.
 * @param {number} tareaId Id de la tarea.
 * @returns {Promise<Paso[]>}
 */
export async function listarPasosDeTarea(tareaId) {
  const pasos = await db.steps.where('taskId').equals(Number(tareaId)).toArray()
  return pasos.sort((a, b) => a.dueDate.localeCompare(b.dueDate))
}

/**
 * Lista TODOS los pasos de la base (sirve para contar avances de varias tareas a la vez).
 * @returns {Promise<Paso[]>}
 */
export function listarTodosLosPasos() {
  return db.steps.toArray()
}

/**
 * Crea un paso nuevo.
 * @param {Omit<Paso, 'id'|'completed'> & Partial<Paso>} datos Datos del paso.
 * @returns {Promise<number>} Id del paso creado.
 */
export function crearPaso(datos) {
  return db.steps.add({ completed: false, responsible: '', ...datos })
}

/**
 * Crea varios pasos de una vez (por ejemplo, los que genera "dividir en partes").
 * @param {Array<Omit<Paso, 'id'|'completed'> & Partial<Paso>>} lista Pasos a crear.
 * @returns {Promise<number>} Id del último paso creado.
 */
export function crearPasos(lista) {
  return db.steps.bulkAdd(lista.map((p) => ({ completed: false, responsible: '', ...p })))
}

/**
 * Modifica un paso (marcarlo como completado, cambiar fecha, responsable...).
 * @param {number} id Id del paso.
 * @param {Partial<Paso>} cambios Solo los campos que cambian.
 * @returns {Promise<number>} 1 si se modificó, 0 si no existía.
 */
export function actualizarPaso(id, cambios) {
  return db.steps.update(Number(id), cambios)
}

/**
 * Elimina un paso.
 * @param {number} id Id del paso.
 * @returns {Promise<void>}
 */
export function eliminarPaso(id) {
  return db.steps.delete(Number(id))
}
