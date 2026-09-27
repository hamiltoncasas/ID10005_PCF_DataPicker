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

## 2. Empezar rapido

1. En el estudio de Power Apps: **Insertar > Obtener mas componentes > Codigo > DateRangePicker**.
2. Opcional: define *Formato de fecha* (por ejemplo `YYYY-MM-DD` o `DD/MM/YYYY`).
3. Opcional: precarga con *Fecha inicial de inicio* (`initialStartDate`) y *Fecha inicial de fin* (`initialEndDate`).

Resultado: `DateRangePicker1.startDate` y `DateRangePicker1.endDate` contienen los extremos elegidos.

## 3. Propiedades de entrada

### 3.1 Datos y comportamiento

| Propiedad (nombre tecnico) | Nombre en Power Apps | Tipo | Predeterminado | Descripcion |
| --- | --- | --- | --- | --- |
| `initialStartDate` | *Fecha inicial de inicio* | Texto | vacio | Extremo inicial precargado, en el formato configurado |
| `initialEndDate` | *Fecha inicial de fin* | Texto | vacio | Extremo final precargado, en el formato configurado |
| `defaultDate` | *Fecha predeterminada* | Texto | vacio | Si no esta vacia, sustituye a *Fecha inicial de inicio* para el extremo inicial |
| `format` | *Formato de fecha* | Texto | `YYYY-MM-DD` | Formato de las dos salidas y de la precarga. Catalogo en [README.md](README.md#7-formatos-de-fecha-y-hora) |
| `resetKey` | *Reiniciar seleccion* | Si/No | No | Cuando cambia de valor se limpia el rango completo |
| `zIndex` | *Prioridad visual del panel* | Numero | `2147483647` | `z-index` del panel abierto |
| `placeholderText` | *Texto de ayuda* | Texto | `Selecciona fecha` | Texto del campo cuando todavia no hay ninguna fecha elegida |
| `isEditable` | *Editable* | Si/No | No | Habilita la escritura en el campo del panel segun el formato configurado |
| `accessibleLabel` | *Etiqueta accesible* | Texto | vacio | Texto para lectores de pantalla |
| `minDate` | *Fecha minima* | Texto | vacio | Primer dia seleccionable del calendario |
| `maxDate` | *Fecha maxima* | Texto | vacio | Ultimo dia seleccionable del calendario |
| `startYear` | *Ano inicial* | Numero | `0` | Ano menor del calendario (`0` = sin limite) |
| `endYear` | *Ano final* | Numero | `0` | Ano mayor del calendario (`0` = sin limite) |
| `startOfWeek` | *Primer dia de la semana* | Texto | regional | `auto`, `sunday`, `monday`, `tuesday`, `wednesday`, `thursday`, `friday` o `saturday` |
| `dateTimeZone` | *Zona horaria* | Texto | local del dispositivo | Zona usada para calcular *hoy* |
| `language` | *Idioma* | Texto | regional | Codigo de idioma para los nombres de meses y dias |

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
6. **Limites:** con *Fecha minima* y *Fecha maxima* los dias fuera del rango se ven deshabilitados; *Ano inicial* y *Ano final* limitan la navegacion mensual.
7. **Reiniciar desde Power Fx:** cuando cambia *Reiniciar seleccion* se limpian los dos extremos y la salida publica vacio.
8. **Precarga:** *Fecha predeterminada* tiene prioridad para el extremo inicial; *Fecha inicial de fin* siempre alimenta el extremo final. Los valores se aplican cuando cambian.
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
//    Fecha inicial de inicio = Text(DateAdd(Today(), -29, Days), "yyyy-mm-dd")
//    Fecha inicial de fin    = Text(Today(), "yyyy-mm-dd")

// 4. Saber si el usuario ya completo el rango
If(!IsBlank(DateRangePicker1.endDate), "Listo para consultar", "Elige la fecha final")

// 5. Limpiar el rango desde un boton
UpdateContext({ reiniciarRango: true });   // Reiniciar seleccion = reiniciarRango
```

Patron habitual: coloca el control como barra de filtros y alimenta con sus salidas la propiedad **Items** de una galeria o de `ExcelReportPicker`.

## 7. Limites y buenas practicas

- **Sin filtro automatico:** el control solo publica las fechas; el filtrado se escribe en la aplicacion (`Filter`), igual que con cualquier otro control.
- **Formato y ambiguedad:** con `DateRangePicker1.startDate` en `DD/MM/YYYY`, la aplicacion que lo lea debe conocer ese formato. Para usarlo con `DateValue`, deja `YYYY-MM-DD`.
- **Un rango por control:** para periodos distintos (mes actual y mes anterior, por ejemplo) usa dos controles.
- **Paneles superpuestos:** el panel se dibuja en el cuerpo de la pagina con posicion fija; si queda detras de otros elementos, sube *Prioridad visual del panel*.
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
| 7 | Cambiar *Reiniciar seleccion* | El rango se limpia |
| 8 | Poner `DisplayMode` en `View` | No se abre el panel |

## 10. Archivos del control

| Archivo | Contenido |
| --- | --- |
| `DateRangePicker/ControlManifest.Input.xml` | Contrato: propiedades, salidas, recursos y metadatos |
| `DateRangePicker/index.ts` | Adaptador PCF: precarga de los dos extremos, `resetKey` y publicacion |
| `DateRangePicker/DateRangePickerView.tsx` | Vista React: calendario, seleccion de rango y panel |
| `DateRangePicker/DateRangePicker.css` | Estilos con prefijo de clases `drp-` |
| `DateRangePicker/strings/DateRangePicker.1033.resx` | Nombres y descripciones localizados del panel de propiedades |
