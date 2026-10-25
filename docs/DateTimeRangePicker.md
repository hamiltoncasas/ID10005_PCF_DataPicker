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

## 2. Guia de uso paso a paso

Esta guia reproduce el caso mas comun: **filtrar movimientos por un intervalo exacto de fecha y hora**, por ejemplo el turno de un operador o una ventana de mantenimiento.

### 2.1 Antes de empezar

| Requisito | Como comprobarlo |
| --- | --- |
| PCF para canvas activo y solucion publicada | Power Platform admin center > Entorno > Caracteristicas; Soluciones > `ID0005_DataPickers` |
| Control disponible en el estudio | **Insertar > Obtener mas componentes > Codigo > DateTimeRangePicker** |
| Columna de destino de tipo **Fecha y hora** | Datos > Tabla > Columna > Tipo *Fecha y hora* |
| Regla del intervalo | Si el fin es inclusivo (`<=`) o exclusivo (`<`), y la zona horaria de los datos |

### 2.2 Pasos

1. **Inserta el control** desde **Insertar > Obtener mas componentes > Codigo > DateTimeRangePicker** y renombralo, por ejemplo `rangoTurno`.
2. **Configura los formatos:** *Formato de fecha* = `YYYY-MM-DD` y *Formato de hora* = `24`. Las salidas siempre usan `YYYY-MM-DDTHH:mm` y `HH:mm` en 24 horas.
3. **Precarga el intervalo:** en *Fecha y hora inicial precargada* (`initialStartDateTime`) escribe `Text(ThisItem.Inicio, "yyyy-mm-dd") & "T" & Text(ThisItem.Inicio, "HH:mm")`; haz lo mismo en *Fecha y hora final precargada* (`initialEndDateTime`) con `ThisItem.Fin`.
4. **Ajusta los campos Inicio y Fin:** cada campo tiene fecha y un selector cada 15 minutos. Cambiar cualquiera de los dos publica el intervalo de inmediato, sin necesidad de tocar el calendario.
5. **Filtra el origen:** usa `FechaHora >= DateTimeValue(rangoTurno.startDateTime) && FechaHora <= DateTimeValue(rangoTurno.endDateTime)`. Si el fin debe ser exclusivo, cambia `<=` por `<`.
6. **Valida antes de consultar:** exige `!IsBlank(rangoTurno.startDateTime) && !IsBlank(rangoTurno.endDateTime)` y comprueba que inicio sea anterior o igual al fin.
7. **Conecta el reinicio:** enlaza *Reiniciar selección* (`resetKey`) a `limpiarTurno` y alternalo desde un boton. La guia completa esta en [ejemplos/DateTimeRangePicker.md](ejemplos/DateTimeRangePicker.md).

### 2.3 Configuracion minima recomendada

| Propiedad | Valor sugerido | Por que |
| --- | --- | --- |
| *Formato de fecha* | `YYYY-MM-DD` | Coincide con la parte de fecha de las salidas |
| *Formato de hora* | `24` | La salida y el resumen se leen igual |
| *Fecha y hora inicial precargada* | `Text(ThisItem.Inicio, "yyyy-mm-dd") & "T" & Text(ThisItem.Inicio, "HH:mm")` | Precarga el intervalo del registro |
| *Fecha y hora final precargada* | `Text(ThisItem.Fin, "yyyy-mm-dd") & "T" & Text(ThisItem.Fin, "HH:mm")` | Completa el intervalo |
| *Zona horaria de los valores* | `Local` | Evita desplazamientos si el origen guarda hora local |
| *Reiniciar selección* | `limpiarTurno` | Permite limpiar el intervalo desde Power Fx |

### 2.4 Comprobar que funciona

1. Abre el panel sin valor: la hora propuesta es la actual alineada a 15 minutos.
2. Elige el dia inicial y el final: el resumen muestra los dos extremos y el panel se contrae.
3. Cambia solo la hora de **Fin**: `endDateTime` se actualiza sin cambiar el dia.
4. Pulsa **Limpiar** o alterna *Reiniciar selección*: las dos salidas quedan vacias.
5. Filtra un origen con hora y revisa los bordes: el registro exactamente en `endDateTime` entra solo si usas `<=`.

Resultado: `rangoTurno.startDateTime` y `rangoTurno.endDateTime` contienen los extremos en `YYYY-MM-DDTHH:mm`. La guia completa, con datos de prueba y variantes de filtro, esta en [ejemplos/DateTimeRangePicker.md](ejemplos/DateTimeRangePicker.md).

## 3. Propiedades de entrada

### 3.1 Datos y comportamiento

| Propiedad (nombre tecnico) | Nombre en Power Apps | Tipo | Predeterminado | Descripcion |
| --- | --- | --- | --- | --- |
| `initialStartDateTime` | *Fecha y hora inicial precargada* | Texto | vacio | Extremo inicial precargado en `YYYY-MM-DDTHH:mm` |
| `initialEndDateTime` | *Fecha y hora final precargada* | Texto | vacio | Extremo final precargado en `YYYY-MM-DDTHH:mm` |
| `defaultDate` | *Fecha de inicio precargada por omision* | Texto | vacio | Si no esta vacia, sustituye a *Fecha y hora inicial precargada* |
| `format` | *Formato de fecha* | Texto | `YYYY-MM-DD` | Formato de la parte de fecha en el resumen y en los campos |
| `timeFormat` | *Formato de hora* | Texto | `24` | Apariencia de la hora: `24`, `12`, `24:00:00` o `12:00:00` |
| `resetKey` | *Reiniciar selección* | Si/No | No | Cuando cambia de valor se limpia el rango completo |
| `zIndex` | *Prioridad visual del selector* | Numero | `2147483647` | `z-index` del panel abierto |
| `placeholderText` | *Texto de ayuda del campo* | Texto | `Selecciona fecha` | Texto del campo cuando no hay rango |
| `isEditable` | *Permitir escribir las fechas* | Si/No | No | Permite escribir la fecha en los campos Inicio y Fin |
| `accessibleLabel` | *Etiqueta accesible* | Texto | vacio | Texto para lectores de pantalla |
| `minDate` | *Fecha mínima* | Texto | vacio | Primer dia seleccionable del calendario |
| `maxDate` | *Fecha máxima* | Texto | vacio | Ultimo dia seleccionable del calendario |
| `startYear` | *Año inicial del calendario* | Numero | `0` | Año menor del calendario (`0` = sin limite) |
| `endYear` | *Año final del calendario* | Numero | `0` | Año mayor del calendario (`0` = sin limite) |
| `startOfWeek` | *Primer día de la semana* | Texto | regional | `auto`, `sunday`, `monday`, `tuesday`, `wednesday`, `thursday`, `friday` o `saturday` |
| `dateTimeZone` | *Zona horaria de los valores* | Texto | local del dispositivo | Zona usada para calcular *hoy* |
| `language` | *Idioma del calendario* | Texto | regional | Codigo de idioma para meses, dias y hora de 12 horas |

### 3.2 Apariencia (equivalentes al selector nativo)

| Propiedad | Nombre en Power Apps | Tipo |
| --- | --- | --- |
| `borderColor` / `borderStyle` / `borderThickness` | *Color del borde*, *Estilo del borde* y *Grosor del borde* | Texto / Texto / Numero |
| `color` / `fill` | *Color del texto* / *Color de fondo del campo* | Texto |
| `font` / `size` / `fontWeight` / `italic` / `strikethrough` / `underline` | *Fuente del texto*, *Tamaño de la fuente*, *Grosor de la fuente*, *Texto en cursiva*, *Texto tachado* y *Texto subrayado* | Texto / Numero / Texto / Si-No |
| `chevronBackground` / `chevronFill` | *Fondo de las flechas del calendario* / *Color de las flechas del calendario* | Texto |
| `iconBackground` / `iconFill` | *Fondo del icono del calendario* / *Color del icono del calendario* | Texto |

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
7. **Limites:** *Fecha mínima*/*Fecha máxima* y *Año inicial del calendario*/*Año final del calendario* deshabilitan dias y limitan la navegacion mensual.
8. **Reiniciar desde Power Fx:** cuando cambia *Reiniciar selección* se limpia el rango y la salida publica vacio.
9. **Precarga:** *Fecha de inicio precargada por omision* tiene prioridad para el extremo inicial; los valores se aplican cuando cambian.
10. **Control deshabilitado:** con `DisplayMode` en `View` no se abre el panel ni se pueden cambiar los campos.

### 5.1 Precarga desde un registro

```powerfx
// Propiedades (texto)
//   Fecha y hora inicial precargada = Text(ThisItem.Inicio, "yyyy-mm-dd") & "T" & Text(ThisItem.Inicio, "HH:mm")
//   Fecha y hora final precargada    = Text(ThisItem.Fin, "yyyy-mm-dd") & "T" & Text(ThisItem.Fin, "HH:mm")
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
UpdateContext({ reiniciarTurno: true });   // Reiniciar selección = reiniciarTurno
```

## 7. Limites y buenas practicas

- **Tramos de 15 minutos:** la granularidad de la hora es la de los selectores; los segundos solo se muestran cuando *Formato de hora* los incluye.
- **Sin filtro automatico:** el control publica las fechas; el filtrado se escribe en la aplicacion con `Filter`, `DateDiff`, etc.
- **Sin conversion a UTC:** los valores se construyen con la hora local del navegador (o la zona de *Zona horaria de los valores*).
- **Un rango por control:** para dos periodos a la vez, usa dos controles.
- **Orden de los extremos:** si eliges primero un extremo mayor, el control ordena el rango para que `startDateTime` sea menor o igual que `endDateTime`.
- **Proyecto propio:** este control se compila tambien en el proyecto anidado `DateTimeRangePicker` (ver [README.md](README.md#4-compilar-los-controles)).

## 8. Problemas comunes

| Sintoma | Causa probable | Solucion |
| --- | --- | --- |
| La hora del extremo final no es la esperada | El campo **Fin** conserva la hora anterior | Escribe la hora en el campo **Fin** antes de cerrar el panel |
| `endDateTime` vacio | Solo se eligio el inicio | Elige el segundo extremo o escribe la fecha y hora de fin |
| Las horas no incluyen segundos | La granularidad es de 15 minutos | Ajusta la hora en la aplicacion si necesitas precision mayor |
| El rango no se precarga | El texto no tiene el formato `YYYY-MM-DDTHH:mm` | Construye el texto con `Text(..., "yyyy-mm-dd") & "T" & Text(..., "HH:mm")` |
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
| 7 | Cambiar *Reiniciar selección* | El rango se limpia |
| 8 | Poner `DisplayMode` en `View` | No se puede abrir el panel |

## 10. Archivos del control

| Archivo | Contenido |
| --- | --- |
| `DateTimeRangePicker/DateTimeRangePicker/ControlManifest.Input.xml` | Contrato: propiedades, salidas, recursos y metadatos |
| `DateTimeRangePicker/DateTimeRangePicker/index.ts` | Adaptador PCF: precarga de los dos extremos, `resetKey` y publicacion |
| `DateTimeRangePicker/DateTimeRangePicker/DateTimeRangePickerView.tsx` | Vista React: calendario, campos Inicio/Fin con hora y panel |
| `DateTimeRangePicker/DateTimeRangePicker/DateTimeRangePicker.css` | Estilos con prefijo de clases `dtrp-` |
| `DateTimeRangePicker/package.json`, `tsconfig.json`, `DateTimeRangePicker.pcfproj` | Entorno de build del proyecto anidado |
