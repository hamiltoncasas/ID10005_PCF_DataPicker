# Ejemplo - ExcelReportPicker

> Fecha: 2026-10-25
> Descripcion: Caso completo de exportacion de pedidos filtrados a Excel, con dos informes, validacion estricta y lectura de las salidas. Referencia del control en [../ExcelReportPicker.md](../ExcelReportPicker.md).

## 1. Que construye

Una pantalla de **pedidos por periodo** con un selector de fechas, una galeria de vista previa y un exportador. El usuario elige el periodo, abre el panel del exportador, revisa las columnas detectadas y descarga el informe.

| Elemento | Nombre | Tipo |
| --- | --- | --- |
| Pantalla | `scrExportarPedidos` | Pantalla |
| Periodo | `rangoPedidos` | DateRangePicker |
| Galeria | `galPedidos` | Galeria vertical |
| Exportador | `expPedidos` | ExcelReportPicker |
| Estado | `lblEstadoExportacion` | Etiqueta |

## 2. Datos de prueba

```powerfx
// App.OnStart
ClearCollect(
    colPedidos,
    { Pedido: "PED-1001", Cliente: "Cliente Norte", Estado: "Entregado", Fecha: Date(2026, 3, 2), FechaEntrega: Date(2026, 3, 5), Producto: "Cafe molido 500 g", Cantidad: 12, Total: 148500 },
    { Pedido: "PED-1002", Cliente: "Cliente Centro", Estado: "Despachado", Fecha: Date(2026, 3, 3), FechaEntrega: Date(2026, 3, 6), Producto: "Te en hebras 250 g", Cantidad: 30, Total: 214000 },
    { Pedido: "PED-1003", Cliente: "Cliente Sur", Estado: "Pendiente", Fecha: Date(2026, 3, 4), FechaEntrega: Date(2026, 3, 10), Producto: "Cafe en grano 1 kg", Cantidad: 8, Total: 356000 },
    { Pedido: "PED-1004", Cliente: "Cliente Occidente", Estado: "Cancelada", Fecha: Date(2026, 3, 5), FechaEntrega: Date(2026, 3, 9), Producto: "Filtro de repuesto", Cantidad: 4, Total: 0 },
    { Pedido: "PED-1005", Cliente: "Cliente Norte", Estado: "Entregado", Fecha: Date(2026, 3, 6), FechaEntrega: Date(2026, 3, 9), Producto: "Cafetera de goteo", Cantidad: 2, Total: 520000 },
    { Pedido: "PED-1006", Cliente: "Cliente Oriente", Estado: "Despachado", Fecha: Date(2026, 3, 7), FechaEntrega: Date(2026, 3, 11), Producto: "Molino manual", Cantidad: 6, Total: 198000 }
)
```

Son datos inventados. La misma forma esta en [ExcelReportPicker-items.json](ExcelReportPicker-items.json).

## 3. Configuracion del exportador

| Propiedad | Valor |
| --- | --- |
| **Items (tabla o coleccion filtrada)** | `galPedidos.Items` (o la misma expresion `Filter` de la galeria) |
| *Definicion de informes (JSON)* | El JSON de la seccion 4 |
| *Validacion estricta* | `true` durante la prueba; `false` en produccion |
| *Limite de filas* | `0` |
| *Informe preseleccionado* | `"pedidos"` |
| *Incluir titulo del informe* | Activado |
| *Incluir resumen de filtros* | Activado |
| *Incluir encabezado* | Activado |
| *Autofiltro de Excel* | Activado |
| *Ajustar ancho de columnas* | Activado |
| *Formato de fecha Excel* | `dd/mm/yyyy` |
| *Formato de moneda Excel* | `#,##0.00` |
| *Codigo de moneda* | `USD` |
| *Reiniciar seleccion* | `varLimpiarExportacion` |
| *Ancho x alto* | `280 x 32` (cerrado) |

## 4. Definicion de informes

```powerfx
JSON({
    pedidos: {
        nombre: "Pedidos del periodo",
        descripcion: "Una fila por pedido, con entrega, producto y total",
        columnas: "Pedido,Cliente,Estado,Fecha,FechaEntrega,Producto,Cantidad,Total",
        titulos: {
            Pedido: "Pedido",
            Cliente: "Cliente",
            Estado: "Estado",
            Fecha: "Fecha del pedido",
            FechaEntrega: "Fecha de entrega",
            Producto: "Producto",
            Cantidad: "Unidades",
            Total: "Total"
        },
        tipos: { Fecha: "fecha", FechaEntrega: "fecha", Cantidad: "entero", Total: "moneda" },
        archivo: "pedidos_{fecha}.xlsx",
        hoja: "Pedidos",
        filtros: "Estado <> Cancelada; Total > 0",
        ordenarPor: "Pedido"
    },
    listado_por_estado: {
        nombre: "Listado por estado",
        descripcion: "Pedidos ordenados por estado y fecha",
        columnas: "Estado,Pedido,Cliente,Fecha,Total",
        titulos: { Fecha: "Fecha del pedido", Total: "Total" },
        tipos: { Fecha: "fecha", Total: "moneda" },
        archivo: "pedidos_por_estado_{fecha}_{hora}.xlsx",
        hoja: "Por estado",
        filtros: "Estado = [Entregado, Despachado]; Total > 0",
        ordenarPor: "Estado"
    }
})
```

El objeto exterior es el diccionario de informes. `pedidos` y `listado_por_estado` son claves internas; `nombre` es lo que ve el usuario. El JSON completo con tres informes esta en [ExcelReportPicker-informes.json](ExcelReportPicker-informes.json).

## 5. Formulas de la pantalla

### 5.1 Filtro compartido

```powerfx
// Items de la galeria y del exportador
Filter(
    colPedidos,
    Fecha >= DateValue(rangoPedidos.startDate) &&
    Fecha <= DateValue(rangoPedidos.endDate)
)
```

El exportador recibe exactamente estos registros. Los `filtros` de cada informe se aplican **ademas** sobre ese resultado.

### 5.2 Estado de la exportacion

```powerfx
If(
    expPedidos.isLoading,
    "Cargando los pedidos...",
    expPedidos.hasError,
    "Error: " & expPedidos.errorMessage,
    IsBlank(expPedidos.lastFile),
    "Elige un informe y pulsa Descargar Excel.",
    "Archivo: " & expPedidos.lastFile & " (" & expPedidos.lastRows & " filas)"
)
```

`lastStatus` vale `listo`, `exportado` o `error`. No interpretes `hasError = false` como exito de descarga: antes de la primera exportacion tambien es falso y `lastFile` esta vacio.

### 5.3 Limpiar el estado

```powerfx
Set(varLimpiarExportacion, !varLimpiarExportacion)
```

La propiedad *Reiniciar seleccion* limpia el informe elegido y el ultimo resultado.

## 6. Pasos de uso en la aplicacion

1. Abre la pantalla con el periodo `2026-03-01` a `2026-03-31`.
2. Comprueba que la galeria de vista previa muestra seis pedidos, incluido el cancelado.
3. Pulsa el control de Excel: el panel lista **Pedidos del periodo** y **Listado por estado**.
4. Elige **Pedidos del periodo**. Revisa los contadores: 8 columnas y 5 registros despues de aplicar `filtros`.
5. Pulsa **Descargar Excel** y abre el archivo `pedidos_<fecha>.xlsx`. Debe tener 5 filas de datos y los encabezados definidos en `titulos`.
6. Elige **Listado por estado** y descarga: debe tener 4 filas (Entregado y Despachado con total mayor que cero).
7. Revisa `lblEstadoExportacion`: debe mostrar el ultimo archivo y el numero de filas.

## 7. Pruebas sugeridas

| # | Accion | Resultado esperado |
| --- | --- | --- |
| 1 | Abrir el panel | Se listan los dos informes del JSON |
| 2 | Elegir Pedidos del periodo | El contador de columnas es 8 y el de registros es 5 |
| 3 | Descargar | Se genera un `.xlsx` que Excel abre sin reparaciones |
| 4 | Revisar el libro | Fila 1 con el nombre, fila 2 con fecha y filtros, encabezados y 5 filas |
| 5 | Descargar Listado por estado | El archivo tiene 4 filas y orden por estado |
| 6 | Escribir una columna inexistente con validacion estricta | La descarga se bloquea y el panel identifica el campo |
| 7 | Poner *Limite de filas* en 3 y descargar | `lastRows` es 3 y el archivo tiene 3 filas |
| 8 | Elegir un periodo sin pedidos | El panel muestra `Registros: 0`; si se descarga, el libro conserva titulo, resumen y encabezado, sin filas de datos, y el aviso incluye *Texto sin registros* |
| 9 | Revisar `lblEstadoExportacion` | Muestra el nombre del archivo y las filas, o el error |

## 8. Variantes utiles

### 8.1 Exportar solo cuando el usuario confirme

```powerfx
// Boton Consultar
ClearCollect(
    colInforme,
    Filter(
        colPedidos,
        Fecha >= DateValue(rangoPedidos.startDate) &&
        Fecha <= DateValue(rangoPedidos.endDate)
    )
);

// Items del exportador
colInforme
```

Asi el exportador no cambia mientras el usuario ajusta el periodo.

### 8.2 Abrir siempre en un informe concreto

En *Informe preseleccionado* escribe la clave, no el nombre visible:

```powerfx
"pedidos"
```

### 8.3 Informe con formato de moneda propio

Dentro de un informe, el formato de una columna tiene prioridad sobre las propiedades globales:

```powerfx
formatos: { Total: "\"USD\" #,##0.00" }
```

### 8.4 Exportar todas las columnas detectadas

El control no exporta automaticamente todas las columnas: el informe debe declarar `columnas`. Para construir la lista, abre el panel, pulsa **Copiar nombres** y pegala en el JSON. La salida `availableColumnsJson` guarda la descripcion de columnas, tipos y formatos para diagnostico.

### 8.5 Diagnostico sin bloquear al usuario

Durante la puesta a punto usa *Validacion estricta* = `true` y revisa el panel. En produccion, `false` permite exportar lo que se pueda resolver y deja el aviso visible. No ignores `hasError`: enlazalo a una etiqueta o a `Notify`.

## 9. Problemas comunes

| Sintoma | Causa probable | Solucion |
| --- | --- | --- |
| El panel no lista informes | El JSON esta vacio o mal formado | Valida el `JSON({...})` y revisa `errorMessage` |
| Una columna sale vacia | El nombre no coincide con el origen | Usa **Copiar nombres** o el nombre logico |
| La descarga se bloquea | *Validacion estricta* activa y una columna no se resuelve | Corrige el nombre o desactiva la validacion para esa prueba |
| El archivo no incluye los registros esperados | El filtro esta en `Items`, no en el JSON | Revisa la expresion de **Items** y los `filtros` del informe |
| `lastFile` esta vacio | Todavia no se descargo ningun archivo | Trata el estado inicial en la etiqueta |
| El libro tiene menos filas que la galeria | *Limite de filas* o `filtros` recortan el resultado | Revisa ambos valores |
| Los importes salen como texto | El tipo se detecto como texto | Declara `tipos: { Total: "moneda" }` |

## 10. Referencia

- Propiedades, salidas y contrato del JSON: [../ExcelReportPicker.md](../ExcelReportPicker.md)
- Informes de ejemplo: [ExcelReportPicker-informes.json](ExcelReportPicker-informes.json)
- Registros de ejemplo: [ExcelReportPicker-items.json](ExcelReportPicker-items.json)
- Publicacion de la solucion: [../README.md](../README.md#6-instalar-y-usar-en-power-apps)
