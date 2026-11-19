/**
 * Controlador de la página "Ajustes" (ajustes.html).
 *
 * Carga, persiste y gestiona respaldos de los ajustes y datos locales.
 */
import { iniciarPagina, aplicarTema } from "../main.js";
import { obtenerAjustes, guardarAjustes } from "../services/ajustes.service.js";
import {
  exportarDatos,
  restaurarDatosIniciales,
} from "../services/datos.service.js";
import { mostrarAviso } from "../utils/utils.js";

await iniciarPagina();

const formulario = document.getElementById("form-ajustes");
const ajustes = await obtenerAjustes();

formulario.elements.theme.value = ajustes.theme;
formulario.elements.notificationsEnabled.checked = ajustes.notificationsEnabled;

formulario.addEventListener("submit", alGuardarAjustes);
// Vista previa: el tema cambia apenas el usuario lo elige (todavía NO se guarda hasta pulsar el botón).
formulario.elements.theme.forEach((opcion) =>
  opcion.addEventListener("change", () => aplicarTema(opcion.value)),
);
document
  .getElementById("btn-exportar")
  .addEventListener("click", alExportarDatos);
document
  .getElementById("btn-restablecer")
  .addEventListener("click", alRestablecerDatos);

/**
 * Se ejecuta al enviar el formulario "Guardar ajustes".
 * @param {SubmitEvent} evento Evento del formulario.
 * @returns {Promise<void>}
 */
async function alGuardarAjustes(evento) {
  evento.preventDefault();
  const cambios = {
    theme: formulario.elements.theme.value,
    notificationsEnabled: formulario.elements.notificationsEnabled.checked,
  };
  try {
    const guardados = await guardarAjustes(cambios);
    aplicarTema(guardados.theme);
    document.getElementById("ajustes-estado").textContent =
      "Ajustes guardados.";
  } catch (error) {
    console.error("[ajustes] No se pudieron guardar los ajustes", error);
    mostrarAviso("No se pudieron guardar los ajustes.", "error");
  }
}

/**
 * Se ejecuta al pulsar "Descargar copia de mis datos".
 * @returns {Promise<void>}
 */
async function alExportarDatos() {
  try {
    const datos = await exportarDatos();
    const blob = new Blob([JSON.stringify(datos, null, 2)], {
      type: "application/json",
    });
    const enlace = document.createElement("a");
    const fecha = new Date()
      .toISOString()
      .replaceAll(":", "-")
      .replace(/\.\d{3}Z$/, "Z");
    enlace.href = URL.createObjectURL(blob);
    enlace.download = `al-dia-respaldo-${fecha}.json`;
    enlace.click();
    URL.revokeObjectURL(enlace.href);
    mostrarAviso("Copia de tus datos descargada.");
  } catch (error) {
    console.error("[ajustes] No se pudieron exportar los datos", error);
    mostrarAviso("No se pudieron exportar los datos.", "error");
  }
}

/**
 * Se ejecuta al pulsar "Restablecer datos de ejemplo".
 * @returns {Promise<void>}
 */
async function alRestablecerDatos() {
  if (
    !confirm(
      "Se borrarán tus datos actuales y se cargarán los datos de ejemplo. ¿Continuar?",
    )
  )
    return;
  try {
    await restaurarDatosIniciales();
    window.location.reload();
  } catch (error) {
    console.error("[ajustes] No se pudieron restablecer los datos", error);
    mostrarAviso("No se pudieron restablecer los datos.", "error");
  }
}
