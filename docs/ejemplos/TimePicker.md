# Ejemplo - TimePicker

> Fecha: 2026-11-10
> Descripcion: Caso completo de captura de una hora con TimePicker, incluida la precarga, el rango horario y la combinacion con una fecha. Referencia del control en [../TimePicker.md](../TimePicker.md).

## 1. Que construye

Una pantalla para **registrar el cierre de caja**. El usuario elige el dia con un `DatePicker`, la hora de corte con un `TimePicker` y guarda el registro. La misma pantalla sirve para crear y para editar: al editar, el control de hora se precarga con el valor almacenado.

| Elemento | Nombre | Tipo |
| --- | --- | --- |
| Pantalla | `scrCorte` | Pantalla |
| Dia | `dtpDia` | DatePicker |
| Hora de corte | `tpCorte` | TimePicker |
| Responsable | `txtResponsable` | Entrada de texto |
| Guardar | `btnGuardarCorte` | Boton |

## 2. Datos de prueba

```powerfx
// App.OnStart
ClearCollect(
    colCortes,
    {
        ID: 1,
        Dia: DateValue("2026-11-09"),
        HoraCorte: "20:00:00",
        Responsable: "Ana"
    }
);
Set(varSiguienteCorte, 2);
Set(varCorteEditado, Blank());
Set(varLimpiarHora, false)
```

`HoraCorte` se guarda como **texto tecnico** `HH:mm:ss`. Si la columna destino es de fecha y hora, combina la fecha y la hora antes de guardar (ver 4.5).

## 3. Configuracion del control

| Propiedad | Valor |
| --- | --- |
| *Usar formato de 24 horas* | Activado |
| *Mostrar segundos* | Desactivado |
| *Formato* | `HH:mm` |
| *Intervalo de minutos* | `15` |
| *Hora inicial* / *Hora final* | `6` / `22` |
| *Hora predeterminada* | `If(!IsBlank(varCorteEditado), varCorteEditado.HoraCorte)` |
| *Reiniciar selección* | `varLimpiarHora` |
| *Fuente del texto* | `Segoe UI` |
| *Tamaño de la fuente* | `13` |
| *Ancho x alto* | `200 x 32` (cerrado) |

La hora precargada puede venir como `20:00:00`, `20:00` o `8:00 PM`; el control la normaliza a `HH:mm:ss`. Si el texto no es una hora valida, se ignora y el panel abre con la hora actual alineada a 15 minutos.

## 4. Formulas de la pantalla

### 4.1 Al mostrar la pantalla

```powerfx
Set(varCorteEditado, Blank());
Set(varLimpiarHora, false);
Set(varUltimoCorte, Blank())
```

### 4.2 Boton Guardar

```powerfx
If(
    IsBlank(tpCorte.selectedTime),
    Notify("Selecciona la hora de corte.", NotificationType.Warning),
    Collect(
        colCortes,
        {
            ID: varSiguienteCorte,
            Dia: DateValue(dtpDia.date),
            HoraCorte: tpCorte.selectedTime,
            Responsable: Trim(txtResponsable.Text)
        }
    );
    Set(varSiguienteCorte, varSiguienteCorte + 1);
    Set(varLimpiarHora, !varLimpiarHora);
    Notify("Corte registrado.", NotificationType.Success)
)
```

### 4.3 Resumen legible

```powerfx
If(
    IsBlank(tpCorte.selectedTime),
    "Sin hora",
    "Corte a las " & Text(TimeValue(tpCorte.selectedTime), "hh:mm AM/PM")
)
```

### 4.4 Leer las partes como numeros

```powerfx
// Etiqueta de hora, minuto y segundo
tpCorte.hour & " h " & tpCorte.minute & " min"

// Comparar con un limite (por ejemplo, cierres despues de las 18)
tpCorte.hour >= 18
```

### 4.5 Guardar en una columna de fecha y hora

```powerfx
Patch(
    colCortes,
    LookUp(colCortes, ID = varCorteEditado.ID),
    {
        // Combina la fecha del DatePicker con la hora tecnica del TimePicker
        Dia: DateTimeValue(dtpDia.date & "T" & tpCorte.selectedTime),
        HoraCorte: tpCorte.selectedTime,
        Responsable: Trim(txtResponsable.Text)
    }
);
Set(varCorteEditado, Blank());
Set(varLimpiarHora, !varLimpiarHora)
```

`selectedTime` siempre trae los segundos (`HH:mm:ss`), por lo que el texto combinado es un instante ISO valido para `DateTimeValue`.

### 4.6 Editar un corte

```powerfx
// Al seleccionar una fila de la galeria
Set(varCorteEditado, ThisItem)
```

Con *Hora predeterminada* enlazada a `varCorteEditado`, el control muestra la hora del registro. No alternes *Reiniciar selección* en la misma accion: el reinicio tiene prioridad y dejaria el control vacio.

## 5. Pruebas sugeridas

| # | Accion | Resultado esperado |
| --- | --- | --- |
| 1 | Abrir el panel sin valor | La hora propuesta es la actual alineada a 15 minutos |
| 2 | Pulsar Guardar sin hora | Aviso; no se guarda nada |
| 3 | Elegir 20:00 | `tpCorte.selectedTime` publica `20:00:00` |
| 4 | Pulsar Guardar | La coleccion recibe `HoraCorte` como texto `20:00:00` |
| 5 | Editar el corte | El control muestra 20:00 y el panel abre en esa hora |
| 6 | Elegir 23:00 | La hora no aparece en la lista: el rango termina a las 22 |
| 7 | Pulsar Limpiar | `selectedTime` queda vacia y `hour`, `minute` y `second` vuelven a `0` |

## 6. Variantes utiles

### 6.1 Mostrar en formato de 12 horas

Desactiva *Usar formato de 24 horas* o deja *Formato* en `hh:mm A`. La salida no cambia: sigue siendo `HH:mm:ss` en 24 horas.

```powerfx
Text(TimeValue(tpCorte.selectedTime), "hh:mm AM/PM")
```

### 6.2 Precision en segundos

Activa *Mostrar segundos* y pon *Intervalo de minutos* en `1`. La salida conserva el segundo elegido (`20:00:37`) y la lista de segundos permite ajustarlo.

### 6.3 Turno nocturno

Configura *Hora inicial* `22` y *Hora final* `6`. La lista ofrece `22`, `23`, `0`, `1`, ... `6`; la validacion de negocio sigue siendo responsabilidad de Power Fx.

### 6.4 Validar un intervalo de horas

Para un turno con hora de inicio y hora de fin usa dos `TimePicker` y compara los valores como texto tecnico (ambos usan `HH:mm:ss`, por lo que la comparacion lexicografica coincide con el orden temporal dentro del mismo dia):

```powerfx
If(
    tpFin.selectedTime <= tpInicio.selectedTime,
    Notify("La hora final debe ser posterior a la inicial.", NotificationType.Warning)
)
```

Si el turno cruza la medianoche, define la regla del negocio: el texto `00:30:00` es menor que `22:00:00`, por lo que ese caso requiere una validacion aparte.

## 7. Problemas comunes

| Sintoma | Causa probable | Solucion |
| --- | --- | --- |
| La precarga no aparece | El texto no es una hora valida | Usa `HH:mm`, `HH:mm:ss`, `hh:mm AM/PM` o una fecha y hora ISO |
| `selectedTime` esta vacio tras pulsar Limpiar | Es el comportamiento esperado | Vuelve a elegir una hora o precarga el valor |
| `DateTimeValue` falla al combinar | Se uso `dtpDia.date` vacio | Comprueba que la fecha tenga valor antes de combinar |
| Los segundos siempre son `00` | *Mostrar segundos* esta desactivado | Activa la propiedad y elige el segundo |
| No se pueden elegir horas de la tarde | El rango termina antes (por ejemplo, `6` a `12`) | Amplia *Hora final* |

## 8. Referencia

- Propiedades, salidas y formatos de hora: [../TimePicker.md](../TimePicker.md)
- Formatos compartidos: [../README.md](../README.md#7-formatos-de-fecha-y-hora)
- Instalacion de la solucion: [../README.md](../README.md#6-instalar-y-usar-en-power-apps)

