/**
 * Controlador de la página "Nueva tarea" (tarea-nueva.html).
 *
 * ESTADO: el formulario se muestra y el desplegable de materias se llena.
 * PENDIENTE para el equipo: generar los pasos, validar y guardar (3 funciones marcadas con TODO).
 */
import { iniciarPagina } from '../main.js'
import { listarMaterias } from '../services/materias.service.js'
import { avisarPendiente, aValorDeInputFecha, ahora, escaparHtml } from '../utils/utils.js'

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
 * Se ejecuta al pulsar "Generar los pasos": crea la lista de pasos con fechas repartidas
 * entre hoy y la fecha de entrega, y la muestra en #pasos-formulario.
 * @returns {void}
 */
function alGenerarPasos() {
  // TODO(equipo): dividir la tarea en partes (objetivo 3 del PDF).
  //   1. Lee #dividir-partes (cuántas), #dividir-nombre (prefijo) y #tarea-fecha (entrega).
  //   2. Reparte las fechas en partes IGUALES entre hoy y la entrega. Ejemplo: 10 días y 5 partes ->
  //      una cada 2 días; la última parte cae el día de la entrega. (Day.js: `ahora().add(n, 'day')`).
  //   3. Dibuja cada paso como una fila de #pasos-formulario con: descripción ("Capítulo 1"),
  //      una fecha editable (<input type="date">) y un responsable (opcional). El usuario podrá ajustar las fechas.
  //   4. Borra la línea de `avisarPendiente` de abajo.
  avisarPendiente('Generar los pasos de una tarea')
}

/**
 * Se ejecuta al enviar el formulario ("Guardar tarea").
 * @param {SubmitEvent} evento Evento del formulario.
 * @returns {Promise<void>}
 */
async function alGuardarTarea(evento) {
  evento.preventDefault()
  // TODO(equipo): validar y guardar la tarea con sus pasos.
  //   1. Validar: título obligatorio y fecha de entrega obligatoria. Si falta algo, muestra el texto en
  //      #error-titulo o #error-fecha (quita el atributo `hidden`) y no sigas.
  //   2. Crear la tarea con `crearTarea({ subjectId, title, type, dueDate, urgencyLevel })` de tareas.service.js
  //      (`subjectId` debe ser número; `urgencyLevel` sale de `calcularUrgencia(dueDate)` de utils.js).
  //   3. Si hay pasos generados, guardarlos con `crearPasos([...])` de pasos.service.js usando el id de la tarea nueva.
  //   4. Ir a la tarea: `window.location.href = '/tarea.html?id=' + idNuevo`.
  //   5. Borra la línea de `avisarPendiente` de abajo.
  avisarPendiente('Guardar tarea')
}
