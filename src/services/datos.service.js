/**
 * Operaciones de respaldo y restauración de todos los datos locales.
 * Los controladores no necesitan conocer los nombres de las tablas de Dexie.
 */
import { db, restablecerBaseDeDatos } from "../db/db.js";

/**
 * Lee todos los stores actuales de la aplicación.
 * @returns {Promise<Record<string, unknown[]>>} Datos exportables.
 */
export async function exportarDatos() {
  const datos = {};
  for (const tabla of db.tables) datos[tabla.name] = await tabla.toArray();
  return datos;
}

/**
 * Elimina la base y deja que Dexie la repueble con los datos iniciales.
 * @returns {Promise<void>}
 */
export function restaurarDatosIniciales() {
  return restablecerBaseDeDatos();
}
