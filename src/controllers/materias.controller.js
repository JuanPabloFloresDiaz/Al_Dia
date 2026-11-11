/**
 * Controlador de la página "Materias" (materias.html).
 *
 * ESTADO: lista las materias con cuántas tareas tiene cada una (solo lectura).
 * PENDIENTE para el equipo: crear, editar y eliminar materias (TODO abajo).
 */
import { iniciarPagina } from '../main.js'
import { listarMaterias } from '../services/materias.service.js'
import { listarTareas } from '../services/tareas.service.js'
import { avisarPendiente, escaparHtml, pluralizar } from '../utils/utils.js'

await iniciarPagina()

await dibujarMaterias()
document.getElementById('form-materia').addEventListener('submit', alAgregarMateria)
document.getElementById('lista-materias').addEventListener('click', alPulsarEnMateria)

/**
 * Dibuja la lista de materias. Se puede volver a llamar después de crear o borrar una.
 * @returns {Promise<void>}
 */
async function dibujarMaterias() {
  const [materias, tareas] = await Promise.all([listarMaterias(), listarTareas()])
  document.getElementById('lista-materias').innerHTML = materias
    .map((m) => {
      const cantidad = tareas.filter((t) => t.subjectId === m.id).length
      return `
        <li class="flex items-center justify-between gap-4 border-b border-linea py-4">
          <div>
            <p class="fila-titulo">${escaparHtml(m.name)}</p>
            <p class="meta">${escaparHtml(m.code)} · ${pluralizar(cantidad, 'tarea', 'tareas')}</p>
          </div>
          <div class="flex gap-2">
            <button type="button" class="btn-secundario !min-h-9 !px-3 !text-sm" data-accion="editar" data-id="${m.id}">Editar</button>
            <button type="button" class="btn-peligro !min-h-9 !px-3 !text-sm" data-accion="eliminar" data-id="${m.id}">Eliminar</button>
          </div>
        </li>`
    })
    .join('')
  document.getElementById('vacio-materias').hidden = materias.length > 0
}

/**
 * Se ejecuta al enviar el formulario "Nueva materia".
 * @param {SubmitEvent} evento Evento del formulario.
 * @returns {void}
 */
function alAgregarMateria(evento) {
  evento.preventDefault()
  // TODO(equipo): crear la materia.
  //   1. Validar: nombre obligatorio y código de 2 a 8 letras. Si falla, escribe el motivo en #error-materia
  //      (quita `hidden`). Evita códigos repetidos revisando `listarMaterias()`.
  //   2. `await crearMateria({ name, code })` de materias.service.js.
  //   3. `await dibujarMaterias()`, `evento.target.reset()` y `mostrarAviso('Materia agregada')`.
  //   4. Borra la línea de `avisarPendiente` de abajo.
  avisarPendiente('Agregar una materia')
}

/**
 * Se ejecuta al hacer clic en "Editar" o "Eliminar" de una materia.
 * @param {MouseEvent} evento Evento de clic.
 * @returns {void}
 */
function alPulsarEnMateria(evento) {
  const boton = evento.target.closest('[data-accion]')
  if (!boton) return
  // TODO(equipo): editar y eliminar materias. Id de la materia: `Number(boton.dataset.id)`.
  //   - Editar: `actualizarMateria(id, { name, code })`.
  //   - Eliminar: ANTES revisa si tiene tareas (`listarTareasPorMateria(id)`); si tiene, avisa y no borres.
  //     Si no tiene, pide confirmación y usa `eliminarMateria(id)`. Luego `await dibujarMaterias()`.
  avisarPendiente(boton.dataset.accion === 'editar' ? 'Editar una materia' : 'Eliminar una materia')
}
