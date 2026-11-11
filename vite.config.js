/**
 * Configuración de Vite (servidor de desarrollo y empaquetado final).
 *
 * El sitio es de VARIAS PÁGINAS (index.html, tareas.html, ...). Vite las detecta solo:
 * cualquier archivo .html que pongas en la RAÍZ del proyecto se incluye en el build.
 * No hace falta registrar páginas nuevas aquí.
 */
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import { readdirSync } from 'node:fs'
import { resolve } from 'node:path'

/** Todas las páginas .html de la raíz, en el formato que espera el empaquetador. */
const paginas = Object.fromEntries(
  readdirSync(import.meta.dirname)
    .filter((archivo) => archivo.endsWith('.html'))
    .map((archivo) => [archivo.replace('.html', ''), resolve(import.meta.dirname, archivo)]),
)

export default defineConfig({
  plugins: [tailwindcss()],
  server: {
    host: true,
    port: 5173,
    // Dentro de Docker (sobre todo en Windows) los cambios de archivos no siempre se detectan:
    // con VITE_USE_POLLING=true Vite revisa los archivos periódicamente.
    watch: { usePolling: process.env.VITE_USE_POLLING === 'true' },
  },
  build: {
    rollupOptions: { input: paginas },
  },
})
