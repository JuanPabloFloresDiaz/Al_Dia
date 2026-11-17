/**
 * Servicio de tareas (tabla `tasks` de IndexedDB). Ver la nota de arquitectura en materias.service.js.
 *
 * @typedef {Object} Tarea
 * @property {number} id Identificador (se genera solo).
 * @property {number} subjectId Id de la materia a la que pertenece.
 * @property {string} title Nombre de la tarea.
 * @property {'lectura'|'proyecto'|'examen'|'otro'} type Tipo de actividad.
 * @property {string} dueDate Fecha de entrega (ISO, UTC).
 * @property {'low'|'medium'|'high'|'urgent'} urgencyLevel Nivel de urgencia.
 * @property {number} progress Avance de 0 a 100 (se calcula con los pasos completados).
 * @property {string} createdAt Fecha en que se registró (ISO, UTC).
 */
import { db } from '../db/db.js'
import { calcularProgreso } from '../utils/utils.js'

/**
 * Lista todas las tareas, la entrega más cercana primero.
 * @returns {Promise<Tarea[]>}
 */
export function listarTareas() {
  return db.tasks.orderBy('dueDate').toArray()
}

/**
 * Lista las tareas de una materia, la entrega más cercana primero.
 * @param {number} materiaId Id de la materia.
 * @returns {Promise<Tarea[]>}
 */
export async function listarTareasPorMateria(materiaId) {
  const tareas = await db.tasks.where('subjectId').equals(Number(materiaId)).toArray()
  return tareas.sort((a, b) => a.dueDate.localeCompare(b.dueDate))
}

/**
 * Busca una tarea por su id.
 * @param {number} id Id de la tarea.
 * @returns {Promise<Tarea|undefined>} La tarea, o undefined si no existe.
 */
export function obtenerTarea(id) {
  return db.tasks.get(Number(id))
}

/**
 * Guarda una tarea nueva. Si no se indican `progress` y `createdAt`, se rellenan solos.
 * @param {Omit<Tarea, 'id'|'progress'|'createdAt'> & Partial<Tarea>} datos Datos de la tarea.
 * @returns {Promise<number>} Id de la tarea creada.
 */
export function crearTarea(datos) {
  return db.tasks.add({ progress: 0, createdAt: new Date().toISOString(), ...datos })
}

/**
 * Modifica una tarea.
 * @param {number} id Id de la tarea.
 * @param {Partial<Tarea>} cambios Solo los campos que cambian.
 * @returns {Promise<number>} 1 si se modificó, 0 si no existía.
 */
export function actualizarTarea(id, cambios) {
  return db.tasks.update(Number(id), cambios)
}

/**
 * Elimina una tarea y TODOS sus pasos (en una sola operación: o se borra todo o nada).
 * @param {number} id Id de la tarea.
 * @returns {Promise<void>}
 */
export function eliminarTarea(id) {
  return db.transaction('rw', db.tasks, db.steps, async () => {
    await db.steps.where('taskId').equals(Number(id)).delete()
    await db.tasks.delete(Number(id))
  })
}

/**
 * Recalcula el avance de una tarea a partir de sus pasos y lo guarda en `progress`.
 * Llamarla SIEMPRE que se marque, agregue o elimine un paso: así el avance que muestran
 * las listas (Hoy, Tareas) nunca queda desactualizado.
 * @param {number} tareaId Id de la tarea.
 * @returns {Promise<number>} El avance nuevo, de 0 a 100.
 */
export async function recalcularProgreso(tareaId) {
  const pasos = await db.steps.where('taskId').equals(Number(tareaId)).toArray()
  const progress = calcularProgreso(pasos)
  await db.tasks.update(Number(tareaId), { progress })
  return progress
}
