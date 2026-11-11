/**
 * Servicio de materias (tabla `subjects` de IndexedDB).
 *
 * Los servicios son la ÚNICA capa que habla con la base de datos. Los controladores
 * (src/controllers) los llaman y reciben datos listos; así, si algo cambia en la base,
 * se arregla aquí y no en cada página. Todas las funciones son asíncronas: usa `await`.
 *
 * @typedef {Object} Materia
 * @property {number} id Identificador (se genera solo).
 * @property {string} name Nombre completo. Ej.: "Diseño y Desarrollo de Sitios Web".
 * @property {string} code Código corto. Ej.: "DDW".
 */
import { db } from '../db/db.js'

/**
 * Lista todas las materias ordenadas por nombre.
 * @returns {Promise<Materia[]>}
 */
export function listarMaterias() {
  return db.subjects.orderBy('name').toArray()
}

/**
 * Busca una materia por su id.
 * @param {number} id Id de la materia.
 * @returns {Promise<Materia|undefined>} La materia, o undefined si no existe.
 */
export function obtenerMateria(id) {
  return db.subjects.get(Number(id))
}

/**
 * Crea una materia nueva.
 * @param {{name: string, code: string}} datos Nombre y código.
 * @returns {Promise<number>} Id de la materia creada.
 */
export function crearMateria({ name, code }) {
  return db.subjects.add({ name: name.trim(), code: code.trim().toUpperCase() })
}

/**
 * Modifica los datos de una materia.
 * @param {number} id Id de la materia.
 * @param {Partial<Materia>} cambios Solo los campos que cambian.
 * @returns {Promise<number>} 1 si se modificó, 0 si no existía.
 */
export function actualizarMateria(id, cambios) {
  return db.subjects.update(Number(id), cambios)
}

/**
 * Elimina una materia. OJO: sus tareas quedarían sin materia; decide como equipo qué hacer
 * (impedir el borrado si tiene tareas, o borrarlas también) antes de usar esta función.
 * @param {number} id Id de la materia.
 * @returns {Promise<void>}
 */
export function eliminarMateria(id) {
  return db.subjects.delete(Number(id))
}
