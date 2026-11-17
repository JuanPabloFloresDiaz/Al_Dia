/**
 * Controlador del detalle de una tarea (tarea.html?id=3).
 *
 * ESTADO: muestra la tarea, su avance y su checklist (solo lectura).
 * PENDIENTE para el equipo: marcar pasos, agregar pasos, editar y eliminar (TODO abajo).
 */
import { iniciarPagina } from '../main.js'
import { obtenerTarea } from '../services/tareas.service.js'
import { obtenerMateria } from '../services/materias.service.js'
import { listarPasosDeTarea } from '../services/pasos.service.js'
import { pasoChecklist } from '../components/paso-checklist.js'
import {
  NIVELES_URGENCIA,
  TIPOS_TAREA,
  calcularUrgencia,
  avisarPendiente,
  aValorDeInputFecha,
  calcularProgreso,
  escaparHtml,
  formatearFecha,
  leerParametro,
  textoVencimiento,
  ahora,
} from '../utils/utils.js'

await iniciarPagina()

const tarea = await obtenerTarea(leerParametro('id'))

if (!tarea) {
  document.getElementById('tarea-no-encontrada').hidden = false
} else {
  document.getElementById('tarea-detalle').hidden = false
  await dibujarTarea()
  document.getElementById('lista-pasos').addEventListener('change', alMarcarPaso)
  document.getElementById('lista-pasos').addEventListener('click', alPulsarEnPaso)
  document.getElementById('form-paso').addEventListener('submit', alAgregarPaso)
  document.getElementById('btn-editar-tarea').addEventListener('click', alEditarTarea)
  document.getElementById('btn-eliminar-tarea').addEventListener('click', alEliminarTarea)
  document.getElementById('paso-fecha').value = aValorDeInputFecha(ahora())
}

/**
 * Dibuja el título, las etiquetas, la barra de avance y la lista de pasos de la tarea.
 * Se puede volver a llamar después de cambiar algo para refrescar la pantalla.
 * @returns {Promise<void>}
 */
async function dibujarTarea() {
  const [materia, pasos] = await Promise.all([obtenerMateria(tarea.subjectId), listarPasosDeTarea(tarea.id)])
  const urgencia = NIVELES_URGENCIA[calcularUrgencia(tarea.dueDate)]
  // El avance sale de los pasos; si la tarea no tiene pasos, se usa el valor guardado.
  const progreso = pasos.length ? calcularProgreso(pasos) : tarea.progress

  document.title = `${tarea.title} · Al Día`
  document.getElementById('tarea-titulo').textContent = tarea.title
  document.getElementById('tarea-meta').textContent =
    `${materia?.name ?? 'Sin materia'} · ${TIPOS_TAREA[tarea.type] ?? 'Otro'} · Entrega el ${formatearFecha(tarea.dueDate, 'D [de] MMMM [de] YYYY')}`
  document.getElementById('tarea-etiquetas').innerHTML = `
    <span class="chip chip-${urgencia.color}">${urgencia.etiqueta}</span>
    <span class="chip" style="background:var(--c-linea)">${escaparHtml(textoVencimiento(tarea.dueDate))}</span>`

  document.getElementById('tarea-progreso-texto').textContent = `${progreso} %`
  const barra = document.getElementById('tarea-progreso')
  barra.setAttribute('aria-valuenow', progreso)
  barra.firstElementChild.style.width = `${progreso}%`

  document.getElementById('lista-pasos').innerHTML = pasos.map(pasoChecklist).join('')
  document.getElementById('vacio-pasos').hidden = pasos.length > 0
}

/**
 * Se ejecuta al marcar o desmarcar la casilla de un paso.
 * @param {Event} evento Evento `change` de la lista (la casilla está en `evento.target`).
 * @returns {void}
 */
function alMarcarPaso(evento) {
  const casilla = evento.target
  if (!casilla.matches('[data-paso-id]')) return
  // TODO(equipo): guardar el paso y actualizar el avance.
  //   1. `actualizarPaso(Number(casilla.dataset.pasoId), { completed: casilla.checked })` de pasos.service.js.
  //   2. Recalcular el avance con `calcularProgreso(pasos)` y guardarlo en la tarea con
  //      `actualizarTarea(tarea.id, { progress })` de tareas.service.js.
  //   3. Llamar a `await dibujarTarea()` para refrescar la barra y la lista.
  //   4. Borra las líneas de `casilla.checked` y `avisarPendiente` de abajo.
  casilla.checked = !casilla.checked
  avisarPendiente('Marcar un paso como completado')
}

/**
 * Se ejecuta al hacer clic dentro de la lista de pasos (sirve para el botón "Editar" de cada paso).
 * @param {MouseEvent} evento Evento de clic.
 * @returns {void}
 */
function alPulsarEnPaso(evento) {
  const boton = evento.target.closest('[data-accion="editar-paso"]')
  if (!boton) return
  // TODO(equipo): editar un paso (descripción, fecha y responsable) y eliminarlo.
  //   Id del paso: `Number(boton.dataset.pasoId)`. Servicios: `actualizarPaso` y `eliminarPaso` (pasos.service.js).
  //   Puedes reemplazar la fila por campos editables, o abrir un formulario aparte.
  avisarPendiente('Editar un paso')
}

/**
 * Se ejecuta al enviar el formulario "Agregar un paso".
 * @param {SubmitEvent} evento Evento del formulario.
 * @returns {void}
 */
function alAgregarPaso(evento) {
  evento.preventDefault()
  // TODO(equipo): crear el paso nuevo.
  //   1. Validar que #paso-descripcion y #paso-fecha no estén vacíos.
  //   2. `crearPaso({ taskId: tarea.id, description, dueDate, responsible })` de pasos.service.js
  //      (convierte la fecha del input con `new Date(valor).toISOString()`).
  //   3. Recalcular el avance (igual que en alMarcarPaso) y llamar a `await dibujarTarea()`.
  //   4. Limpiar el formulario (`evento.target.reset()`) y borrar la línea de `avisarPendiente`.
  avisarPendiente('Agregar un paso')
}

/**
 * Se ejecuta al pulsar "Editar tarea".
 * @returns {void}
 */
function alEditarTarea() {
  // TODO(equipo): editar título, tipo, materia y fecha. Puede reutilizar la forma de tarea-nueva.html
  //   (por ejemplo `tarea-nueva.html?id=3` en modo edición) y guardar con `actualizarTarea` de tareas.service.js.
  avisarPendiente('Editar la tarea')
}

/**
 * Se ejecuta al pulsar "Eliminar tarea".
 * @returns {void}
 */
function alEliminarTarea() {
  // TODO(equipo): pedir confirmación (`confirm('¿Eliminar la tarea y todos sus pasos?')`) y, si acepta,
  //   llamar a `eliminarTarea(tarea.id)` de tareas.service.js (borra también los pasos) y volver a '/tareas.html'.
  avisarPendiente('Eliminar la tarea')
}
