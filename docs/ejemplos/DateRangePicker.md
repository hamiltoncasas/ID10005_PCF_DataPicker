# Ejemplo - DateRangePicker

> Fecha: 2026-10-25
> Descripcion: Caso completo de filtro por rango de fechas con DateRangePicker, incluido el tratamiento del dia final. Referencia del control en [../DateRangePicker.md](../DateRangePicker.md).

## 1. Que construye

Una pantalla de **pedidos por periodo** con una galeria filtrada por dos fechas. El control publica `startDate` y `endDate`; la galeria y una etiqueta de total usan esos valores. El ejemplo fija un periodo de prueba y muestra al final como usar un periodo movil de 30 dias.

| Elemento | Nombre | Tipo |
| --- | --- | --- |
| Pantalla | `scrPedidosPeriodo` | Pantalla |
| Rango | `rangoPedidos` | DateRangePicker |
| Galeria | `galPedidos` | Galeria vertical |
| Total | `lblTotal` | Etiqueta |
| Limpiar | `btnLimpiarRango` | Boton |

## 2. Datos de prueba

```powerfx
// App.OnStart
ClearCollect(
    colPedidos,
    { Pedido: 1001, Cliente: "Cliente Norte", Fecha: Date(2026, 9, 30), Total: 120 },
    { Pedido: 1002, Cliente: "Cliente Sur", Fecha: Date(2026, 10, 1), Total: 80 },
    { Pedido: 1003, Cliente: "Cliente Este", Fecha: Date(2026, 10, 15), Total: 250 },
    { Pedido: 1004, Cliente: "Cliente Oeste", Fecha: Date(2026, 10, 31), Total: 90 },
    { Pedido: 1005, Cliente: "Cliente Norte", Fecha: Date(2026, 11, 1), Total: 60 }
);
Set(varLimpiarRango, false)
```

Con el periodo `2026-10-01` a `2026-10-31` deben quedar tres pedidos: 1002, 1003 y 1004.

## 3. Configuracion del control

| Propiedad | Valor |
| --- | --- |
| *Formato de fecha* | `YYYY-MM-DD` |
| *Fecha inicial precargada* | `"2026-10-01"` |
| *Fecha final precargada* | `"2026-10-31"` |
| *Reiniciar selección* | `varLimpiarRango` |
| *Primer día de la semana* | `monday` |
| *Fecha mínima* | `"2026-01-01"` |
| *Fecha máxima* | `"2026-12-31"` |
| *Texto de ayuda del campo* | `Selecciona el periodo` |
| *Etiqueta accesible* | `Periodo de pedidos` |
| *Ancho x alto* | `380 x 32` (cerrado) |

Para produccion, cambia las fechas iniciales por un periodo movil:

```powerfx
// Fecha inicial precargada
Text(DateAdd(Today(), -29, Days), "yyyy-mm-dd")

// Fecha final precargada
Text(Today(), "yyyy-mm-dd")
```

## 4. Formulas de la pantalla

### 4.1 Items de la galeria

```powerfx
Filter(
    colPedidos,
    Fecha >= DateValue(rangoPedidos.startDate) &&
    Fecha <= DateValue(rangoPedidos.endDate)
)
```

Si `Fecha` incluyera hora, usa el limite superior exclusivo para no perder los registros del ultimo dia:

```powerfx
Filter(
    colPedidos,
    Fecha >= DateValue(rangoPedidos.startDate) &&
    Fecha < DateAdd(DateValue(rangoPedidos.endDate), 1, Days)
)
```

### 4.2 Total del periodo

```powerfx
Sum(
    Filter(
        colPedidos,
        Fecha >= DateValue(rangoPedidos.startDate) &&
        Fecha <= DateValue(rangoPedidos.endDate)
    ),
    Total
)
```

### 4.3 Texto del periodo

```powerfx
If(
    IsBlank(rangoPedidos.endDate),
    "Selecciona la fecha final",
    Text(DateValue(rangoPedidos.startDate), "dd/mm/yyyy") &
    " - " &
    Text(DateValue(rangoPedidos.endDate), "dd/mm/yyyy")
)
```

### 4.4 Habilitar Consultar solo con el rango completo

```powerfx
// DisplayMode del boton Consultar
If(
    IsBlank(rangoPedidos.startDate) || IsBlank(rangoPedidos.endDate),
    DisplayMode.Disabled,
    DisplayMode.Edit
)
```

### 4.5 Limpiar el rango

```powerfx
Set(varLimpiarRango, !varLimpiarRango)
```

La propiedad *Reiniciar selección* se dispara con el cambio y deja el rango vacio. Si despues quieres volver a mostrar un periodo concreto, no vuelvas a alternar esta variable: enlaza *Fecha inicial precargada* y *Fecha final precargada* a variables y asigna el periodo con `Set` (ver la variante 6.3).

## 5. Pruebas sugeridas

| # | Accion | Resultado esperado |
| --- | --- | --- |
| 1 | Abrir la pantalla | El rango muestra 01/10/2026 a 31/10/2026 |
| 2 | Revisar la galeria | Aparecen los pedidos 1002, 1003 y 1004 |
| 3 | Revisar el total | La etiqueta suma 420 |
| 4 | Elegir 2026-10-31 como unico dia | Solo aparece el pedido 1004 |
| 5 | Elegir primero el 31 y despues el 1 | El control ordena el rango y mantiene el resultado |
| 6 | Primer clic en un dia nuevo | `endDate` queda vacio y el boton Consultar se deshabilita |
| 7 | Pulsar Limpiar | Las dos salidas quedan vacias y la galeria no recibe un rango invalido |

## 6. Variantes utiles

### 6.1 Periodo movil de 30 dias

Sustituye las fechas iniciales por las expresiones de la seccion 3. Cada vez que se abre la pantalla, el rango termina hoy.

### 6.2 Filtro con valores opcionales

Si quieres que un rango vacio muestre todo:

```powerfx
Filter(
    colPedidos,
    IsBlank(rangoPedidos.startDate) || Fecha >= DateValue(rangoPedidos.startDate),
    IsBlank(rangoPedidos.endDate) || Fecha <= DateValue(rangoPedidos.endDate)
)
```

`Filter` con varias condiciones las combina con AND; las condiciones con `||` permiten que un extremo vacio no restrinja.

### 6.3 Rango predefinido por botones

```powerfx
// Ultimos 7 dias
Set(varInicioRango, Text(DateAdd(Today(), -6, Days), "yyyy-mm-dd"));
Set(varFinRango, Text(Today(), "yyyy-mm-dd"))
```

Enlaza *Fecha inicial precargada* a `varInicioRango` y *Fecha final precargada* a `varFinRango`. Al cambiar las variables, el control detecta nuevos valores iniciales y adopta el rango; no hace falta alternar *Reiniciar selección*.

### 6.4 Exportar el periodo

La misma expresion de **Items** de la galeria se puede usar en la propiedad **Items** de `ExcelReportPicker`. El exportador recibe ya filtrados los pedidos del periodo.

## 7. Problemas comunes

| Sintoma | Causa probable | Solucion |
| --- | --- | --- |
| La galeria aparece vacia al abrir | Alguno de los extremos esta vacio | Precarga las dos fechas o trata el vacio con `IsBlank` |
| Falta el ultimo dia | La columna tiene hora y se compara con `<=` a medianoche | Usa `< DateAdd(fin, 1, Days)` |
| El dia final se duplica o se pierde | Se sumo un dia a una columna de solo fecha | Usa `<=` cuando la columna no tiene hora |
| El rango se invierte | El usuario eligio el fin antes que el inicio | El control lo reordena; valida igualmente antes de consultar |
| Reiniciar no restaura el periodo inicial | La variable no cambia de valor | Alterna la variable con `!` en lugar de asignar `true` |

## 8. Referencia

- Propiedades, salidas y formato: [../DateRangePicker.md](../DateRangePicker.md)
- Formatos compartidos: [../README.md](../README.md#7-formatos-de-fecha-y-hora)
- Ejemplo de exportacion: [ExcelReportPicker.md](ExcelReportPicker.md)
