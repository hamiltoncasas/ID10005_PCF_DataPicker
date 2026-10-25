# DateRangePicker

> Fecha: 2026-09-27
> Descripcion: Selector de rango de fechas (inicio y fin) para Power Apps Canvas: propiedades, salidas, comportamiento, ejemplos y pruebas. Indice general en [README.md](README.md).

## 1. Que es

`DateRangePicker` es un control PCF de tipo `virtual` que permite elegir **dos fechas** (inicio y fin) y publicarlas como texto en el formato que configures. Es la base visual de los demas selectores del repositorio.

| Dato | Valor |
| --- | --- |
| Identificador de componente | `id5_ID10005.DateRangePicker` |
| Version | 1.0.11 |
| Salidas | `startDate`, `endDate`, `selectedDate` |
| Requiere servicios externos | No |

Estructura visual:

- **Modo compacto:** campo de 32 px con el resumen del rango (`inicio -> fin`), texto de ayuda y boton azul a la derecha.
- **Panel expandido:** encabezado con la etiqueta *RANGO DE FECHAS*, el resumen, una **pastilla de estado** (*En seleccion* mientras falta un extremo y *Listo* cuando el rango esta completo) y el boton de cierre.
- **Calendario:** dia de hoy marcado con borde, extremos del rango resaltados y los dias intermedios con fondo de rango; navegacion mensual con `‹` y `›`.
- **Pie:** mensaje (*Haz clic en dos fechas para completar el rango* o *Rango seleccionado*) y, cuando hay rango, el boton **Limpiar**.

Cuando lo usas: para filtrar consultas por periodo, para precargar rangos de fechas de un informe y para alimentar la propiedad **Items** de otros controles (por ejemplo `ExcelReportPicker`).

## 2. Guia de uso paso a paso

Esta guia reproduce el caso mas comun: **usar un rango de fechas como filtro de una galeria o de un informe**. El control no filtra por si mismo: publica los dos extremos y la aplicacion los usa en `Filter`.

### 2.1 Antes de empezar

| Requisito | Como comprobarlo |
| --- | --- |
| PCF para canvas activo y solucion publicada | Power Platform admin center > Entorno > Caracteristicas; Soluciones > `ID0005_DataPickers` |
| Control disponible en el estudio | **Insertar > Obtener mas componentes > Codigo > DateRangePicker** |
| Origen de datos con una columna de fecha | Datos > Tabla, o una coleccion de prueba |
| Criterio del periodo acordado | Si el dia final se incluye o no, y si la columna tiene hora |

### 2.2 Pasos

1. **Inserta el control** desde **Insertar > Obtener mas componentes > Codigo > DateRangePicker** y renombralo, por ejemplo `rangoPedidos`.
2. **Configura el formato:** *Formato de fecha* = `YYYY-MM-DD`. La precarga y las dos salidas usan ese mismo formato.
3. **Precarga un periodo inicial:** en *Fecha inicial precargada* (`initialStartDate`) escribe `Text(DateAdd(Today(), -29, Days), "yyyy-mm-dd")` y en *Fecha final precargada* (`initialEndDate`) `Text(Today(), "yyyy-mm-dd")`. Son los ultimos 30 dias incluidos.
4. **Define el criterio del dia final:** con columnas de **solo fecha**, usa `>= inicio && <= fin`. Con columnas de **fecha y hora**, usa `>= inicio && < DateAdd(fin, 1, Days)` para incluir todo el dia final.
5. **Alimenta la galeria o el informe:** en **Items** escribe `Filter(Pedidos, Fecha >= DateValue(rangoPedidos.startDate) && Fecha <= DateValue(rangoPedidos.endDate))`. Si usas el control junto a `ExcelReportPicker`, la misma expresion va en su propiedad **Items**.
6. **Controla el estado incompleto:** mientras solo haya un clic, `endDate` esta vacio. Deshabilita el boton **Consultar** con `IsBlank(rangoPedidos.endDate)` y muestra una pista al usuario.
7. **Conecta el reinicio:** enlaza *Reiniciar selección* (`resetKey`) a una variable como `limpiarRango` y alternala desde un boton. La guia completa esta en [ejemplos/DateRangePicker.md](ejemplos/DateRangePicker.md).

### 2.3 Configuracion minima recomendada

| Propiedad | Valor sugerido | Por que |
| --- | --- | --- |
| *Formato de fecha* | `YYYY-MM-DD` | Permite usar `DateValue` sin ambiguedad |
| *Fecha inicial precargada* | `Text(DateAdd(Today(), -29, Days), "yyyy-mm-dd")` | La pantalla abre con un periodo util |
| *Fecha final precargada* | `Text(Today(), "yyyy-mm-dd")` | Cierra el periodo en el dia actual |
| *Primer día de la semana* | `monday` | Coincide con el calendario habitual en espanol |
| *Fecha mínima* / *Fecha máxima* | `2020-01-01` / `Text(Today(), "yyyy-mm-dd")` | Acota el calendario al rango de negocio |
| *Reiniciar selección* | `limpiarRango` | Permite volver al estado inicial desde Power Fx |

### 2.4 Comprobar que funciona

1. Primer clic en un dia: se marca el inicio, `startDate` tiene valor y `endDate` queda vacio.
2. Segundo clic posterior: se completa el rango y las dos salidas se publican.
3. Segundo clic anterior al inicio: el control reordena el rango para que inicio sea menor o igual que fin.
4. Pulsa **Limpiar** o alterna *Reiniciar selección*: las dos salidas quedan vacias.
5. Filtra una galeria y compara el conteo con el periodo: el dia final debe aparecer segun el criterio elegido.

Resultado: `rangoPedidos.startDate` y `rangoPedidos.endDate` contienen los extremos en el formato configurado. La guia completa, con datos de prueba, filtros y validaciones, esta en [ejemplos/DateRangePicker.md](ejemplos/DateRangePicker.md).

## 3. Propiedades de entrada

### 3.1 Datos y comportamiento

| Propiedad (nombre tecnico) | Nombre en Power Apps | Tipo | Predeterminado | Descripcion |
| --- | --- | --- | --- | --- |
| `initialStartDate` | *Fecha inicial precargada* | Texto | vacio | Extremo inicial precargado, en el formato configurado |
| `initialEndDate` | *Fecha final precargada* | Texto | vacio | Extremo final precargado, en el formato configurado |
| `defaultDate` | *Fecha de inicio precargada por omision* | Texto | vacio | Si no esta vacia, sustituye a *Fecha inicial precargada* para el extremo inicial |
| `format` | *Formato de fecha* | Texto | `YYYY-MM-DD` | Formato de las dos salidas y de la precarga. Catalogo en [README.md](README.md#7-formatos-de-fecha-y-hora) |
| `resetKey` | *Reiniciar selección* | Si/No | No | Cuando cambia de valor se limpia el rango completo |
| `zIndex` | *Prioridad visual del selector* | Numero | `2147483647` | `z-index` del panel abierto |
| `placeholderText` | *Texto de ayuda del campo* | Texto | `Selecciona fecha` | Texto del campo cuando todavia no hay ninguna fecha elegida |
| `isEditable` | *Permitir escribir las fechas* | Si/No | No | Habilita la escritura en el campo del panel segun el formato configurado |
| `accessibleLabel` | *Etiqueta accesible* | Texto | vacio | Texto para lectores de pantalla |
| `minDate` | *Fecha mínima* | Texto | vacio | Primer dia seleccionable del calendario |
| `maxDate` | *Fecha máxima* | Texto | vacio | Ultimo dia seleccionable del calendario |
| `startYear` | *Año inicial del calendario* | Numero | `0` | Año menor del calendario (`0` = sin limite) |
| `endYear` | *Año final del calendario* | Numero | `0` | Año mayor del calendario (`0` = sin limite) |
| `startOfWeek` | *Primer día de la semana* | Texto | regional | `auto`, `sunday`, `monday`, `tuesday`, `wednesday`, `thursday`, `friday` o `saturday` |
| `dateTimeZone` | *Zona horaria de los valores* | Texto | local del dispositivo | Zona usada para calcular *hoy* |
| `language` | *Idioma del calendario* | Texto | regional | Codigo de idioma para los nombres de meses y dias |

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
| `startDate` | Texto | Extremo inicial del rango, en el formato configurado |
| `endDate` | Texto | Extremo final del rango, en el formato configurado |
| `selectedDate` | Texto | Mismo valor que `startDate`. Se conserva por compatibilidad |

Si solo hay un extremo elegido, `startDate` tiene valor y `endDate` queda vacio.

## 5. Comportamiento

1. **Primer clic en un dia:** ese dia pasa a ser el extremo inicial. La pastilla de estado muestra *En seleccion* y el pie indica que hace falta la fecha final.
2. **Segundo clic:** se completa el rango, se resaltan los dias intermedios, la pastilla cambia a *Listo* y el panel se contrae publicando `startDate` y `endDate`.
3. **Clic en un dia anterior al inicio:** el control interpreta el clic como el nuevo inicio si no hay fin, o reorganiza la seleccion para que el rango siempre tenga inicio menor o igual que fin.
4. **Nueva seleccion despues de un rango completo:** el siguiente clic empieza un rango nuevo (el primer clic queda como inicio y se limpia el fin anterior).
5. **Boton Limpiar** (visible cuando hay rango): vacia los dos extremos y publica vacio.
6. **Limites:** con *Fecha mínima* y *Fecha máxima* los dias fuera del rango se ven deshabilitados; *Año inicial del calendario* y *Año final del calendario* limitan la navegacion mensual.
7. **Reiniciar desde Power Fx:** cuando cambia *Reiniciar selección* se limpian los dos extremos y la salida publica vacio.
8. **Precarga:** *Fecha de inicio precargada por omision* tiene prioridad para el extremo inicial; *Fecha final precargada* siempre alimenta el extremo final. Los valores se aplican cuando cambian.
9. **Control deshabilitado:** con `DisplayMode` en `View` no se abre el panel ni se puede elegir.

## 6. Ejemplos en Power Fx

```powerfx
// 1. Filtrar una galeria por el periodo elegido (columnas solo fecha)
Filter(Pedidos,
    Fecha >= DateValue(DateRangePicker1.startDate) &&
    Fecha <= DateValue(DateRangePicker1.endDate))

// 2. Periodo completo incluyendo el dia final (columnas de fecha y hora)
Filter(Pedidos,
    Fecha >= DateRangePicker1.startDate &&
    Fecha < DateAdd(DateValue(DateRangePicker1.endDate), 1, Days))

// 3. Precargar los ultimos 30 dias al abrir la pantalla
//    Fecha inicial precargada = Text(DateAdd(Today(), -29, Days), "yyyy-mm-dd")
//    Fecha final precargada    = Text(Today(), "yyyy-mm-dd")

// 4. Saber si el usuario ya completo el rango
If(!IsBlank(DateRangePicker1.endDate), "Listo para consultar", "Elige la fecha final")

// 5. Limpiar el rango desde un boton
UpdateContext({ reiniciarRango: true });   // Reiniciar selección = reiniciarRango
```

Patron habitual: coloca el control como barra de filtros y alimenta con sus salidas la propiedad **Items** de una galeria o de `ExcelReportPicker`.

## 7. Limites y buenas practicas

- **Sin filtro automatico:** el control solo publica las fechas; el filtrado se escribe en la aplicacion (`Filter`), igual que con cualquier otro control.
- **Formato y ambiguedad:** con `DateRangePicker1.startDate` en `DD/MM/YYYY`, la aplicacion que lo lea debe conocer ese formato. Para usarlo con `DateValue`, deja `YYYY-MM-DD`.
- **Un rango por control:** para periodos distintos (mes actual y mes anterior, por ejemplo) usa dos controles.
- **Paneles superpuestos:** el panel se dibuja en el cuerpo de la pagina con posicion fija; si queda detras de otros elementos, sube *Prioridad visual del selector*.
- **Zona horaria:** las fechas se calculan en la hora local del navegador (o en la zona configurada); no hay conversion a UTC.

## 8. Problemas comunes

| Sintoma | Causa probable | Solucion |
| --- | --- | --- |
| `endDate` queda vacio | Solo se eligio la fecha inicial | Elige la segunda fecha para completar el rango |
| El rango se desordena | Se eligio primero el extremo mayor | Vuelve a elegirlo desde el extremo menor o limpia y repite |
| Las fechas precargadas no aparecen | El texto no usa el formato configurado | Escribe `2026-09-01` con *Formato de fecha* en `YYYY-MM-DD` |
| El boton Limpiar no aparece | No hay rango completo | Limpiar aparece cuando ya hay rango seleccionado |
| Filtrar deja fuera el dia final | La columna tiene hora distinta de `00:00` | Compara con `< DateAdd(DateValue(end), 1, Days)` |

## 9. Verificacion

| # | Accion | Resultado esperado |
| --- | --- | --- |
| 1 | Clic en una fecha | El dia se resalta y la pastilla muestra *En seleccion* |
| 2 | Clic en una fecha posterior | Se resalta el rango completo y se publican `startDate` y `endDate` |
| 3 | Clic en una fecha | Empieza un rango nuevo |
| 4 | Pulsar **Limpiar** | Las salidas quedan vacias |
| 5 | Configurar `minDate` y `maxDate` | Los dias fuera de los limites se ven deshabilitados |
| 6 | Cambiar *Formato de fecha* | Las dos salidas usan el formato nuevo |
| 7 | Cambiar *Reiniciar selección* | El rango se limpia |
| 8 | Poner `DisplayMode` en `View` | No se abre el panel |

## 10. Archivos del control

| Archivo | Contenido |
| --- | --- |
| `DateRangePicker/ControlManifest.Input.xml` | Contrato: propiedades, salidas, recursos y metadatos |
| `DateRangePicker/index.ts` | Adaptador PCF: precarga de los dos extremos, `resetKey` y publicacion |
| `DateRangePicker/DateRangePickerView.tsx` | Vista React: calendario, seleccion de rango y panel |
| `DateRangePicker/DateRangePicker.css` | Estilos con prefijo de clases `drp-` |
| `DateRangePicker/strings/DateRangePicker.1033.resx` | Nombres y descripciones localizados del panel de propiedades |
