/**
 * Configuración de IndexedDB con Dexie.js.
 *
 * Este es el ÚNICO archivo donde se define la base de datos del navegador.
 * El resto del código NO usa `db` directamente: lo hace a través de los archivos de `src/services/`.
 *
 * Esquema (viene de docs/AlDiaDatabase_v1.json):
 *   subjects  -> materias           (id, name, code)
 *   tasks     -> tareas             (id, subjectId, title, type, dueDate, urgencyLevel, progress, createdAt)
 *   steps     -> pasos / checklist  (id, taskId, description, dueDate, completed, responsible)
 *   settings  -> ajustes            (id, theme, notificationsEnabled)
 *   notifications -> avisos         (id, taskId, milestone, level, title, message, read, createdAt)   [versión 2]
 *   tasks (v2) guarda además `notify` (avisos activados) y `lastMilestone` (último hito avisado).
 *
 * Sintaxis de Dexie: "++id" = id autoincremental; los demás nombres son campos con ÍNDICE
 * (solo los indexados se pueden usar en `.where('campo')`; los otros se guardan igual).
 *
 * Fechas: se guardan como texto ISO 8601 en UTC (ej. "2026-11-30T23:59:59Z").
 * Para mostrarlas o compararlas usa las funciones de `src/utils/utils.js` (usan Day.js).
 *
 * IMPORTANTE al cambiar el esquema: sube el número de versión con `db.version(2).stores({...})`
 * en lugar de editar la versión 1; así los datos que ya existen en los navegadores no se rompen.
 */
import Dexie from 'dexie'
import datosIniciales from './datos-iniciales.json'

/** Nombre con el que el navegador guarda la base de datos. */
export const NOMBRE_BD = datosIniciales.database

/** Instancia única de la base de datos de la aplicación. */
export const db = new Dexie(NOMBRE_BD)

db.version(datosIniciales.version).stores(datosIniciales.stores)

// Versión 2: bandeja de avisos (la campanita). `read` es 0 (sin leer) o 1 (leído), porque IndexedDB
// no permite indexar booleanos. Las tareas guardan `notify` y `lastMilestone` sin necesidad de índice.
db.version(2).stores({
  notifications: '++id, taskId, read, createdAt',
})

/**
 * Se ejecuta UNA sola vez: cuando la base de datos se crea por primera vez en un navegador.
 * Carga los datos de ejemplo (materias, tareas y pasos) para que el sitio no se vea vacío.
 */
db.on('populate', async (transaccion) => {
  const { seedData } = datosIniciales
  await transaccion.table('subjects').bulkAdd(seedData.subjects)
  await transaccion.table('tasks').bulkAdd(seedData.tasks)
  await transaccion.table('steps').bulkAdd(seedData.steps)
  await transaccion.table('settings').bulkAdd(seedData.settings)
})

/**
 * Abre la base de datos (y la crea con los datos de ejemplo si es la primera vez).
 * Se llama desde `iniciarPagina()` en `src/main.js`, así que ninguna página la llama a mano.
 *
 * @returns {Promise<import('dexie').Dexie>} La base de datos lista para usar.
 */
export async function abrirBaseDeDatos() {
  if (!db.isOpen()) await db.open()
  return db
}

/**
 * Borra TODA la base de datos y la vuelve a crear con los datos de ejemplo.
 * Útil para pruebas y para el botón "Restablecer datos de ejemplo" de Ajustes.
 *
 * @returns {Promise<void>}
 */
export async function restablecerBaseDeDatos() {
  await db.delete()
  await db.open()
}
