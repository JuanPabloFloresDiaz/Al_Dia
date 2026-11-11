# Al Día

Gestor de tareas académicas. Proyecto de **Diseño y Desarrollo de Sitios Web** (UFG, ciclo II-2026).
Integrantes: Herbert Ayala, Juan Pablo Flores y Guillermo Menjívar. El documento del proyecto está en [`docs/Proyecto_Al_Dia_DDW.pdf`](docs/Proyecto_Al_Dia_DDW.pdf).

Tecnologías: HTML, CSS (Tailwind), JavaScript, **IndexedDB con Dexie.js**, **Day.js** y **Vite**. No hay servidor ni base de datos externa: todo se guarda en el navegador.

## Cómo ejecutarlo

### Con Docker (lo más fácil)

```bash
docker compose up -d --build            # sitio compilado  -> http://localhost:8085
docker compose --profile dev up desarrollo   # para programar -> http://localhost:5173 (se recarga al guardar)
docker compose down                     # apagar
```

Si el puerto está ocupado: `WEB_PORT=9000 docker compose up -d --build`.

### Sin Docker (necesitas Node 22.12 o superior; el contenedor usa Node 24)

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # genera la carpeta dist/
```

## Dónde está cada cosa

```
*.html                    Las páginas (una por pantalla). Solo estructura; sin lógica.
src/
  main.js                 Lo que toda página necesita al abrir (menú, tema, base de datos).
  controllers/            Un JavaScript por página: lee datos, los dibuja y atiende los clics.
  services/               ÚNICA capa que habla con IndexedDB (materias, tareas, pasos, ajustes).
  db/db.js                Configuración de IndexedDB y datos de ejemplo.
  components/             Piezas reutilizables: menú, pie (.html) y filas de tarea/paso (.js).
  utils/utils.js          Funciones compartidas (fechas con Day.js, urgencia, progreso, escapar HTML, avisos).
  utils/componentes.js    El motor que pone los componentes .html en cada página.
  styles/main.css         Colores, tipografía y estilos de botones, campos, chips y filas.
docs/                     PDF del proyecto y esquema original de la base de datos.
```

El flujo de una pantalla: **página `.html`** (estructura) → **controlador** (`src/controllers`) → **servicio** (`src/services`) → **IndexedDB** (`src/db/db.js`). Un controlador nunca usa `db` directamente.

## Qué está hecho y qué falta

Hecho: estructura, diseño de todas las pantallas (computadora, celular y tema oscuro), IndexedDB configurada con datos de ejemplo, capa de servicios completa, y las pantallas **muestran** los datos reales.

Falta (la lógica de cada pantalla). Cada punto está marcado en el código como `TODO(equipo)` con los pasos a seguir; búscalo con `Ctrl+Shift+F`.

| Archivo | Qué hay que programar |
|---|---|
| `controllers/tarea-nueva.controller.js` | Dividir una tarea en partes con fechas repartidas; validar y guardar tarea con sus pasos |
| `controllers/tarea.controller.js` | Marcar pasos (y recalcular el avance), agregar/editar pasos, editar y eliminar la tarea |
| `controllers/tareas.controller.js` | Filtros (texto, materia, tipo, estado) |
| `controllers/materias.controller.js` | Crear, editar y eliminar materias |
| `controllers/ajustes.controller.js` | Guardar ajustes, descargar copia de los datos, restablecer datos de ejemplo |
| `controllers/hoy.controller.js` | Aviso con el resumen de la semana al abrir el sitio |

Mientras una función esté pendiente, al usarla aparece el aviso «Pendiente de programar: …». Al terminar cada una, **borra la línea `avisarPendiente(...)`**.

## Reglas del equipo

1. **Comentarios en español, en cada función**, con el formato de este proyecto (JSDoc: qué hace, `@param`, `@returns`). Mira cualquier archivo de `src/services/` como modelo.
2. **Texto que escribe el usuario → `escaparHtml()`** antes de ponerlo en `innerHTML`. Si no, se puede inyectar código en el sitio.
3. **Fechas siempre con las funciones de `utils.js`** (usan Day.js). En la base se guardan como texto ISO en UTC.
4. Si algo lo usas en más de un archivo, va en `utils/utils.js`.
5. **Cambiar el esquema de IndexedDB**: no edites la versión 1; agrega `db.version(2).stores({...})` en `db/db.js` para no romper los datos que ya tienen los demás en su navegador.
6. Para ver los datos guardados: DevTools (F12) → pestaña *Application* → *IndexedDB* → `AlDiaDatabase`. Para empezar de cero, borra esa base y recarga.
7. Trabajen en ramas por funcionalidad (por ejemplo `feat/filtros-tareas`) y fusionen a `main` con Pull Request.

## Diseño

La interfaz evita a propósito la estética genérica de páginas «generadas con IA»:

- **Tipografía:** Bricolage Grotesque (títulos) y Atkinson Hyperlegible (texto, pensada para leer bien). Nada de Inter ni de sistema.
- **Color:** azul cobalto como acento y amarillo resaltador solo para marcar «hoy» y la página actual. Sin degradados morados ni tarjetas grises idénticas.
- **Estructura:** las tareas son filas separadas por líneas (no tarjetas iguales), y el borde de color indica la urgencia. El estado también se escribe con palabras, no solo con color.
- **Movimiento:** una sola animación al abrir «Hoy»; se desactiva si el sistema pide reducir movimiento.
- **Cambiar colores o fuentes:** todo está al inicio de `src/styles/main.css`.

Referencias usadas: la guía `frontend-design` de Anthropic y el proyecto de código abierto *Impeccable* (lista de patrones a evitar).
