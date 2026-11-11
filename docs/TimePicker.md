# TimePicker

> Fecha: 2026-11-10
> Descripcion: Selector de una sola hora para Power Apps Canvas: propiedades, salidas, comportamiento, ejemplos y pruebas. Indice general en [README.md](README.md).

## 1. Que es

`TimePicker` es un control PCF de tipo `virtual` que permite elegir **una sola hora** con listas de hora, minuto y segundo, y la publica en formato tecnico `HH:mm:ss` y por partes.

| Dato | Valor |
| --- | --- |
| Identificador de componente | `id5_ID10005.TimePicker` |
| Version | 1.0.0 |
| Salidas | `selectedTime`, `hour`, `minute`, `second` |
| Requiere servicios externos | No |

Estructura visual:

- **Modo compacto:** campo de 32 px con el resumen de la hora elegida y boton con icono de reloj a la derecha.
- **Panel expandido:** encabezado (etiqueta *HORA*, resumen, estado *Listo* / *En selección* y cierre), vista previa de la hora, listas de **Hora**, **Minuto** y, si esta activo, **Segundo**, mas el selector **AM/PM** en reloj de 12 horas, y el pie con **Ahora** y **Limpiar**.
- **Formato de la hora:** la propiedad *Formato* acepta un patron (`HH:mm:ss`, `hh:mm A`, ...); si se deja vacia, el formato se deduce de *Usar formato de 24 horas* y *Mostrar segundos*. La salida nunca cambia: siempre `HH:mm:ss` en 24 horas.

Cuando lo usas: para capturar una hora suelta (hora de corte, hora de atencion, horario de un turno) sin fecha, con la salida lista para `TimeValue` o para combinarla con una fecha.

## 2. Guia de uso paso a paso

Esta guia reproduce el caso mas comun: **registrar la hora de un turno**. La aplicacion precarga la hora al editar, limita las horas posibles y guarda el valor en una columna de texto.

### 2.1 Antes de empezar

| Requisito | Como comprobarlo |
| --- | --- |
| PCF para canvas activo y solucion publicada | Power Platform admin center > Entorno > Caracteristicas; Soluciones > `ID0005_DataPickers` |
| Control disponible en el estudio | **Insertar > Obtener mas componentes > Codigo > TimePicker** |
| Columna destino | Columna de texto (la salida `selectedTime` es texto `HH:mm:ss`) o una formula que la convierta |
| Rango horario acordado con el negocio | *Hora inicial* y *Hora final* limitan las horas de la lista |

### 2.2 Pasos

1. **Inserta el control** desde **Insertar > Obtener mas componentes > Codigo > TimePicker** y renombralo, por ejemplo `tpTurno`.
2. **Fija el formato:** deja *Usar formato de 24 horas* activo y *Mostrar segundos* desactivado. El resumen mostrara `HH:mm`, que coincide con la parte de hora de la salida tecnica `HH:mm:ss`.
3. **Limita el horario:** en *Hora inicial* escribe `6` y en *Hora final* `20`. Solo se podran elegir horas entre 06 y 20; para un turno nocturno usa `22` y `6`.
4. **Ajusta la granularidad:** *Intervalo de minutos* = `15` reduce la lista de minutos a `00`, `15`, `30` y `45`.
5. **Precarga al editar:** en *Hora predeterminada* escribe `ThisItem.HoraCorte` (si la columna ya trae una hora) o el texto `"08:30"`. Acepta `HH:mm`, `HH:mm:ss`, `hh:mm AM/PM` y una fecha y hora ISO.
6. **Conecta el reinicio:** usa `UpdateContext({ limpiarHora: false })` y enlaza *Reiniciar selección* (`resetKey`) a `limpiarHora`; un boton lo alterna con `UpdateContext({ limpiarHora: !limpiarHora })`.
7. **Lee la salida:** `tpTurno.selectedTime` devuelve `HH:mm:ss`. Usa `tpTurno.hour`, `tpTurno.minute` y `tpTurno.second` para leer las partes como numeros.
8. **Guarda con validacion:** antes del `Patch`, comprueba `!IsBlank(tpTurno.selectedTime)`. La guia completa esta en [ejemplos/TimePicker.md](ejemplos/TimePicker.md).

### 2.3 Configuracion minima recomendada

| Propiedad | Valor sugerido | Por que |
| --- | --- | --- |
| *Usar formato de 24 horas* | Activado | Evita confusiones entre AM/PM y la salida de 24 horas |
| *Mostrar segundos* | Desactivado | La mayoria de los horarios no necesita segundos; la salida queda en `HH:mm:00` |
| *Intervalo de minutos* | `15` | Lista corta y facil de usar; usa `1` si necesitas precision al minuto |
| *Hora inicial* / *Hora final* | `6` / `20` | Evita horas fuera del horario de atencion (un rango `22` a `6` cruza la medianoche) |
| *Hora predeterminada* | `ThisItem.HoraCorte` | Precarga el registro que se edita |
| *Reiniciar selección* | `limpiarHora` | Permite limpiar el control desde Power Fx |

### 2.4 Comprobar que funciona

1. Abre el panel sin valor: la hora propuesta debe ser la actual alineada al *Intervalo de minutos*.
2. Cambia la hora y el minuto: `selectedTime` cambia en cada paso y conserva la parte que no se modifico.
3. Activa *Mostrar segundos*: aparece la lista de segundos y `selectedTime` conserva el segundo elegido.
4. Precarga `22:45` con *Hora inicial* `22` y *Hora final* `6`: el valor se aplica y la lista incluye el cruce de medianoche.
5. Pulsa **Limpiar**: `selectedTime` queda vacia y `hour`, `minute` y `second` vuelven a `0`.

Resultado: `tpTurno.selectedTime` devuelve `HH:mm:ss`. La guia completa, con escenarios de alta y edicion, esta en [ejemplos/TimePicker.md](ejemplos/TimePicker.md).

## 3. Propiedades de entrada

### 3.1 Datos y comportamiento

| Propiedad (nombre tecnico) | Nombre en Power Apps | Tipo | Predeterminado | Descripcion |
| --- | --- | --- | --- | --- |
| `defaultTime` | *Hora predeterminada* | Texto | vacio | Hora precargada. Acepta `HH:mm`, `HH:mm:ss`, `hh:mm AM/PM`, una fecha y hora ISO (`2026-11-10T08:30:00`) o vacio. Se lee tal como esta escrita, sin convertir zonas horarias |
| `format` | *Formato* | Texto | vacio | Patron de presentacion con los tokens `HH` (24 h), `H`, `hh` (12 h), `h`, `mm`, `ss`, `A` (AM/PM) y `a` (am/pm), por ejemplo `HH:mm:ss` o `hh:mm A`. Vacio o sin tokens = formato automatico |
| `resetKey` | *Reiniciar selección* | Si/No | No | Cuando cambia de valor, el control limpia la hora seleccionada |
| `startHour` | *Hora inicial* | Numero | `0` | Primera hora elegible (0 a 23). Si es mayor que la hora final, el rango cruza la medianoche |
| `endHour` | *Hora final* | Numero | `23` | Ultima hora elegible (0 a 23). Si es igual a la hora inicial, solo se puede elegir esa hora |
| `minuteInterval` | *Intervalo de minutos* | Numero | `1` | Paso de la lista de minutos, de 1 a 60. Vacio o `0` usa `1` |
| `showSeconds` | *Mostrar segundos* | Si/No | No | Muestra la lista de segundos y conserva los segundos elegidos; si esta desactivado, siempre son `00` |
| `use24HourFormat` | *Usar formato de 24 horas* | Si/No | Si | Reloj de 24 horas (0 a 23). Desactivado usa 1 a 12 con AM/PM |

Las propiedades de posicion y visibilidad (`X`, `Y`, `Width`, `Height`, `Visible` y `DisplayMode`) las aporta el host y no se declaran en el manifiesto. El control tampoco declara un evento `onChange`: cada cambio se publica con `notifyOutputChanged`, de modo que las formulas que leen `selectedTime`, `hour`, `minute` o `second` se recalculan solas.

### 3.2 Apariencia (equivalentes al selector de hora nativo)

| Propiedad | Nombre en Power Apps | Tipo | Predeterminado |
| --- | --- | --- | --- |
| `borderColor` | *Color del borde* | Texto | `#8a8a8a` |
| `borderThickness` | *Grosor del borde* | Numero | `1` |
| `focusedBorderColor` | *Color del borde con foco* | Texto | `#2f5da8` |
| `color` | *Color del texto* | Texto | predeterminado del tema |
| `fill` | *Color de fondo del campo* | Texto | predeterminado del tema |
| `font` | *Fuente del texto* | Texto | predeterminado del tema |
| `fontWeight` | *Grosor de la fuente* | Texto | `Normal` |
| `size` | *Tamaño de la fuente* | Numero | `13` |

Los colores aceptan `#RRGGBB`, `rgb()`, nombres CSS y `Color.X` de Power Apps; el grosor de fuente acepta `Bold`, `Semibold`, `Normal`, `Lighter`, `FontWeight.Bold` o un numero de 100 a 900. Un valor vacio o invalido deja el estilo predeterminado.

## 4. Salidas

| Salida | Tipo | Descripcion |
| --- | --- | --- |
| `selectedTime` | Texto | Hora tecnica `HH:mm:ss` en 24 horas. Vacia mientras no haya seleccion |
| `hour` | Numero | Hora de 0 a 23; `0` si no hay seleccion |
| `minute` | Numero | Minuto de 0 a 59; `0` si no hay seleccion |
| `second` | Numero | Segundo de 0 a 59; `0` si no hay seleccion o si *Mostrar segundos* esta desactivado |

Las cuatro salidas se derivan del mismo valor: cuando no hay seleccion, `selectedTime` queda vacia y las partes numericas devuelven `0`.

## 5. Comportamiento

1. **Abrir el panel:** clic en el campo o en el boton del reloj. El panel se dibuja junto al campo, fuera del contenedor, y se cierra con el boton de cierre (**×**).
2. **Sin valor previo:** la hora propuesta es la **hora actual alineada al *Intervalo de minutos***, con los segundos en `00`. Cambiar una lista publica la hora de inmediato.
3. **Cambiar la hora:** la lista de horas respeta *Hora inicial* y *Hora final*; un rango con la hora inicial mayor que la final cruza la medianoche (`22` a `6` ofrece `22`, `23`, `0`, ... `6`), y si ambas son iguales solo se ofrece esa hora.
4. **Cambiar el minuto:** la lista usa el paso configurado (`00`, `15`, `30`, `45` con `15`). Una hora precargada con un minuto que no sigue el paso no se pierde: se conserva y se agrega a la lista.
5. **Segundos:** con *Mostrar segundos* activo aparece la lista de segundos y la salida conserva el segundo elegido. Desactivado, el segundo siempre es `00` y tambien se descarta al precargar.
6. **Reloj de 12 horas:** la lista de horas muestra `01` a `12`, el selector **AM/PM** cambia el meridiano y se conserva al cambiar de hora cuando el rango lo permite. Con un rango que solo admite AM, la opcion PM queda deshabilitada (y al reves).
7. **Boton Ahora** (pie del panel): aplica la hora actual alineada al intervalo.
8. **Boton Limpiar** (pie del panel, visible cuando hay seleccion): deja `selectedTime` vacia y cierra el panel.
9. **Formato:** *Formato* con tokens (`HH:mm:ss`, `hh:mm A`, ...) define el resumen y la vista previa. Un patron vacio o sin tokens usa `HH:mm` (24 horas), `HH:mm:ss` (24 horas con segundos), `hh:mm A` (12 horas) o `hh:mm:ss A` (12 horas con segundos).
10. **Reiniciar desde Power Fx:** cuando cambia *Reiniciar selección* se limpia la hora. Con *Hora predeterminada* llena, el valor precargado se aplica cuando ese texto cambia.
11. **Valor fuera del rango o del intervalo:** si el valor actual no pertenece a las horas o minutos configurados, se conserva y se agrega a la lista para no perderlo; el usuario solo puede elegir valores validos.
12. **Control deshabilitado:** con `DisplayMode` en `View` no se abre el panel ni se cambian las listas.

### 5.1 Ejemplo de precarga

```powerfx
// Texto directo
"08:30"

// Con segundos
"08:30:45"

// Reloj de 12 horas
"6:30 PM"

// Desde una columna de fecha y hora (24 horas, sin convertir zonas horarias)
Text(ThisItem.HoraCorte, "HH:mm:ss")
```

Un texto invalido (`"abc"`, `"25:00"`, `"9:75 PM"`) se ignora: el control abre con la hora actual alineada al intervalo.

## 6. Ejemplos en Power Fx

```powerfx
// 1. Hora nativa de Power Apps
Set(varHora, TimeValue(TimePicker1.selectedTime))

// 2. Escribir la hora en un registro como texto tecnico
Patch(Turnos, ThisItem, { HoraCorte: TimePicker1.selectedTime })

// 3. Combinar una fecha y una hora en un solo instante
DateTimeValue(DatePicker1.date & "T" & TimePicker1.selectedTime)

// 4. Leer las partes como numeros
Notify("Hora: " & TimePicker1.hour & " Minuto: " & TimePicker1.minute)

// 5. Mostrar la hora con AM/PM a partir de la salida tecnica
Text(TimeValue(TimePicker1.selectedTime), "hh:mm AM/PM")

// 6. Limpiar el control desde un boton
UpdateContext({ reiniciarHora: true });   // Reiniciar selección = reiniciarHora
```

`TimeValue` acepta `HH:mm:ss`, por lo que la salida se puede usar directamente. Para guardar en una columna de fecha y hora, combina la fecha con `DateTimeValue(fecha & "T" & hora)`.

## 7. Limites y buenas practicas

- **Solo hora, sin fecha:** el control no guarda dia ni zona horaria. Para un instante completo usa `DateTimePicker` o combina `DatePicker` con `TimePicker`.
- **Zona horaria:** la hora se lee y se publica como esta escrita; no hay conversion. Si el destino es UTC, convierte explicitamente en Power Fx.
- **Precision:** la lista de minutos depende de *Intervalo de minutos*; los segundos solo existen con *Mostrar segundos*. La salida siempre incluye los segundos (`:00` cuando no se muestran).
- **Valores fuera de rango:** el control conserva el valor actual aunque no pertenezca al rango o al paso, para no perder datos; no lo corrige ni lo trunca.
- **El control no crece en el lienzo:** el panel flotante es el que crece y se coloca junto al campo; el ancho minimo del panel es 260 px.
- **Un valor por pantalla:** para un intervalo de horas usa dos controles y valida en Power Fx que la hora final sea posterior a la inicial.
- **Etiquetas:** el campo y las listas exponen etiquetas `aria-*` (*Selector de hora*, *Abrir el selector de hora*, *Hora*, *Minuto*, *Segundo*, *AM o PM*, *Contraer selector*).

## 8. Problemas comunes

| Sintoma | Causa probable | Solucion |
| --- | --- | --- |
| La precarga no se aplica | El texto no es una hora valida | Usa `HH:mm`, `HH:mm:ss`, `hh:mm AM/PM` o una fecha y hora ISO |
| `TimeValue` falla | La salida se modifico o se convirtio a otro formato | Usa `selectedTime` tal cual (`HH:mm:ss`) |
| Los segundos siempre aparecen en `00` | *Mostrar segundos* esta desactivado | Activa la propiedad si necesitas precision en segundos |
| El resumen muestra 12 horas y se compara con 24 | *Usar formato de 24 horas* esta desactivado o *Formato* usa `hh`/`A` | Deja *Usar formato de 24 horas* activo o lee siempre `selectedTime` |
| No aparecen todas las horas | *Hora inicial* y *Hora final* limitan la lista | Amplia el rango; recuerda que `22` a `6` cruza la medianoche |
| La hora elegida no se guarda como fecha y hora | La columna destino espera una fecha completa | Combina con `DateTimeValue(fecha & "T" & TimePicker1.selectedTime)` |

## 9. Verificacion

| # | Accion | Resultado esperado |
| --- | --- | --- |
| 1 | Abrir el panel sin valor previo | La hora propuesta es la actual alineada al intervalo, con segundos en `00` |
| 2 | Cambiar la hora y el minuto | `selectedTime` cambia en cada paso y conserva la parte no modificada |
| 3 | Activar *Mostrar segundos* y elegir un segundo | La salida conserva el segundo elegido |
| 4 | Configurar *Hora inicial* `22` y *Hora final* `6` | La lista ofrece `22`, `23`, `0`, ... `6` |
| 5 | Configurar *Intervalo de minutos* `15` | La lista de minutos ofrece `00`, `15`, `30` y `45` |
| 6 | Desactivar *Usar formato de 24 horas* | Aparece el selector AM/PM y el resumen usa 12 horas |
| 7 | Pulsar **Limpiar** | `selectedTime` queda vacia y las partes vuelven a `0` |
| 8 | Cambiar *Reiniciar selección* | Se limpia la hora |
| 9 | Poner `DisplayMode` en `View` | No se abre el panel ni se cambian las listas |

El arnes del repositorio (ver [README.md](README.md#9-verificacion-y-pruebas)) cubre el parseo de horas, el rechazo de valores invalidos, la publicacion de `HH:mm:ss`, los patrones de formato, los rangos con cruce de medianoche, el intervalo de minutos, las equivalencias de 12 y 24 horas y los estilos del campo.

## 10. Archivos del control

| Archivo | Contenido |
| --- | --- |
| `TimePicker/ControlManifest.Input.xml` | Contrato: propiedades, salidas, recursos y metadatos |
| `TimePicker/index.ts` | Adaptador PCF: precarga, `resetKey` y publicacion de `selectedTime`, `hour`, `minute` y `second` |
| `TimePicker/TimePickerView.tsx` | Vista React: campo compacto, panel de listas, formato y utilidades puras |
| `TimePicker/TimePicker.css` | Estilos con prefijo de clases `tp-` |
| `TimePicker/strings/TimePicker.1033.resx` | Nombres y descripciones localizados del panel de propiedades |



