/**
 * Controlador del detalle de una tarea (tarea.html?id=3).
 *
 * Muestra la tarea, su avance y su checklist. Permite marcar pasos y agregar, editar y eliminar pasos.
 */
import { iniciarPagina } from '../main.js'
import { obtenerTarea, recalcularProgreso, eliminarTarea } from '../services/tareas.service.js'
import { obtenerMateria } from '../services/materias.service.js'
import { listarPasosDeTarea, crearPaso, actualizarPaso, eliminarPaso } from '../services/pasos.service.js'
import { pasoChecklist } from '../components/paso-checklist.js'
import {
  NIVELES_URGENCIA,
  TIPOS_TAREA,
  aValorDeInputFecha,
  calcularProgreso,
  calcularUrgencia,
  deInputAFechaIso,
  escaparHtml,
  formatearFecha,
  leerParametro,
  mostrarAviso,
  textoVencimiento,
  ahora,
} from '../utils/utils.js'

await iniciarPagina()

const tarea = await obtenerTarea(leerParametro('id'))
/** Pasos de la tarea tal como se dibujaron la última vez (los usa la edición de un paso). */
let pasos = []

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
 * Se vuelve a llamar después de cada cambio para refrescar la pantalla.
 * @returns {Promise<void>}
 */
async function dibujarTarea() {
  const [materia, lista] = await Promise.all([obtenerMateria(tarea.subjectId), listarPasosDeTarea(tarea.id)])
  pasos = lista
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
 * Se ejecuta al marcar o desmarcar la casilla de un paso: lo guarda y actualiza el avance.
 * @param {Event} evento Evento `change` de la lista (la casilla está en `evento.target`).
 * @returns {Promise<void>}
 */
async function alMarcarPaso(evento) {
  const casilla = evento.target
  if (!casilla.matches('[data-paso-id]')) return
  const id = Number(casilla.dataset.pasoId)
  const cambios = {completed: casilla.checked}
  await actualizarPaso(id, cambios)

  await recalcularProgreso(tarea.id)
  await dibujarTarea()
}

/**
 * Se ejecuta al enviar el formulario "Agregar un paso".
 * @param {SubmitEvent} evento Evento del formulario.
 * @returns {Promise<void>}
 */
async function alAgregarPaso(evento) {
  evento.preventDefault()
  const description = document.getElementById('paso-descripcion').value.trim()
  const fecha = document.getElementById('paso-fecha').value
  const responsible = document.getElementById('paso-responsable').value.trim()

  if (!description || !fecha) return mostrarAviso('Escribe qué hay que hacer y para cuándo.', 'error')

  await crearPaso({ taskId: tarea.id, description, dueDate: deInputAFechaIso(fecha), responsible })
  await recalcularProgreso(tarea.id)
  await dibujarTarea()

  evento.target.reset()
  document.getElementById('paso-fecha').value = aValorDeInputFecha(ahora())
  mostrarAviso('Paso agregado')
}

/**
 * Se ejecuta al hacer clic dentro de la lista de pasos. Atiende los botones de cada paso:
 * Editar, y en modo edición Guardar, Cancelar y Eliminar.
 * @param {MouseEvent} evento Evento de clic.
 * @returns {Promise<void>}
 */
async function alPulsarEnPaso(evento) {
  const boton = evento.target.closest('[data-accion]')
  if (!boton) return
  const id = Number(boton.dataset.pasoId)
  const fila = boton.closest('li')
  const accion = boton.dataset.accion

  if (accion === 'editar-paso') {
    const paso = pasos.find((p) => p.id === id)
    fila.outerHTML = filaPasoEnEdicion(paso)
  } else if (accion === 'cancelar-paso') {
    await dibujarTarea()
  } else if (accion === 'guardar-paso') {
    const description = fila.querySelector('[name="descripcion"]').value.trim()
    const fecha = fila.querySelector('[name="fecha"]').value
    const responsible = fila.querySelector('[name="responsable"]').value.trim()
    if (!description || !fecha) return mostrarAviso('El paso necesita un nombre y una fecha.', 'error')

    await actualizarPaso(id, { description, dueDate: deInputAFechaIso(fecha), responsible })
    await dibujarTarea()
    mostrarAviso('Paso actualizado')
  } else if (accion === 'eliminar-paso') {
    if (!confirm('¿Eliminar este paso?')) return
    await eliminarPaso(id)
    await recalcularProgreso(tarea.id)
    await dibujarTarea()
    mostrarAviso('Paso eliminado')
  }
}

/**
 * HTML de un paso en modo edición: sus tres datos editables y los botones Guardar, Cancelar y Eliminar.
 * @param {import('../services/pasos.service.js').Paso} paso Paso a editar.
 * @returns {string} HTML de la fila.
 */
function filaPasoEnEdicion(paso) {
  return `
    <li class="grid gap-2 border-b border-linea py-3">
      <input class="entrada" name="descripcion" value="${escaparHtml(paso.description)}" maxlength="160" aria-label="Qué hay que hacer" />
      <div class="grid gap-2 sm:grid-cols-2">
        <input class="entrada" name="fecha" type="date" value="${aValorDeInputFecha(paso.dueDate)}" aria-label="Para cuándo" />
        <input class="entrada" name="responsable" value="${escaparHtml(paso.responsible)}" maxlength="80" placeholder="Responsable (opcional)" aria-label="Responsable" />
      </div>
      <div class="flex flex-wrap gap-2">
        <button type="button" class="btn !min-h-9 !px-3 !text-sm" data-accion="guardar-paso" data-paso-id="${paso.id}">Guardar</button>
        <button type="button" class="btn-secundario !min-h-9 !px-3 !text-sm" data-accion="cancelar-paso" data-paso-id="${paso.id}">Cancelar</button>
        <button type="button" class="btn-peligro !min-h-9 !px-3 !text-sm" data-accion="eliminar-paso" data-paso-id="${paso.id}">Eliminar</button>
      </div>
    </li>`
}

/**
 * Se ejecuta al pulsar "Editar tarea".
 * @returns {void}
 */
function alEditarTarea() {
  window.location.href = '/tarea-nueva.html?id=' + tarea.id
}

/**
 * Se ejecuta al pulsar "Eliminar tarea": pide confirmación, borra la tarea con sus pasos y vuelve a la lista.
 * @returns {Promise<void>}
 */
async function alEliminarTarea() {
  if (!confirm('¿Eliminar la tarea y todos sus pasos?')) return
  await eliminarTarea(tarea.id)
  window.location.href = '/tareas.html'
}
