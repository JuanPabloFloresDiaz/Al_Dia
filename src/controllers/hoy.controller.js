/**
 * Controlador de la página "Hoy" (index.html).
 *
 * Qué hace: lee las tareas y las materias, y dibuja el resumen del día, la semana
 * (lunes a domingo), las tareas atrasadas y las que vienen.
 *
 *Al abrir el sitio muestra una vez por sesión el aviso con el resumen de la semana.
 */
import { iniciarPagina } from '../main.js'
import { listarTareas } from '../services/tareas.service.js'
import { listarMaterias } from '../services/materias.service.js'
import { obtenerAjustes } from '../services/ajustes.service.js'
import { filaTarea } from '../components/fila-tarea.js'
import {
  ahora,
  calcularUrgencia,
  capitalizar,
  diasDeLaSemana,
  diasRestantes,
  escaparHtml,
  esMismoDia,
  formatearFecha,
  mostrarAviso,
  NIVELES_URGENCIA,
  pluralizar,
  textoVencimiento,
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
mostrarResumenSemanal()
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
                    const color = NIVELES_URGENCIA[calcularUrgencia(t.dueDate)].color
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

/**
 * Muestra UNA vez por sesión un aviso con el resumen de la semana (objetivo 5 del PDF).
 * Solo sale si el usuario tiene los avisos activados en Ajustes y hay algo que avisar.
 * @returns {void}
 */
function mostrarResumenSemanal() {
  console.log('[resumen]', {
  avisosActivados: ajustes.notificationsEnabled,
  entregasSemana: entregasDeLaSemana.length,
  atrasadas: atrasadas.length,
  yaMostrado: sessionStorage.getItem('resumen-mostrado'),
})
  if (!ajustes.notificationsEnabled) return
  if (!entregasDeLaSemana.length && !atrasadas.length) return

  // sessionStorage recuerda datos solo mientras la pestaña esté abierta: al cerrarla se borra.
  // Así el resumen sale al abrir el sitio, pero no cada vez que se vuelve a "Hoy".
  try {
    if (sessionStorage.getItem('resumen-mostrado')) return
    sessionStorage.setItem('resumen-mostrado', 'si')
  } catch {
    // Si el navegador bloquea sessionStorage, el resumen se muestra igual (solo que podría repetirse).
  }

  const partes = []
  if (entregasDeLaSemana.length) partes.push(pluralizar(entregasDeLaSemana.length, 'entrega', 'entregas'))
  if (atrasadas.length) partes.push(`${pluralizar(atrasadas.length, 'tarea atrasada', 'tareas atrasadas')}`)

  let texto = `Resumen de la semana: ${partes.join(' y ')}.`

  if (proximas.length > 0) {
  texto += ` La próxima: ${proximas[0].title} (${textoVencimiento(proximas[0].dueDate).toLowerCase()}).`
}

  mostrarAviso(texto, 'info', { fijo: true })
}
