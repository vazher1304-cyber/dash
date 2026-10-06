# Templer · Mis reportes

Aplicación de reportes inmobiliarios en un único HTML, basada en el archivo existente proporcionado por el usuario. La importación XLSX/XLS/CSV y el ejemplo se procesan en el navegador. No requiere base de datos, backend ni compilación.

## Ejecutar

Abre `index.html` directamente en un navegador, o usa el servidor estático local:

```bash
cd /workspace/dash
python3 -m http.server 8000 --bind 127.0.0.1
```

El servidor es únicamente una herramienta de desarrollo; no recibe los archivos importados. Los datos de sesión permanecen en el navegador. Las librerías de importación, gráficas y exportación están integradas. Las animaciones existentes usan GSAP/ScrollTrigger/SplitText y Lenis desde sus versiones fijadas en jsDelivr; la aplicación conserva su alternativa sin esas animaciones cuando no están disponibles.

## Visión general

- Indicadores de viviendas con LoteID, con/sin cliente y valor con precio de venta; resumen financiero y de escrituración.
- El mismo plano, controles, modelo y selección se comparten con **Plano de lotes**. No se crea un segundo mapa. La vista general presenta un esquema por manzanas; la vista detallada conserva el entorno ilustrativo original.
- Al seleccionar un proyecto desde el esquema, cambia el filtro global. Para regresar al conjunto, usa **Todos los proyectos** en el selector superior. En ese conjunto, los KPIs abarcan todos los proyectos y el plano muestra el proyecto indicado explícitamente.
- Selección persistente por identificador de fila, mediante clic, toque, Enter o Espacio. La ficha contextual muestra los campos importados y permite abrir la ficha completa o localizar el lote en el plano detallado.
- Se omiten los nuevos indicadores cuando faltan sus columnas fuente. Una nota explica qué datos no están disponibles; no se convierten esas ausencias en KPIs de valor cero.

Se conservan Clientes, Ventas, Personal, Crédito puente, Saldos por proyecto y Plano de lotes; búsqueda global, tablas, filtros, ejemplo y exportaciones Excel/PDF/SVG.

## Datos y funciones

`pickBestSheet` → `rowsFromSheet` → `enterWorkspace` → `sessionData.rows` es la entrada actual. Los cálculos existentes `computeClientes`, `computeVentas`, `computePersonal`, `computePuente`, `computeSaldos` y `computeMapa` consumen esas filas canónicas. `selectUnitAssignment` añade únicamente la agregación de asignación de cliente.

`mountSharedMap` mueve el único conjunto de controles y plano entre paneles, conservando sus IDs y eventos. `layoutMapa` y `buildPlanoSvg` aceptan la opción `schematic`, reutilizando la geometría de lotes y omitiendo el entorno ilustrativo en la vista general. `decorateMap` e `inspectLot` restauran la selección por `mapState.selectedId`, sin depender del orden de elementos SVG.

`enterWorkspace(rows, fileName, demo, fields)` conserva un cuarto argumento opcional con las columnas reconocidas. `renderOverviewAvailability` utiliza esa metadata para decidir qué indicadores están respaldados por el archivo.

Se mantiene la semántica original de los reportes: se cuenta como escrituración la presencia de **F Estim Escritura**, y los filtros de periodo afectan Ventas y Personal. El valor de venta de la vista general indica el periodo seleccionado; inventario, saldos y plano conservan el alcance original por proyecto. Un esquema no acredita ubicación geográfica, disponibilidad comercial ni progreso de obra.

Para una integración futura, añade un adaptador que normalice los registros y la disponibilidad de campos al contrato de `enterWorkspace`; reutiliza los selectores existentes. No se implementaron API, autenticación ni almacenamiento persistente.

## Validación en navegador

Las pruebas son herramientas de desarrollo y no se añaden dependencias a la aplicación:

```bash
npm install --prefix /workspace/.templer-tools --cache /workspace/.templer-npm-cache playwright@1.58.2 --no-audit --no-fund
cd /workspace/dash
NODE_PATH=/workspace/.templer-tools/node_modules node tests/operations.cjs
```

Requieren Chromium en `/usr/bin/chromium` y `pdftotext`. `CHROMIUM_EXECUTABLE` permite elegir otra instalación de Chromium; `TEMPLER_URL` permite elegir la dirección del servidor.

El script de instalación del entorno guarda las cuatro librerías originales de animación en `/workspace/.templer-tools/cdn`, descargadas con verificación TLS. Para validar también el comportamiento con GSAP/Lenis, ejecuta:

```bash
NODE_PATH=/workspace/.templer-tools/node_modules \
TEMPLER_CDN_CACHE=/workspace/.templer-tools/cdn \
node tests/operations.cjs
```

La caché se usa únicamente en el navegador de pruebas. No cambia las URLs de la aplicación ni desactiva verificación de certificados. Las pruebas cubren importación XLSX/XLS/CSV, reimportación, cálculos, proyectos, selección, fichas, búsqueda, periodos, reportes, exportaciones, columnas faltantes, estados vacíos, teclado, toque, tema oscuro y anchos de 320 a 1440 px. Guardan capturas y exportaciones en una carpeta temporal indicada al finalizar.
