/**
 * Punto de entrada común: lo que TODAS las páginas necesitan antes de mostrar su contenido.
 *
 * Cada controlador (src/controllers/*.controller.js) empieza llamando a `iniciarPagina()`.
 * Así el menú, el tema y la base de datos se preparan igual en todo el sitio.
 */
import "./styles/main.css";
import { montarComponentes } from "./utils/componentes.js";
import { abrirBaseDeDatos } from "./db/db.js";
import { obtenerAjustes } from "./services/ajustes.service.js";
import { iniciarCampana } from "./components/campana.js";

/**
 * Aplica el tema visual a toda la página.
 * @param {'light'|'dark'} tema Tema a mostrar.
 * @returns {void}
 */
export function aplicarTema(tema) {
  document.documentElement.dataset.theme = tema === "dark" ? "dark" : "light";
}

/**
 * Marca en el menú el enlace de la página actual (lo indica `data-activo` del componente navbar).
 * @returns {void}
 */
function marcarPaginaActiva() {
  const menu = document.querySelector("nav[data-activo]");
  menu
    ?.querySelector(`[data-pagina="${menu.dataset.activo}"]`)
    ?.setAttribute("aria-current", "page");
}

/**
 * Prepara la página: monta los componentes (menú, pie), abre IndexedDB y aplica el tema guardado.
 * Hay que esperarla con `await` antes de leer datos.
 *
 * @returns {Promise<void>}
 */
export async function iniciarPagina() {
  montarComponentes();
  marcarPaginaActiva();
  await abrirBaseDeDatos();
  const ajustes = await obtenerAjustes();
  aplicarTema(ajustes.theme);
  // Un fallo en los avisos no debe impedir que la página cargue.
  iniciarCampana().catch((error) => console.error("[avisos]", error));
  ocultarCargadorPagina();
}

/**
 * Oculta suavemente el loader inicial después de preparar datos y tema.
 * @returns {void}
 */
function ocultarCargadorPagina() {
  const cargador = document.getElementById("cargador-pagina");
  if (!cargador) return;
  requestAnimationFrame(() => {
    cargador.classList.add("saliendo");
    window.setTimeout(() => cargador.remove(), 300);
  });
}
