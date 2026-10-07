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

## Capa isométrica 3D

La vista general añade una escena Three.js **0.170.0** y tarjetas de cristal. Cada lote del plano existente aparece como una loseta con marcador azul; las manzanas usan la misma agrupación y geometría esquemática del plano. No representa coordenadas, construcción ni alturas reales.

Sirve la carpeta completa por HTTP con el comando anterior. Three.js y OrbitControls están incluidos en `js/scene/vendor/`; no se requiere npm ni conexión para la escena. Las bibliotecas y reglas originales de importación y reportes permanecen intactas.

- Selecciona un marcador para abrir la ficha existente; el tooltip usa el mismo formateador del plano.
- Arrastra para desplazar y usa la rueda o los controles 3D para acercar. La rotación permanece fija en una vista isométrica.
- **Ver plano 2D** restaura todos los controles, gestos y selección por teclado del plano original. Los reportes detallados mantienen su plano existente.
- La búsqueda, filtros, importaciones y selección se sincronizan desde el modelo original. Los registros filtrados se atenúan y dejan de ser seleccionables en 3D.
- Menos de 768 px, WebGL no disponible, pérdida del contexto o `?no3d=1`: fondo degradado y dashboard original con tarjetas de cristal.
- La apertura directa con `file://` utiliza deliberadamente la alternativa 2D para evitar las restricciones de módulos locales. Esta modalidad no se pudo probar en el navegador administrado del entorno; HTTP sí está verificado.
- Se respeta movimiento reducido; el render se pausa con la pestaña oculta. `TemplerScene.dispose()` libera la escena y `TemplerScene.init()` permite reiniciarla.

### Verificación de esta capa

No hay comandos de lint ni build: es una aplicación estática. Las pruebas usan la instalación de Playwright de desarrollo existente, sin añadir dependencias de la aplicación:

```bash
node tests/preservation.cjs
NODE_PATH=/workspace/.templer-tools/node_modules \
TEMPLER_CDN_CACHE=/workspace/.templer-tools/cdn \
TEMPLER_URL='http://127.0.0.1:8000/index.html?no3d=1' node tests/operations.cjs
NODE_PATH=/workspace/.templer-tools/node_modules node tests/controls.cjs
NODE_PATH=/workspace/.templer-tools/node_modules node tests/scene.cjs
```

`PLAN.md` contiene el inventario de selectores, el mapeo de datos y el registro de regresiones. `tests/preservation.cjs` comprueba que, al retirar únicamente las nuevas etiquetas de inicialización y capas, el documento coincide exactamente con la revisión `cd17d81`.
