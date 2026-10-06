# Templer · Operación inmobiliaria

Aplicación estática en `index.html`. Importa XLSX, XLS o CSV y procesa los datos en el navegador. No necesita compilación, servidor de datos, API, cuentas ni credenciales.

## Abrir la aplicación

Puedes abrir `index.html` directamente en un navegador moderno. Para servirlo desde este entorno:

```bash
cd /workspace/dash
python3 -m http.server 8000 --bind 127.0.0.1
```

Las librerías de importación, gráficas y exportación están integradas. Las animaciones opcionales GSAP/Lenis usan las URLs originales de jsDelivr; la importación, navegación y reportes también funcionan sin ellas.

## Rediseño V2

La implementación sigue `PROMPT_CODEX_WARETRACK_INMOBILIARIA_V2.md` y el esquema de composición enviado por el usuario. No se recibió la captura mencionada.

- Navegación lateral persistente en escritorio y un mismo menú accesible en tablet/móvil, con teclado, Escape y restauración del foco.
- Barra superior con marca, vista, filtro global de proyecto, búsqueda, archivo importado, cambio de archivo y exportaciones Excel/PDF.
- Cuatro KPI compactos sobre el plano: viviendas, con cliente, sin cliente y valor de venta; se omiten cuando faltan sus columnas fuente.
- Plano protagonista, con agrupación por manzana, perspectiva esquemática, profundidad sutil, estado, selección, búsqueda, zoom y desplazamiento. «Todos los proyectos» representa todos sus lotes; seleccionar un proyecto actualiza toda la operación.
- Una sola ficha contextual a la derecha, alineada con los KPI y el plano. Sin selección muestra el resumen del proyecto; al seleccionar muestra datos reales y acciones de ficha/plano. En móvil se coloca debajo del modelo.
- Estado, saldo y escrituración en un resumen inferior compacto. Actividad y seguimiento se pueden desplegar; los proyectos aparecen como filas compactas.

Se conservan Clientes, Ventas, Personal, Crédito puente, Saldos por proyecto y Plano de lotes; importaciones, ejemplo, búsqueda global, tablas, filtros de periodo, fichas y exportaciones Excel/PDF/SVG.

## Datos y funciones

`pickBestSheet` → `rowsFromSheet` → `enterWorkspace` → `sessionData.rows` sigue siendo la entrada. Los normalizadores, `lotStatus`, cálculos `compute*`, reportes detallados y generadores de exportación conservan sus reglas.

`mountSharedMap` mueve el único plano y la única ficha entre las vistas. `selectDisplayedMapProject` reutiliza los proyectos, manzanas, lotes y totales de `computeMapa`: el filtro global gobierna la vista general, incluyendo su esquema conjunto. El plano detallado conserva su exploración interna por proyecto. No existe un segundo motor de mapa.

`layoutMapa` y `buildPlanoSvg` usan la misma geometría de lotes. La opción `schematic` omite el entorno ilustrativo del plano detallado y aplica una proyección visual con profundidad; no acredita calles, coordenadas, construcción ni ubicación geográfica.

`decorateMap` e `inspectLot` conservan la selección mediante el identificador de fila. `resetInspector` muestra el resumen sin selección. `syncNavigation` y `closeSidebar` controlan el menú en todos los modos de movimiento.

`enterWorkspace` conserva metadata de las columnas reconocidas. `renderOverviewAvailability` omite KPI sin respaldo. `mapStatusAvailable` presenta el estado como no disponible cuando faltan datos para determinarlo; no modifica la regla de estado de los reportes.

La semántica original se conserva: los reportes cuentan como escrituración la presencia de **F Estim Escritura**. En la ficha general el campo se identifica como **Escritura estimada**. Los periodos afectan Ventas y Personal; inventario, saldos y plano mantienen su alcance por proyecto. El KPI de valor de venta indica el periodo activo. «Sin cliente» no implica disponibilidad comercial.

## Validación

Las pruebas son herramientas de desarrollo, separadas de la aplicación:

```bash
npm install --prefix /workspace/.templer-tools --cache /workspace/.templer-npm-cache playwright@1.58.2 --no-audit --no-fund
cd /workspace/dash
NODE_PATH=/workspace/.templer-tools/node_modules node tests/operations.cjs
```

Requieren Chromium (`/usr/bin/chromium`) y `pdftotext`. `CHROMIUM_EXECUTABLE` y `TEMPLER_URL` permiten elegir otras instalaciones/direcciones. Para comprobar también las animaciones originales, usa la caché descargada por el script del entorno con TLS verificado:

```bash
NODE_PATH=/workspace/.templer-tools/node_modules \
TEMPLER_CDN_CACHE=/workspace/.templer-tools/cdn \
node tests/operations.cjs
```

Las pruebas cubren importaciones, datos, navegación, mapa, filtros, fichas, búsqueda, exportaciones, estados incompletos/vacíos, movimiento reducido, tema oscuro, toque y anchos de 320 a 1800 px. Guardan capturas y archivos exportados en una carpeta temporal indicada al terminar. `VALIDATION.md` describe la comprobación de esta entrega.
