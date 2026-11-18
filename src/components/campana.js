/**
 * Campanita de avisos (arriba, en el menú) y entrega de los avisos de las tareas.
 *
 * Qué hace:
 *  - Revisa los hitos de tiempo al abrir cualquier página y luego cada minuto (y al volver a la pestaña).
 *  - Cada aviso nuevo se guarda en la bandeja (la campanita con su contador) y además se muestra:
 *      · como aviso del sistema, fuera de la página (como los de Outlook), si el usuario dio permiso;
 *      · si no, como aviso dentro de la página.
 *  - Los avisos solo llegan con el sitio abierto en alguna pestaña: sin servidor no hay cómo despertarlo.
 *
 * Los textos y los porcentajes viven en `utils.js` (sección 6); el guardado, en `avisos.service.js`.
 */
import {
  borrarAvisos,
  contarAvisosNoLeidos,
  listarAvisos,
  marcarAvisosLeidos,
  revisarAvisos,
} from '../services/avisos.service.js'
import { escaparHtml, formatearFecha, mostrarAviso, pedirPermisoAvisosDelSistema } from '../utils/utils.js'

/** Cada cuánto se revisan los hitos mientras el sitio está abierto. */
const INTERVALO_REVISION_MS = 60_000

/** Color del borde izquierdo de cada aviso según su gravedad. */
const COLOR_POR_NIVEL = {
  info: 'var(--c-verde)',
  alerta: 'var(--c-amarillo)',
  atrasada: 'var(--c-rojo)',
}

const panel = () => document.getElementById('campana-panel')
const boton = () => document.getElementById('campana-boton')

/**
 * Arranca la campanita y la revisión periódica de avisos. Se llama desde `iniciarPagina()`.
 * @returns {Promise<void>}
 */
export async function iniciarCampana() {
  prepararPanel()
  await revisarYEntregar()
  await actualizarContador()
  setInterval(revisarYEntregar, INTERVALO_REVISION_MS)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') revisarYEntregar()
  })
  // Si otra pestaña genera un aviso, esta también actualiza su contador.
  window.addEventListener('focus', actualizarContador)
}

/**
 * Pide a `avisos.service` los avisos nuevos y los entrega.
 * @returns {Promise<void>}
 */
async function revisarYEntregar() {
  try {
    const nuevos = await revisarAvisos()
    nuevos.forEach(entregarAviso)
    if (nuevos.length) await actualizarContador()
  } catch (error) {
    console.error('[avisos] No se pudo revisar los avisos', error)
  }
}

/**
 * Muestra un aviso nuevo: del sistema si hay permiso, y si no, dentro de la página.
 * @param {import('../services/avisos.service.js').Aviso} aviso Aviso recién generado.
 * @returns {void}
 */
function entregarAviso(aviso) {
  if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
    try {
      const notificacion = new Notification(aviso.title, {
        body: aviso.message,
        tag: `aldia-${aviso.taskId}-${aviso.milestone}`,
        icon: '/favicon.svg',
      })
      notificacion.onclick = () => {
        window.focus()
        window.location.href = `/tarea.html?id=${aviso.taskId}`
      }
      return
    } catch {
      // Algunos navegadores de celular no permiten `new Notification`; se avisa dentro de la página.
    }
  }
  mostrarAviso(aviso.message, aviso.level === 'info' ? 'info' : 'error', { fijo: aviso.level !== 'info' })
}

/**
 * Pone en el contador de la campanita cuántos avisos faltan por leer.
 * @returns {Promise<void>}
 */
async function actualizarContador() {
  const contador = document.getElementById('campana-contador')
  if (!contador) return
  const cantidad = await contarAvisosNoLeidos()
  contador.textContent = cantidad > 9 ? '9+' : String(cantidad)
  contador.hidden = cantidad === 0
  boton()?.setAttribute('aria-label', cantidad ? `Avisos: ${cantidad} sin leer` : 'Avisos')
}

/**
 * Conecta los botones de la campanita (abrir, cerrar, marcar como leídos, borrar, activar permisos).
 * @returns {void}
 */
function prepararPanel() {
  if (!boton() || !panel()) return
  boton().addEventListener('click', alPulsarCampana)
  document.addEventListener('click', (evento) => {
    if (!panel().hidden && !evento.target.closest('#campana')) cerrarPanel()
  })
  document.addEventListener('keydown', (evento) => {
    if (evento.key === 'Escape' && !panel().hidden) {
      cerrarPanel()
      boton().focus()
    }
  })
  document.getElementById('campana-borrar').addEventListener('click', async () => {
    await borrarAvisos()
    await dibujarLista()
    await actualizarContador()
  })
  document.getElementById('campana-permiso').addEventListener('click', async () => {
    const permiso = await pedirPermisoAvisosDelSistema()
    if (permiso === 'denied') mostrarAviso('El navegador bloqueó los avisos del sistema. Se pueden activar en su configuración.', 'error')
    mostrarBotonDePermiso()
  })
}

/**
 * Abre o cierra el panel. Al abrirlo muestra los avisos y los marca como leídos.
 * @returns {Promise<void>}
 */
async function alPulsarCampana() {
  if (!panel().hidden) return cerrarPanel()
  panel().hidden = false
  boton().setAttribute('aria-expanded', 'true')
  mostrarBotonDePermiso()
  await dibujarLista()
  await marcarAvisosLeidos()
  await actualizarContador()
}

/**
 * Cierra el panel.
 * @returns {void}
 */
function cerrarPanel() {
  panel().hidden = true
  boton().setAttribute('aria-expanded', 'false')
}

/**
 * Muestra "Activar avisos del sistema" solo si el navegador los soporta y el usuario aún no decidió.
 * @returns {void}
 */
function mostrarBotonDePermiso() {
  const visible = typeof Notification !== 'undefined' && Notification.permission === 'default'
  document.getElementById('campana-permiso').hidden = !visible
}

/**
 * Dibuja la lista de avisos dentro del panel (los no leídos con el título en negrita).
 * @returns {Promise<void>}
 */
async function dibujarLista() {
  const avisos = await listarAvisos()
  document.getElementById('campana-vacio').hidden = avisos.length > 0
  document.getElementById('campana-borrar').hidden = avisos.length === 0
  document.getElementById('campana-lista').innerHTML = avisos
    .map(
      (a) => `
      <li class="border-b border-linea last:border-b-0">
        <a class="block border-l-4 px-4 py-3 no-underline text-tinta hover:bg-fondo" href="/tarea.html?id=${a.taskId}"
           style="border-left-color:${COLOR_POR_NIVEL[a.level] ?? COLOR_POR_NIVEL.info}">
          <span class="block text-sm ${a.read ? 'font-normal' : 'font-bold'}">${escaparHtml(a.title)}${a.read ? '' : ' · nuevo'}</span>
          <span class="block text-sm">${escaparHtml(a.message)}</span>
          <span class="block text-xs text-tinta-suave">${escaparHtml(formatearFecha(a.createdAt, 'D MMM, h:mm a'))}</span>
        </a>
      </li>`,
    )
    .join('')
}
