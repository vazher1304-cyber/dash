# Validación de la entrega

Se usó el HTML adjunto como base, porque el repositorio seleccionado no tenía archivos ni commits. Los archivos originales adjuntos se conservaron.

La última ejecución completa finalizó con **95 checks aprobados** y código de salida 0:

```bash
cd /workspace/dash
NODE_PATH=/workspace/.templer-tools/node_modules \
TEMPLER_CDN_CACHE=/workspace/.templer-tools/cdn \
TEMPLER_BASELINE_MODEL=/tmp/templer-baseline-model.json \
node tests/operations.cjs
```

El parámetro `TEMPLER_BASELINE_MODEL` era una captura de los modelos del HTML original obtenida con la misma importación CSV; es opcional y no se necesita para ejecutar la suite habitual. La comparación completa de filas normalizadas y resultados de Clientes, Ventas, Personal, Crédito puente y Saldos por proyecto pasó sin diferencias.

Comprobaciones ejecutadas:

- Ejemplo de 96 viviendas, selección global de proyecto y asignación de clientes.
- Importación efectiva de XLSX, XLS y CSV con acentos, fechas, valores positivos/negativos y nombres que contienen texto HTML; reimportación y salida del ejemplo.
- Los seis reportes detallados y la vista general siguen accesibles.
- Selección de lote mediante Enter, Espacio y toque; búsqueda, filtro de estado, zoom, arrastre, Ctrl + rueda y pellizco con dos dedos; selección persistente entre vistas, perspectiva/planta y actualización de periodos.
- Ficha completa, cierre con Escape, restauración del foco, búsqueda global fuera del proyecto actual y navegación «Ver en el plano».
- Exportación real Excel, PDF y SVG; lectura del libro exportado y comprobación del texto de las secciones del PDF.
- Columnas opcionales ausentes y lotes/filas inexistentes; los indicadores no respaldados se omiten y los estados vacíos eliminan selecciones obsoletas.
- Escritorio, 1024/768/390/320 px sin desbordamiento horizontal, tema oscuro, modo de movimiento reducido y navegación con GSAP/Lenis activos.
- Cero errores no capturados del navegador.

También se verificó la sintaxis de todos los scripts ejecutables integrados; los paquetes SheetJS, ExcelJS, Chart.js, jsPDF y AutoTable permanecen idénticos al adjunto. Los normalizadores, reglas de estado, cálculos, renderizadores de reportes y generador PDF conservan su implementación original.

El script de instalación se ejecutó dos veces; la segunda confirmó que la instalación era reutilizable. El servidor estático se inició desde `/workspace/dash` y la respuesta HTTP coincide byte por byte con `index.html`. Se guardaron `install_script` y `start_skill` en el borrador del entorno; publicación y restauración en una nueva tarea no se han ejecutado.

## Límites

Estas pruebas usan archivos sintéticos; no se recibió un archivo de operaciones real. No constituyen una auditoría completa de accesibilidad con lector de pantalla. La semántica original de **F Estim Escritura** y del alcance de los periodos se conserva y se explica en README.md. El plano general es un esquema, no una representación geográfica.

Las librerías opcionales de animación se descargaron con TLS verificado y se suministraron al navegador de pruebas desde esa caché: Chromium de este entorno no reconocía directamente el certificado del proxy para jsDelivr. No se desactivó verificación TLS ni se cambiaron las URLs de la aplicación. Los flujos principales también se comprobaron sin las animaciones externas.

El código está disponible en la rama `main` de `vazher1304-cyber/dash` en GitHub. La publicación del entorno es un paso independiente y no formó parte de estas pruebas.
