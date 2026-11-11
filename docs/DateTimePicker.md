# DateTimePicker

> Fecha: 2026-11-10
> Descripcion: Selector de una sola fecha y hora para Power Apps Canvas: propiedades, salidas, comportamiento, ejemplos y pruebas. Indice general en [README.md](README.md).

## 1. Que es

`DateTimePicker` es un control PCF de tipo `virtual` que permite elegir **una sola fecha y hora** y publicarlas juntas en formato tecnico y por separado. Desde la version **1.1.1** expone el juego completo de propiedades del selector de fecha y hora nativo de Power Apps (incluidas las variantes de hora `SelectedHour` y `SelectedDateHour`).

| Dato | Valor |
| --- | --- |
| Identificador de componente | `id5_ID10005.DateTimePicker` |
| Version | 1.1.1 |
| Propiedades de entrada | 52 |
| Salidas | `dateTime`, `date`, `time`, `selectedDate`, `selectedHour`, `selectedDateHour`, `onChange`, `onSelect` |
| Requiere servicios externos | No |


Estructura visual:

- **Modo compacto:** campo de 32 px con el resumen de la seleccion y boton azul a la derecha.
- **Panel expandido:** encabezado (etiqueta *FECHA Y HORA*, resumen, estado y cierre), calendario mensual, un campo de fecha editable y un **selector de hora cada 15 minutos**, mas el pie con el boton **Limpiar**.
- **Formato de la hora:** la propiedad *Formato de hora* decide si se ve en reloj de 12 o 24 horas y si incluye segundos; el selector siempre ofrece tramos de 15 minutos (`HH:mm`).
- **Modos de presentacion:** *Modo de presentacion* (`displayMode`) acepta `Edit`, `View` y `Disabled`, con los mismos efectos que el selector nativo.

Cuando lo usas: para capturar el momento exacto de un evento (inicio de una sesion, fecha de un movimiento con hora) sin depender del control nativo de fecha y hora, con la salida siempre en formato tecnico.

## 2. Guia de uso paso a paso

Esta guia reproduce el caso mas comun: **registrar el momento exacto de un evento**. La aplicacion precarga un valor al editar, permite cambiarlo y guarda fecha y hora en una sola columna.

### 2.1 Antes de empezar

| Requisito | Como comprobarlo |
| --- | --- |
| PCF para canvas activo y solucion publicada | Power Platform admin center > Entorno > Caracteristicas; Soluciones > `ID0005_DataPickers` |
| Control disponible en el estudio | **Insertar > Obtener mas componentes > Codigo > DateTimePicker** |
| Columna destino de tipo **Fecha y hora** | Datos > Tabla > Columna > Tipo *Fecha y hora* |
| Zona horaria acordada con el negocio | La salida es local o UTC segun *Zona horaria de los valores* |

### 2.2 Pasos

1. **Inserta el control** desde **Insertar > Obtener mas componentes > Codigo > DateTimePicker** y renombralo, por ejemplo `dtpInicioSesion`.
2. **Fija los formatos:** *Formato de fecha* = `YYYY-MM-DD` y *Formato de hora* = `24`. Asi el resumen coincide con la salida tecnica `YYYY-MM-DDTHH:mm`.
3. **Precarga al editar:** en *Fecha y hora precargada* (`initialDateTime`) escribe `Text(ThisItem.Inicio, "yyyy-mm-dd") & "T" & Text(ThisItem.Inicio, "HH:mm")`. El texto debe incluir la `T`; si solo trae la fecha, el control lo ignora.
4. **Resuelve la prioridad de precarga:** si tambien usas *Fecha y hora inicial (selector nativo)* (`defaultDateHour`) o *Fecha y hora precargada por omision* (`defaultDate`), recuerda que la primera gana sobre la segunda y esta sobre *Fecha y hora precargada*. Deja vacia una sola fuente de precarga.
5. **Conecta el reinicio:** usa `UpdateContext({ limpiarMomento: false })` y enlaza *Reiniciar selección* (`resetKey`) a `limpiarMomento`; un boton lo alterna con `UpdateContext({ limpiarMomento: !limpiarMomento })`.
6. **Lee las tres salidas:** `dtpInicioSesion.dateTime` (valor completo), `dtpInicioSesion.date` (solo dia) y `dtpInicioSesion.time` (solo hora en 24 h). Usa `dateTime` para guardar y `date`/`time` para mostrar.
7. **Guarda con validacion:** antes del `Patch`, comprueba `!IsBlank(dtpInicioSesion.dateTime)` y convierte con `DateTimeValue(...)`. La guia completa esta en [ejemplos/DateTimePicker.md](ejemplos/DateTimePicker.md).

### 2.3 Configuracion minima recomendada

| Propiedad | Valor sugerido | Por que |
| --- | --- | --- |
| *Formato de fecha* | `YYYY-MM-DD` | Coincide con la parte de fecha de la salida |
| *Formato de hora* | `24` | Evita confusiones entre AM/PM y la salida de 24 horas |
| *Fecha y hora precargada* | `Text(ThisItem.Inicio, "yyyy-mm-dd") & "T" & Text(ThisItem.Inicio, "HH:mm")` | Precarga el registro que se edita |
| *Zona horaria de los valores* | `Local` | Mantiene la hora que ve el usuario; usa `Utc` solo si el destino es UTC |
| *Reiniciar selección* | `limpiarMomento` | Permite limpiar el control desde Power Fx |

### 2.4 Comprobar que funciona

1. Abre el panel sin valor: la hora propuesta debe ser la actual alineada a 15 minutos.
2. Elige un dia y luego una hora: `dateTime` cambia en ambos pasos y conserva la parte no modificada.
3. Vacia el campo de fecha del panel: `dateTime`, `date` y `time` quedan vacios.
4. Precarga `2026-09-16T08:30`: al abrir, el calendario muestra septiembre de 2026 y la hora `08:30`.
5. Guarda y vuelve a abrir el registro: la hora guardada debe coincidir con la que muestra el control.

Resultado: `dtpInicioSesion.dateTime` devuelve `YYYY-MM-DDTHH:mm`. La guia completa, con escenarios de alta y edicion, conversion a UTC y validaciones, esta en [ejemplos/DateTimePicker.md](ejemplos/DateTimePicker.md).

## 3. Propiedades de entrada

### 3.1 Datos y comportamiento

| Propiedad (nombre tecnico) | Nombre en Power Apps | Tipo | Predeterminado | Descripcion |
| --- | --- | --- | --- | --- |
| `initialDateTime` | *Fecha y hora precargada* | Texto | vacio | Valor precargado en formato `YYYY-MM-DDTHH:mm`. Un texto que no traiga la hora se ignora (el panel abre en el mes actual con la hora actual alineada a 15 minutos) |
| `defaultDate` | *Fecha y hora precargada por omision* | Texto | vacio | Segunda prioridad: si no esta vacio, sustituye a *Fecha y hora precargada*; lo pisa *Fecha y hora inicial (selector nativo)* |
| `defaultDateHour` | *Fecha y hora inicial (selector nativo)* | Texto | vacio | Valor inicial en formato `YYYY-MM-DDTHH:mm`. **Tiene la prioridad mas alta**: sustituye a *Fecha y hora precargada por omision* y a *Fecha y hora precargada*. Es la propiedad `DefaultDateHour` del selector nativo |
| `format` | *Formato de fecha* | Texto | `YYYY-MM-DD` | Formato de la parte de fecha en el resumen del panel y del campo de fecha |
| `timeFormat` | *Formato de hora* | Texto | `24` | Apariencia de la hora: `24`, `12`, `24:00:00` o `12:00:00` |
| `resetKey` | *Reiniciar selección* | Si/No | No | Cuando cambia de valor, el control limpia la fecha y la hora |
| `zIndex` | *Prioridad visual del selector* | Numero | `2147483647` | `z-index` del panel abierto |
| `placeholderText` | *Texto de ayuda del campo* | Texto | `Selecciona fecha` | Texto del campo compacto cuando no hay valor |
| `isEditable` | *Permitir escribir la fecha* | Si/No | No | Permite escribir la fecha en el campo del panel; el texto se interpreta con el formato configurado |
| `accessibleLabel` | *Etiqueta accesible* | Texto | vacio | Texto para lectores de pantalla |
| `minDate` | *Fecha mínima* | Texto | vacio | Primer dia seleccionable |
| `maxDate` | *Fecha máxima* | Texto | vacio | Ultimo dia seleccionable |
| `startYear` | *Año inicial del calendario* | Numero | `0` | Año menor del calendario (`0` = sin limite) |
| `endYear` | *Año final del calendario* | Numero | `0` | Año mayor del calendario (`0` = sin limite) |
| `startOfWeek` | *Primer día de la semana* | Texto | regional | `auto`, `sunday`, `monday`, `tuesday`, `wednesday`, `thursday`, `friday` o `saturday` |
| `dateTimeZone` | *Zona horaria de los valores* | Texto | local del dispositivo | Zona usada para calcular la hora y la fecha actuales |
| `language` | *Idioma del calendario* | Texto | regional | Codigo de idioma para nombres de meses, dias y hora de 12 horas (por ejemplo `es-ES`) |
| `displayMode` | *Modo de presentacion* | Texto | `Edit` | `Edit` permite elegir, `View` muestra el valor sin abrir el panel y `Disabled` aplica los colores deshabilitados y bloquea la interaccion. Se aceptan tambien `Vista` y `Deshabilitado` |
| `tooltip` | *Texto de ayuda emergente* | Texto | vacio | Texto del atributo `title` del campo y del boton del calendario |
| `visible` | *Visible* | Si/No | Si | Si esta desactivado, el control no dibuja nada (equivale a `Visible` del lienzo) |
| `tabIndex` | *Indice de tabulacion* | Numero | vacio | Posicion del campo y del boton en el recorrido con la tecla Tab |

### 3.2 Apariencia (equivalentes al selector nativo)

| Propiedad | Nombre en Power Apps | Tipo |
| --- | --- | --- |
| `borderColor` / `borderStyle` / `borderThickness` | *Color del borde*, *Estilo del borde* y *Grosor del borde* | Texto / Texto / Numero |
| `color` / `fill` | *Color del texto* / *Color de fondo del campo* | Texto |
| `font` / `size` / `fontWeight` / `italic` / `strikethrough` / `underline` | *Fuente del texto*, *Tamaño de la fuente*, *Grosor de la fuente*, *Texto en cursiva*, *Texto tachado* y *Texto subrayado* | Texto / Numero / Texto / Si-No |
| `chevronBackground` / `chevronFill` | *Fondo de las flechas del calendario* / *Color de las flechas del calendario* | Texto |
| `iconBackground` / `iconFill` | *Fondo del icono del calendario* / *Color del icono del calendario* | Texto |
| `calendarHeaderFill` | *Fondo de la cabecera del calendario* | Texto |
| `disabledBorderColor` / `disabledColor` / `disabledFill` | *Color del borde deshabilitado*, *Color del texto deshabilitado* y *Color de fondo deshabilitado* | Texto |
| `focusedBorderColor` / `focusedBorderThickness` | *Color del borde con foco* y *Grosor del borde con foco* | Texto / Numero |
| `paddingTop` / `paddingRight` / `paddingBottom` / `paddingLeft` | *Relleno superior*, *Relleno derecho*, *Relleno inferior* y *Relleno izquierdo* | Numero |
| `height` / `width` | *Alto del campo (px)* y *Ancho del campo (px)*; `0` o vacio dejan el tamaño del diseño | Numero |
| `x` / `y` | *Desplazamiento horizontal (px)* y *Desplazamiento vertical (px)* respecto a la posición que da el lienzo | Numero |
| `layoutMinHeight` / `layoutMinWidth` | *Alto mínimo del control (px)* y *Ancho mínimo del control (px)* | Numero |

Los colores aceptan `#RRGGBB`, `rgb()`, nombres CSS y la forma `Color.Azul` de Power Apps. Los colores `disabled*` solo se aplican cuando el control está deshabilitado o el *Modo de presentación* es `Disabled`; los `padding*`, `height`, `width`, `x`, `y` y `layoutMin*` se aplican al campo cerrado (el panel abierto conserva su tamaño propio, con 340 px de ancho mínimo).

### 3.3 Paridad con el selector de fecha y hora nativo

Tabla de correspondencia uno a uno con el panel del control nativo. La dirección indica si la propiedad es de entrada o una salida.

| Propiedad nativa | Propiedad del control | Dirección |
| --- | --- | --- |
| `AccessibleLabel` | `accessibleLabel` | Entrada |
| `BorderColor` | `borderColor` | Entrada |
| `BorderStyle` | `borderStyle` | Entrada |
| `BorderThickness` | `borderThickness` | Entrada |
| `CalendarHeaderFill` | `calendarHeaderFill` | Entrada |
| `Color` | `color` | Entrada |
| `DefaultDateHour` | `defaultDateHour` | Entrada |
| `DisabledBorderColor` | `disabledBorderColor` | Entrada |
| `DisabledColor` | `disabledColor` | Entrada |
| `DisabledFill` | `disabledFill` | Entrada |
| `DisplayMode` | `displayMode` | Entrada |
| `Fill` | `fill` | Entrada |
| `FocusedBorderColor` | `focusedBorderColor` | Entrada |
| `FocusedBorderThickness` | `focusedBorderThickness` | Entrada |
| `Font` | `font` | Entrada |
| `FontWeight` | `fontWeight` | Entrada |
| `Format` | `format` | Entrada |
| `Height` | `height` | Entrada |
| `IconBackground` | `iconBackground` | Entrada |
| `IconFill` | `iconFill` | Entrada |
| `InputTextPlaceholder` | `placeholderText` | Entrada |
| `IsEditable` | `isEditable` | Entrada |
| `Language` | `language` | Entrada |
| `LayoutMinHeight` | `layoutMinHeight` | Entrada |
| `LayoutMinWidth` | `layoutMinWidth` | Entrada |
| `OnChange` | `onChange` | Salida (contador de cambios) |
| `OnSelect` | `onSelect` | Salida (contador de aperturas) |
| `PaddingBottom` | `paddingBottom` | Entrada |
| `PaddingLeft` | `paddingLeft` | Entrada |
| `PaddingRight` | `paddingRight` | Entrada |
| `PaddingTop` | `paddingTop` | Entrada |
| `Reset` | `resetKey` | Entrada (al cambiar de valor) |
| `SelectedDate` | `selectedDate` | Salida |
| `SelectedDateHour` | `selectedDateHour` | Salida |
| `SelectedHour` | `selectedHour` | Salida |
| `Size` | `size` | Entrada |
| `StartOfWeek` | `startOfWeek` | Entrada |
| `TabIndex` | `tabIndex` | Entrada |
| `Tooltip` | `tooltip` | Entrada |
| `Visible` | `visible` | Entrada |
| `Width` | `width` | Entrada |
| `X` | `x` | Entrada |
| `Y` | `y` | Entrada |

Notas de la correspondencia:

- En Power Fx los nombres no distinguen mayusculas: `dtpVisita.BorderColor` y `dtpVisita.borderColor` son la misma propiedad, asi que una formula escrita para el control nativo se lee igual en este control.
- `OnChange` y `OnSelect` se publican como **contadores** (numeros enteros) porque un control PCF no puede declarar eventos: se comparan con una variable para detectar el cambio y el valor nuevo se lee de `selectedDateHour`.
- `Reset` se llama `resetKey` en el manifiesto por compatibilidad con las versiones anteriores; actua igual: cada vez que cambia de valor, el control se limpia.
- `X` e `Y` no pueden mover el control fuera del contenedor que asigna el lienzo: se aplican como un desplazamiento (`translate`) respecto a esa posicion.


## 4. Salidas

| Salida | Tipo | Descripcion |
| --- | --- | --- |
| `dateTime` | Texto | Valor tecnico `YYYY-MM-DDTHH:mm`; con *Zona horaria de los valores* = `Utc` termina en `Z` (`YYYY-MM-DDTHH:mmZ`) |
| `date` | Texto | Solo la fecha, en `YYYY-MM-DD` |
| `time` | Texto | Solo la hora, en `HH:mm` |
| `selectedDate` | Texto | Mismo valor que `dateTime` (`SelectedDate` del selector nativo). Se conserva por compatibilidad |
| `selectedHour` | Texto | Solo la hora, en `HH:mm` (`SelectedHour` del selector nativo) |
| `selectedDateHour` | Texto | Mismo valor que `dateTime` (`SelectedDateHour` del selector nativo) |
| `onChange` | Numero | Contador que se incrementa cada vez que el usuario cambia la fecha o la hora (`OnChange` del selector nativo) |
| `onSelect` | Numero | Contador que se incrementa cada vez que el usuario abre el panel (`OnSelect` del selector nativo) |

Todas las salidas de valor se derivan del mismo dato: si no hay seleccion, quedan vacias. Los dos contadores empiezan en `0` y solo avanzan con acciones del usuario (elegir un dia, cambiar la hora, escribir una fecha, limpiar o abrir el panel), no cuando la aplicacion precarga el valor.

```powerfx
// Detectar el cambio una sola vez, sin repetir la accion en cada render
If(
    dtpVisita.onChange <> varUltimoCambio,
    Set(varUltimoCambio, dtpVisita.onChange);
    Notify("Nueva fecha y hora: " & dtpVisita.selectedDateHour)
)
```


## 5. Comportamiento

1. **Abrir el panel:** clic en el campo o en el boton. El calendario abre en el mes del valor actual; si no hay valor, en el mes actual.
2. **Seleccionar un dia:** la fecha elegida se resalta, se **conserva la hora** que estuviera seleccionada y el valor se publica. La hora propuesta la primera vez es la **hora actual alineada a 15 minutos**.
3. **Cambiar la hora:** el selector ofrece tramos de 15 minutos (`00:00`, `00:15`, `00:30`, ...). Al cambiar la hora, la fecha se mantiene y se publica el nuevo `dateTime`.
4. **Escribir la fecha en el campo del panel:** si escribes una fecha valida se publica; si la dejas vacia, las salidas `dateTime`, `date` y `time` quedan vacias.
5. **Boton Limpiar** (pie del panel): borra la fecha y la hora y publica vacio.
6. **Formato de la hora:** `12` y `12:00:00` muestran la hora con AM/PM (respetando la propiedad *Idioma* cuando esta definida); `24:00:00` y `12:00:00` agregan los segundos en el resumen. El valor de las salidas nunca cambia: siempre `HH:mm` en 24 horas.
7. **Limites:** *Fecha mínima*/*Fecha máxima* y *Año inicial del calendario*/*Año final del calendario* deshabilitan dias y detienen la navegacion mensual.
8. **Reiniciar desde Power Fx:** cuando cambia *Reiniciar selección* se limpian fecha y hora.
9. **Precarga:** el orden de prioridad es *Fecha y hora inicial (selector nativo)* (`defaultDateHour`), despues *Fecha y hora precargada por omision* (`defaultDate`) y por ultimo *Fecha y hora precargada* (`initialDateTime`); el valor se aplica cuando cambia.
10. **Modo de presentacion:** con `Edit` (predeterminado) se elige con normalidad; con `View` se ve el valor y el campo queda de solo lectura, sin abrir el panel ni disparar `onSelect`; con `Disabled` se aplica la paleta deshabilitada (*Color de fondo deshabilitado*, *Color del texto deshabilitado* y *Color del borde deshabilitado*) y tampoco se puede interactuar. El bloqueo del host (control deshabilitado desde la aplicacion) se comporta como `Disabled`.
11. **Foco y ayuda:** *Color del borde con foco* y *Grosor del borde con foco* dibujan el anillo del campo cuando tiene el foco; *Texto de ayuda emergente* se muestra al pasar el puntero sobre el campo y sobre el boton del calendario.
12. **Visible:** con *Visible* en No, el control no dibuja nada y deja de ocupar espacio util. La salida conserva el ultimo valor.
13. **Tamaño y relleno:** *Alto del campo (px)*, *Ancho del campo (px)*, *Relleno superior/derecho/inferior/izquierdo* y *Alto mínimo*/*Ancho mínimo del control* afectan solo al campo cerrado; el panel desplegado mantiene su diseño de 340 px de ancho mínimo.
14. **Cabecera del calendario:** *Fondo de la cabecera del calendario* pinta la barra del mes y del año dentro del panel, incluidos los botones de mes anterior y siguiente.


### 5.1 Ejemplo de precarga

```powerfx
// Propiedad Fecha y hora precargada (texto)
"2026-09-16T08:30"

// Desde un registro (si la columna ya trae fecha y hora)
Text(ThisItem.FechaHora, "yyyy-mm-dd") & "T" & Text(ThisItem.FechaHora, "HH:mm")
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
UpdateContext({ reiniciarMomento: true });   // Reiniciar selección = reiniciarMomento
```

### 6.1 Estilos y eventos del selector nativo

Las propiedades de entrada se escriben en el panel de propiedades del control (el icono **fx**), igual que en el control nativo:

```powerfx
// Modo de presentacion segun el estado del formulario
If(varSoloLectura, "View", "Edit")

// Color del borde con foco y grosor del anillo
Color.Blue

// Tamano del campo: alto y ancho en pixeles
40
```

Los eventos se leen como contadores desde una formula de comportamiento (por ejemplo el `OnSelect` de un boton o el `OnVisible` de la pantalla):

```powerfx
// Reaccionar una sola vez al cambio de fecha y hora
If(
    DateTimePicker1.onChange <> varUltimoCambio,
    Set(varUltimoCambio, DateTimePicker1.onChange);
    Set(varMomento, DateTimeValue(DateTimePicker1.selectedDateHour));
    Notify("Fecha y hora actualizadas", NotificationType.Information)
)
```

## 7. Limites y buenas practicas

- **Tramos de 15 minutos:** el selector de hora trabaja con esa granularidad; *Formato de hora* con segundos solo cambia la presentacion (`HH:mm:00`).
- **Zona horaria:** con `Local` las fechas se interpretan en la hora local del equipo. Con `Utc` el control trabaja con la fecha y hora UTC y agrega `Z` a `dateTime`; no convierte automaticamente una hora local escrita sin desplazamiento, asi que captura el valor ya en la zona correcta. Al enviar el valor como instante a otro sistema, verifica la zona del usuario.
- **El control no crece en el lienzo:** el panel flotante es el que crece; el ancho minimo del panel es 340 px. *Alto del campo (px)*, *Ancho del campo (px)* y los rellenos solo cambian el campo cerrado.
- **Posicion:** *X* e *Y* son un desplazamiento (`translate`) sobre la posicion que asigna el lienzo; no cambian el tamano del contenedor ni liberan espacio.
- **Contadores de evento:** `onChange` y `onSelect` son numeros que solo crecen. Guarda el ultimo valor en una variable para ejecutar una accion una sola vez; el valor seleccionado siempre se lee de `selectedDateHour` (o de `dateTime`).
- **Visible:** al desactivar *Visible* el control deja de dibujarse, pero el valor de las salidas se conserva.
- **Un valor por pantalla:** para un intervalo usa `DateTimeRangePicker`.
- **Etiquetas:** configura *Etiqueta accesible* en pantallas donde el campo no tenga una etiqueta visible propia, y *Texto de ayuda emergente* cuando necesites explicar el formato esperado.

## 8. Problemas comunes

| Sintoma | Causa probable | Solucion |
| --- | --- | --- |
| La hora vuelve a `00:00` al elegir otro dia | No habia hora previa y no se cambio el selector | Elige la hora despues de la fecha, o precarga el valor completo |
| `DateTimeValue` falla | La salida se modifico o el formato tiene otra forma | Usa la salida tal cual (`YYYY-MM-DDTHH:mm`); no la recompongas a mano |
| El valor inicial no se aplica | El texto no trae `T` entre fecha y hora | Escribe `2026-09-16T08:30` |
| El resumen muestra otra hora de la esperada | *Formato de hora* esta en 12 horas y se compara con una cadena de 24 | Deja `24` para leer el resumen como la salida |
| El control no aparece en la pantalla | *Visible* esta en No | Ponlo en Si (o quita la formula que lo desactiva) |
| Los colores deshabilitados no se ven | El *Modo de presentacion* sigue en `Edit` | Ponlo en `Disabled` o deshabilita el control desde la aplicacion |
| El anillo de foco no cambia | El foco esta en el panel y no en el campo | Configura el color con el campo cerrado enfocado; el anillo usa *Color del borde con foco* y *Grosor del borde con foco* |
| La accion del evento se ejecuta muchas veces | Se compara `onChange` sin guardar el ultimo valor | Guarda el contador en una variable y compara antes de actuar |
| *Fecha y hora inicial* no se aplica | El texto no trae `T` o la propiedad de mayor prioridad la pisa | Usa `YYYY-MM-DDTHH:mm` y deja vacias `defaultDate` e `initialDateTime` |

## 9. Verificacion

| # | Accion | Resultado esperado |
| --- | --- | --- |
| 1 | Abrir el panel sin valor previo | El selector de hora propone la hora actual alineada a 15 minutos |
| 2 | Cambiar la hora y luego elegir un dia | `dateTime` combina el dia elegido con la hora seleccionada |
| 3 | Elegir un dia y volver a abrir | La hora y el mes se mantienen coherentes con el valor |
| 4 | Vaciar el campo de fecha del panel | `dateTime`, `date` y `time` quedan vacios |
| 5 | Cambiar *Formato de hora* a `12` | El resumen muestra la hora en formato de 12 horas |
| 6 | Poner `DisplayMode` en `View` | No se abre el panel y el campo queda de solo lectura, con el aspecto normal |
| 7 | Poner `DisplayMode` en `Disabled` | El campo se pinta con *Color de fondo deshabilitado*, *Color del texto deshabilitado* y *Color del borde deshabilitado*, y no se puede interactuar |
| 8 | Enfocar el campo con *Color del borde con foco* y *Grosor del borde con foco* configurados | El anillo de foco usa ese color y ese grosor |
| 9 | Configurar *Texto de ayuda emergente* y pasar el puntero | El texto aparece sobre el campo y sobre el boton del calendario |
| 10 | Poner *Alto del campo (px)* = 40 y *Ancho del campo (px)* = 320 | El campo cerrado toma ese tamano; el panel abierto no cambia |
| 11 | Configurar *Fondo de la cabecera del calendario* y abrir el panel | La barra del mes y del año se pinta con ese color |
| 12 | Cambiar *Reiniciar selección* | Se limpian fecha y hora |
| 13 | Abrir el panel del calendario | La salida `onSelect` sube una unidad |
| 14 | Elegir un dia y cambiar la hora | `onChange` sube una unidad por cambio y `selectedHour`/`selectedDateHour` publican el valor |
| 15 | Poner *Visible* en No | El control deja de dibujarse y las salidas conservan el ultimo valor |

El arnes del repositorio (ver [README.md](README.md#9-verificacion-y-pruebas)) cubre la conservacion de la hora al cambiar el dia, la publicacion de `YYYY-MM-DDTHH:mm`, el cierre del panel al elegir el dia, la hora por defecto alineada a 15 minutos, la ausencia de valor cuando no hay fecha y el boton Limpiar, ademas del modo de presentacion, la prioridad de la fecha inicial, el tamaño y el relleno del campo, la paleta deshabilitada, la cabecera del calendario y el aviso de `OnSelect` (112 verificaciones en total).

## 10. Archivos del control

| Archivo | Contenido |
| --- | --- |
| `DateTimePicker/ControlManifest.Input.xml` | Contrato: propiedades, salidas, recursos y metadatos |
| `DateTimePicker/index.ts` | Adaptador PCF: prioridad de la precarga, `resetKey`, `displayMode`, publicacion de las seis salidas de valor y los contadores `onChange`/`onSelect` |
| `DateTimePicker/DateTimePickerView.tsx` | Vista React: calendario, campo de fecha, selector de hora, estilos configurables y modos de presentacion |
| `DateTimePicker/DateTimePicker.css` | Estilos con prefijo de clases `dtp-` |
| `DateTimePicker/strings/DateTimePicker.1033.resx` | Nombres y descripciones localizados del panel de propiedades |
