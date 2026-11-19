/**
 * Elementos reutilizables para búsquedas y filtros.
 *
 * El componente solo conoce el DOM y emite cambios; la decisión de qué
 * resultados mostrar pertenece a cada controlador.
 */

/**
 * Conecta un campo de búsqueda con una función de cambios.
 * @param {HTMLInputElement} input Campo de búsqueda.
 * @param {(value: string, event: Event) => void} alCambiar Callback de cambios.
 * @returns {() => void} Función para desconectar el listener.
 */
export function conectarSearchFilter(input, alCambiar) {
  const manejarCambio = (evento) => alCambiar(input.value.trim(), evento);
  input.addEventListener("input", manejarCambio);
  return () => input.removeEventListener("input", manejarCambio);
}

/**
 * Crea el marcado accesible de un campo de búsqueda.
 * @param {{id: string, label?: string, placeholder?: string}} opciones Configuración visual.
 * @returns {HTMLDivElement} Contenedor listo para insertar en la vista.
 */
export function crearSearchFilter({
  id,
  label = "Buscar",
  placeholder = "Buscar…",
}) {
  const campo = document.createElement("div");
  campo.className = "campo";
  campo.innerHTML = `
    <label for="${id}">${label}</label>
    <input class="entrada" id="${id}" type="search" placeholder="${placeholder}" autocomplete="off" />
  `;
  return campo;
}
