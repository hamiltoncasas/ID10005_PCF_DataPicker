# Ejemplo - DateTimeRangePicker

> Fecha: 2026-10-25
> Descripcion: Caso completo de filtro por intervalo de fecha y hora con DateTimeRangePicker. Referencia del control en [../DateTimeRangePicker.md](../DateTimeRangePicker.md).

## 1. Que construye

Una pantalla de **movimientos por turno** que filtra una galeria entre dos instantes exactos. El ejemplo usa un turno de manana, muestra como tratar el limite final de forma inclusiva o exclusiva y como precargar el intervalo de un registro existente.

| Elemento | Nombre | Tipo |
| --- | --- | --- |
| Pantalla | `scrMovimientosTurno` | Pantalla |
| Intervalo | `rangoTurno` | DateTimeRangePicker |
| Galeria | `galMovimientos` | Galeria vertical |
| Resumen | `lblResumenTurno` | Etiqueta |
| Limpiar | `btnLimpiarTurno` | Boton |

## 2. Datos de prueba

```powerfx
// App.OnStart
ClearCollect(
    colMovimientos,
    { ID: 1, Operador: "Ana", FechaHora: DateTimeValue("2026-10-28T07:59"), Tipo: "Entrada" },
    { ID: 2, Operador: "Ana", FechaHora: DateTimeValue("2026-10-28T08:00"), Tipo: "Inicio turno" },
    { ID: 3, Operador: "Luis", FechaHora: DateTimeValue("2026-10-28T12:15"), Tipo: "Pausa" },
    { ID: 4, Operador: "Ana", FechaHora: DateTimeValue("2026-10-28T17:59"), Tipo: "Actividad" },
    { ID: 5, Operador: "Luis", FechaHora: DateTimeValue("2026-10-28T18:00"), Tipo: "Fin turno" }
);
Set(varLimpiarTurno, false)
```

Con el intervalo `2026-10-28T08:00` a `2026-10-28T18:00` y limite inclusivo deben aparecer los movimientos 2, 3, 4 y 5.

## 3. Configuracion del control

| Propiedad | Valor |
| --- | --- |
| *Formato de fecha* | `YYYY-MM-DD` |
| *Formato de hora* | `24` |
| *Fecha y hora inicial precargada* | `"2026-10-28T08:00"` |
| *Fecha y hora final precargada* | `"2026-10-28T18:00"` |
| *Reiniciar selección* | `varLimpiarTurno` |
| *Zona horaria de los valores* | `Local` |
| *Etiqueta accesible* | `Intervalo del turno` |
| *Ancho x alto* | `520 x 32` (cerrado, dos campos) |

En el panel cada extremo tiene fecha y un selector de hora con pasos de 15 minutos. Los valores iniciales deben incluir la `T`; si un valor no trae hora, el control usa la hora actual alineada a 15 minutos.

## 4. Formulas de la pantalla

### 4.1 Items de la galeria (fin inclusivo)

```powerfx
Filter(
    colMovimientos,
    FechaHora >= DateTimeValue(rangoTurno.startDateTime) &&
    FechaHora <= DateTimeValue(rangoTurno.endDateTime)
)
```

### 4.2 Items de la galeria (fin exclusivo)

```powerfx
Filter(
    colMovimientos,
    FechaHora >= DateTimeValue(rangoTurno.startDateTime) &&
    FechaHora < DateTimeValue(rangoTurno.endDateTime)
)
```

Usa el limite exclusivo cuando el siguiente intervalo empieza exactamente en el fin del actual; asi un movimiento no aparece en dos turnos.

### 4.3 Resumen legible

```powerfx
If(
    IsBlank(rangoTurno.startDateTime) || IsBlank(rangoTurno.endDateTime),
    "Selecciona el intervalo completo",
    Text(DateTimeValue(rangoTurno.startDateTime), "dd/mm/yyyy HH:mm") &
    " - " &
    Text(DateTimeValue(rangoTurno.endDateTime), "dd/mm/yyyy HH:mm")
)
```

### 4.4 Validar el intervalo

```powerfx
If(
    IsBlank(rangoTurno.startDateTime) || IsBlank(rangoTurno.endDateTime),
    Notify("Selecciona el inicio y el fin del turno.", NotificationType.Warning),
    If(
        DateTimeValue(rangoTurno.startDateTime) > DateTimeValue(rangoTurno.endDateTime),
        Notify("El inicio no puede ser posterior al fin.", NotificationType.Warning),
        Notify("Intervalo listo para consultar.", NotificationType.Success)
    )
)
```

### 4.5 Limpiar y precargar al editar

```powerfx
// Boton Limpiar
Set(varLimpiarTurno, !varLimpiarTurno)

// Precarga desde un registro con campos Inicio y Fin
// Fecha y hora inicial precargada
Text(varTurno.Inicio, "yyyy-mm-dd") & "T" & Text(varTurno.Inicio, "HH:mm")

// Fecha y hora final precargada
Text(varTurno.Fin, "yyyy-mm-dd") & "T" & Text(varTurno.Fin, "HH:mm")
```

## 5. Pruebas sugeridas

| # | Accion | Resultado esperado |
| --- | --- | --- |
| 1 | Abrir la pantalla | El resumen muestra 28/10/2026 08:00 a 28/10/2026 18:00 |
| 2 | Revisar la galeria con fin inclusivo | Aparecen los movimientos 2, 3, 4 y 5 |
| 3 | Cambiar el fin a 17:45 | Desaparecen los movimientos 4 y 5 y el resumen se actualiza |
| 4 | Cambiar solo la hora de inicio a 12:00 | El dia se conserva y el filtro empieza al mediodia |
| 5 | Pulsar Limpiar | `startDateTime` y `endDateTime` quedan vacios |
| 6 | Precargar con un registro existente | Los dos campos muestran la fecha y la hora del turno |
| 7 | Repetir la busqueda | Cada cambio de hora se publica sin pulsar un boton de confirmar |

## 6. Variantes utiles

### 6.1 Turno que cruza la medianoche

El control admite fechas distintas en cada extremo, asi que un turno de 22:00 a 06:00 se elige con inicio el 28/10 a las 22:00 y fin el 29/10 a las 06:00. Para no incluir el relevo que empieza justo a las 06:00, usa el limite superior exclusivo:

```powerfx
Filter(
    colMovimientos,
    FechaHora >= DateTimeValue(rangoTurno.startDateTime),
    FechaHora < DateTimeValue(rangoTurno.endDateTime)
)
```

Si el negocio necesita turnos nocturnos, tambien puedes guardar una columna de turno y filtrar por ella ademas del intervalo.

### 6.2 Intervalo de 24 horas

```powerfx
// Fecha y hora inicial precargada: hoy a las 00:00
Text(Today(), "yyyy-mm-dd") & "T00:00"

// Fecha y hora final precargada: hoy a las 23:45
Text(Today(), "yyyy-mm-dd") & "T23:45"
```

Como el selector avanza de 15 en 15 minutos, el ultimo valor disponible del dia es `23:45`. Para incluir la medianoche, elige como fin el dia siguiente a las `00:00` y usa el limite superior exclusivo (`<`).

### 6.3 Mostrar la duracion

```powerfx
DateDiff(
    DateTimeValue(rangoTurno.startDateTime),
    DateTimeValue(rangoTurno.endDateTime),
    Minutes
) & " minutos"
```

Valida primero que los dos extremos tengan valor.

### 6.4 Exportar los movimientos del turno

Enlaza la propiedad **Items** de `ExcelReportPicker` a la misma tabla filtrada de la seccion 4.1. El informe recibe solo los movimientos del intervalo.

## 7. Problemas comunes

| Sintoma | Causa probable | Solucion |
| --- | --- | --- |
| No aparece ningun movimiento | Los extremos estan vacios o invertidos | Precarga el intervalo y valida `inicio <= fin` |
| Falta el movimiento del fin | Se uso `<` en lugar de `<=` | Elige el limite segun la regla del negocio |
| El movimiento del fin aparece en dos turnos | Se uso `<=` en turnos consecutivos | Usa `<` en el fin |
| La hora no se conserva al cambiar el dia | Se reconstruyo el texto sin la parte `T` | Usa `Text(fecha, "yyyy-mm-dd") & "T" & Text(fecha, "HH:mm")` |
| El selector solo permite horas cada 15 minutos | Es el paso definido por el control | Elige el multiplo mas cercano o ajusta el dato antes de guardarlo |

## 8. Referencia

- Propiedades, salidas y formatos: [../DateTimeRangePicker.md](../DateTimeRangePicker.md)
- Formatos compartidos: [../README.md](../README.md#7-formatos-de-fecha-y-hora)
- Ejemplo de exportacion: [ExcelReportPicker.md](ExcelReportPicker.md)
