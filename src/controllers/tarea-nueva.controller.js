/**
 * Controlador de la página "Nueva tarea" (tarea-nueva.html).
 * Genera los pasos con el divisor, valida el formulario y guarda la tarea con sus pasos.
 */
import { iniciarPagina } from '../main.js'
import { listarMaterias } from '../services/materias.service.js'
import { crearTarea } from '../services/tareas.service.js'
import { crearPasos } from '../services/pasos.service.js'
import {
  aValorDeInputFecha,
  ahora,
  deInputAFechaIso,
  diasRestantes,
  dividirEnPartes,
  escaparHtml,
  mostrarAviso,
} from '../utils/utils.js'

await iniciarPagina()

const formulario = document.getElementById('form-tarea')

await llenarSelectorDeMaterias()
// La fecha de entrega empieza en una semana a partir de hoy (el usuario la cambia).
document.getElementById('tarea-fecha').value = aValorDeInputFecha(ahora().add(7, 'day'))

formulario.addEventListener('submit', alGuardarTarea)
document.getElementById('btn-generar-pasos').addEventListener('click', alGenerarPasos)

/**
 * Llena el desplegable "Materia" con las materias de IndexedDB.
 * @returns {Promise<void>}
 */
async function llenarSelectorDeMaterias() {
  const materias = await listarMaterias()
  document.getElementById('tarea-materia').innerHTML = materias
    .map((m) => `<option value="${m.id}">${escaparHtml(m.name)} (${escaparHtml(m.code)})</option>`)
    .join('')
}

/**
 * Se ejecuta al pulsar "Generar los pasos": reparte la tarea en partes y las muestra como filas editables.
 * @returns {void}
 */
function alGenerarPasos() {
  const partes = Number(document.getElementById('dividir-partes').value)
  const nombre = document.getElementById('dividir-nombre').value.trim() || 'Parte'
  const fechaEntrega = document.getElementById('tarea-fecha').value

  if (!fechaEntrega) return mostrarAviso('Primero elige la fecha de entrega.', 'error')
  if (diasRestantes(fechaEntrega) < 0) return mostrarAviso('La fecha de entrega ya pasó.', 'error')
  if (!(partes >= 1 && partes <= 30)) return mostrarAviso('Elige entre 1 y 30 partes.', 'error')

  const pasos = dividirEnPartes(partes, nombre, fechaEntrega)
  document.getElementById('pasos-formulario').innerHTML = pasos.map(filaPasoEditable).join('')
}

/**
 * HTML de un paso generado: nombre, fecha y responsable, los tres editables antes de guardar.
 * @param {{description: string, fecha: string}} paso Paso que devuelve `dividirEnPartes`.
 * @returns {string} HTML de la fila.
 */
function filaPasoEditable(paso) {
  return `
    <li class="grid gap-2 border-b border-linea py-3 sm:grid-cols-3" data-paso>
      <input class="entrada" name="paso-descripcion" value="${escaparHtml(paso.description)}" aria-label="Nombre del paso" />
      <input class="entrada" name="paso-fecha" type="date" value="${paso.fecha}" aria-label="Fecha sugerida" />
      <input class="entrada" name="paso-responsable" placeholder="Responsable (opcional)" aria-label="Responsable" />
    </li>`
}

/**
 * Se ejecuta al enviar el formulario: valida, guarda la tarea y sus pasos, y abre la tarea nueva.
 * @param {SubmitEvent} evento Evento del formulario.
 * @returns {Promise<void>}
 */

/**
 * Se ejecuta al enviar el formulario: valida la tarea y TODOS sus pasos, y solo si todo está bien
 * guarda la tarea con sus pasos y abre la tarea nueva.
 * @param {SubmitEvent} evento Evento del formulario.
 * @returns {Promise<void>}
 */
async function alGuardarTarea(evento) {
  evento.preventDefault()
  const title = formulario.elements.title.value.trim()
  const fecha = formulario.elements.dueDate.value

  ocultarError('error-titulo')
  ocultarError('error-fecha')
  let valido = true

  if (!title) {
    mostrarError('error-titulo', 'Escribe qué tienes que entregar.')
    valido = false
  }
  if (!fecha) {
    mostrarError('error-fecha', 'Elige la fecha de entrega.')
    valido = false
  } else if (diasRestantes(fecha) < 0) {
    mostrarError('error-fecha', 'La fecha de entrega ya pasó.')
    valido = false
  }

  if (!valido) return

  // Los pasos se leen y se validan ANTES de guardar nada: si uno está mal, no se guarda ni la tarea.
  // (Se leen de las filas, no de lo que generó el divisor: el usuario pudo editarlos.)
  const filas = document.querySelectorAll('#pasos-formulario [data-paso]')
  const pasos = []
  for (let i = 0; i < filas.length; i++) {
    const description = filas[i].querySelector('[name="paso-descripcion"]').value.trim()
    const fechaPaso = filas[i].querySelector('[name="paso-fecha"]').value
    const responsible = filas[i].querySelector('[name="paso-responsable"]').value.trim()

    if (!description || !fechaPaso) return mostrarAviso(`El paso ${i + 1} necesita un nombre y una fecha.`, 'error')

    pasos.push({ description, dueDate: deInputAFechaIso(fechaPaso), responsible })
  }

  // Todo es válido: recién ahora se guarda.
  try {
    const idNuevo = await crearTarea({
      subjectId: Number(formulario.elements.subjectId.value),
      title,
      type: formulario.elements.type.value,
      dueDate: deInputAFechaIso(fecha),
    })
    if (pasos.length) await crearPasos(pasos.map((p) => ({ ...p, taskId: idNuevo })))

    window.location.href = '/tarea.html?id=' + idNuevo
  } catch (error) {
    console.error(error)
    mostrarAviso('No se pudo guardar la tarea. Intenta de nuevo.', 'error')
  }
}

/**
 * Muestra un mensaje de error debajo de un campo.
 * @param {string} id Id del párrafo de error. Ej.: "error-titulo".
 * @param {string} texto Mensaje a mostrar.
 * @returns {void}
 */
function mostrarError(id, texto) {
  const parrafo = document.getElementById(id)
  parrafo.textContent = texto
  parrafo.hidden = false
}

/**
 * Oculta el mensaje de error de un campo.
 * @param {string} id Id del párrafo de error.
 * @returns {void}
 */
function ocultarError(id) {
  document.getElementById(id).hidden = true
}
