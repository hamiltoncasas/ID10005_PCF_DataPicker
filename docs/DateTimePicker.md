# DateTimePicker

> Fecha: 2026-09-27
> Descripcion: Selector de una sola fecha y hora para Power Apps Canvas: propiedades, salidas, comportamiento, ejemplos y pruebas. Indice general en [README.md](README.md).

## 1. Que es

`DateTimePicker` es un control PCF de tipo `virtual` que permite elegir **una sola fecha y hora** y publicarlas juntas en formato tecnico y por separado.

| Dato | Valor |
| --- | --- |
| Identificador de componente | `id5_ID10005.DateTimePicker` |
| Version | 1.0.3 |
| Salidas | `dateTime`, `date`, `time`, `selectedDate` |
| Requiere servicios externos | No |

Estructura visual:

- **Modo compacto:** campo de 32 px con el resumen de la seleccion y boton azul a la derecha.
- **Panel expandido:** encabezado (etiqueta *FECHA Y HORA*, resumen, estado y cierre), calendario mensual, un campo de fecha editable y un **selector de hora cada 15 minutos**, mas el pie con el boton **Limpiar**.
- **Formato de la hora:** la propiedad *Formato de hora* decide si se ve en reloj de 12 o 24 horas y si incluye segundos; el selector siempre ofrece tramos de 15 minutos (`HH:mm`).

Cuando lo usas: para capturar el momento exacto de un evento (inicio de una sesion, fecha de un movimiento con hora) sin depender del control nativo de fecha y hora, con la salida siempre en formato tecnico.

## 2. Empezar rapido

1. En el estudio de Power Apps: **Insertar > Obtener mas componentes > Codigo > DateTimePicker**.
2. Opcional: define *Formato de fecha* (por ejemplo `YYYY-MM-DD`) y *Formato de hora* (`24`, `12`, `24:00:00` o `12:00:00`).
3. Opcional: precarga con *Fecha y hora inicial* (`initialDateTime`) en formato `YYYY-MM-DDTHH:mm`, por ejemplo `2026-09-16T08:30`.

Resultado: `DateTimePicker1.dateTime` devuelve la fecha y la hora en formato `YYYY-MM-DDTHH:mm`.

## 3. Propiedades de entrada

### 3.1 Datos y comportamiento

| Propiedad (nombre tecnico) | Nombre en Power Apps | Tipo | Predeterminado | Descripcion |
| --- | --- | --- | --- | --- |
| `initialDateTime` | *Fecha y hora inicial* | Texto | vacio | Valor precargado en formato `YYYY-MM-DDTHH:mm`. Un texto que no traiga la hora se ignora (el panel abre en el mes actual con la hora actual alineada a 15 minutos) |
| `defaultDate` | *Fecha predeterminada* | Texto | vacio | Valor de mayor prioridad: si no esta vacio, sustituye a *Fecha y hora inicial* |
| `format` | *Formato de fecha* | Texto | `YYYY-MM-DD` | Formato de la parte de fecha en el resumen del panel y del campo de fecha |
| `timeFormat` | *Formato de hora* | Texto | `24` | Apariencia de la hora: `24`, `12`, `24:00:00` o `12:00:00` |
| `resetKey` | *Reiniciar seleccion* | Si/No | No | Cuando cambia de valor, el control limpia la fecha y la hora |
| `zIndex` | *Prioridad visual del panel* | Numero | `2147483647` | `z-index` del panel abierto |
| `placeholderText` | *Texto de ayuda* | Texto | `Selecciona fecha` | Texto del campo compacto cuando no hay valor |
| `isEditable` | *Editable* | Si/No | No | Permite escribir la fecha en el campo del panel; el texto se interpreta con el formato configurado |
| `accessibleLabel` | *Etiqueta accesible* | Texto | vacio | Texto para lectores de pantalla |
| `minDate` | *Fecha minima* | Texto | vacio | Primer dia seleccionable |
| `maxDate` | *Fecha maxima* | Texto | vacio | Ultimo dia seleccionable |
| `startYear` | *Ano inicial* | Numero | `0` | Ano menor del calendario (`0` = sin limite) |
| `endYear` | *Ano final* | Numero | `0` | Ano mayor del calendario (`0` = sin limite) |
| `startOfWeek` | *Primer dia de la semana* | Texto | regional | `auto`, `sunday`, `monday`, `tuesday`, `wednesday`, `thursday`, `friday` o `saturday` |
| `dateTimeZone` | *Zona horaria* | Texto | local del dispositivo | Zona usada para calcular la hora y la fecha actuales |
| `language` | *Idioma* | Texto | regional | Codigo de idioma para nombres de meses, dias y hora de 12 horas (por ejemplo `es-ES`) |

### 3.2 Apariencia (equivalentes al selector nativo)

| Propiedad | Nombre en Power Apps | Tipo |
| --- | --- | --- |
| `borderColor` / `borderStyle` / `borderThickness` | *Color*, *Estilo* y *Grosor del borde* | Texto / Texto / Numero |
| `color` / `fill` | *Color del texto* / *Relleno* | Texto |
| `font` / `size` / `fontWeight` / `italic` / `strikethrough` / `underline` | Tipografia del control | Texto / Numero / Texto / Si-No |
| `chevronBackground` / `chevronFill` | Flechas de navegacion del calendario | Texto |
| `iconBackground` / `iconFill` | Icono del boton del panel | Texto |

## 4. Salidas

| Salida | Tipo | Descripcion |
| --- | --- | --- |
| `dateTime` | Texto | Valor tecnico `YYYY-MM-DDTHH:mm` (sin zona horaria) |
| `date` | Texto | Solo la fecha, en `YYYY-MM-DD` |
| `time` | Texto | Solo la hora, en `HH:mm` |
| `selectedDate` | Texto | Mismo valor que `dateTime`. Se conserva por compatibilidad |

Las tres primeras salidas se derivan del mismo valor: si no hay seleccion, las cuatro quedan vacias.

## 5. Comportamiento

1. **Abrir el panel:** clic en el campo o en el boton. El calendario abre en el mes del valor actual; si no hay valor, en el mes actual.
2. **Seleccionar un dia:** la fecha elegida se resalta, se **conserva la hora** que estuviera seleccionada y el valor se publica. La hora propuesta la primera vez es la **hora actual alineada a 15 minutos**.
3. **Cambiar la hora:** el selector ofrece tramos de 15 minutos (`00:00`, `00:15`, `00:30`, ...). Al cambiar la hora, la fecha se mantiene y se publica el nuevo `dateTime`.
4. **Escribir la fecha en el campo del panel:** si escribes una fecha valida se publica; si la dejas vacia, las salidas `dateTime`, `date` y `time` quedan vacias.
5. **Boton Limpiar** (pie del panel): borra la fecha y la hora y publica vacio.
6. **Formato de la hora:** `12` y `12:00:00` muestran la hora con AM/PM (respetando la propiedad *Idioma* cuando esta definida); `24:00:00` y `12:00:00` agregan los segundos en el resumen. El valor de las salidas nunca cambia: siempre `HH:mm` en 24 horas.
7. **Limites:** *Fecha minima*/*Fecha maxima* y *Ano inicial*/*Ano final* deshabilitan dias y detienen la navegacion mensual.
8. **Reiniciar desde Power Fx:** cuando cambia *Reiniciar seleccion* se limpian fecha y hora.
9. **Precarga:** *Fecha predeterminada* tiene prioridad sobre *Fecha y hora inicial*; el valor se aplica cuando cambia.
10. **Control deshabilitado:** con `DisplayMode` en `View` no se puede abrir el panel ni cambiar el valor.

### 5.1 Ejemplo de precarga

```powerfx
// Propiedad Fecha y hora inicial (texto)
"2026-09-16T08:30"

// Desde un registro (si la columna ya trae fecha y hora)
Text(ThisItem.FechaHora, "yyyy-mm-dd") & "T" & Text(ThisItem.FechaHora, "hh:mm")
```

El valor debe incluir la hora (`2026-09-16T08:30`): un texto que solo traiga la fecha no se aplica y el panel propone el mes actual con la hora actual alineada a 15 minutos.

## 6. Ejemplos en Power Fx

```powerfx
// 1. Valor nativo de fecha y hora
Set(varMomento, DateTimeValue(DateTimePicker1.dateTime))

// 2. Escribir el valor en un registro
Patch(Eventos, ThisItem, { Inicio: DateTimeValue(DateTimePicker1.dateTime) })

// 3. Filtrar por dia (ignorando la hora)
Filter(Movimientos, DateValue(DateTimePicker1.date) = Fecha)

// 4. Mostrar la hora sola
Notify("Hora elegida: " & DateTimePicker1.time)

// 5. Limpiar el control desde un boton
UpdateContext({ reiniciarMomento: true });   // Reiniciar seleccion = reiniciarMomento
```

## 7. Limites y buenas practicas

- **Tramos de 15 minutos:** el selector de hora trabaja con esa granularidad; *Formato de hora* con segundos solo cambia la presentacion (`HH:mm:00`).
- **Sin conversion a UTC:** las fechas se interpretan en la hora local del equipo (o en la zona de *Zona horaria*). Si el valor se envia a otro sistema como instante UTC, puede cambiar de dia segun la zona del usuario.
- **El control no crece en el lienzo:** el panel flotante es el que crece; el ancho minimo del panel es 340 px.
- **Un valor por pantalla:** para un intervalo usa `DateTimeRangePicker`.
- **Etiquetas:** configura *Etiqueta accesible* en pantallas donde el campo no tenga una etiqueta visible propia.

## 8. Problemas comunes

| Sintoma | Causa probable | Solucion |
| --- | --- | --- |
| La hora vuelve a `00:00` al elegir otro dia | No habia hora previa y no se cambio el selector | Elige la hora despues de la fecha, o precarga el valor completo |
| `DateTimeValue` falla | La salida se modifico o el formato tiene otra forma | Usa la salida tal cual (`YYYY-MM-DDTHH:mm`); no la recompongas a mano |
| El valor inicial no se aplica | El texto no trae `T` entre fecha y hora | Escribe `2026-09-16T08:30` |
| El resumen muestra otra hora de la esperada | *Formato de hora* esta en 12 horas y se compara con una cadena de 24 | Deja `24` para leer el resumen como la salida |

## 9. Verificacion

| # | Accion | Resultado esperado |
| --- | --- | --- |
| 1 | Abrir el panel sin valor previo | El selector de hora propone la hora actual alineada a 15 minutos |
| 2 | Cambiar la hora y luego elegir un dia | `dateTime` combina el dia elegido con la hora seleccionada |
| 3 | Elegir un dia y volver a abrir | La hora y el mes se mantienen coherentes con el valor |
| 4 | Vaciar el campo de fecha del panel | `dateTime`, `date` y `time` quedan vacios |
| 5 | Cambiar *Formato de hora* a `12` | El resumen muestra la hora en formato de 12 horas |
| 6 | Poner `DisplayMode` en `View` | No se abre el panel |
| 7 | Cambiar *Reiniciar seleccion* | Se limpian fecha y hora |

El arnes del repositorio (ver [README.md](README.md#9-verificacion-y-pruebas)) cubre la conservacion de la hora al cambiar el dia, la publicacion de `YYYY-MM-DDTHH:mm`, el cierre del panel al elegir el dia, la hora por defecto alineada a 15 minutos, la ausencia de valor cuando no hay fecha y el boton Limpiar.

## 10. Archivos del control

| Archivo | Contenido |
| --- | --- |
| `DateTimePicker/ControlManifest.Input.xml` | Contrato: propiedades, salidas, recursos y metadatos |
| `DateTimePicker/index.ts` | Adaptador PCF: precarga, `resetKey` y publicacion de `dateTime`, `date` y `time` |
| `DateTimePicker/DateTimePickerView.tsx` | Vista React: calendario, campo de fecha, selector de hora y panel |
| `DateTimePicker/DateTimePicker.css` | Estilos con prefijo de clases `dtp-` |
| `DateTimePicker/strings/DateTimePicker.1033.resx` | Nombres y descripciones localizados del panel de propiedades |
