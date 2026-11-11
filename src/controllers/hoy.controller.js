/**
 * Controlador de la página "Hoy" (index.html).
 *
 * Qué hace: lee las tareas y las materias, y dibuja el resumen del día, la semana
 * (lunes a domingo), las tareas atrasadas y las que vienen.
 *
 * ESTADO: terminado (solo lectura). Pendiente para el equipo: el aviso emergente de
 * "resumen de la semana" al abrir el sitio (ver TODO al final).
 */
import { iniciarPagina } from '../main.js'
import { listarTareas } from '../services/tareas.service.js'
import { listarMaterias } from '../services/materias.service.js'
import { obtenerAjustes } from '../services/ajustes.service.js'
import { filaTarea } from '../components/fila-tarea.js'
import {
  ahora,
  aFecha,
  capitalizar,
  diasDeLaSemana,
  diasRestantes,
  escaparHtml,
  esMismoDia,
  formatearFecha,
  NIVELES_URGENCIA,
  pluralizar,
} from '../utils/utils.js'

await iniciarPagina()

const [tareas, materias, ajustes] = await Promise.all([listarTareas(), listarMaterias(), obtenerAjustes()])
/** Diccionario { idMateria: materia } para encontrar la materia de cada tarea rápido. */
const materiaPorId = Object.fromEntries(materias.map((m) => [m.id, m]))

const pendientes = tareas.filter((t) => t.progress < 100)
const atrasadas = pendientes.filter((t) => diasRestantes(t.dueDate) < 0)
const semana = diasDeLaSemana()
const entregasDeLaSemana = pendientes.filter(
  (t) => diasRestantes(t.dueDate) >= 0 && semana.some((dia) => esMismoDia(dia, t.dueDate)),
)
const proximas = pendientes.filter((t) => diasRestantes(t.dueDate) >= 0)

dibujarCabecera()
dibujarSemana()
dibujarLista('lista-atrasadas', atrasadas)
document.getElementById('seccion-atrasadas').hidden = atrasadas.length === 0
dibujarLista('lista-proximas', proximas)
document.getElementById('vacio-proximas').hidden = proximas.length > 0

/**
 * Escribe la fecha de hoy como título y una frase que resume cómo vas.
 * @returns {void}
 */
function dibujarCabecera() {
  document.getElementById('hoy-titulo').textContent = capitalizar(formatearFecha(ahora(), 'dddd D [de] MMMM'))
  const resumen = document.getElementById('hoy-resumen')
  if (!entregasDeLaSemana.length && !atrasadas.length) {
    resumen.textContent = 'Estás al día. No tienes entregas esta semana.'
    return
  }
  const partes = []
  if (entregasDeLaSemana.length) partes.push(`${pluralizar(entregasDeLaSemana.length, 'entrega', 'entregas')} esta semana`)
  if (atrasadas.length) partes.push(`${pluralizar(atrasadas.length, 'tarea atrasada', 'tareas atrasadas')}`)
  resumen.textContent = `Tienes ${partes.join(' y ')}.`
}

/**
 * Dibuja los 7 días de la semana, cada uno con las tareas que se entregan ese día.
 * El día de hoy lleva la clase `es-hoy` (se marca con resaltador).
 * @returns {void}
 */
function dibujarSemana() {
  document.getElementById('semana').innerHTML = semana
    .map((dia) => {
      const delDia = tareas.filter((t) => esMismoDia(dia, t.dueDate))
      return `
        <div class="dia-semana ${esMismoDia(dia, ahora()) ? 'es-hoy' : ''}">
          <div>
            <p class="meta">${capitalizar(dia.format('ddd'))}</p>
            <p class="dia-numero">${dia.format('D')}</p>
          </div>
          ${
            delDia.length
              ? delDia
                  .map((t) => {
                    const color = (NIVELES_URGENCIA[t.urgencyLevel] ?? NIVELES_URGENCIA.low).color
                    return `<a class="dia-tarea urgencia-${color}" href="/tarea.html?id=${t.id}">${escaparHtml(t.title)}</a>`
                  })
                  .join('')
              : '<p class="meta">Sin entregas</p>'
          }
        </div>`
    })
    .join('')
}

/**
 * Dibuja una lista de filas de tarea dentro de un contenedor.
 * @param {string} idContenedor Id del elemento donde se dibuja.
 * @param {import('../services/tareas.service.js').Tarea[]} lista Tareas a mostrar.
 * @returns {void}
 */
function dibujarLista(idContenedor, lista) {
  document.getElementById(idContenedor).innerHTML = lista.map((t) => filaTarea(t, materiaPorId[t.subjectId])).join('')
}

// TODO(equipo): aviso de "resumen de la semana" al abrir el sitio (objetivo 5 del PDF).
//   1. Si `ajustes.notificationsEnabled` es true y hay entregas esta semana o tareas atrasadas,
//      mostrar el resumen UNA vez por sesión (puedes guardar una marca en sessionStorage).
//   2. Usa `mostrarAviso(texto)` de utils.js, o crea un componente nuevo en src/components/.
//   Las variables `entregasDeLaSemana`, `atrasadas` y `ajustes` de este archivo ya tienen lo necesario.
void ajustes // (quita esta línea cuando uses `ajustes`)
void aFecha // (quita esta línea cuando uses `aFecha`)
