# Ejemplo - DateTimePicker

> Fecha: 2026-10-25
> Descripcion: Caso completo de registro de una fecha y hora con DateTimePicker, incluida la precarga al editar y la conversion a UTC. Referencia del control en [../DateTimePicker.md](../DateTimePicker.md).

## 1. Que construye

Una pantalla para **agendar visitas tecnicas**. El usuario escribe el cliente, elige el dia y la hora de la visita y guarda el registro. La misma pantalla sirve para crear y para editar: al editar, el control se precarga con la fecha y hora almacenadas.

| Elemento | Nombre | Tipo |
| --- | --- | --- |
| Pantalla | `scrVisita` | Pantalla |
| Cliente | `txtCliente` | Entrada de texto |
| Fecha y hora | `dtpVisita` | DateTimePicker |
| Tecnico | `cmbTecnico` | Desplegable |
| Guardar | `btnAgendar` | Boton |

## 2. Datos de prueba

```powerfx
// App.OnStart
ClearCollect(
    colVisitas,
    {
        ID: 1,
        Cliente: "Cliente Norte",
        Inicio: DateTimeValue("2026-10-28T08:30"),
        Tecnico: "Ana"
    }
);
Set(varSiguienteVisita, 2);
Set(varVisitaEditada, Blank());
Set(varLimpiarVisita, false)
```

`Inicio` es de tipo fecha y hora. No guardes la salida del control como texto si la columna es de tipo fecha y hora.

## 3. Configuracion del control

| Propiedad | Valor |
| --- | --- |
| *Formato de fecha* | `YYYY-MM-DD` |
| *Formato de hora* | `24` |
| *Fecha y hora precargada* | `If(!IsBlank(varVisitaEditada), Text(varVisitaEditada.Inicio, "yyyy-mm-dd") & "T" & Text(varVisitaEditada.Inicio, "HH:mm"))` |
| *Fecha y hora precargada por omision* | Vacia |
| *Reiniciar selección* | `varLimpiarVisita` |
| *Zona horaria de los valores* | `Local` |
| *Fecha mínima* | `Text(Today(), "yyyy-mm-dd")` |
| *Etiqueta accesible* | `Fecha y hora de la visita` |
| *Ancho x alto* | `360 x 32` (cerrado) |

La `T` entre la fecha y la hora es obligatoria: `2026-10-28T08:30`. Un texto que solo traiga la fecha se ignora.

## 4. Formulas de la pantalla

### 4.1 Al mostrar la pantalla

```powerfx
Set(varVisitaEditada, Blank());
Set(varLimpiarVisita, false);
Set(varUltimaVisita, Blank())
```

### 4.2 Boton Agendar

```powerfx
If(
    IsBlank(dtpVisita.dateTime),
    Notify("Selecciona la fecha y la hora de la visita.", NotificationType.Warning),
    Collect(
        colVisitas,
        {
            ID: varSiguienteVisita,
            Cliente: Trim(txtCliente.Text),
            Inicio: DateTimeValue(dtpVisita.dateTime),
            Tecnico: cmbTecnico.Selected.Value
        }
    );
    Set(varSiguienteVisita, varSiguienteVisita + 1);
    Set(varLimpiarVisita, !varLimpiarVisita);
    Notify("Visita agendada.", NotificationType.Success)
)
```

### 4.3 Resumen legible

```powerfx
If(
    IsBlank(dtpVisita.dateTime),
    "Sin fecha ni hora",
    Text(DateTimeValue(dtpVisita.dateTime), "dddd, dd 'de' mmmm 'de' yyyy, HH:mm")
)
```

### 4.4 Separar fecha y hora para mostrarlas

```powerfx
// Etiqueta de fecha
Text(DateValue(dtpVisita.date), "dd/mm/yyyy")

// Etiqueta de hora
dtpVisita.time
```

`date` y `time` son salidas independientes; `dateTime` es la que se guarda.

### 4.5 Editar una visita

```powerfx
// Al seleccionar una fila de la galeria
Set(varVisitaEditada, ThisItem)
```

Con *Fecha y hora precargada* enlazada a `varVisitaEditada`, el control muestra la fecha y la hora del registro. No alternes *Reiniciar selección* en la misma accion: el reinicio tiene prioridad y dejaria el control vacio. Para guardar los cambios usa este boton:

```powerfx
Patch(
    colVisitas,
    LookUp(colVisitas, ID = varVisitaEditada.ID),
    {
        Cliente: Trim(txtCliente.Text),
        Inicio: DateTimeValue(dtpVisita.dateTime),
        Tecnico: cmbTecnico.Selected.Value
    }
);
Set(varVisitaEditada, Blank());
Set(varLimpiarVisita, !varLimpiarVisita)
```

## 5. Pruebas sugeridas

| # | Accion | Resultado esperado |
| --- | --- | --- |
| 1 | Abrir el panel sin valor | La hora propuesta es la actual alineada a 15 minutos |
| 2 | Abrir Agendar sin fecha | Aviso; no se guarda nada |
| 3 | Elegir el 28/10/2026 y 08:30 | `dtpVisita.dateTime` publica `2026-10-28T08:30` |
| 4 | Pulsar Agendar | La coleccion recibe `Inicio` como fecha y hora |
| 5 | Editar la visita | El control muestra 28/10/2026 y 08:30 |
| 6 | Cambiar solo el dia | La hora 08:30 se conserva |
| 7 | Pulsar Limpiar | Las salidas `dateTime`, `date` y `time` quedan vacias |

## 6. Variantes utiles

### 6.1 Mostrar en formato de 12 horas

El formato de hora del control puede ser `12` o `12:00:00` sin cambiar el valor de `dateTime`, que siempre publica 24 horas:

```powerfx
Text(DateTimeValue(dtpVisita.dateTime), "hh:mm AM/PM")
```

### 6.2 Guardar en UTC

Si la columna de destino guarda UTC, configura *Zona horaria de los valores* = `Utc`: la salida `dateTime` incluye la `Z` (`2026-10-28T08:30Z`) y la fecha y hora elegidas se interpretan como UTC. El control no convierte una hora local a UTC por ti; escribe la hora ya en UTC o convierte el valor de origen antes de usarlo como *Fecha y hora precargada*.

### 6.3 Hora por omision a las 09:00

Deja *Fecha y hora precargada* como `Text(Today(), "yyyy-mm-dd") & "T09:00"` en el formulario de alta. Recuerda que *Fecha y hora precargada por omision* tiene prioridad si tambien la configuras.

### 6.4 Validar que la visita sea futura

```powerfx
If(
    DateTimeValue(dtpVisita.dateTime) <= Now(),
    Notify("La visita debe quedar en el futuro.", NotificationType.Warning),
    // continuar con el guardado
    Collect(colVisitas, { Cliente: txtCliente.Text, Inicio: DateTimeValue(dtpVisita.dateTime), Tecnico: cmbTecnico.Selected.Value })
)
```

## 7. Problemas comunes

| Sintoma | Causa probable | Solucion |
| --- | --- | --- |
| La precarga no aparece | El texto no incluye `T` o no usa `YYYY-MM-DDTHH:mm` | Construye el texto con `Text(campo, "yyyy-mm-dd") & "T" & Text(campo, "HH:mm")` |
| La hora cambia al guardar | Se convirtio dos veces entre local y UTC | Define una sola zona en *Zona horaria de los valores* y no vuelvas a convertir |
| `dateTime` esta vacio tras elegir fecha | Falta confirmar la hora en el panel | Elige la hora; la seleccion se publica al confirmar el panel |
| El valor inicial se ignora | Solo se envio la fecha | Agrega la parte `THH:mm` |
| `defaultDate` pisa la precarga | Las dos propiedades estan enlazadas | Usa una sola fuente de precarga |

## 8. Referencia

- Propiedades, salidas y formatos de hora: [../DateTimePicker.md](../DateTimePicker.md)
- Formatos compartidos: [../README.md](../README.md#7-formatos-de-fecha-y-hora)
- Instalacion de la solucion: [../README.md](../README.md#6-instalar-y-usar-en-power-apps)
