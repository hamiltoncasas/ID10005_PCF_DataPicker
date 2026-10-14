# Ejemplos de la documentacion

> Fecha: 2026-10-13
> Descripcion: Ejemplos JSON inventados que acompanan las guias de los controles. Indice general en [../README.md](../README.md).

Estos archivos existen para que los ejemplos de las guias se puedan copiar y pegar sin abrir ninguna aplicacion. **No contienen datos de ningun cliente ni de ningun entorno:** los pedidos, clientes, vendedores y totales son inventados (ver [12. Datos de ejemplo](../README.md#12-datos-de-ejemplo)).

| Archivo | Para que sirve | Guia |
| --- | --- | --- |
| `ExcelReportPicker-informes.json` | Definicion de tres informes (dos en espanol y uno con los alias en ingles) para la propiedad *Definicion de informes (JSON)* | [ExcelReportPicker.md](../ExcelReportPicker.md#7-definicion-de-informes-json) |
| `ExcelReportPicker-items.json` | Registros inventados que ilustran la forma de **Items**: una fila por pedido, con fechas, enteros, moneda y un pedido cancelado | [ExcelReportPicker.md](../ExcelReportPicker.md#11-ejemplo-completo-datos-inventados) |

Como usarlos:

1. Copia el contenido del archivo y pegalo en la propiedad del control (*Definicion de informes (JSON)*): la propiedad acepta el mismo texto JSON que produce `JSON({...})` en Power Fx.
2. Ajusta los nombres de las columnas a los campos reales que veas en **Columnas detectadas** antes de descargar.
3. Los valores de `ExcelReportPicker-items.json` son una muestra del origen: no se importan en Power Apps, solo describen la forma de los registros que se enlazan en **Items**.

Los archivos con datos reales (`.csv`, `.tsv`, `.xlsx`, extractos y volcados) estan excluidos por `.gitignore`: en este repositorio solo se versionan los ejemplos inventados de esta carpeta.
