/**
 * Controlador de la página "Tareas" (tareas.html): lista completa de tareas.
 *
 * ESTADO: la lista se dibuja completa (solo lectura). PENDIENTE para el equipo: los filtros.
 */
import { iniciarPagina } from '../main.js'
import { listarTareas } from '../services/tareas.service.js'
import { listarMaterias } from '../services/materias.service.js'
import { filaTarea } from '../components/fila-tarea.js'
import { avisarPendiente, escaparHtml, pluralizar } from '../utils/utils.js'

await iniciarPagina()

const [tareas, materias] = await Promise.all([listarTareas(), listarMaterias()])
const materiaPorId = Object.fromEntries(materias.map((m) => [m.id, m]))

llenarSelectorDeMaterias()
dibujarTareas(tareas)
document.getElementById('form-filtros').addEventListener('input', alCambiarFiltros)
document.getElementById('form-filtros').addEventListener('submit', (e) => e.preventDefault())

/**
 * Llena el desplegable "Materia" de los filtros con las materias de la base de datos.
 * @returns {void}
 */
function llenarSelectorDeMaterias() {
  const selector = document.getElementById('filtro-materia')
  selector.insertAdjacentHTML(
    'beforeend',
    materias.map((m) => `<option value="${m.id}">${escaparHtml(m.name)}</option>`).join(''),
  )
}

/**
 * Dibuja una lista de tareas y actualiza el contador ("4 tareas"). Si la lista está vacía, muestra el mensaje de vacío.
 * @param {import('../services/tareas.service.js').Tarea[]} lista Tareas a mostrar.
 * @returns {void}
 */
function dibujarTareas(lista) {
  document.getElementById('lista-tareas').innerHTML = lista.map((t) => filaTarea(t, materiaPorId[t.subjectId])).join('')
  document.getElementById('vacio-tareas').hidden = lista.length > 0
  document.getElementById('tareas-contador').textContent = pluralizar(lista.length, 'tarea', 'tareas')
}

/**
 * Se ejecuta cada vez que el usuario escribe o cambia un filtro.
 * @returns {void}
 */
function alCambiarFiltros() {
  // TODO(equipo): filtrar `tareas` y llamar a `dibujarTareas(filtradas)`.
  //   1. Lee los valores: #filtro-texto, #filtro-materia, #filtro-tipo y #filtro-estado.
  //   2. Texto: el título contiene lo escrito (sin importar mayúsculas). Materia: `t.subjectId`. Tipo: `t.type`.
  //   3. Estado: "pendientes" (progress < 100), "atrasadas" (pendiente y `diasRestantes(t.dueDate) < 0`),
  //      "terminadas" (progress === 100). Los filtros se combinan (deben cumplirse todos).
  //   4. Borra la línea de `avisarPendiente` de abajo.
  avisarPendiente('Filtros de tareas')
}
