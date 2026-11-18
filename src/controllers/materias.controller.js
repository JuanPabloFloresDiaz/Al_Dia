/**
 * Controlador de la página "Materias" (materias.html).
 * Lista las materias con cuántas tareas tiene cada una, y permite crearlas, editarlas y eliminarlas.
 */
import { iniciarPagina } from '../main.js'
import { listarMaterias, crearMateria, actualizarMateria, eliminarMateria } from '../services/materias.service.js'
import { listarTareas, listarTareasPorMateria } from '../services/tareas.service.js'
import { escaparHtml, mostrarAviso, pluralizar } from '../utils/utils.js'

await iniciarPagina()

/** Materias tal como se dibujaron la última vez (las usan la edición y la validación). */
let materias = []

await dibujarMaterias()
document.getElementById('form-materia').addEventListener('submit', alAgregarMateria)
document.getElementById('lista-materias').addEventListener('click', alPulsarEnMateria)

/**
 * Dibuja la lista de materias. Se vuelve a llamar después de crear, editar o borrar una.
 * @returns {Promise<void>}
 */
async function dibujarMaterias() {
  const [lista, tareas] = await Promise.all([listarMaterias(), listarTareas()])
  materias = lista
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
 * Revisa que el nombre y el código de una materia sean válidos. La usan crear y editar.
 * @param {string} name Nombre, ya sin espacios al inicio ni al final.
 * @param {string} code Código, ya en mayúsculas y sin espacios.
 * @param {number} [idExcluir] Id de la materia que se está editando (para no compararla consigo misma).
 * @returns {string} El motivo del error, o '' si todo está bien.
 */
function validarMateria(name, code, idExcluir) {
  if (!name) return 'Escribe el nombre de la materia.'
  if (!/^[A-Z]{2,8}$/.test(code)) return 'El código debe tener de 2 a 8 letras, sin espacios ni tildes.'
  if (materias.some((m) => m.code === code && m.id !== idExcluir)) return `Ya existe una materia con el código ${code}.`
  return ''
}

/**
 * Se ejecuta al enviar el formulario "Nueva materia".
 * @param {SubmitEvent} evento Evento del formulario.
 * @returns {Promise<void>}
 */
async function alAgregarMateria(evento) {
  evento.preventDefault()
  const name = document.getElementById('materia-nombre').value.trim()
  const code = document.getElementById('materia-codigo').value.trim().toUpperCase()
  const error = document.getElementById('error-materia')

  const motivo = validarMateria(name, code)
  error.textContent = motivo
  error.hidden = !motivo
  if (motivo) return

  await crearMateria({ name, code })
  await dibujarMaterias()
  evento.target.reset()
  mostrarAviso('Materia agregada')
}

/**
 * Se ejecuta al hacer clic en los botones de una materia: Editar y Eliminar,
 * y en modo edición Guardar y Cancelar.
 * @param {MouseEvent} evento Evento de clic.
 * @returns {Promise<void>}
 */
async function alPulsarEnMateria(evento) {
  const boton = evento.target.closest('[data-accion]')
  if (!boton) return
  const id = Number(boton.dataset.id)
  const fila = boton.closest('li')
  const accion = boton.dataset.accion

  if (accion === 'editar') {
    const materia = materias.find((m) => m.id === id)
    fila.outerHTML = filaMateriaEnEdicion(materia)
  } else if (accion === 'cancelar') {
    await dibujarMaterias()
  } else if (accion === 'guardar') {
    const name = fila.querySelector('[name="nombre"]').value.trim()
    const code = fila.querySelector('[name="codigo"]').value.trim().toUpperCase()
    const motivo = validarMateria(name, code, id)
    if (motivo) return mostrarAviso(motivo, 'error')

    await actualizarMateria(id, { name, code })
    await dibujarMaterias()
    mostrarAviso('Materia actualizada')
  } else if (accion === 'eliminar') {
    const tareas = await listarTareasPorMateria(id)
    if (tareas.length > 0) return mostrarAviso(`No se puede eliminar: tiene ${pluralizar(tareas.length, 'tarea', 'tareas')}.`, 'error')

    if (!confirm('¿Eliminar esta materia?')) return
    await eliminarMateria(id)
    await dibujarMaterias()
    mostrarAviso('Materia eliminada')
  }
}

/**
 * HTML de una materia en modo edición: nombre y código editables, con Guardar y Cancelar.
 * @param {import('../services/materias.service.js').Materia} materia Materia a editar.
 * @returns {string} HTML de la fila.
 */
function filaMateriaEnEdicion(materia) {
  return `
    <li class="grid gap-2 border-b border-linea py-4 sm:grid-cols-[1fr_8rem_auto] sm:items-center">
      <input class="entrada" name="nombre" value="${escaparHtml(materia.name)}" maxlength="80" aria-label="Nombre de la materia" />
      <input class="entrada" name="codigo" value="${escaparHtml(materia.code)}" maxlength="8" aria-label="Código corto" />
      <div class="flex gap-2">
        <button type="button" class="btn !min-h-9 !px-3 !text-sm" data-accion="guardar" data-id="${materia.id}">Guardar</button>
        <button type="button" class="btn-secundario !min-h-9 !px-3 !text-sm" data-accion="cancelar" data-id="${materia.id}">Cancelar</button>
      </div>
    </li>`
}
