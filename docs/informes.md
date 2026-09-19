# Manual de uso · Exportador de informes a Excel (`ExcelReportPicker`)

> Fecha: 2026-09-18  
> Descripcion: Manual del control PCF que despliega los informes configurados en JSON y descarga cada informe en Excel con filtros dinamicos, columnas seleccionadas y formatos nativos de Excel.

No hay datos reales de ningun cliente en este manual: todos los ejemplos usan datos inventados de pedidos de venta.

## 1. Que resuelve

`ExcelReportPicker` es **un unico elemento visual** (no un boton estandar de Power Apps) que:

1. Se ve como un campo compacto con un icono de Excel y una etiqueta configurable.
2. Al hacer clic despliega el panel con la lista de informes definidos en JSON.
3. Al elegir un informe muestra al frente la barra con el boton **Descargar Excel**, el nombre del archivo y los contadores de columnas y registros.
4. Al pulsar el boton genera el `.xlsx` y lo descarga en el navegador.
5. Exporta exactamente los registros que recibe en **Items**: los filtros se escriben en esa propiedad con Power Fx, como en una galeria.
6. Detecta el tipo de dato de cada columna (fecha, fecha y hora, hora, entero, decimal, moneda, porcentaje, booleano, texto) y escribe la celda con el **formato nativo de Excel**.
7. Muestra los errores y avisos de configuracion en el propio panel y los publica en sus salidas.

Identificador del componente: `id5_ID10005.ExcelReportPicker`. Version 1.2.0.

## 2. Requisitos previos

| Requisito | Donde |
| --- | --- |
| **Power Apps component framework for canvas apps** activado | Power Platform admin center > Entorno > Configuracion > Producto > Caracteristicas |
| Solucion que contenga el control importada y publicada | make.powerapps.com > Soluciones |
| Permiso para agregar codigo a la aplicacion | Power Apps Studio > Insertar > Obtener mas componentes > Codigo |

## 3. Empezar rapido (3 pasos)

1. Agrega el control: **Insertar > Obtener mas componentes > Codigo > ExcelReportPicker**.
2. En **Items** enlaza la tabla o coleccion y aplica los filtros con Power Fx, como en una galeria (seccion 4). El control recibe exactamente lo que devuelve esa expresion.
3. En **Definicion de informes (JSON)** escribe el informe con `JSON({...})`: ahi van las columnas que se exportan (con los **mismos nombres de campo**), los titulos, el archivo y el orden (seccion 5).

Abre el panel del control: veras la lista de informes, el bloque **Columnas detectadas** (campo, tipo y formato) y, al elegir un informe, el boton de descarga. **No hay que mapear columnas**: los nombres se toman del origen.

## 4. Guia de parametros: donde va cada cosa

| Parametro | Para que sirve | Que escribir |
| --- | --- | --- |
| **Items** | Los registros que se exportan, **ya filtrados con Power Fx como en una galeria**. No hay columnas que mapear | `Filter(Pedidos, Activo)`. Ver 4.1 |
| **Definicion de informes (JSON)** | La estructura de los informes: nombre, columnas, titulos, tipos, archivo, hoja y orden | El `JSON({...})` de la seccion 5 |
| **Validacion estricta** | Bloquea la descarga cuando una columna o un tipo declarado en el informe no se pueden resolver | `false` en produccion, `true` durante la puesta a punto |
| **Formato de fecha / fecha y hora / hora / entero / numero / moneda / porcentaje Excel**, **Codigo de moneda**, **Texto para verdadero/falso** | El formato nativo de Excel de cada tipo de dato | `dd/mm/yyyy`, `#,##0`, `#,##0.00`, `#,##0.00 "USD"`, `0.00%`, `Sí`/`No`. Ver 7.2 |
| **Limite de filas** | Corta la exportacion a los primeros N registros | `0` = todos |
| **Incluir titulo del informe**, **Incluir resumen de filtros** | Escriben la fila 1 (nombre) y la fila 2 (generado + filtros aplicados) | `Si` |
| **Incluir encabezado**, **Autofiltro de Excel**, **Ajustar ancho de columnas** | Fila de titulos con autofiltro y anchos calculados | `Si` |
| **Informe preseleccionado** | Clave del informe que aparece elegido al abrir el control | La clave de un informe, por ejemplo `pedidos` |
| **Reiniciar seleccion** | Al cambiar de valor limpia la seleccion y el ultimo resultado | Conectado a una variable de Power Fx |
| **Prioridad visual del panel** | z-index del panel | `2147483647` si hay elementos encima |
| **Textos de la interfaz** | Boton, titulo del panel, boton de descarga y mensajes | Seccion 8.2 |

> Las **columnas a exportar** no son un parametro del control: se declaran dentro de cada informe, en su propiedad `columnas` (seccion 5).

### 4.1 La propiedad Items

`Items` es un conjunto de datos: se enlaza una tabla o una coleccion **igual que en una galeria**, y ahi mismo se filtran los registros.

| Forma | Ejemplo |
| --- | --- |
| Tabla completa | `Pedidos` |
| Tabla filtrada (lo normal) | `Filter(Pedidos, Activo)` |
| Rango de fechas con columnas de fecha y hora | `Filter(Pedidos, Fecha >= dttRangePickerVista.startDate && Fecha < DateAdd(dttRangePickerVista.endDate, 1, Days))` |
| Coleccion con fechas en texto | `Filter(AddColumns(colPedidos, "FechaReal", DateValue(Left(Fecha, 10))), FechaReal >= dttRangePickerVista.startDate && FechaReal <= dttRangePickerVista.endDate)` |
| Coleccion calculada | `AddColumns(Filter(Pedidos, Activo), "Dias", DateDiff(Fecha, FechaEntrega, Days))` |

Buenas practicas:

1. Filtra en `Items`: el control **no filtra por su cuenta**, exporta exactamente lo que recibe (como una galeria).
2. Todos los informes del control comparten el resultado de `Items`; si necesitas periodos distintos por informe, usa dos controles o un `Filter()` distinto en cada uno.
3. Reduce lo que no se exporta con `Filter`/`ShowColumns`; para cortar filas en el Excel esta **Limite de filas**.
4. Los nombres que uses aqui son los que se declaran en `columnas` del informe (respetan mayusculas).
5. Como los datos llegan con su tipo (fecha, numero, booleano), ya no hace falta declarar `tipos`: usalo solo para forzar un tipo dudoso.


## 5. Definicion de informes (JSON)

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
    "ordenarPor": "Pedido",
    "ordenDescendente": false
  }
}
```

Asi se escribe en la propiedad con `JSON({...})`, que tambien acepta la forma equivalente con comillas en las claves si lo prefieres.

| Propiedad | Tipo | Obligatoria | Descripcion |
| --- | --- | --- | --- |
| `nombre` | Texto | No | Nombre en la lista del panel y en la primera fila de la hoja. Si falta se usa la clave |
| `descripcion` | Texto | No | Texto secundario junto al nombre en la lista |
| `columnas` | Texto (o lista) | No | Campos que se exportan y **en que orden**. Se recomienda la cadena separada por comas (`"Pedido,Fecha,Total"`), que es lo que produce `JSON({...})` en Power Fx; tambien se acepta una lista. Los nombres deben coincidir con los campos del origen (o con el titulo declarado en `titulos`). Si se omite, se exportan todos los campos con datos |
| `titulos` | Objeto | No | Encabezado de cada columna en Excel |
| `tipos` | Objeto | No | Tipo forzado por columna: `texto`, `entero`, `numero`, `moneda`, `porcentaje`, `fecha`, `fechaHora`, `hora`, `booleano` |
| `formatos` | Objeto | No | Formato de Excel literal por columna; tiene prioridad sobre `tipos` y sobre las propiedades globales |
| `archivo` | Texto | No | Nombre del archivo. Marcas: `{informe}`, `{nombre}`, `{fecha}`, `{hora}`. Se agrega `.xlsx` si falta |
| `hoja` | Texto | No | Nombre de la hoja (maximo 31 caracteres; se quitan los caracteres no validos) |
| `filtros` | Lista | No | **Ya no se usa**: los filtros se aplican en **Items**. Si se declara, se ignora sin generar errores (se conserva para futuras versiones) |
| `ordenarPor` | Texto | No | Columna de orden (una sola) |
| `ordenDescendente` | Si/No | No | Orden descendente. Predeterminado `false` |

Tambien se aceptan los alias en ingles `name`, `description`, `columns`, `titles`, `types`, `formats`, `fileName`, `sheetName`, `filters`, `sortBy` y `sortDescending`.

### 5.1 Ejemplo (dos informes)

Suponiendo que **Items** entrega registros con los campos `Pedido`, `Cliente`, `Estado`, `Fecha`, `FechaEntrega`, `Producto`, `Cantidad`, `Total` y `Vendedor`:

```powerfx
JSON({
    pedidos: {
        nombre: "Pedidos del periodo",
        descripcion: "Detalle de pedidos con su entrega",
        columnas: "Pedido,Cliente,Estado,Fecha,FechaEntrega,Producto,Cantidad,Total",
        titulos: { Pedido: "Pedido", Cliente: "Cliente", Estado: "Estado", Fecha: "Fecha del pedido", FechaEntrega: "Fecha de entrega", Producto: "Producto", Cantidad: "Cantidad", Total: "Total" },
        tipos: { Fecha: "fecha", FechaEntrega: "fecha", Cantidad: "entero", Total: "moneda" },
        archivo: "pedidos_{fecha}.xlsx",
        hoja: "Pedidos",
        ordenarPor: "Pedido"
    },
    por_vendedor: {
        nombre: "Ventas por vendedor",
        columnas: "Vendedor,Fecha,Pedido,Cliente,Estado,Total",
        titulos: { Vendedor: "Vendedor", Fecha: "Fecha del pedido", Pedido: "Pedido", Cliente: "Cliente", Estado: "Estado", Total: "Total" },
        tipos: { Fecha: "fecha", Total: "moneda" },
        archivo: "ventas_por_vendedor_{fecha}.xlsx",
        hoja: "Vendedores",
        ordenarPor: "Vendedor"
    }
})
```

El periodo de ambos informes lo define el `Filter()` que escribas en **Items**.

## 6. Filtrado en Items

El control **no filtra**: exporta exactamente los registros que recibe en **Items**. El filtrado se hace con Power Fx, igual que en una galeria, y puede usar cualquier control de la pantalla.

| Necesidad | Expresion en Items |
| --- | --- |
| Por estado o vendedor | `Filter(Pedidos, Estado = DropdownEstado.Selected.Value)` |
| Por texto | `Filter(Pedidos, Cliente = TextInputCliente.Text)` o `StartsWith(Cliente, TextInputCliente.Text)` |
| Periodo (columnas de fecha y hora) | `Filter(Pedidos, Fecha >= dttRangePickerVista.startDate && Fecha < DateAdd(dttRangePickerVista.endDate, 1, Days))` |
| Periodo (solo fecha) | `Filter(Pedidos, Fecha >= DateValue(dttRangePickerVista.startDate) && Fecha <= DateValue(dttRangePickerVista.endDate))` |
| Varias condiciones | `Filter(Pedidos, Estado = estadoSel.Value && Cliente = clienteSel.Value)` |

Puntos clave:

- **Todos los informes comparten** el resultado de `Items`: si necesitas periodos distintos, usa dos controles del PCF o cambia el `Filter()` con una variable.
- El panel muestra cuantos registros llegan en **Items** y el Excel escribe esa cantidad en la fila de resumen.
- Si `Items` queda vacio, el informe se genera solo con el encabezado y el panel avisa.
- **Limite de filas** corta la exportacion despues del filtro.

### 6.1 Reglas por informe (uso futuro)

La definicion del informe todavia admite la clave `filtros` (reglas por informe con valores), pero **sin una propiedad de valores de filtros no se aplica nada**: se puede dejar u omitir. Se conserva para una version futura en la que cada informe tenga su propio rango. Formas admitidas:

| Forma | Ejemplo |
| --- | --- |
| Token simple | `"vendedor"` (el operador se deduce del nombre: `inicio`/`desde` -> `>=`, `fin`/`hasta` -> `<=`, sin sufijo -> `=`) |
| Texto con operador | `"Total > 1000"`, `"Cliente contiene textoCliente"`, `"Fecha entre fechaInicio y fechaFin"` |
| Objeto | `{ "columna": "Fecha", "operador": "entre", "desde": "fechaInicio", "hasta": "fechaFin" }` |

Operadores: `=`, `<>`, `>`, `>=`, `<`, `<=`, `contiene`, `empieza`, `termina`, `entre`.

### 6.2 Comparaciones por tipo (referencia)

| Tipo de columna | Como se compara |
| --- | --- |
| `fecha` | Por dia (`=` = ese dia; `entre` incluye ambos extremos) |
| `fechaHora` | Por dia si el valor del filtro no trae hora; por minuto si la trae |
| `hora` | Por minuto del dia |
| `entero`, `numero`, `moneda`, `porcentaje` | Comparacion numerica |
| `texto` y demas | Texto normalizado (minusculas y sin acentos) |

## 7. Tipos de dato y formatos nativos

### 7.1 Deteccion automatica

El tipo de cada columna se decide en este orden:

1. La propiedad `tipos` del informe.
2. El tipo que informa el origen en **Items** (fecha, numero, booleano) o, si no lo informa, los valores: fechas en texto ISO (`2026-03-12`), numeros con separadores (`1.234,50`), monedas (`$ 1.234,50`) y porcentajes (`12,5%`).

### 7.2 Formatos predeterminados

| Tipo | Propiedad que lo define | Predeterminado |
| --- | --- | --- |
| `fecha` | *Formato de fecha Excel* | `dd/mm/yyyy` |
| `fechaHora` | *Formato de fecha y hora Excel* | `dd/mm/yyyy hh:mm` |
| `hora` | *Formato de hora Excel* | `hh:mm` |
| `entero` | *Formato de entero Excel* | `#,##0` |
| `numero` | *Formato de numero Excel* | `#,##0.00` |
| `moneda` | *Formato de moneda Excel* y *Codigo de moneda* | `#,##0.00 "USD"` o `"$" #,##0.00` |
| `porcentaje` | *Formato de porcentaje Excel* | `0.00%` |
| `booleano` | *Texto para verdadero / falso* | `Si` / `No` |
| `texto` | - | `@` |

Los formatos se escriben como **formato nativo de Excel** (`numFmt` mas estilo de celda): la fecha es una fecha real, el numero se puede sumar y la moneda respeta el formato regional. El tipo y el formato aplicados se consultan en el bloque *Columnas detectadas* o en la salida *Columnas detectadas (JSON)*.

### 7.3 Estructura del libro generado

```text
Fila 1  Nombre del informe                          <- Incluir titulo del informe
Fila 2  Generado: 18/09/2026 09:30 | Registros: 3 | Filtros: Fecha del pedido entre 2026-03-01 y 2026-03-31
Fila 3  (vacia)
Fila 4  Pedido | Cliente | Estado | Fecha del pedido | ...   <- encabezado con autofiltro
Fila 5  PED-1001 | Comercial Andina | Despachado | 12/03/2026 | ...
```

En la fila 2 los filtros se muestran con los valores recibidos (por eso las fechas aparecen como `yyyy-mm-dd`) y la ultima parte nombra la columna y el operador aplicados.

Las filas 1 y 2 dependen de *Incluir titulo del informe* e *Incluir resumen de filtros*; el encabezado de *Incluir encabezado* y *Autofiltro de Excel*; los anchos de *Ajustar ancho de columnas* (entre 8 y 60 caracteres).

## 8. Propiedades del control

### 8.1 Entradas

| Propiedad | Tipo | Predeterminado | Descripcion |
| --- | --- | --- | --- |
| **Items** | Conjunto de datos | - | Tabla o coleccion con los registros que se exportan, ya filtrados con Power Fx (seccion 4) |
| *Definicion de informes (JSON)* | Texto multilinea | vacio | Informes configurados (seccion 5) |
| *Validacion estricta* | Si/No | No | Bloquea la descarga si una columna o un tipo declarado no se pueden resolver |
| *Formato de fecha Excel* | Texto | `dd/mm/yyyy` | Formato nativo de las fechas y orden dia/mes al leer textos de fecha |
| *Formato de fecha y hora Excel* | Texto | `dd/mm/yyyy hh:mm` | Formato nativo de las columnas con hora |
| *Formato de hora Excel* | Texto | `hh:mm` | Formato nativo de las columnas de hora |
| *Formato de entero Excel* | Texto | `#,##0` | Formato nativo de los enteros |
| *Formato de numero Excel* | Texto | `#,##0.00` | Formato nativo de los decimales |
| *Formato de moneda Excel* | Texto | `#,##0.00 "USD"` o `"$" #,##0.00` | Formato nativo de las monedas |
| *Codigo de moneda* | Texto | vacio | Codigo ISO que se agrega al formato de moneda (`USD`, `COP`, `EUR`, ...) |
| *Formato de porcentaje Excel* | Texto | `0.00%` | Formato nativo de los porcentajes |
| *Texto para verdadero* / *Texto para falso* | Texto | `Si` / `No` | Texto de los booleanos en Excel |
| *Limite de filas* | Numero | `0` | Maximo de registros exportados; `0` exporta todos |
| *Incluir encabezado* | Si/No | Si | Escribe la fila de titulos |
| *Incluir titulo del informe* | Si/No | Si | Escribe el nombre del informe en la primera fila |
| *Incluir resumen de filtros* | Si/No | Si | Escribe la fecha de generacion, los registros y los filtros aplicados |
| *Autofiltro de Excel* | Si/No | Si | Deja el encabezado con autofiltro |
| *Ajustar ancho de columnas* | Si/No | Si | Calcula el ancho de cada columna |
| *Informe preseleccionado* | Texto | vacio | Clave del informe seleccionado al iniciar |
| *Reiniciar seleccion* | Si/No | No | Al cambiar de valor limpia la seleccion y el ultimo resultado |
| *Prioridad visual del panel* | Numero | `2147483647` | z-index del panel |

### 8.2 Textos de la interfaz

| Propiedad | Predeterminado |
| --- | --- |
| *Texto del boton* | `Informes` |
| *Titulo del panel* | `Exportar a Excel` |
| *Texto guia del panel* | `Elige un informe y descarga el archivo Excel con los datos filtrados.` |
| *Texto del boton de descarga* | `Descargar Excel` |
| *Texto mientras genera* | `Generando Excel...` |
| *Texto de exito* | `Excel generado` |
| *Texto sin informes* | `No hay informes definidos. Configura la propiedad Definicion de informes (JSON).` |
| *Texto sin registros* | `Sin registros para exportar con los filtros actuales.` |
| *Titulo de error* | `Revisa la configuracion del informe` |

### 8.3 Salidas

| Salida | Tipo | Descripcion |
| --- | --- | --- |
| *Informe seleccionado* | Texto | Clave del informe elegido en el panel |
| *Ultimo informe exportado* | Texto | Clave del ultimo informe exportado |
| *Nombre del ultimo informe* | Texto | Nombre del ultimo informe exportado |
| *Ultimo archivo generado* | Texto | Nombre del archivo descargado |
| *Filas del ultimo informe* | Numero | Filas escritas |
| *Estado del ultimo intento* | Texto | `listo`, `exportado` o `error` |
| *Mensaje de error* | Texto | Detalle del ultimo error |
| *Hubo error* | Si/No | Verdadero si el ultimo intento fallo |
| *Cantidad de columnas detectadas* | Numero | Columnas del origen enlazado |
| *Columnas detectadas (JSON)* | Texto | Nombre, nombre visible, tipo y formato de cada columna |

## 9. Ejemplo completo (datos inventados)

Pantalla con un `DateRangePicker`, un desplegable de vendedor y una etiqueta de aviso:

```powerfx
// Boton de la pantalla: limpiar el rango de fechas
Set(varReiniciar, true)                       // conectado a la propiedad Reiniciar seleccion del control

// Control ExcelReportPicker1
// Items  (aqui se filtra, como en una galeria)
Filter(Pedidos,
    Activo &&
    Fecha >= dttRangePickerVista.startDate &&
    Fecha < DateAdd(dttRangePickerVista.endDate, 1, Days) &&
    (IsBlank(DropdownVendedor.Selected.Value) || Vendedor = DropdownVendedor.Selected.Value)
)

// Definicion de informes (JSON)  -> contenido del ejemplo de la seccion 5.1

// Propiedades de formato y presentacion
// Formato de fecha Excel          = dd/mm/yyyy
// Formato de entero Excel         = #,##0
// Codigo de moneda                = USD
// Informe preseleccionado         = pedidos
// Validacion estricta             = false
// Limite de filas                 = 0

// Etiqueta de resultado
If(ExcelReportPicker1.hasError,
    "Error: " & ExcelReportPicker1.errorMessage,
    "Ultimo archivo: " & ExcelReportPicker1.lastFile & " (" & ExcelReportPicker1.lastRows & " filas)"
)
```

Resultado del informe `pedidos` con el rango 01/03/2026 a 31/03/2026:

| Pedido | Cliente | Estado | Fecha del pedido | Fecha de entrega | Producto | Cantidad | Total |
| --- | --- | --- | --- | --- | --- | --- | --- |
| PED-1001 | Comercial Andina | Entregado | 12/03/2026 | 15/03/2026 | Artículo A | 25 | $ 1,875.00 |
| PED-1002 | Distribuciones Norte | Despachado | 18/03/2026 | 22/03/2026 | Artículo B | 8 | $ 640.00 |
| PED-1003 | Almacén Central | En proceso | 27/03/2026 | 30/03/2026 | Artículo A | 50 | $ 3,750.00 |

En el archivo, *Cantidad* es un numero (se puede sumar) y *Total* es un numero con formato de moneda: no es texto.

## 10. Errores y avisos

| Mensaje en el panel | Causa | Solucion |
| --- | --- | --- |
| Sin datos. Enlaza una tabla o coleccion en Items | **Items** esta vacio | Enlaza el origen y revisa el `Filter()` que lo alimenta |
| La definicion de informes no es un JSON valido | Error de sintaxis en el texto de `reportsJson` (comillas, comas, llaves) | Revisa el `JSON({...})` paso a paso |
| La definicion de informes debe ser un objeto con un informe por clave | El valor no es un objeto con informes | Usa `{ "clave": { ... } }` |
| El informe "X" pide la columna "Y", que no esta enlazada | El nombre de `columnas` no coincide con ningun campo de **Items** | Revisa *Columnas detectadas* y corrige el nombre (respeta mayusculas) |
| El informe "X" no tiene columnas validas para exportar | Ninguna columna de `columnas` existe en el origen | Corrige los nombres o quita `columnas` para exportar todo |
| El valor "X" del filtro no corresponde al tipo de dato | Solo si declaras `filtros` en el informe (uso futuro) | Los filtros se aplican en **Items**; omite la clave `filtros` |
| Items no tiene registros con los filtros actuales | El `Filter()` de Items no deja filas | El archivo se genera solo con el encabezado; ajusta el filtro |
| Modo de validacion estricta... | La propiedad *Validacion estricta* esta activa y hay avisos | Corrige los avisos o desactiva la propiedad |

## 11. Empaquetado e importacion

> Este control es un **componente nuevo** dentro de la solucion: no hay que modificar los controles existentes. Cada control es una carpeta independiente con su propio `ControlManifest.Input.xml`.

### 11.1 Opcion A: crearlo desde Power Platform CLI

```powershell
mkdir MiInforme && cd MiInforme
pac pcf init --namespace ID10005 --name ExcelReportPicker --template field --npm
npm install
npm install xlsx@0.18.5
npm run build

# Agregarlo a la solucion existente
pac solution add-reference --path "C:\ruta\a\MiInforme"
dotnet build solution.cdsproj -c Release
```

### 11.2 Opcion B: agregarlo al proyecto PCF existente (como esta en este repositorio)

1. Crea la carpeta del control con `ControlManifest.Input.xml`, `index.ts`, la vista `.tsx`, el `.css`, `strings/*.resx` y los modulos de logica (`reportModel.ts`, `excelWriter.ts`).
2. Agrega la dependencia: `npm install xlsx@0.18.5`.
3. Compila el proyecto: `npm run build` (el `pcfproj` incluye cualquier carpeta con manifiesto, sin tocar el archivo de proyecto).
4. Reconstruye la solucion: `dotnet build solution.cdsproj -c Release` → `solution/bin/Release/solution.zip` y `solution_managed.zip`.
5. Importa el zip en **make.powerapps.com > Soluciones > Importar solucion**, publica todos los cambios y agrega el control desde **Insertar > Obtener mas componentes > Codigo**.

### 11.3 Versionado

| Que | Donde | Cuando |
| --- | --- | --- |
| Version del control | atributo `version` del manifiesto | En cada cambio; Power Apps Studio solo actualiza los componentes existentes si la version sube |
| Version de la solucion | `<Version>` en `solution/src/Other/Solution.xml` | Al publicar una entrega; Dataverse rechaza versiones menores o iguales a la instalada |

## 12. Limitaciones y buenas practicas

### 12.1 Limitaciones

- **Sin estilos de celda ni paneles congelados:** la libreria usada (SheetJS Community Edition) escribe formatos numericos, anchos y autofiltro, pero no negritas, colores ni bordes. Para una presentacion con estilo, aplica una plantilla al abrir el archivo.
- **Tamano del bundle:** incluye la libreria de Excel, por lo que el `bundle.js` es mayor que el de los demas controles (aprox. 1.6 MB sin minificar frente a ~0.8 MB de los controles de fecha).
- **Los datos vienen del origen enlazado:** el control solo lee **Items**, asi que los filtros y la reduccion de columnas se hacen ahi con Power Fx (`Filter`, `ShowColumns`) y el corte de filas con *Limite de filas*.
- **Una sola lectura del origen:** el control pide las paginas adicionales del conjunto de datos (hasta 5000 registros por pagina y 10 paginas); si el origen tiene mas filas, filtra en Power Fx.
- **Tipos:** con un origen tipado (Dataverse o coleccion con `DateValue`) el tipo llega solo; si una columna duda, declarala en `tipos`.
- **Generacion en el cliente:** todo el proceso ocurre en el navegador.
- **Descarga:** depende de la configuracion del navegador; en la aplicacion publicada y en dispositivos moviles la descarga la gestiona el sistema operativo del usuario.
- **Zona horaria:** las fechas se interpretan y escriben con la hora local del navegador; no hay conversion a UTC (una fecha de Dataverse con hora puede cambiar de dia si se envia como instante UTC y el usuario esta en otra zona).
- **Orden:** una sola columna de orden (`ordenarPor`); los valores vacios se ubican al final al ordenar ascendente.
- **Sin calculos:** el control no calcula diferencias ni totales; si los necesitas, agrega columnas calculadas con `AddColumns` en **Items** y exportalas como cualquier campo.
- **Sin acceso a datos:** el control solo usa los registros que llegan por **Items** (no consulta Dataverse por su cuenta).

### 12.2 Buenas practicas

1. Declara `titulos` en todos los informes: mejora el Excel y hace que los filtros cortos se resuelvan sin ambiguedad.
2. Declara `tipos` cuando la deteccion automatica pueda dudar (por ejemplo, importes o fechas que llegan como texto).
3. Declara en `columnas` solo los campos que se necesitan y en el orden en que deben aparecer en Excel.
4. Reduce **Items** con `Filter`/`ShowColumns` si el origen es grande; el control exporta exactamente lo que recibe.
5. Activa *Validacion estricta* durante la puesta a punto: convierte cada aviso en un bloqueo y evita entregar un Excel incompleto sin advertirlo.
6. Revisa *Columnas detectadas* antes de escribir el JSON para confirmar nombres y tipos.
7. Envia las fechas de filtro como texto `yyyy-mm-dd`.
8. Versiona manifiesto y solucion en cada entrega.

## 13. Seguridad

El control se ejecuta en el cliente (el navegador del usuario) y no abre canales de salida: no declara servicios externos ni dominios, no usa `fetch`, `XMLHttpRequest`, `WebSocket` ni `postMessage`, no evalua codigo (`eval`/`new Function`), no inyecta HTML y no guarda nada en `localStorage`, `sessionStorage` ni `indexedDB`. El libro se arma en memoria y se entrega con una descarga del navegador; el control no escribe en Dataverse ni en ningun servicio.

Medidas concretas frente a un libro de Excel malicioso o danado:

| Riesgo | Medida |
| --- | --- |
| Inyeccion de formulas (un dato que empieza por `=` o `+`) | Todos los valores se escriben como texto; el libro no contiene formulas ni hipervinculos, aunque el dato se reciba con `=` (verificado en el arnes: el XML no incluye `<f>`) |
| Caracteres invalidos que dana el archivo | Se quitan los caracteres de control, los no caracteres y los medios pares suplentes; cada celda se recorta a 32767 caracteres |
| Nombres de archivo maliciosos (`../`, rutas, nombres reservados) | El nombre se limpia: sin separadores de ruta, sin secuencias `..`, sin nombres reservados de Windows, con longitud limitada y extension `.xlsx` |
| Nombre de hoja invalido | Se quitan `[ ] \ / ? * :` y los caracteres de control, y se recorta a 31 caracteres |
| Campos con nombres heredados (`constructor`, `toString`) | Las lecturas de `titulos`, `tipos`, `formatos` y de los valores del origen usan busquedas propias, sin recorrer el prototipo |
| Volumen excesivo (bloqueo del navegador) | Maximo 5000 registros por pagina y 10 paginas, *Limite de filas* configurable, maximo de 16384 columnas y de 1 048 576 filas |
| Entradas corruptas | El JSON de `reportsJson` se analiza con control de errores; los problemas se muestran en el panel y en las salidas, sin romper la aplicacion |

En el repositorio: los extractos y exportaciones de clientes nunca se versionan (`.gitignore` bloquea `*.csv`, `*.tsv`, `*.xlsx`, `*.xls`, `*.accdb` y `*.mdb`) y todos los ejemplos de esta documentacion son inventados.

## 14. Comprobacion en la aplicacion

| # | Accion | Resultado esperado |
| --- | --- | --- |
| 1 | Enlazar la tabla o coleccion en **Items** (con el `Filter()` del periodo) | El panel lista los campos detectados con su tipo y formato |
| 2 | Abrir el panel | Aparece la lista de informes definidos en el JSON |
| 3 | Elegir un informe | Se muestra la barra con **Descargar Excel**, el archivo y los contadores |
| 4 | Descargar | Se descarga el `.xlsx` y aparece el mensaje de exito |
| 5 | Abrir el Excel: columna de fecha | Fecha real con el formato configurado (no texto) |
| 6 | Abrir el Excel: columna de moneda | Numero con el formato/simbolo de moneda |
| 7 | Cambiar el rango de fechas y volver a descargar | El archivo trae solo los registros del rango (fila *Generado...Filtros...*) |
| 8 | Dejar el rango vacio | El informe exporta todos los registros |
| 9 | Escribir un JSON invalido | El panel muestra el error con el detalle |
| 10 | Pedir una columna no mapeada | El panel muestra el aviso con el nombre de la columna |
| 11 | Poner `DisplayMode` en `View` | No se puede abrir el panel |
| 12 | Abrir el panel cerca del borde inferior | El panel se reubica para no salirse de la ventana |






