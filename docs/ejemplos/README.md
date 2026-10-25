# Ejemplos de la documentacion

> Fecha: 2026-10-25
> Descripcion: Guias paso a paso y ejemplos JSON inventados que acompanan la documentacion de los controles. Indice general en [../README.md](../README.md).

Cada control tiene una guia de ejemplo con una pantalla completa, datos de prueba, formulas de Power Fx, pruebas sugeridas y problemas comunes. Los dos archivos JSON se pueden copiar y pegar sin abrir ninguna aplicacion. **Nada de esto contiene datos de ningun cliente ni de ningun entorno:** los pedidos, clientes, vendedores y totales son inventados (ver [12. Datos de ejemplo](../README.md#12-datos-de-ejemplo)).

| Archivo | Contenido |
| --- | --- |
| [DatePicker.md](DatePicker.md) | Captura y guardado de una sola fecha |
| [DateRangePicker.md](DateRangePicker.md) | Filtro por rango de fechas, incluido el tratamiento del dia final |
| [DateTimePicker.md](DateTimePicker.md) | Registro de fecha y hora, precarga al editar y conversion a UTC |
| [DateTimeRangePicker.md](DateTimeRangePicker.md) | Filtro por intervalo de fecha y hora |
| [SearchableComboBox.md](SearchableComboBox.md) | Seleccion multiple con busqueda y filtro de una galeria |
| [ExcelReportPicker.md](ExcelReportPicker.md) | Exportacion de pedidos filtrados a Excel con dos informes |
| [WebPageViewer.md](WebPageViewer.md) | Visor de ayuda con navegacion, URL relativa y recarga |
| [TCGPasswordEngine.md](TCGPasswordEngine.md) | Alta, inicio de sesion y cambio de contrasena |
| `ExcelReportPicker-informes.json` | Definicion de tres informes (dos en espanol y uno con los alias en ingles) para la propiedad *Definicion de informes (JSON)* |
| `ExcelReportPicker-items.json` | Registros inventados que ilustran la forma de **Items**: una fila por pedido, con fechas, enteros, moneda y un pedido cancelado |

Como usar las guias:

1. Abre la guia del control y sigue las secciones en orden: datos de prueba, configuracion, formulas y pruebas.
2. Ajusta los nombres de las columnas a los campos reales que veas en **Columnas detectadas** antes de descargar.

Como usar los JSON:

1. Copia el contenido de `ExcelReportPicker-informes.json` y pegalo en la propiedad *Definicion de informes (JSON)*: acepta el mismo texto JSON que produce `JSON({...})` en Power Fx.
2. Los valores de `ExcelReportPicker-items.json` son una muestra del origen: no se importan en Power Apps, solo describen la forma de los registros que se enlazan en **Items**. La etiqueta completa de la propiedad es *Items (tabla o coleccion filtrada)*.

Los archivos con datos reales (`.csv`, `.tsv`, `.xlsx`, extractos y volcados) estan excluidos por `.gitignore`: en este repositorio solo se versionan los ejemplos inventados de esta carpeta.
