/**
 * Servicio de ajustes del usuario (tabla `settings`). Hay UN solo registro, con id 1.
 * Ver la nota de arquitectura en materias.service.js.
 *
 * @typedef {Object} Ajustes
 * @property {number} id Siempre 1.
 * @property {'light'|'dark'} theme Tema visual.
 * @property {boolean} notificationsEnabled Si se muestran los avisos al abrir el sitio.
 */
import { db } from '../db/db.js'

/** Valores que se usan si el registro de ajustes no existe. */
const AJUSTES_POR_DEFECTO = { id: 1, theme: 'light', notificationsEnabled: true }

/**
 * Obtiene los ajustes actuales.
 * @returns {Promise<Ajustes>}
 */
export async function obtenerAjustes() {
  return (await db.settings.get(1)) ?? AJUSTES_POR_DEFECTO
}

/**
 * Guarda cambios en los ajustes.
 * @param {Partial<Omit<Ajustes, 'id'>>} cambios Solo los campos que cambian.
 * @returns {Promise<Ajustes>} Los ajustes ya actualizados.
 */
export async function guardarAjustes(cambios) {
  const nuevos = { ...(await obtenerAjustes()), ...cambios, id: 1 }
  await db.settings.put(nuevos)
  return nuevos
}
