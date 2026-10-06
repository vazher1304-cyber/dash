# Validación del rediseño V2

La implementación utiliza el HTML existente, la especificación V2 y el esquema de composición enviado por el usuario. No se recibió una captura de la referencia.

La ejecución completa terminó con **141 comprobaciones aprobadas**, salida 0 y cero errores no capturados.

## Comprobaciones

La suite valida en Chromium:

- Importaciones efectivas XLSX, XLS y CSV; reimportación y sustitución del ejemplo ficticio de 96 viviendas.
- KPI de asignación, importes, fechas, acentos y texto que contiene marcado HTML, sin ejecución de ese marcado.
- Composición de escritorio con navegación persistente, KPI sobre el modelo, ficha a la derecha y plano completo visible al ajustar zoom.
- Todos los proyectos representados en el esquema general; filtro global que actualiza lotes, KPI, resumen sin selección y finanzas inferiores.
- Selección por Enter, Espacio y toque; limpieza de selección y restauración del resumen; persistencia entre vistas, perspectiva/planta y cambio de periodo.
- Búsqueda y filtros de estado, zoom, arrastre, Ctrl + rueda y pellizco de dos dedos.
- Clientes, Ventas, Personal, Crédito puente, Saldos y Plano; fichas, búsqueda global fuera del proyecto actual y localización en el plano.
- Exportaciones reales Excel, PDF y SVG; lectura de los totales del libro exportado y texto de las secciones del PDF.
- Columnas faltantes: KPI omitidos, estado de saldo desconocido, avance no inferido sin fecha; lotes y filas inexistentes sin selección obsoleta.
- Menú en 1024/768/390/320 px con etiquetas visibles, foco contenido, fondo inactivo y Escape; restauración de barra lateral en 1800 px.
- Marca visible, ausencia de desbordamiento horizontal, tema oscuro, movimiento reducido y navegación con GSAP/Lenis.
- Cero errores no capturados del navegador.

Se capturaron los modelos canónicos de la versión anterior publicada con la misma importación CSV. La suite compara todas las filas y los resultados de Clientes, Ventas, Personal, Crédito puente y Saldos; deben coincidir completamente.

```bash
cd /workspace/dash
NODE_PATH=/workspace/.templer-tools/node_modules \
TEMPLER_CDN_CACHE=/workspace/.templer-tools/cdn \
TEMPLER_BASELINE_MODEL=/tmp/templer-baseline-model.json \
node tests/operations.cjs
```

La captura de modelos es un artefacto temporal opcional. La suite se puede ejecutar sin ella; la caché de animaciones también es opcional.

Los cinco paquetes integrados (SheetJS, ExcelJS, Chart.js, jsPDF y AutoTable) se comprobaron idénticos al HTML original adjunto. Los normalizadores, regla de estado, cálculos, renderizadores de reportes detallados y generador PDF permanecen sin cambios. Los nueve scripts ejecutables integrados pasan la verificación de sintaxis. `git diff --check` pasa.

## Límites

Los archivos de prueba son sintéticos; no se recibió un libro de operaciones real. Esta validación no constituye una auditoría completa con lector de pantalla. Se conserva la semántica de fechas y periodos descrita en README.md. La profundidad del plano representa bloques de lotes y no acredita construcción ni ubicación real.

Las animaciones se sirven al navegador de pruebas desde una caché descargada con TLS verificado, porque Chromium de este entorno no reconoce directamente el certificado del proxy para jsDelivr. No se cambian las URLs de la aplicación ni se desactiva la verificación TLS. Los flujos principales también se comprueban sin estas animaciones.

La configuración del entorno de nube guardada anteriormente sigue siendo compatible. Publicar/restaurar el entorno es independiente de publicar el código en GitHub.
