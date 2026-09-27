# DateTimeRangePicker

> Fecha: 2026-09-27
> Descripcion: Selector de rango de fecha y hora (inicio y fin) para Power Apps Canvas: propiedades, salidas, comportamiento, ejemplos y pruebas. Indice general en [README.md](README.md).

## 1. Que es

`DateTimeRangePicker` es un control PCF de tipo `virtual` que permite elegir **fecha y hora de inicio** y **fecha y hora de fin**, y publicar los dos extremos en formato tecnico `YYYY-MM-DDTHH:mm`.

| Dato | Valor |
| --- | --- |
| Identificador de componente | `id5_ID10005.DateTimeRangePicker` |
| Version | 1.0.11 |
| Salidas | `startDateTime`, `endDateTime`, `selectedDate` |
| Requiere servicios externos | No |
| Proyecto | Anidado en `DateTimeRangePicker/` (se puede compilar por separado) |

Estructura visual:

- **Modo compacto:** campo de 32 px con el resumen del rango (`inicio -> fin`) y boton azul a la derecha.
- **Panel expandido:** encabezado con la etiqueta *RANGO DE FECHA Y HORA*, el resumen, la pastilla de estado (*En seleccion* o *Listo*) y el boton de cierre.
- **Calendario:** extremos resaltados, dias intermedios con fondo de rango, hoy con borde y navegacion mensual.
- **Campos Inicio y Fin:** cada uno con un campo de fecha (`date`) y un **selector de hora cada 15 minutos**; se pueden editar directamente sin volver a tocar el calendario.
- **Pie:** mensaje (*Haz clic en dos fechas para completar el rango* o *Rango seleccionado*) y, cuando hay rango, el boton **Limpiar**.

Cuando lo usas: para filtrar por un intervalo de tiempo exacto (turnos, jornadas, sesiones) y para alimentar la propiedad **Items** de galerias o de `ExcelReportPicker`.

## 2. Empezar rapido

1. En el estudio de Power Apps: **Insertar > Obtener mas componentes > Codigo > DateTimeRangePicker**.
2. Opcional: define *Formato de fecha* (`YYYY-MM-DD`) y *Formato de hora* (`24`, `12`, `24:00:00` o `12:00:00`).
3. Opcional: precarga con *Fecha y hora inicial de inicio* (`initialStartDateTime`) y *Fecha y hora inicial de fin* (`initialEndDateTime`), por ejemplo `2026-09-16T08:30` y `2026-09-16T18:30`.

Resultado: `DateTimeRangePicker1.startDateTime` y `DateTimeRangePicker1.endDateTime` contienen los extremos.

## 3. Propiedades de entrada

### 3.1 Datos y comportamiento

| Propiedad (nombre tecnico) | Nombre en Power Apps | Tipo | Predeterminado | Descripcion |
| --- | --- | --- | --- | --- |
| `initialStartDateTime` | *Fecha y hora inicial de inicio* | Texto | vacio | Extremo inicial precargado en `YYYY-MM-DDTHH:mm` |
| `initialEndDateTime` | *Fecha y hora inicial de fin* | Texto | vacio | Extremo final precargado en `YYYY-MM-DDTHH:mm` |
| `defaultDate` | *Fecha predeterminada* | Texto | vacio | Si no esta vacia, sustituye a *Fecha y hora inicial de inicio* |
| `format` | *Formato de fecha* | Texto | `YYYY-MM-DD` | Formato de la parte de fecha en el resumen y en los campos |
| `timeFormat` | *Formato de hora* | Texto | `24` | Apariencia de la hora: `24`, `12`, `24:00:00` o `12:00:00` |
| `resetKey` | *Reiniciar seleccion* | Si/No | No | Cuando cambia de valor se limpia el rango completo |
| `zIndex` | *Prioridad visual del panel* | Numero | `2147483647` | `z-index` del panel abierto |
| `placeholderText` | *Texto de ayuda* | Texto | `Selecciona fecha` | Texto del campo cuando no hay rango |
| `isEditable` | *Editable* | Si/No | No | Permite escribir la fecha en los campos Inicio y Fin |
| `accessibleLabel` | *Etiqueta accesible* | Texto | vacio | Texto para lectores de pantalla |
| `minDate` | *Fecha minima* | Texto | vacio | Primer dia seleccionable del calendario |
| `maxDate` | *Fecha maxima* | Texto | vacio | Ultimo dia seleccionable del calendario |
| `startYear` | *Ano inicial* | Numero | `0` | Ano menor del calendario (`0` = sin limite) |
| `endYear` | *Ano final* | Numero | `0` | Ano mayor del calendario (`0` = sin limite) |
| `startOfWeek` | *Primer dia de la semana* | Texto | regional | `auto`, `sunday`, `monday`, `tuesday`, `wednesday`, `thursday`, `friday` o `saturday` |
| `dateTimeZone` | *Zona horaria* | Texto | local del dispositivo | Zona usada para calcular *hoy* |
| `language` | *Idioma* | Texto | regional | Codigo de idioma para meses, dias y hora de 12 horas |

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
| `startDateTime` | Texto | Inicio del rango en `YYYY-MM-DDTHH:mm` |
| `endDateTime` | Texto | Fin del rango en `YYYY-MM-DDTHH:mm` |
| `selectedDate` | Texto | Mismo valor que `startDateTime`. Se conserva por compatibilidad |

## 5. Comportamiento

1. **Primer clic en un dia:** ese dia pasa a ser el extremo inicial con la hora que este seleccionada en el campo **Inicio** (la hora actual alineada a 15 minutos la primera vez). La pastilla muestra *En seleccion*.
2. **Segundo clic:** se completa el rango (con la hora del campo **Fin**), se resaltan los dias intermedios, la pastilla pasa a *Listo* y el panel se contrae publicando los dos extremos.
3. **Campos Inicio y Fin:** cada uno tiene un campo de fecha y un selector de hora cada 15 minutos. Cambiar cualquiera de los dos publica el rango de inmediato, sin necesidad de tocar el calendario.
4. **Nueva seleccion despues de un rango completo:** el siguiente clic empieza un rango nuevo.
5. **Boton Limpiar:** vacia los dos extremos y publica vacio.
6. **Formato de la hora:** `12` y `12:00:00` muestran la hora con AM/PM; `24:00:00` y `12:00:00` agregan segundos en el resumen. Las salidas siempre son `HH:mm` en 24 horas.
7. **Limites:** *Fecha minima*/*Fecha maxima* y *Ano inicial*/*Ano final* deshabilitan dias y limitan la navegacion mensual.
8. **Reiniciar desde Power Fx:** cuando cambia *Reiniciar seleccion* se limpia el rango y la salida publica vacio.
9. **Precarga:** *Fecha predeterminada* tiene prioridad para el extremo inicial; los valores se aplican cuando cambian.
10. **Control deshabilitado:** con `DisplayMode` en `View` no se abre el panel ni se pueden cambiar los campos.

### 5.1 Precarga desde un registro

```powerfx
// Propiedades (texto)
//   Fecha y hora inicial de inicio = Text(ThisItem.Inicio, "yyyy-mm-dd") & "T" & Text(ThisItem.Inicio, "hh:mm")
//   Fecha y hora inicial de fin    = Text(ThisItem.Fin, "yyyy-mm-dd") & "T" & Text(ThisItem.Fin, "hh:mm")
```

## 6. Ejemplos en Power Fx

```powerfx
// 1. Filtrar por el intervalo exacto (columnas de fecha y hora)
Filter(Movimientos,
    FechaHora >= DateTimeValue(DateTimeRangePicker1.startDateTime) &&
    FechaHora <= DateTimeValue(DateTimeRangePicker1.endDateTime))

// 2. Periodo por dias completos: incluye todo el dia final
Filter(Movimientos,
    FechaHora >= DateTimeValue(DateTimeRangePicker1.startDateTime) &&
    FechaHora < DateAdd(DateValue(Left(DateTimeRangePicker1.endDateTime, 10)), 1, Days))

// 3. Comprobar que el rango esta completo antes de consultar
If(IsBlank(DateTimeRangePicker1.endDateTime),
   Notify("Elige el fin del periodo", NotificationType.Warning))

// 4. Duracion del periodo elegido (en horas)
DateDiff(DateTimeValue(DateTimeRangePicker1.startDateTime),
         DateTimeValue(DateTimeRangePicker1.endDateTime), Hours)

// 5. Limpiar el rango desde un boton
UpdateContext({ reiniciarTurno: true });   // Reiniciar seleccion = reiniciarTurno
```

## 7. Limites y buenas practicas

- **Tramos de 15 minutos:** la granularidad de la hora es la de los selectores; los segundos solo se muestran cuando *Formato de hora* los incluye.
- **Sin filtro automatico:** el control publica las fechas; el filtrado se escribe en la aplicacion con `Filter`, `DateDiff`, etc.
- **Sin conversion a UTC:** los valores se construyen con la hora local del navegador (o la zona de *Zona horaria*).
- **Un rango por control:** para dos periodos a la vez, usa dos controles.
- **Orden de los extremos:** si eliges primero un extremo mayor, el control ordena el rango para que `startDateTime` sea menor o igual que `endDateTime`.
- **Proyecto propio:** este control se compila tambien en el proyecto anidado `DateTimeRangePicker` (ver [README.md](README.md#4-compilar-los-controles)).

## 8. Problemas comunes

| Sintoma | Causa probable | Solucion |
| --- | --- | --- |
| La hora del extremo final no es la esperada | El campo **Fin** conserva la hora anterior | Escribe la hora en el campo **Fin** antes de cerrar el panel |
| `endDateTime` vacio | Solo se eligio el inicio | Elige el segundo extremo o escribe la fecha y hora de fin |
| Las horas no incluyen segundos | La granularidad es de 15 minutos | Ajusta la hora en la aplicacion si necesitas precision mayor |
| El rango no se precarga | El texto no tiene el formato `YYYY-MM-DDTHH:mm` | Construye el texto con `Text(..., "yyyy-mm-dd") & "T" & Text(..., "hh:mm")` |
| Filtrar deja fuera el dia final | Se compara con `<=` sobre columnas con hora | Usa `< DateAdd(...)` con el dia siguiente |

## 9. Verificacion

| # | Accion | Resultado esperado |
| --- | --- | --- |
| 1 | Clic en un dia | Se marca el extremo inicial y la pastilla muestra *En seleccion* |
| 2 | Clic en otro dia | Se resalta el rango y se publican los dos extremos con hora |
| 3 | Cambiar la hora del campo **Fin** | `endDateTime` se actualiza al instante |
| 4 | Pulsar **Limpiar** | Las salidas quedan vacias |
| 5 | Cambiar *Formato de hora* a `12` | El resumen usa 12 horas y las salidas siguen en 24 |
| 6 | Configurar `minDate` y `maxDate` | Los dias fuera de los limites se ven deshabilitados |
| 7 | Cambiar *Reiniciar seleccion* | El rango se limpia |
| 8 | Poner `DisplayMode` en `View` | No se puede abrir el panel |

## 10. Archivos del control

| Archivo | Contenido |
| --- | --- |
| `DateTimeRangePicker/DateTimeRangePicker/ControlManifest.Input.xml` | Contrato: propiedades, salidas, recursos y metadatos |
| `DateTimeRangePicker/DateTimeRangePicker/index.ts` | Adaptador PCF: precarga de los dos extremos, `resetKey` y publicacion |
| `DateTimeRangePicker/DateTimeRangePicker/DateTimeRangePickerView.tsx` | Vista React: calendario, campos Inicio/Fin con hora y panel |
| `DateTimeRangePicker/DateTimeRangePicker/DateTimeRangePicker.css` | Estilos con prefijo de clases `dtrp-` |
| `DateTimeRangePicker/package.json`, `tsconfig.json`, `DateTimeRangePicker.pcfproj` | Entorno de build del proyecto anidado |
