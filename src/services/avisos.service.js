/**
 * Servicio de avisos (tabla `notifications`) y revisión de los hitos de tiempo de las tareas.
 * Ver la nota de arquitectura en materias.service.js: esta es la única capa que usa IndexedDB.
 *
 * Cómo funciona: una tarea con `notify: true` avisa cuando pasa cierto PORCENTAJE del tiempo entre su
 * creación y su entrega (25, 33, 50, 66 y 75 %) y otra vez cuando se atrasa (100 %). `lastMilestone`
 * guarda el último hito avisado para no repetir el mismo aviso.
 *
 * @typedef {Object} Aviso
 * @property {number} id Identificador.
 * @property {number} taskId Tarea a la que se refiere.
 * @property {number} milestone Hito alcanzado (25, 33, 50, 66, 75 o 100).
 * @property {'info'|'alerta'|'atrasada'} level Gravedad (define el color).
 * @property {string} title Título corto.
 * @property {string} message Texto completo.
 * @property {0|1} read 0 = sin leer, 1 = leído (no es booleano porque IndexedDB no indexa booleanos).
 * @property {string} createdAt Cuándo se generó (ISO, UTC).
 */
import { db } from '../db/db.js'
import { ahora, hitoAlcanzado, porcentajeTranscurrido, textoDeAviso } from '../utils/utils.js'

/**
 * Lista los avisos, el más reciente primero.
 * @param {number} [limite=30] Máximo de avisos a devolver.
 * @returns {Promise<Aviso[]>}
 */
export function listarAvisos(limite = 30) {
  return db.notifications.orderBy('createdAt').reverse().limit(limite).toArray()
}

/**
 * Cuántos avisos no se han leído (el número de la campanita).
 * @returns {Promise<number>}
 */
export function contarAvisosNoLeidos() {
  return db.notifications.where('read').equals(0).count()
}

/**
 * Marca todos los avisos como leídos.
 * @returns {Promise<number>} Cuántos se actualizaron.
 */
export function marcarAvisosLeidos() {
  return db.notifications.where('read').equals(0).modify({ read: 1 })
}

/**
 * Borra todos los avisos.
 * @returns {Promise<void>}
 */
export function borrarAvisos() {
  return db.notifications.clear()
}

/**
 * Hito que ya se alcanzó hoy para una tarea. Sirve para no avisar de golpe todo lo anterior cuando
 * se activan los avisos de una tarea que ya va avanzada, o se le cambia la fecha.
 *
 * @param {string|Date} creada Fecha de creación de la tarea.
 * @param {string|Date} entrega Fecha límite.
 * @returns {number} Hito actual (0 si aún no se alcanza ninguno).
 */
export function hitoActual(creada, entrega) {
  return hitoAlcanzado(porcentajeTranscurrido(creada, entrega))
}

/**
 * Revisa las tareas con avisos activados y genera el aviso del hito más alto que se alcanzó y todavía
 * no se avisó. Si el sitio estuvo cerrado y se pasaron varios hitos, se genera SOLO el último
 * (no una ráfaga de avisos viejos).
 *
 * Todo ocurre dentro de una transacción: si hay dos pestañas abiertas, la segunda ve el hito ya
 * registrado y no duplica el aviso.
 *
 * No genera nada si los avisos están apagados en Ajustes, si la tarea no tiene avisos activados
 * o si ya está terminada (avance de 100 %).
 *
 * @param {import('dayjs').Dayjs} [referencia] Momento a evaluar (por defecto, ahora; sirve para pruebas).
 * @returns {Promise<Aviso[]>} Los avisos nuevos (vacío si no hubo).
 */
export function revisarAvisos(referencia = ahora()) {
  return db.transaction('rw', db.tasks, db.notifications, db.settings, async () => {
    const ajustes = await db.settings.get(1)
    if (ajustes && ajustes.notificationsEnabled === false) return []

    const nuevos = []
    const tareas = await db.tasks.toArray()
    for (const tarea of tareas) {
      if (!tarea.notify || tarea.progress >= 100) continue
      const hito = hitoAlcanzado(porcentajeTranscurrido(tarea.createdAt, tarea.dueDate, referencia))
      if (hito <= (tarea.lastMilestone ?? 0)) continue

      const { nivel, titulo, mensaje } = textoDeAviso(hito, tarea.title, tarea.dueDate, referencia)
      const aviso = {
        taskId: tarea.id,
        milestone: hito,
        level: nivel,
        title: titulo,
        message: mensaje,
        read: 0,
        createdAt: referencia.toISOString(),
      }
      aviso.id = await db.notifications.add(aviso)
      await db.tasks.update(tarea.id, { lastMilestone: hito })
      nuevos.push(aviso)
    }
    return nuevos
  })
}
