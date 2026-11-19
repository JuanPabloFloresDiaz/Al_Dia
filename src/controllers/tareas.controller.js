/**
 * Controlador de la página "Tareas" (tareas.html): lista completa de tareas.
 *
 * La lista se actualiza al cambiar cualquiera de los filtros disponibles.
 */
import { iniciarPagina } from "../main.js";
import { listarTareas } from "../services/tareas.service.js";
import { listarMaterias } from "../services/materias.service.js";
import { filaTarea } from "../components/fila-tarea.js";
import { escaparHtml, pluralizar } from "../utils/utils.js";
import { filtrarTareas } from "./search-filter.controller.js";

await iniciarPagina();

const [tareas, materias] = await Promise.all([
  listarTareas(),
  listarMaterias(),
]);
const materiaPorId = Object.fromEntries(materias.map((m) => [m.id, m]));

llenarSelectorDeMaterias();
dibujarTareas(tareas);
document
  .getElementById("form-filtros")
  .addEventListener("input", alCambiarFiltros);
document
  .getElementById("form-filtros")
  .addEventListener("submit", (e) => e.preventDefault());

/**
 * Llena el desplegable "Materia" de los filtros con las materias de la base de datos.
 * @returns {void}
 */
function llenarSelectorDeMaterias() {
  const selector = document.getElementById("filtro-materia");
  selector.insertAdjacentHTML(
    "beforeend",
    materias
      .map((m) => `<option value="${m.id}">${escaparHtml(m.name)}</option>`)
      .join(""),
  );
}

/**
 * Dibuja una lista de tareas y actualiza el contador ("4 tareas"). Si la lista está vacía, muestra el mensaje de vacío.
 * @param {import('../services/tareas.service.js').Tarea[]} lista Tareas a mostrar.
 * @returns {void}
 */
function dibujarTareas(lista) {
  document.getElementById("lista-tareas").innerHTML = lista
    .map((t) => filaTarea(t, materiaPorId[t.subjectId]))
    .join("");
  document.getElementById("vacio-tareas").hidden = lista.length > 0;
  document.getElementById("tareas-contador").textContent = pluralizar(
    lista.length,
    "tarea",
    "tareas",
  );
}

/**
 * Se ejecuta cada vez que el usuario escribe o cambia un filtro.
 * @returns {void}
 */
function alCambiarFiltros() {
  const filtros = {
    texto: document.getElementById("filtro-texto").value,
    materiaId: document.getElementById("filtro-materia").value,
    tipo: document.getElementById("filtro-tipo").value,
    estado: document.getElementById("filtro-estado").value,
  };
  dibujarTareas(filtrarTareas(tareas, filtros));
}
