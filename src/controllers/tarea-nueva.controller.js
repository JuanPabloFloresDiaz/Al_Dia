/**
 * Controlador de la página "Nueva tarea" (tarea-nueva.html).
 * Genera los pasos con el divisor, valida el formulario y guarda la tarea con sus pasos.
 *
 * Modo edición: con `tarea-nueva.html?id=3` la misma página edita la tarea 3
 * (llena el formulario con sus datos y oculta el divisor).
 */
import { iniciarPagina } from '../main.js'
import { listarMaterias } from '../services/materias.service.js'
import { crearTarea, obtenerTarea, actualizarTarea } from '../services/tareas.service.js'
import { crearPasos } from '../services/pasos.service.js'
import {
  aValorDeInputFecha,
  ahora,
  deInputAFechaIso,
  diasRestantes,
  dividirEnPartes,
  escaparHtml,
  leerParametro,
  mostrarAviso,
  pedirPermisoAvisosDelSistema,
} from '../utils/utils.js'
import { hitoActual } from '../services/avisos.service.js'

await iniciarPagina()

const formulario = document.getElementById('form-tarea')

await llenarSelectorDeMaterias()
// La fecha de entrega empieza en una semana a partir de hoy (el usuario la cambia).
document.getElementById('tarea-fecha').value = aValorDeInputFecha(ahora().add(7, 'day'))

/** Si la dirección trae ?id=, la página edita esa tarea en vez de crear una nueva. */
const idEdicion = leerParametro('id')
const tareaEnEdicion = idEdicion ? await obtenerTarea(idEdicion) : null
if (tareaEnEdicion) prepararModoEdicion(tareaEnEdicion)

formulario.addEventListener('submit', alGuardarTarea)
// Al activar los avisos se pide el permiso del navegador (hay que hacerlo desde un cambio del usuario).
formulario.elements.notify.addEventListener('change', (evento) => {
  if (evento.target.checked) pedirPermisoAvisosDelSistema()
})
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
 * Convierte la página en "Editar tarea": llena el formulario con los datos guardados y oculta
 * el divisor (los pasos de una tarea que ya existe se editan desde su detalle).
 * @param {import('../services/tareas.service.js').Tarea} tarea Tarea a editar.
 * @returns {void}
 */
function prepararModoEdicion(tarea) {
  document.title = 'Editar tarea · Al Día'
  document.querySelector('h1').textContent = 'Editar tarea'
  formulario.elements.title.value = tarea.title
  formulario.elements.subjectId.value = tarea.subjectId
  formulario.elements.type.value = tarea.type
  formulario.elements.dueDate.value = aValorDeInputFecha(tarea.dueDate)
  formulario.elements.notify.checked = Boolean(tarea.notify)
  formulario.querySelector('fieldset').hidden = true
  formulario.querySelector('button[type="submit"]').textContent = 'Guardar cambios'
  formulario.querySelector('a.btn-secundario').href = '/tarea.html?id=' + tarea.id
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
 * Se ejecuta al enviar el formulario: valida y guarda. En modo crear, guarda la tarea con sus pasos;
 * en modo edición, actualiza la tarea. Al terminar abre el detalle de la tarea.
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
  } else if (!tareaEnEdicion && diasRestantes(fecha) < 0) {
    // Solo al CREAR: una tarea atrasada que ya existe se debe poder editar (por ejemplo, corregir el título).
    mostrarError('error-fecha', 'La fecha de entrega ya pasó.')
    valido = false
  }

  if (!valido) return

  const datos = {
    subjectId: Number(formulario.elements.subjectId.value),
    title,
    type: formulario.elements.type.value,
    dueDate: deInputAFechaIso(fecha),
    notify: formulario.elements.notify.checked,
  }
  datos.lastMilestone = hitoInicial(datos)

  try {
    if (tareaEnEdicion) {
      await actualizarTarea(tareaEnEdicion.id, datos)
      window.location.href = '/tarea.html?id=' + tareaEnEdicion.id
      return
    }

    const idNuevo = await crearTarea(datos)

    // Los pasos se leen de las filas, no de lo que generó el divisor: el usuario pudo editarlos.
    const filas = document.querySelectorAll('#pasos-formulario [data-paso]')
    const pasos = [...filas].map((fila) => ({
      taskId: idNuevo,
      description: fila.querySelector('[name="paso-descripcion"]').value.trim(),
      dueDate: deInputAFechaIso(fila.querySelector('[name="paso-fecha"]').value),
      responsible: fila.querySelector('[name="paso-responsable"]').value.trim(),
    }))
    if (pasos.length) await crearPasos(pasos)

    window.location.href = '/tarea.html?id=' + idNuevo
  } catch (error) {
    console.error(error)
    mostrarAviso('No se pudo guardar la tarea. Intenta de nuevo.', 'error')
  }
}

/**
 * Último hito de aviso que se da por "ya avisado" al guardar. Una tarea nueva empieza en 0.
 * Al editar, si se activan los avisos o se cambia la fecha, se parte del hito actual para no
 * lanzar de golpe avisos de porcentajes que ya pasaron.
 * @param {{notify: boolean, dueDate: string}} datos Datos que se van a guardar.
 * @returns {number} Hito inicial (0, 25, 33, 50, 66, 75 o 100).
 */
function hitoInicial(datos) {
  if (!tareaEnEdicion) return 0
  const cambio = datos.notify !== Boolean(tareaEnEdicion.notify) || datos.dueDate !== tareaEnEdicion.dueDate
  return cambio ? hitoActual(tareaEnEdicion.createdAt, datos.dueDate) : (tareaEnEdicion.lastMilestone ?? 0)
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
