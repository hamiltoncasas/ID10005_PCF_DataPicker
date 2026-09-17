# Referencia de controles

> Fecha: 2026-09-16  
> Descripcion: Propiedades, salidas y comportamiento de los cinco controles PCF del repositorio.

Todos los controles comparten:

- **Tipo de control:** `virtual` (usables en Power Apps Canvas y en Dataverse).
- **Espacio de nombres:** `ID10005`, por lo que el identificador de cada componente es `id5_ID10005.<Constructor>`.
- **Diseño:** modo compacto cerrado de 32 px con borde gris y botón azul a la derecha; panel expandido en superposición con encabezado (etiqueta, resumen, estado y botón de cierre), cuerpo y pie.
- **`zIndex`:** entrada opcional que define la prioridad visual del panel abierto. Valor predeterminado `2147483647` (se limita entre 1 y 2147483647).
- **`resetKey`:** entrada `Si/No`. Cuando cambia su valor, el control limpia la selección. Sirve para reiniciar el control desde Power Fx (por ejemplo con un botón *Limpiar*).
- **Modo deshabilitado:** el framework controla `DisplayMode`; con el control deshabilitado no se puede abrir el panel ni cambiar la selección.
- **Accesibilidad:** cada campo y botón expone etiquetas `aria-*` y navegación por teclado.

## Indice

1. [DatePicker](#datepicker)
2. [DateTimePicker](#datetimepicker)
3. [DateRangePicker](#daterangepicker)
4. [DateTimeRangePicker](#datetimerangepicker)
5. [SearchableComboBox](#searchablecombobox)

## DatePicker

Selecciona **una sola fecha** en un calendario. Version 1.0.1.

### Entradas

| Propiedad | Tipo | Obligatoria | Predeterminado | Descripcion |
| --- | --- | --- | --- | --- |
| `initialDate` | Texto | No | vacío | Fecha precargada, escrita en el formato configurado en `format` |
| `resetKey` | Si/No | No | No | Al cambiar de valor limpia la fecha seleccionada |
| `format` | Texto | No | `YYYY-MM-DD` | Formato de la salida y del valor precargado |
| `zIndex` | Número | No | `2147483647` | Prioridad visual del panel |

### Salidas

| Salida | Descripcion |
| --- | --- |
| `date` | Fecha seleccionada en el formato configurado, o vacío si no hay selección |

### Comportamiento

- Al abrir el panel, el mes visible es el de la fecha precargada (o el mes actual).
- La fecha de hoy se marca con un borde y la seleccionada con fondo `#b86e49`.
- Al elegir un día el valor se publica y el panel se contrae.
- El botón **Limpiar** del pie del panel vacía la selección.
- Un valor inicial inválido no rompe el control: se ignora y el panel abre en el mes actual.

### Ejemplo en Power Fx

```powerfx
// Fecha nativa
DateValue(DatePicker1.date)

// Formato regional para mostrar
Text(DateValue(DatePicker1.date), "[$-es-CO]dddd, dd 'de' mmmm 'de' yyyy")

// Limpiar desde un boton
UpdateContext({ reiniciar: true })   // y en el control: resetKey = reiniciar
```

## DateTimePicker

Selecciona **una sola fecha y hora**. Version 1.0.1.

### Entradas

| Propiedad | Tipo | Obligatoria | Predeterminado | Descripcion |
| --- | --- | --- | --- | --- |
| `initialDateTime` | Texto | No | vacío | Valor precargado en formato `YYYY-MM-DDTHH:mm` |
| `resetKey` | Si/No | No | No | Al cambiar de valor limpia la fecha y la hora |
| `format` | Texto | No | `YYYY-MM-DD` | Formato de fecha usado en el resumen del panel |
| `timeFormat` | Texto | No | `24` | Apariencia de la hora: `24`, `12`, `24:00:00` o `12:00:00` |
| `zIndex` | Número | No | `2147483647` | Prioridad visual del panel |

### Salidas

| Salida | Descripcion |
| --- | --- |
| `dateTime` | Valor técnico `YYYY-MM-DDTHH:mm` |
| `date` | Parte de fecha `YYYY-MM-DD` |
| `time` | Parte de hora `HH:mm` |

### Comportamiento

- El panel incluye calendario, campo de fecha y selector de hora en pasos de 15 minutos.
- Al elegir un día se conserva la hora activa y el panel se contrae.
- Cambiar la hora no cierra el panel; si ya existía una fecha, la salida se actualiza de inmediato.
- Si no hay valor previo, la hora propuesta es la hora actual alineada a 15 minutos.
- Si el valor precargado tiene minutos fuera de los pasos de 15, esa hora se agrega a la lista.
- Limpiar el campo de fecha vacía todo el valor (`dateTime`, `date` y `time` quedan vacíos).

### Ejemplo en Power Fx

```powerfx
// Fecha y hora nativa
DateTimeValue(DateTimePicker1.dateTime)

// Hora de inicio de un registro
Patch(Eventos, ThisItem, { Inicio: DateTimeValue(DateTimePicker1.dateTime) })

// Mostrar fecha y hora con formato local
Text(DateTimeValue(DateTimePicker1.dateTime), "[$-es-CO]dd/MM/yyyy HH:mm")
```

## DateRangePicker

Selecciona **un rango de fechas**. Version 1.0.9. Es el control original del repositorio.

### Entradas

| Propiedad | Tipo | Obligatoria | Predeterminado | Descripcion |
| --- | --- | --- | --- | --- |
| `initialStartDate` | Texto | No | vacío | Fecha inicial precargada en el formato configurado |
| `initialEndDate` | Texto | No | vacío | Fecha final precargada en el formato configurado |
| `resetKey` | Si/No | No | No | Al cambiar de valor limpia el rango |
| `format` | Texto | No | `YYYY-MM-DD` | Formato de las salidas |
| `zIndex` | Número | No | `2147483647` | Prioridad visual del panel |

### Salidas

| Salida | Descripcion |
| --- | --- |
| `startDate` | Fecha inicial elegida |
| `endDate` | Fecha final elegida |

### Comportamiento

- La primera selección define la fecha inicial y el control espera la fecha final.
- Si la segunda fecha es anterior, el control ordena el rango automáticamente.
- Al completar el rango se resalta todo el rango y el panel se contrae.
- Una nueva selección después de completar el rango inicia un rango nuevo.

## DateTimeRangePicker

Selecciona **un rango de fecha y hora**. Version 1.0.9. Vivía en un proyecto anidado (`DateTimeRangePicker/`).

### Entradas

| Propiedad | Tipo | Obligatoria | Predeterminado | Descripcion |
| --- | --- | --- | --- | --- |
| `initialStartDateTime` | Texto | No | vacío | Valor inicial `YYYY-MM-DDTHH:mm` |
| `initialEndDateTime` | Texto | No | vacío | Valor final `YYYY-MM-DDTHH:mm` |
| `resetKey` | Si/No | No | No | Al cambiar de valor limpia el rango |
| `format` | Texto | No | `YYYY-MM-DD` | Formato de fecha del resumen |
| `timeFormat` | Texto | No | `24` | `24`, `12`, `24:00:00` o `12:00:00` |
| `zIndex` | Número | No | `2147483647` | Prioridad visual del panel |

### Salidas

| Salida | Descripcion |
| --- | --- |
| `startDateTime` | Inicio del rango en `YYYY-MM-DDTHH:mm` |
| `endDateTime` | Fin del rango en `YYYY-MM-DDTHH:mm` |

### Comportamiento

- Incluye calendario y dos campos (inicio y fin) con selector de hora cada 15 minutos.
- Al completar ambos extremos el panel se contrae y se resalta el rango de fechas.

## SearchableComboBox

Combobox con **búsqueda tipo contiene** sobre una tabla o colección enlazada. Version 1.0.2. El detalle completo esta en [combobox.md](combobox.md).

### Entradas

| Propiedad | Tipo | Obligatoria | Predeterminado | Descripcion |
| --- | --- | --- | --- | --- |
| `items` | Conjunto de datos | Si | - | Registros mostrados como opciones (columnas `value`, `label`, `description`) |
| `defaultValue` | Texto | No | vacío | Valores precargados separados por `;` (admite valores o etiquetas) |
| `selectMultiple` | Si/No | No | No | Habilita selección múltiple con etiquetas removibles |
| `isSearchable` | Si/No | No | Sí | Habilita el cuadro de búsqueda y el filtro contiene |
| `searchFields` | Texto | No | vacío | Columnas donde buscar, separadas por coma. Vacío = todas |
| `noSelectionText` | Texto | No | `---` | Texto cuando no hay selección |
| `placeholderText` | Texto | No | `Buscar...` | Texto guía del cuadro de búsqueda |
| `loadAllRecords` | Si/No | No | No | Solicita las páginas restantes del conjunto de datos para filtrar sobre **todos** los registros (hasta 10 páginas de 5000). Desactivado, el paginador de Power Apps del control sigue funcionando |
| `resetKey` | Si/No | No | No | Al cambiar de valor limpia la selección |
| `zIndex` | Número | No | `2147483647` | Prioridad visual de la lista |

### Salidas

| Salida | Descripcion |
| --- | --- |
| `selectedValue` | Valor de la primera opción seleccionada |
| `selectedLabel` | Etiqueta de la primera opción seleccionada |
| `selectedValues` | Valores seleccionados separados por `;` |
| `selectedLabels` | Etiquetas seleccionadas separadas por `;` |
| `selectedCount` | Cantidad de opciones seleccionadas |

### Ejemplo en Power Fx

```powerfx
// Tabla a partir de la seleccion multiple
ForAll(Split(SearchableComboBox1.selectedValues, ";"), { Codigo: ThisRecord.Value })

// Etiquetas legibles separadas por coma
Substitute(SearchableComboBox1.selectedLabels, ";", ", ")

// Mostrar solo si hay seleccion
If(SearchableComboBox1.selectedCount > 0, SearchableComboBox1.selectedValue)
```

## Notas comunes

- **Ambiguedad de formato:** para convertir con `DateValue` o `DateTimeValue` se recomienda dejar `format` en `YYYY-MM-DD`, porque `DD/MM/YYYY` y `MM/DD/YYYY` pueden interpretarse de forma distinta según la región del usuario. Catalogo completo en [formatos.md](formatos.md).
- **Paneles superpuestos:** los paneles se dibujan en `document.body` con `position: fixed`, así que no los recorta el contenedor del control. Si en tu pantalla hay elementos de lienzo con `z-index` propio, sube el valor de `zIndex`.
- **Precarga:** los valores precargados se aplican cuando cambian; si necesitas reiniciar, usa `resetKey`.
- **Tamaño:** los controles no se expanden en el lienzo: el panel flotante es el que crece. El ancho mínimo del panel es 320 px (fecha), 340 px (fecha y hora) y el ancho del control (combobox, mínimo 220 px).

