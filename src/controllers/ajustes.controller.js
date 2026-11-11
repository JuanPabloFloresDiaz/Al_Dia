/**
 * Controlador de la página "Ajustes" (ajustes.html).
 *
 * ESTADO: muestra los ajustes guardados en el formulario.
 * PENDIENTE para el equipo: guardar, exportar y restablecer (TODO abajo).
 */
import { iniciarPagina, aplicarTema } from '../main.js'
import { obtenerAjustes } from '../services/ajustes.service.js'
import { avisarPendiente } from '../utils/utils.js'

await iniciarPagina()

const formulario = document.getElementById('form-ajustes')
const ajustes = await obtenerAjustes()

formulario.elements.theme.value = ajustes.theme
formulario.elements.notificationsEnabled.checked = ajustes.notificationsEnabled

formulario.addEventListener('submit', alGuardarAjustes)
// Vista previa: el tema cambia apenas el usuario lo elige (todavía NO se guarda hasta pulsar el botón).
formulario.elements.theme.forEach((opcion) => opcion.addEventListener('change', () => aplicarTema(opcion.value)))
document.getElementById('btn-exportar').addEventListener('click', alExportarDatos)
document.getElementById('btn-restablecer').addEventListener('click', alRestablecerDatos)

/**
 * Se ejecuta al enviar el formulario "Guardar ajustes".
 * @param {SubmitEvent} evento Evento del formulario.
 * @returns {void}
 */
function alGuardarAjustes(evento) {
  evento.preventDefault()
  // TODO(equipo): guardar con `guardarAjustes({ theme, notificationsEnabled })` de ajustes.service.js.
  //   Valores: `formulario.elements.theme.value` y `formulario.elements.notificationsEnabled.checked`.
  //   Al terminar escribe "Ajustes guardados" en #ajustes-estado y borra la línea de `avisarPendiente`.
  avisarPendiente('Guardar los ajustes')
}

/**
 * Se ejecuta al pulsar "Descargar copia de mis datos".
 * @returns {void}
 */
function alExportarDatos() {
  // TODO(equipo): descargar un archivo .json con materias, tareas, pasos y ajustes.
  //   Pista: `db.table('tasks').toArray()` (importa `db` solo aquí o, mejor, crea `exportarDatos()` en un servicio),
  //   luego `new Blob([JSON.stringify(datos, null, 2)], { type: 'application/json' })` y un enlace <a download>.
  avisarPendiente('Descargar copia de los datos')
}

/**
 * Se ejecuta al pulsar "Restablecer datos de ejemplo".
 * @returns {void}
 */
function alRestablecerDatos() {
  // TODO(equipo): pedir confirmación (borra TODO lo que el usuario registró) y llamar a
  //   `await restablecerBaseDeDatos()` de src/db/db.js. Después recarga con `window.location.reload()`.
  avisarPendiente('Restablecer los datos de ejemplo')
}
