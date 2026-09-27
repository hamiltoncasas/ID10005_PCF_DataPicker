# ExcelReportPicker

> Fecha: 2026-09-27
> Descripcion: Exportador de informes a Excel para Power Apps Canvas: informes definidos en JSON, tipos y formatos nativos de Excel, filtros por informe, aviso del estado de carga y descarga del archivo. Indice general en [README.md](README.md).

## 1. Que resuelve

`ExcelReportPicker` es **un unico elemento visual** (no un boton estandar de Power Apps) que:

1. Se ve como un campo compacto con un icono de Excel y una etiqueta configurable.
2. Al hacer clic despliega el panel con la lista de informes definidos en JSON.
3. Al elegir un informe muestra al frente la barra con el boton **Descargar Excel**, el nombre del archivo y los contadores de columnas y registros.
4. Al pulsar el boton genera el `.xlsx` y lo descarga en el navegador.
5. Exporta **exactamente los registros que recibe en Items**: los filtros se escriben en esa propiedad con Power Fx, como en una galeria.
6. Detecta el tipo de dato de cada columna (fecha, fecha y hora, hora, entero, decimal, moneda, porcentaje, booleano, texto) y escribe la celda con el **formato nativo de Excel**.
7. Muestra los errores y avisos de configuracion en el propio panel y los publica en sus salidas.

| Dato | Valor |
| --- | --- |
| Identificador de componente | `id5_ID10005.ExcelReportPicker` |
| Version | 1.4.1 |
| Conjunto de datos | `items` (los registros que se exportan) |
| Dependencia de JavaScript | `xlsx` (SheetJS, edicion comunitaria) incluida en el bundle |
| Requiere servicios externos | No |

## 2. Requisitos previos

| Requisito | Donde |
| --- | --- |
| **Power Apps component framework for canvas apps** activado | Power Platform admin center > Entorno > Configuracion > Producto > Caracteristicas |
| Solucion con el control importada y publicada | make.powerapps.com > Soluciones |
| Permiso para agregar codigo a la aplicacion | Power Studio > Insertar > Obtener mas componentes > Codigo |

## 3. Empezar rapido (3 pasos)

1. Agrega el control: **Insertar > Obtener mas componentes > Codigo > ExcelReportPicker**.
2. En **Items** enlaza la tabla o coleccion y aplica los filtros con Power Fx, como en una galeria (seccion 5).
3. En **Definicion de informes (JSON)** escribe el informe con `JSON({...})`: ahi van las columnas que se exportan (por su **nombre visible** o su **nombre logico**), los titulos, el archivo y el orden (seccion 7).

Abre el panel del control: veras la lista de informes, el bloque **Columnas detectadas** (campo, tipo y formato) y, al elegir un informe, el boton de descarga. **No hay que mapear columnas**: los nombres se toman del origen.

## 4. Guia de parametros: donde va cada cosa

| Parametro | Para que sirve | Que escribir |
| --- | --- | --- |
| **Items** | Los registros que se exportan, **ya filtrados con Power Fx como en una galeria**. No hay columnas que mapear | `Filter(Origen, Condicion)` |
| **Definicion de informes (JSON)** | La estructura de los informes: nombre, columnas, titulos, tipos, archivo, hoja y orden | El `JSON({...})` de la seccion 7 |
| **Validacion estricta** | Bloquea la descarga cuando una columna o un tipo declarado no se puede resolver | `false` en produccion, `true` durante la puesta a punto |
| **Formato de fecha / fecha y hora / hora / entero / numero / moneda / porcentaje Excel**, **Codigo de moneda**, **Texto para verdadero/falso** | El formato nativo de Excel de cada tipo de dato | `dd/mm/yyyy`, `#,##0`, `#,##0.00`, `#,##0.00 "USD"`, `0.00%`, `Si`/`No` |
| **Limite de filas** | Corta la exportacion a los primeros N registros | `0` = todos |
| **Incluir titulo del informe**, **Incluir resumen de filtros** | Escriben la fila 1 (nombre) y la fila 2 (generado + filtros aplicados) | `Si` |
| **Incluir encabezado**, **Autofiltro de Excel**, **Ajustar ancho de columnas** | Fila de titulos con autofiltro y anchos calculados | `Si` |
| **Informe preseleccionado** | Clave del informe que aparece elegido al abrir el control | La clave de un informe, por ejemplo `pedidos` |
| **Reiniciar seleccion** | Al cambiar de valor limpia la seleccion y el ultimo resultado | Conectado a una variable de Power Fx |
| **Prioridad visual del panel** | `z-index` del panel | `2147483647` si hay elementos encima |
| **Mostrar aviso de carga**, **Texto mientras carga**, **Texto cuando esta listo**, **Milisegundos del aviso listo** | Avisan mientras se cargan los registros de `Items` y confirman cuando el origen termino | Seccion 6 |
| **Textos de la interfaz** | Boton, titulo del panel, boton de descarga y mensajes | Seccion 8.2 |

> Las **columnas a exportar** no son un parametro del control: se declaran dentro de cada informe, en su propiedad `columnas` (seccion 7).

## 5. La propiedad Items

`Items` es un conjunto de datos: se enlaza una tabla o una coleccion **igual que en una galeria**, y ahi mismo se filtran los registros.

| Forma | Ejemplo |
| --- | --- |
| Tabla completa | `Pedidos` |
| Tabla filtrada (lo normal) | `Filter(Pedidos, Activo)` |
| Rango de fechas con columnas de fecha y hora | `Filter(Pedidos, Fecha >= RangePicker1.startDate && Fecha < DateAdd(RangePicker1.endDate, 1, Days))` |
| Coleccion con fechas en texto | `Filter(AddColumns(colPedidos, "FechaReal", DateValue(Left(Fecha, 10))), FechaReal >= RangePicker1.startDate && FechaReal <= RangePicker1.endDate)` |
| Coleccion calculada | `AddColumns(Filter(Pedidos, Activo), "Dias", DateDiff(Fecha, FechaEntrega, Days))` |

Buenas practicas:

1. Filtra en `Items`: el control **no filtra por su cuenta**, exporta exactamente lo que recibe (como una galeria).
2. Todos los informes del control comparten el resultado de `Items`; si necesitas periodos distintos por informe, usa dos controles o declara `filtros` en cada informe (seccion 7.4).
3. Reduce lo que no se exporta con `Filter`/`ShowColumns`; para cortar filas en el Excel esta **Limite de filas**.
4. Los nombres que uses en `columnas` deben existir en el origen filtrado.
5. Como los datos llegan con su tipo (fecha, numero, booleano), declarar `tipos` solo es necesario para forzar un tipo dudoso.

El control pide automaticamente las paginas adicionales del conjunto de datos (hasta 5000 registros por pagina y 10 paginas) y el contador de paginas es **por consulta**: al agotarse cada consulta se rearma, asi que varios cambios de filtro seguidos siguen trayendo todas las filas.

Si quieres controlar **cuando** se refresca (por ejemplo solo al pulsar un boton *Consultar*), alimenta `Items` desde una coleccion:

```powerfx
// Boton Consultar
ClearCollect(colInforme, Filter(Origen, Condicion));

// Items del control
colInforme
```

## 6. Aviso del estado de carga

Mientras el host entrega los registros de **Items** (y las paginas adicionales), el control lo avisa en el propio elemento visual: el icono se reemplaza por un **giro** y el texto pasa a *Texto mientras carga*. Cuando el origen termina, aparece un **visto bueno** con *Texto cuando esta listo* durante el tiempo configurado y despues el control vuelve a su texto normal.

| Propiedad | Que hace | Predeterminado |
| --- | --- | --- |
| *Mostrar aviso de carga* | Activa o desactiva todo el aviso | `Si` |
| *Texto mientras carga* | Texto del aviso durante la carga (tambien en el boton de descarga y en la cabecera del panel) | `Cargando datos...` |
| *Texto cuando esta listo* | Mensaje que aparece al terminar | `Datos cargados` |
| *Milisegundos del aviso listo* | Cuanto se mantiene el mensaje de listo; `0` lo deja visible hasta el proximo cambio de datos | `4000` |

Salidas asociadas: *Esta cargando* (`isLoading`) y *Estado de la carga* (`dataStatus`, con los valores `cargando` o `listo`), utiles para reflejar el estado en una etiqueta de la aplicacion.

El aviso se calcula con dos senales del host: **paginas pendientes** del conjunto de datos y **ausencia de columnas y de registros**. Si el host no confirma el fin de la carga en 15 segundos, el aviso se retira para no quedar girando indefinidamente.

## 7. Definicion de informes (JSON)

Es un objeto con **un informe por clave**:

```json
{
  "clave_del_informe": {
    "nombre": "Nombre visible en el panel",
    "descripcion": "Texto secundario opcional",
    "columnas": "Pedido,Fecha,Total",
    "titulos": { "Pedido": "Titulo en Excel" },
    "tipos": { "Fecha": "fecha", "Total": "moneda" },
    "formatos": { "Total": "\"$\" #,##0.00" },
    "archivo": "nombre_{fecha}.xlsx",
    "hoja": "Nombre de la hoja",
    "filtros": "Estado <> Cancelada",
    "ordenarPor": "Pedido",
    "ordenDescendente": false
  }
}
```

Asi se escribe en la propiedad con `JSON({...})`, que tambien admite la forma con comillas en las claves si lo prefieres.

### 7.1 Campos de cada informe

| Campo | Tipo | Obligatorio | Descripcion |
| --- | --- | --- | --- |
| `nombre` | Texto | No | Nombre en la lista del panel y en la primera fila de la hoja. Si falta se usa la clave |
| `descripcion` | Texto | No | Texto secundario junto al nombre en la lista |
| `columnas` | Texto (o lista) | No | Campos que se exportan y **en que orden**. Se recomienda la cadena separada por comas (`"Pedido,Fecha,Total"`), que es lo que produce `JSON({...})`; tambien se acepta una lista. Cada nombre puede ser el **nombre visible** del campo, su **nombre logico** o su alias (seccion 7.3). Si se omite, se exportan todos los campos con datos |
| `titulos` | Objeto | No | Encabezado de cada columna en Excel |
| `tipos` | Objeto | No | Tipo forzado por columna: `texto`, `entero`, `numero`, `moneda`, `porcentaje`, `fecha`, `fechaHora`, `hora`, `booleano` |
| `formatos` | Objeto | No | Formato de Excel literal por columna; tiene prioridad sobre `tipos` y sobre las propiedades globales |
| `archivo` | Texto | No | Nombre del archivo. Marcas: `{informe}`, `{nombre}`, `{fecha}`, `{hora}`. Se agrega `.xlsx` si falta |
| `hoja` | Texto | No | Nombre de la hoja (maximo 31 caracteres; se quitan los caracteres no validos) |
| `filtros` | Texto (o lista/objeto) | No | Condiciones propias del informe, con **valores literales** (seccion 7.4). Varias reglas se separan con `;` y se combinan con AND |
| `ordenarPor` | Texto | No | Columna de orden (una sola) |
| `ordenDescendente` | Si/No | No | Orden descendente. Predeterminado `false` |

Tambien se aceptan los alias en ingles `name`, `description`, `columns`, `titles`, `types`, `formats`, `fileName`, `sheetName`, `filters`, `sortBy` y `sortDescending`.

### 7.2 Ejemplo con dos informes

```powerfx
// Items entrega registros con campos como Pedido, Cliente, Estado, Fecha,
// FechaEntrega, Producto, Cantidad, Total y Vendedor
JSON({
    pedidos: {
        nombre: "Pedidos del periodo",
        descripcion: "Detalle de pedidos con su entrega",
        columnas: "Pedido,Cliente,Estado,Fecha,FechaEntrega,Producto,Cantidad,Total",
        titulos: { Pedido: "Pedido", Cliente: "Cliente", Estado: "Estado", Fecha: "Fecha del pedido", FechaEntrega: "Fecha de entrega", Producto: "Producto", Cantidad: "Cantidad", Total: "Total" },
        tipos: { Fecha: "fecha", FechaEntrega: "fecha", Cantidad: "entero", Total: "moneda" },
        archivo: "pedidos_{fecha}.xlsx",
        hoja: "Pedidos",
        filtros: "Estado <> Cancelada; Total > 0",
        ordenarPor: "Pedido"
    },
    por_vendedor: {
        nombre: "Ventas por vendedor",
        columnas: "Vendedor,Fecha,Pedido,Cliente,Estado,Total",
        titulos: { Vendedor: "Vendedor", Fecha: "Fecha del pedido", Total: "Total" },
        tipos: { Fecha: "fecha", Total: "moneda" },
        archivo: "ventas_por_vendedor_{fecha}.xlsx",
        hoja: "Vendedores",
        filtros: "Estado = [Entregado, Despachado]",
        ordenarPor: "Vendedor"
    }
})
```

El periodo de ambos informes lo define el `Filter()` que escribas en **Items**, y cada informe lo puede acotar ademas con sus `filtros`.

### 7.3 Como se reconocen las columnas y como se leen los valores

Cada columna del origen puede tener mas de un nombre y el control usa cada uno para una cosa distinta:

| Nombre | Clave que informa el host | Para que la usa el control |
| --- | --- | --- |
| **Nombre visible** | `FieldDisplayName` | **Reconocer** la columna: es el nombre con el que el usuario ve el campo en Power Apps y el que puedes escribir en `columnas`, `titulos`, `tipos`, `formatos`, `filtros` y `ordenarPor`. Es tambien el encabezado predeterminado del Excel |
| **Nombre logico** | `FieldName` | **Leer el valor** de la celda: el control pide el dato con esta clave, que es la unica del conjunto de datos. El panel lo muestra junto al nombre visible |
| **Alias** | `Alias` | Respaldo en los dos papeles (reconocer y leer), cuando el origen lo declara |

Reglas practicas:

- Puedes escribir el informe con el **nombre visible** o con el **nombre logico**; las dos formas resuelven la misma columna. La busqueda no distingue mayusculas, acentos ni espacios de mas.
- Si el origen no responde a la clave del nombre visible, la celda se lee con el nombre logico, con el alias y, como ultimo recurso, con la forma **codificada** que usan algunos origenes para los nombres con espacios (`Importe total` se pide tambien como `Importe_x0020_total`). Asi una celda no queda vacia por el nombre del campo.
- El encabezado del Excel es el nombre visible, salvo que `titulos` declare otro.
- Si `columnas` o `filtros` piden una columna que no esta enlazada en el conjunto de datos, el panel lo avisa; con **Validacion estricta** activa la descarga se bloquea.

Los dos estilos conviven en el mismo JSON y producen el mismo libro:

```powerfx
JSON({
    por_visible: {
        nombre: "Escrito con el nombre visible",
        columnas: "Nombre completo,Ciudad",
        titulos: { "Nombre completo": "Cliente" }
    },
    por_logico: {
        nombre: "Escrito con el nombre logico",
        columnas: "nombre_logico_1,nombre_logico_2",
        titulos: { nombre_logico_1: "Cliente" }
    }
})
```

Para conocer los nombres reales que trae el origen, abre el panel del control y mira el bloque **Columnas detectadas** (o la salida *Columnas detectadas (JSON)*, que incluye nombre, nombre visible, tipo y formato) y usa el boton **Copiar nombres**.

### 7.4 Filtros por informe

`filtros` aplica condiciones **propias de un informe** con valores literales sobre el resultado de **Items**. Varias reglas se separan con `;` y se combinan con AND:

```text
"Estado <> Cancelada; Total > 0"
```

Operadores admitidos:

| Necesidad | Notacion | Ejemplo |
| --- | --- | --- |
| Igual / distinto | `=` o `<>` | `Estado = Entregado` |
| Mayor, mayor o igual, menor, menor o igual | `>`, `>=`, `<`, `<=` | `Total >= 1000` |
| Uno de varios (OR) | `= [a, b, c]` | `Estado = [Pendiente, Programada]` |
| Ninguno de varios | `<> [a, b]` | `Estado <> [Cancelada, Despachada]` |
| Contiene | `%texto%` | `Ciudad %BOGOTA%` |
| Empieza por | `texto%` | `Codigo A0%` |
| Termina en | `%texto` | `Grupo %0903` |
| Niega los tres anteriores | `!` delante | `Notas !%PRUEBA%` |
| Columna vacia | `= ""` | `FechaEntrega = ""` |
| Columna con valor | `<> ""` o solo el nombre | `Vendedor` |
| Rango inclusivo | `valor..valor` | `Fecha 2026-09-01..2026-09-19` |

Detalles del comportamiento:

- **Texto:** la comparacion ignora mayusculas y acentos, asi que `%bogota%` encuentra `Bogota, D.C.`.
- **Fechas:** sin hora se compara por dia (`2026-09-19`); con hora (`2026-09-19T23:59:59`) se compara al minuto. El rango `a..b` incluye los dos extremos.
- **Numeros:** admite `1234.50` y `1.234,50`.
- **Booleanos:** `Verdadero`, `True`, `Si`, `1` / `False`, `No`, `0`.
- Los filtros se evaluan **en el navegador** sobre lo que ya llego en `Items`: no consultan el origen, asi que `Items` define el universo y su delegacion.
- Si una regla no resuelve la columna o el valor no cuadra con el tipo, aparece un **aviso** en el panel y en el resumen del libro; con **Validacion estricta** activa la descarga se bloquea.
- Tambien se acepta la forma de objeto: `filtros: { columna: "Cliente"; operador: "="; valor: "CLIENTE DE EJEMPLO" }`.
- Los nombres de columna de las reglas usan el **nombre visible** o el **nombre logico** de la misma forma que `columnas`.

### 7.5 Comparaciones por tipo

| Tipo de columna | Como se compara |
| --- | --- |
| `fecha` | Por dia (`=` es ese dia; `entre` incluye los dos extremos) |
| `fechaHora` | Por dia si el valor del filtro no trae hora; por minuto si la trae |
| `hora` | Por minuto del dia |
| `entero`, `numero`, `moneda`, `porcentaje` | Comparacion numerica |
| `texto` y demas | Texto normalizado (minusculas y sin acentos) |

## 8. Propiedades del control

### 8.1 Entradas

| Propiedad (nombre tecnico) | Nombre en Power Apps | Tipo | Predeterminado | Descripcion |
| --- | --- | --- | --- | --- |
| `items` | *Items* | Conjunto de datos | - | Tabla o coleccion con los registros que se exportan, ya filtrados con Power Fx (seccion 5) |
| `reportsJson` | *Definicion de informes (JSON)* | Texto multilinea | vacio | Informes configurados (seccion 7) |
| `strictFilters` | *Validacion estricta* | Si/No | No | Bloquea la descarga si una columna o un tipo declarado no se puede resolver |
| `dateFormat` | *Formato de fecha Excel* | Texto | `dd/mm/yyyy` | Formato nativo de las fechas y orden dia/mes al leer textos de fecha |
| `dateTimeFormat` | *Formato de fecha y hora Excel* | Texto | `dd/mm/yyyy hh:mm` | Formato nativo de las columnas con hora |
| `timeFormat` | *Formato de hora Excel* | Texto | `hh:mm` | Formato nativo de las columnas de hora |
| `integerFormat` | *Formato de entero Excel* | Texto | `#,##0` | Formato nativo de los enteros |
| `numberFormat` | *Formato de numero Excel* | Texto | `#,##0.00` | Formato nativo de los decimales |
| `currencyFormat` | *Formato de moneda Excel* | Texto | vacio | Formato nativo de las monedas; si esta vacio se usa el de *Codigo de moneda* o `"$" #,##0.00` |
| `currencyCode` | *Codigo de moneda* | Texto | vacio | Codigo ISO que se agrega al formato de moneda (`USD`, `COP`, `EUR`, ...) |
| `percentFormat` | *Formato de porcentaje Excel* | Texto | `0.00%` | Formato nativo de los porcentajes |
| `booleanTrueText` / `booleanFalseText` | *Texto para verdadero* / *Texto para falso* | Texto | `Si` / `No` | Texto de los booleanos en Excel |
| `maxRows` | *Limite de filas* | Numero | `0` | Maximo de registros exportados; `0` exporta todos |
| `includeHeaderRow` | *Incluir encabezado* | Si/No | Si | Escribe la fila de titulos |
| `includeTitle` | *Incluir titulo del informe* | Si/No | Si | Escribe el nombre del informe en la primera fila |
| `includeFilterSummary` | *Incluir resumen de filtros* | Si/No | Si | Escribe la fecha de generacion, los registros y los filtros aplicados |
| `autoFilter` | *Autofiltro de Excel* | Si/No | Si | Deja el encabezado con autofiltro |
| `autoColumnWidth` | *Ajustar ancho de columnas* | Si/No | Si | Calcula el ancho de cada columna (entre 8 y 60 caracteres) |
| `defaultReport` | *Informe preseleccionado* | Texto | vacio | Clave del informe que aparece elegido al iniciar |
| `resetKey` | *Reiniciar seleccion* | Si/No | No | Al cambiar de valor limpia la seleccion y el ultimo resultado |
| `zIndex` | *Prioridad visual del panel* | Numero | `2147483647` | `z-index` del panel |
| `showDataStatus` | *Mostrar aviso de carga* | Si/No | Si | Avisa mientras carga `Items` y confirma cuando termina |
| `loadingText` | *Texto mientras carga* | Texto | `Cargando datos...` | Texto del aviso de carga |
| `readyText` | *Texto cuando esta listo* | Texto | `Datos cargados` | Mensaje al terminar la carga |
| `readyNoticeMs` | *Milisegundos del aviso listo* | Numero | `4000` | Duracion del mensaje de listo; `0` lo deja visible |
| `buttonText`, `panelTitleText`, `panelHintText`, `downloadText`, `exportingText`, `successText`, `noReportsText`, `emptyDataText`, `errorTitleText` | Textos de la interfaz | Texto | ver 8.2 | Textos del elemento visual y del panel |

### 8.2 Textos de la interfaz

| Propiedad (nombre tecnico) | Nombre en Power Apps | Predeterminado |
| --- | --- | --- |
| `buttonText` | *Texto del boton* | `Informes` |
| `panelTitleText` | *Titulo del panel* | `Exportar a Excel` |
| `panelHintText` | *Texto guia del panel* | `Elige un informe y descarga el archivo Excel con los datos filtrados.` |
| `downloadText` | *Texto del boton de descarga* | `Descargar Excel` |
| `exportingText` | *Texto mientras genera* | `Generando Excel...` |
| `successText` | *Texto de exito* | `Excel generado` |
| `noReportsText` | *Texto sin informes* | `No hay informes definidos. Configura la propiedad Definicion de informes (JSON).` |
| `emptyDataText` | *Texto sin registros* | `Sin registros para exportar con los filtros actuales.` |
| `errorTitleText` | *Titulo de error* | `Revisa la configuracion del informe` |
| `loadingText` | *Texto mientras carga* | `Cargando datos...` |
| `readyText` | *Texto cuando esta listo* | `Datos cargados` |

Los textos internos del panel (etiquetas *INFORMES*, *Registros*, *Columnas*, *Columnas detectadas*, *Copiar nombres*, los mensajes de copiado y las pistas de ayuda) no se configuran por propiedades.

### 8.3 Salidas

| Salida (nombre tecnico) | Nombre en Power Apps | Tipo | Descripcion |
| --- | --- | --- | --- |
| `selectedReport` | *Informe seleccionado* | Texto | Clave del informe elegido en el panel |
| `lastReport` | *Ultimo informe exportado* | Texto | Clave del ultimo informe exportado |
| `lastReportName` | *Nombre del ultimo informe* | Texto | Nombre del ultimo informe exportado |
| `lastFile` | *Ultimo archivo generado* | Texto | Nombre del archivo descargado |
| `lastRows` | *Filas del ultimo informe* | Numero | Filas escritas en el libro |
| `lastStatus` | *Estado del ultimo intento* | Texto | `listo`, `exportado` o `error` |
| `errorMessage` | *Mensaje de error* | Texto | Detalle del ultimo error |
| `hasError` | *Hubo error* | Si/No | Verdadero si el ultimo intento fallo |
| `columnsDetected` | *Cantidad de columnas detectadas* | Numero | Columnas del origen enlazado |
| `availableColumnsJson` | *Columnas detectadas (JSON)* | Texto | Nombre, nombre visible, tipo y formato de cada columna |
| `isLoading` | *Esta cargando* | Si/No | Verdadero mientras se cargan los registros del origen |
| `dataStatus` | *Estado de la carga* | Texto | `cargando` o `listo`, para mostrar en una etiqueta de la aplicacion |

Ejemplos:

```powerfx
// Avisar al usuario del resultado
If(ExcelReportPicker1.hasError,
   Notify(ExcelReportPicker1.errorMessage, NotificationType.Error),
   Notify("Se genero " & ExcelReportPicker1.lastFile & " con " & ExcelReportPicker1.lastRows & " filas"))

// Mostrar el aviso de carga en una etiqueta
If(ExcelReportPicker1.isLoading, "Consultando datos...", "Datos disponibles: " & Text(ExcelReportPicker1.dataStatus))

// Guardar en una variable la lista de columnas detectadas
Set(varColumnas, ExcelReportPicker1.availableColumnsJson)
```

## 9. Tipos de dato y formatos nativos de Excel

### 9.1 Deteccion automatica del tipo

El tipo de cada columna se decide en este orden:

1. La propiedad `tipos` del informe (lo que declares manda).
2. El tipo que informa el origen en **Items** (fecha, numero, booleano, moneda, ...).
3. Los valores: fechas en texto ISO (`2026-03-12`), numeros con separadores (`1.234,50`), monedas (`$ 1.234,50`) y porcentajes (`12,5%`).

### 9.2 Formatos predeterminados

| Tipo | Propiedad del control que lo define | Formato predeterminado |
| --- | --- | --- |
| `fecha` | *Formato de fecha Excel* | `dd/mm/yyyy` |
| `fechaHora` | *Formato de fecha y hora Excel* | `dd/mm/yyyy hh:mm` |
| `hora` | *Formato de hora Excel* | `hh:mm` |
| `entero` | *Formato de entero Excel* | `#,##0` |
| `numero` | *Formato de numero Excel* | `#,##0.00` |
| `moneda` | *Formato de moneda Excel* y *Codigo de moneda* | `#,##0.00 "USD"` si defines codigo; si no, `"$" #,##0.00` |
| `porcentaje` | *Formato de porcentaje Excel* | `0.00%` |
| `booleano` | *Texto para verdadero* / *Texto para falso* | `Si` / `No` |
| `texto` | - | `@` |

Los formatos se escriben como **formato nativo de Excel** (formato numerico aplicado a la celda): la fecha es una fecha real, el numero se puede sumar y la moneda respeta el formato configurado. El tipo y el formato aplicados a cada columna se consultan en el bloque *Columnas detectadas* del panel o en la salida *Columnas detectadas (JSON)*.

Un formato declarado en `formatos` (dentro del informe) tiene prioridad sobre `tipos` y sobre las propiedades globales del control.

## 10. Estructura del libro generado

```text
Fila 1  Nombre del informe                          <- Incluir titulo del informe
Fila 2  Generado: 18/09/2026 09:30 | Registros: 3 | Filtros: Fecha entre 2026-03-01 y 2026-03-31
Fila 3  (vacia)
Fila 4  Pedido | Cliente | Estado | Fecha | ...      <- encabezado con autofiltro
Fila 5  PED-1001 | Comercial Andina | Despachado | 12/03/2026 | ...
```

- Las filas 1 y 2 dependen de *Incluir titulo del informe* e *Incluir resumen de filtros*.
- El encabezado depende de *Incluir encabezado*; el autofiltro de *Autofiltro de Excel* (se aplica solo si hay encabezado y filas).
- Los anchos de columna se calculan entre 8 y 60 caracteres por columna cuando *Ajustar ancho de columnas* esta activo.
- La fila 2 muestra los filtros con los valores recibidos (por eso las fechas aparecen como `YYYY-MM-DD`) y la ultima parte nombra la columna y el operador aplicados.
- El nombre de la hoja sale de `hoja` (maximo 31 caracteres, sin `[ ] \ / ? * :`).

## 11. Ejemplo completo (datos inventados)

Pantalla con un `DateRangePicker`, un desplegable de vendedor, una etiqueta de aviso y el exportador:

```powerfx
// Boton de la pantalla: limpiar el periodo
Set(varReiniciar, true);      // conectado a la propiedad Reiniciar seleccion del selector de fechas

// Propiedad Items del control
Filter(Pedidos,
    Fecha >= DateValue(DateRangePicker1.startDate) &&
    Fecha <= DateValue(DateRangePicker1.endDate) &&
    (IsBlank(DropdownVendedor.Selected.Value) || Vendedor = DropdownVendedor.Selected.Value))

// Propiedad Definicion de informes (JSON)
JSON({
    detalle: {
        nombre: "Detalle de pedidos",
        descripcion: "Una fila por pedido del periodo elegido",
        columnas: "Pedido,Cliente,Estado,Fecha,FechaEntrega,Producto,Cantidad,Total",
        titulos: { Fecha: "Fecha del pedido", FechaEntrega: "Fecha de entrega", Cantidad: "Unidades", Total: "Total" },
        tipos: { Fecha: "fecha", FechaEntrega: "fecha", Cantidad: "entero", Total: "moneda" },
        archivo: "pedidos_{fecha}.xlsx",
        hoja: "Pedidos",
        filtros: "Estado <> Cancelada",
        ordenarPor: "Pedido"
    },
    resumen: {
        nombre: "Resumen por estado",
        columnas: "Estado,Pedido,Total",
        tipos: { Total: "moneda" },
        archivo: "resumen_{fecha}_{hora}.xlsx",
        ordenarPor: "Estado",
        ordenDescendente: true
    }
})

// Etiqueta de aviso de la pantalla
If(ExcelReportPicker1.isLoading,
   "Consultando datos...",
   If(ExcelReportPicker1.hasError,
      ExcelReportPicker1.errorMessage,
      "Ultimo archivo: " & ExcelReportPicker1.lastFile & " (" & ExcelReportPicker1.lastRows & " filas)"))

// Boton "Exportar de nuevo" (opcional)
Select(ExcelReportPicker1)   // o guia al usuario al panel del control
```

Pasos de uso: enlaza **Items**, pega el `JSON({...})` en *Definicion de informes (JSON)*, abre el panel del control, revisa **Columnas detectadas** y pulsa **Descargar Excel** en el informe que quieras.

## 12. Seguridad

El control se ejecuta en el cliente (el navegador del usuario) y no abre canales de salida: no declara servicios externos ni dominios, no usa `fetch`, `XMLHttpRequest`, `WebSocket` ni `postMessage`, no evalua codigo (`eval` / `new Function`), no inyecta HTML y no guarda nada en `localStorage`, `sessionStorage` ni `indexedDB`. El libro se arma en memoria y se entrega con una descarga del navegador; el control no escribe en Dataverse ni en ningun servicio.

Medidas concretas frente a un libro danado o a datos inesperados:

| Riesgo | Medida |
| --- | --- |
| Inyeccion de formulas (un dato que empieza por `=` o `+`) | Todos los valores se escriben como texto: el libro no contiene formulas ni hipervinculos, aunque el dato llegue con `=` |
| Caracteres invalidos que danan el archivo | Se quitan los caracteres de control, los no caracteres y los medios pares suplentes; cada celda se recorta a 32767 caracteres |
| Nombres de archivo maliciosos (`../`, rutas, nombres reservados) | El nombre se limpia: sin separadores de ruta, sin secuencias `..`, sin nombres reservados de Windows, con longitud limitada y extension `.xlsx` |
| Nombre de hoja invalido | Se quitan `[ ] \ / ? * :` y los caracteres de control, y se recorta a 31 caracteres |
| Campos con nombres heredados (`constructor`, `toString`) | Las lecturas de `titulos`, `tipos`, `formatos` y de los valores del origen usan busquedas propias, sin recorrer el prototipo |
| Volumen excesivo (bloqueo del navegador) | Maximo 5000 registros por pagina y 10 paginas, *Limite de filas* configurable, maximo de 16384 columnas y de 1048576 filas |
| Entradas corruptas | El JSON de `Definicion de informes (JSON)` se analiza con control de errores; los problemas se muestran en el panel y en las salidas, sin romper la aplicacion |

## 13. Limites y buenas practicas

### 13.1 Limites conocidos

- **Sin estilos de celda ni paneles congelados:** la libreria usada escribe formatos numericos, anchos y autofiltro, pero no negritas, colores ni bordes. Para una presentacion con estilo, aplica una plantilla al abrir el archivo.
- **Tamano del bundle:** incluye la libreria de Excel, asi que el `bundle.js` es mayor que el de los demas controles (aprox. 450 KB minificado frente a unos 137 KB de los controles de fecha).
- **Los datos vienen del origen enlazado:** el control solo lee **Items**; los filtros y la reduccion de columnas se hacen ahi con Power Fx, y el corte de filas con *Limite de filas*.
- **Una sola lectura del origen:** se piden las paginas adicionales hasta 5000 registros por pagina y 10 paginas; si el origen tiene mas filas, filtra en Power Fx.
- **Tipos:** con un origen tipado (Dataverse o coleccion con `DateValue`) el tipo llega solo; si una columna duda, declarala en `tipos`.
- **Generacion en el cliente:** todo el proceso ocurre en el navegador y la descarga depende de la configuracion del navegador y del dispositivo.
- **Zona horaria:** las fechas se interpretan y escriben con la hora local del navegador; no hay conversion a UTC.
- **Orden:** una sola columna de orden (`ordenarPor`); los valores vacios se ubican al final al ordenar ascendente.
- **Sin calculos:** el control no calcula diferencias ni totales; si los necesitas, agrega columnas calculadas con `AddColumns` en **Items** y exportalas como cualquier otro campo.
- **Sin acceso a datos propio:** el control no consulta el origen por su cuenta.
- **Aviso de carga:** la deteccion es una heuristica del host (paginas pendientes o ausencia de columnas y registros); si el host no confirma el fin, el aviso se retira a los 15 segundos y el estado publicado pasa a `listo`.

### 13.2 Buenas practicas

1. Declara `titulos` en todos los informes: mejora el Excel y hace que los filtros cortos se resuelvan sin ambiguedad.
2. Declara `tipos` cuando la deteccion automatica pueda dudar (por ejemplo, importes o fechas que llegan como texto).
3. Declara en `columnas` solo los campos que se necesitan, en el orden en que deben aparecer.
4. Reduce **Items** con `Filter`/`ShowColumns` si el origen es grande: el control exporta exactamente lo que recibe.
5. Activa *Validacion estricta* durante la puesta a punto: convierte cada aviso en un bloqueo y evita entregar un Excel incompleto sin advertirlo.
6. Revisa **Columnas detectadas** antes de escribir el JSON para confirmar los nombres reales y los tipos.
7. Envia las fechas de los filtros como texto `YYYY-MM-DD`.
8. Sube la version del manifiesto y de la solucion en cada entrega.

## 14. Comprobacion en la aplicacion

| # | Accion | Resultado esperado |
| --- | --- | --- |
| 1 | Enlazar la tabla o coleccion en **Items** (con el `Filter()` del periodo) | El panel lista los campos detectados con su tipo y formato |
| 2 | Abrir el panel | Aparece la lista de informes definidos en el JSON |
| 3 | Elegir un informe | Se muestra la barra con **Descargar Excel**, el nombre del archivo y los contadores |
| 4 | Pulsar **Descargar Excel** | Se descarga el `.xlsx` y aparece el mensaje de exito |
| 5 | Abrir el Excel: columna de fecha | Fecha real con el formato configurado (no texto) |
| 6 | Abrir el Excel: columna de moneda | Numero con el formato y el simbolo configurados |
| 7 | Cambiar el periodo en **Items** y volver a descargar | El archivo trae solo los registros del periodo (miralo en la fila *Generado...Filtros...*) |
| 8 | Dejar el periodo vacio | El informe exporta todos los registros recibidos |
| 9 | Escribir un JSON invalido | El panel muestra el error con el detalle |
| 10 | Pedir una columna que no existe en el origen | El panel muestra el aviso con el nombre de la columna |
| 11 | Poner `DisplayMode` en `View` | No se puede abrir el panel |
| 12 | Abrir el panel cerca del borde inferior | El panel se reubica para no salirse de la ventana |
| 13 | Abrir la pantalla con un origen grande | El elemento muestra el aviso de carga y luego *Datos cargados* |
| 14 | Definir textos propios en *Texto mientras carga* y *Texto cuando esta listo* | El aviso los usa tal cual |
| 15 | Poner *Milisegundos del aviso listo* en `0` | El mensaje de listo se queda visible |
| 16 | Desactivar *Mostrar aviso de carga* | El control no cambia su texto ni su icono |

Automatizado: el arnes `tools/verificar-nombres-campo.js` comprueba el reconocimiento de columnas y la lectura de celdas con un registro simulado (ver [README.md](README.md#9-verificacion-y-pruebas)).

## 15. Archivos del control

| Archivo | Contenido |
| --- | --- |
| `ExcelReportPicker/ControlManifest.Input.xml` | Contrato: conjunto de datos `items`, propiedades, salidas y recursos |
| `ExcelReportPicker/index.ts` | Adaptador PCF: lee el origen, interpreta los informes, aplica filtros, genera y descarga el libro y publica las salidas |
| `ExcelReportPicker/reportModel.ts` | Logica pura: definicion de informes, resolucion de columnas, deteccion de tipos, filtros, orden, nombres de archivo y hoja |
| `ExcelReportPicker/excelWriter.ts` | Construccion del libro con la libreria `xlsx`: filas informativas, encabezado, valores nativos, formatos, anchos y autofiltro |
| `ExcelReportPicker/ExcelReportPickerView.tsx` | Vista React: elemento compacto, panel, lista de informes, mensajes y bloque de columnas detectadas |
| `ExcelReportPicker/ExcelReportPicker.css` | Estilos con prefijo de clases `erp-` |
| `ExcelReportPicker/strings/ExcelReportPicker.1033.resx` | Nombres y descripciones localizados del panel de propiedades |
