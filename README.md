# Al Día

Al Día es un gestor inteligente de tareas académicas desarrollado para la asignatura
**Diseño y Desarrollo de Sitios Web** de la Universidad Francisco Gavidia,
correspondiente al ciclo II-2026.

La aplicación permite organizar materias, crear y administrar tareas, dividir el
trabajo en pasos, consultar vencimientos y recibir avisos. Toda la información se
guarda localmente en el navegador mediante IndexedDB; no requiere cuentas ni servidor.

**Integrantes:** Herbert Ayala, Juan Pablo Flores y Guillermo Menjívar.

## Tecnologías

- HTML5
- CSS3 con Tailwind CSS
- JavaScript con ES Modules
- Vite
- IndexedDB con Dexie.js
- Day.js
- Docker y nginx

## Funcionalidades

- Resumen diario y semanal de entregas.
- Consulta de tareas atrasadas y próximas.
- Creación, edición y eliminación de tareas.
- Gestión de materias con nombre y código.
- División de una tarea en pasos mediante fechas sugeridas.
- Registro, edición y eliminación del checklist de una tarea.
- Cálculo automático del avance según los pasos completados.
- Niveles de urgencia calculados a partir de la fecha de entrega.
- Filtro combinado de tareas por texto, materia, tipo y estado.
- Búsqueda de tareas por título o materia en la página principal.
- Búsqueda de materias por nombre o código.
- Avisos dentro de la aplicación y avisos del sistema cuando el navegador lo permite.
- Tema claro y oscuro.
- Exportación completa de los datos locales en formato JSON.
- Restablecimiento de materias, tareas, pasos y ajustes a los datos de ejemplo.
- Loader inicial y animaciones responsivas con soporte para movimiento reducido.

## Requisitos

Para ejecutar el proyecto sin Docker se necesita Node.js 22.12 o superior.

## Ejecución local

```bash
npm install
npm run dev
```

El sitio estará disponible en `http://localhost:5173`.

Para generar la versión de producción:

```bash
npm run build
```

Los archivos finales se generan en `dist/`.

Para previsualizar el resultado compilado:

```bash
npm run preview
```

## Ejecución con Docker

Sitio compilado servido por nginx:

```bash
docker compose up -d --build
```

Disponible en `http://localhost:8085`.

Entorno de desarrollo con recarga automática:

```bash
docker compose --profile dev up desarrollo
```

Disponible en `http://localhost:5173`.

Para detener los contenedores:

```bash
docker compose down
```

Los puertos se pueden cambiar al iniciar Docker:

```bash
WEB_PORT=9000 docker compose up -d --build
DEV_PORT=5174 docker compose --profile dev up desarrollo
```

## Estructura del proyecto

```text
Al_Dia/
├── *.html                 Páginas y estructura de cada vista
├── src/
│   ├── main.js            Inicialización, componentes, tema y base de datos
│   ├── components/        Componentes HTML y JavaScript reutilizables
│   ├── controllers/       Coordinación de una vista y sus eventos
│   ├── services/          Acceso a IndexedDB y operaciones de dominio
│   ├── db/
│   │   ├── db.js          Configuración de Dexie
│   │   └── datos-iniciales.json
│   ├── styles/
│   │   └── main.css       Variables visuales, componentes y animaciones
│   └── utils/
│       ├── utils.js       Fechas, validaciones, urgencia y avisos
│       └── componentes.js Carga de componentes HTML compartidos
├── docs/                  Documento y esquema del proyecto
├── Dockerfile
├── docker-compose.yml
├── vite.config.js
└── package.json
```

El flujo de datos es:

**Página HTML → controlador → servicio → IndexedDB**

Los controladores no deben acceder directamente a las tablas de Dexie. Todas las
operaciones de persistencia se realizan desde `src/services/`.

## Arquitectura

El proyecto aplica separación de responsabilidades:

- Los componentes administran el renderizado y los eventos del DOM.
- Los controladores coordinan datos y acciones de la página.
- Los servicios encapsulan las operaciones de IndexedDB.
- El controlador de filtros contiene reglas de búsqueda independientes del DOM.
- Las utilidades compartidas evitan duplicar lógica de fechas, textos y avisos.
- Los criterios de filtrado pueden ampliarse sin modificar el núcleo de búsqueda.

### Almacenamiento local

Dexie administra la base `AlDiaDatabase`. Los stores principales son:

- `subjects`: materias
- `tasks`: tareas
- `steps`: pasos o checklist
- `settings`: tema y preferencias de avisos
- `notifications`: bandeja de avisos

Para inspeccionar los datos guardados:

1. Abre las herramientas de desarrollo con `F12`.
2. Selecciona la pestaña **Application**.
3. Abre **IndexedDB → AlDiaDatabase**.

También puedes restablecer todos los datos desde **Ajustes → Restablecer datos de ejemplo**.

## Persistencia de datos

Al día no utiliza backend ni cuentas de usuario. La información:

- Se conserva entre recargas.
- Pertenece únicamente al navegador y dispositivo actual.
- Puede exportarse desde **Ajustes** en un archivo JSON con fecha y hora.
- Puede eliminarse y volver a sembrarse desde la vista Ajustes.

## Diseño responsive

- Adaptado para escritorio y dispositivos móviles.
- Navegación y pie compartidos en todas las páginas.
- Tema claro y oscuro.
- Campos, listas y filtros adaptables.
- Loader CSS mostrado durante la preparación inicial.
- Animaciones reducidas automáticamente si el sistema configura movimiento reducido.

## Convenciones de desarrollo

- Usar JavaScript ES Modules.
- Documentar módulos y funciones públicas con JSDoc.
- Mantener los comentarios y nombres de variables claros y descriptivos.
- Usar las funciones de `src/utils/utils.js` para fechas con Day.js.
- Escapar contenido escrito por el usuario antes de insertarlo mediante `innerHTML`.
- No modificar directamente el esquema Dexie de la versión existente: crear una nueva versión al ampliar stores o índices.
- Ejecutar `npm run build` antes de subir cambios.
- Trabajar por funcionalidades en ramas independientes y fusionar mediante Pull Request.

## Documentación académica

El documento de proyecto se encuentra en:

[`docs/Proyecto_Al_Dia_DDW.pdf`](docs/Proyecto_Al_Dia_DDW.pdf)
