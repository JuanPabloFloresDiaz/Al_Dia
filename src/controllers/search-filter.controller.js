/**
 * Reglas de filtrado compartidas por las vistas que muestran tareas o materias.
 *
 * Este módulo es deliberadamente independiente del DOM y de IndexedDB. Así cada
 * controlador puede combinar criterios nuevos sin modificar el núcleo de filtro.
 */
import { diasRestantes } from "../utils/utils.js";

/**
 * Normaliza texto para búsquedas tolerantes a mayúsculas y tildes.
 * @param {unknown} valor Texto a normalizar.
 * @returns {string} Texto normalizado.
 */
export function normalizarTexto(valor) {
  return String(valor ?? "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

/**
 * Filtra tareas por título y materia asociada.
 * @param {import('../services/tareas.service.js').Tarea[]} tareas Tareas originales.
 * @param {Map<number, import('../services/materias.service.js').Materia>|Record<number, import('../services/materias.service.js').Materia>} materias Materias por id.
 * @param {string} texto Texto buscado.
 * @returns {import('../services/tareas.service.js').Tarea[]} Tareas coincidentes.
 */
export function filtrarTareasPorTexto(tareas, materias, texto) {
  const busqueda = normalizarTexto(texto);
  if (!busqueda) return tareas;
  return tareas.filter((tarea) => {
    const materia =
      materias instanceof Map
        ? materias.get(tarea.subjectId)
        : materias[tarea.subjectId];
    return [tarea.title, materia?.name, materia?.code].some((valor) =>
      normalizarTexto(valor).includes(busqueda),
    );
  });
}

/**
 * Aplica todos los filtros activos de la vista Tareas usando AND.
 * @param {import('../services/tareas.service.js').Tarea[]} tareas Tareas originales.
 * @param {{texto?: string, materiaId?: string, tipo?: string, estado?: string}} filtros Criterios activos.
 * @returns {import('../services/tareas.service.js').Tarea[]} Tareas que cumplen todos los criterios.
 */
export function filtrarTareas(tareas, filtros) {
  const texto = normalizarTexto(filtros.texto);
  return tareas.filter((tarea) => {
    const coincideTexto =
      !texto || normalizarTexto(tarea.title).includes(texto);
    const coincideMateria =
      !filtros.materiaId || tarea.subjectId === Number(filtros.materiaId);
    const coincideTipo = !filtros.tipo || tarea.type === filtros.tipo;
    const pendiente = tarea.progress < 100;
    const coincideEstado =
      !filtros.estado ||
      (filtros.estado === "pendientes" && pendiente) ||
      (filtros.estado === "atrasadas" &&
        pendiente &&
        diasRestantes(tarea.dueDate) < 0) ||
      (filtros.estado === "terminadas" && tarea.progress === 100);
    return coincideTexto && coincideMateria && coincideTipo && coincideEstado;
  });
}

/**
 * Filtra materias por nombre o código.
 * @param {import('../services/materias.service.js').Materia[]} materias Materias originales.
 * @param {string} texto Texto buscado.
 * @returns {import('../services/materias.service.js').Materia[]} Materias coincidentes.
 */
export function filtrarMaterias(materias, texto) {
  const busqueda = normalizarTexto(texto);
  if (!busqueda) return materias;
  return materias.filter((materia) =>
    [materia.name, materia.code].some((valor) =>
      normalizarTexto(valor).includes(busqueda),
    ),
  );
}
