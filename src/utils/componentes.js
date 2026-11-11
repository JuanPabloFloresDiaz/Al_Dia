/**
 * Sistema de componentes HTML reutilizables.
 *
 * Problema que resuelve: sin esto, el menú y el pie de página tendrían que copiarse en cada página.
 * Con esto se escriben UNA vez en `src/components/*.html` y cada página solo dice dónde van:
 *
 *     <div data-componente="navbar" data-activo="tareas"></div>
 *
 * Funciona así: busca todos los elementos con `data-componente="nombre"`, trae el archivo
 * `src/components/nombre.html` y lo pone en su lugar. Los atributos `data-*` se pueden usar
 * dentro del componente escribiendo `{{nombre}}`. Ej.: `data-activo="tareas"` -> `{{activo}}`.
 *
 * Para crear un componente nuevo basta con añadir `src/components/mi-componente.html`.
 */

/** Todos los componentes .html, cargados como texto al compilar (no hace falta registrarlos). */
const archivos = import.meta.glob('../components/*.html', { query: '?raw', import: 'default', eager: true })

/** Diccionario { nombre: contenidoHtml }, p. ej. { navbar: '<header>...' }. */
const componentes = Object.fromEntries(
  Object.entries(archivos).map(([ruta, contenido]) => [ruta.split('/').pop().replace('.html', ''), contenido]),
)

/**
 * Reemplaza los `{{clave}}` de un componente por los valores de los atributos `data-*`.
 * @param {string} plantilla HTML del componente.
 * @param {DOMStringMap} datos `dataset` del elemento marcador.
 * @returns {string} HTML ya completo.
 */
function rellenar(plantilla, datos) {
  return plantilla.replace(/\{\{(\w+)\}\}/g, (_, clave) => datos[clave] ?? '')
}

/**
 * Monta todos los componentes de la página actual. Se llama desde `iniciarPagina()` (src/main.js).
 * @param {ParentNode} [raiz=document] Zona donde buscar marcadores (por defecto, toda la página).
 * @returns {void}
 */
export function montarComponentes(raiz = document) {
  raiz.querySelectorAll('[data-componente]').forEach((marcador) => {
    const nombre = marcador.dataset.componente
    const plantilla = componentes[nombre]
    if (!plantilla) {
      console.warn(`[componentes] No existe src/components/${nombre}.html`)
      return
    }
    marcador.outerHTML = rellenar(plantilla, marcador.dataset)
  })
}
