# DatePicker

> Fecha: 2026-09-27
> Descripcion: Selector de una sola fecha para Power Apps Canvas: propiedades, salidas, comportamiento, ejemplos y pruebas. Indice general en [README.md](README.md).

## 1. Que es

`DatePicker` es un control PCF de tipo `virtual` que permite elegir **una sola fecha** en un calendario y publicarla como texto en el formato que configures.

| Dato | Valor |
| --- | --- |
| Identificador de componente | `id5_ID10005.DatePicker` |
| Version | 1.0.3 |
| Salida principal | `date` |
| Requiere servicios externos | No |

Comparte el lenguaje visual de los demas selectores del repositorio:

- **Modo compacto (cerrado):** campo de solo lectura de 32 px de alto con borde gris, texto de ayuda y boton azul con el icono de calendario a la derecha.
- **Panel expandido:** se dibuja **en superposicion** (no recorta el lienzo) con encabezado (etiqueta, resumen, estado y boton de cierre), calendario mensual, dias de semana y pie con el boton **Limpiar**.
- **Marcas del calendario:** la fecha de hoy lleva un borde y la fecha elegida un fondo de acento; los dias fuera del mes se ven atenuados.
- La navegacion mensual se hace con `‹` y `›`; si configuras `startYear`/`endYear`, esos botones se deshabilitan al llegar al limite.

Cuando lo usas: cuando necesitas controlar el **formato de la salida**, limitar el calendario (ano, mes minimo y maximo) o replicar el aspecto de los demas selectores del repositorio. Si solo necesitas una fecha para escribir en Dataverse y el formato nativo te sirve, el selector de fecha del propio Power Apps es suficiente.

## 2. Guia de uso paso a paso

Esta guia reproduce el caso mas comun: **capturar una fecha en un formulario y guardarla en un registro**. Al final, la aplicacion valida que haya seleccion, escribe la fecha y permite limpiarla.

### 2.1 Antes de empezar

| Requisito | Como comprobarlo |
| --- | --- |
| La caracteristica **Power Apps component framework for canvas apps** esta activa | Power Platform admin center > Entorno > Configuracion > Producto > Caracteristicas |
| La solucion con el control esta importada y publicada | make.powerapps.com > Soluciones > `ID0005_DataPickers` |
| La aplicacion permite insertar codigo | Estudio de Power Apps > **Insertar > Obtener mas componentes > Codigo** |
| Existe la tabla o coleccion donde se guarda la fecha | Datos > Tablas, o una coleccion creada con `ClearCollect` |

### 2.2 Pasos

1. **Inserta el control:** en el estudio abre **Insertar > Obtener mas componentes > Codigo > DatePicker**. Si no aparece, revisa la seccion 2.1 y vuelve a importar la solucion.
2. **Dale un nombre estable:** cambia `DatePicker1` por un nombre de negocio, por ejemplo `dtpFechaEntrega`. Las formulas de esta guia usan ese nombre.
3. **Configura el formato:** en *Formato de fecha* escribe `YYYY-MM-DD`. Es el formato recomendado para convertir la salida con `DateValue` y el que usan los ejemplos del repositorio.
4. **Precarga si editas un registro existente:** en *Fecha precargada* (`initialDate`) escribe `Text(ThisItem.FechaEntrega, "yyyy-mm-dd")`. Si el formulario es de alta, dejala vacia.
5. **Conecta el reinicio:** crea una variable en la pantalla con `UpdateContext({ limpiarFecha: false })` y enlaza *Reiniciar selección* (`resetKey`) a `limpiarFecha`. Un boton puede ejecutar `UpdateContext({ limpiarFecha: !limpiarFecha })`.
6. **Lee la salida:** agrega una etiqueta con `Text(DateValue(dtpFechaEntrega.date), "dddd, dd 'de' mmmm 'de' yyyy")` para confirmar que el valor llega como fecha y no como texto ambiguo.
7. **Guarda el registro:** en el boton **Guardar** usa `Patch` con `DateValue(dtpFechaEntrega.date)` y valida antes de escribir. El ejemplo completo esta en [ejemplos/DatePicker.md](ejemplos/DatePicker.md).

### 2.3 Configuracion minima recomendada

| Propiedad | Valor sugerido | Por que |
| --- | --- | --- |
| *Formato de fecha* | `YYYY-MM-DD` | Evita ambiguedades entre dia y mes al usar `DateValue` |
| *Fecha precargada* | `Text(ThisItem.FechaEntrega, "yyyy-mm-dd")` | Muestra el valor actual al editar |
| *Reiniciar selección* | `limpiarFecha` | Permite limpiar el control desde un boton |
| *Fecha mínima* | `Text(Today(), "yyyy-mm-dd")` | Impide elegir fechas pasadas (opcional) |
| *Etiqueta accesible* | `Fecha de entrega` | Mejora la lectura con lectores de pantalla |

### 2.4 Comprobar que funciona

1. Abre la pantalla sin valor precargado: el campo muestra `Selecciona fecha`.
2. Elige un dia: el panel se contrae y `dtpFechaEntrega.date` publica `YYYY-MM-DD`.
3. Pulsa el boton de limpiar: la salida queda vacia y vuelve el texto de ayuda.
4. Intenta guardar sin fecha: la aplicacion debe mostrar el aviso definido con `Notify`.
5. Cambia *Formato de fecha* a `DD/MM/YYYY`: la salida cambia de formato, pero `DateValue` sigue interpretandola segun la configuracion regional.

Resultado: el control muestra la fecha elegida y publica la salida `dtpFechaEntrega.date` en el formato configurado. La guia completa con tabla de datos, formulas de guardado y variantes esta en [ejemplos/DatePicker.md](ejemplos/DatePicker.md).

## 3. Propiedades de entrada

### 3.1 Datos y comportamiento

| Propiedad (nombre tecnico) | Nombre en Power Apps | Tipo | Predeterminado | Descripcion |
| --- | --- | --- | --- | --- |
| `initialDate` | *Fecha precargada* | Texto | vacio | Fecha para precargar el control. Se interpreta con el formato de **Formato de fecha**; tambien acepta ISO `YYYY-MM-DD` |
| `defaultDate` | *Fecha precargada por omision* | Texto | vacio | Valor de mayor prioridad: si no esta vacio, sustituye a *Fecha precargada*. La entrada se vuelve a aplicar si cambia |
| `format` | *Formato de fecha* | Texto | `YYYY-MM-DD` | Formato de la salida y de la precarga. Catalogo en [README.md](README.md#7-formatos-de-fecha-y-hora) |
| `resetKey` | *Reiniciar selección* | Si/No | No | Cuando cambia de valor, el control limpia la fecha seleccionada. Ideal para un boton *Limpiar* |
| `zIndex` | *Prioridad visual del selector* | Numero | `2147483647` | `z-index` del panel abierto. Se limita entre 1 y 2147483647 |
| `placeholderText` | *Texto de ayuda del campo* | Texto | `Selecciona fecha` | Texto del campo cuando no hay fecha elegida |
| `isEditable` | *Permitir escribir la fecha* | Si/No | No | Permite **escribir** la fecha en el campo (ademas de elegirla en el calendario). El texto escrito se interpreta con el formato configurado |
| `accessibleLabel` | *Etiqueta accesible* | Texto | vacio | Texto para lectores de pantalla cuando la etiqueta del lienzo no basta |
| `minDate` | *Fecha mínima* | Texto | vacio | Primer dia seleccionable. Los dias anteriores se ven deshabilitados |
| `maxDate` | *Fecha máxima* | Texto | vacio | Ultimo dia seleccionable |
| `startYear` | *Año inicial del calendario* | Numero | `0` | Año menor del calendario (`0` = sin limite) |
| `endYear` | *Año final del calendario* | Numero | `0` | Año mayor del calendario (`0` = sin limite) |
| `startOfWeek` | *Primer día de la semana* | Texto | `monday` | Nombre completo del dia en espanol o ingles, o numero de 0 (domingo) a 6 (sabado). Un valor vacio o no reconocido usa lunes |
| `dateTimeZone` | *Zona horaria de los valores* | Texto | `Local` | Solo `Utc` activa el modo UTC; cualquier otro valor se interpreta como `Local`. En UTC, una salida elegida se publica como instante con `Z` |
| `language` | *Idioma del calendario* | Texto | espanol | Codigo BCP 47, por ejemplo `es-ES` o `en-US`; vacio/invalido usa los nombres predeterminados en espanol |

### 3.2 Apariencia (equivalentes al selector nativo)

Estas propiedades siguen los mismos nombres y el mismo espiritu que las del control de fecha nativo de Power Apps. Todas son opcionales: si no se definen, el control usa su diseno propio.

| Propiedad | Nombre en Power Apps | Tipo |
| --- | --- | --- |
| `borderColor` | *Color del borde* | Texto |
| `borderStyle` | *Estilo del borde* | Texto |
| `borderThickness` | *Grosor del borde* | Numero |
| `color` | *Color del texto* | Texto |
| `fill` | *Color de fondo del campo* | Texto |
| `font` | *Fuente del texto* | Texto |
| `size` | *Tamaño de la fuente* | Numero |
| `fontWeight` | *Grosor de la fuente* | Texto |
| `italic` | *Texto en cursiva* | Si/No |
| `strikethrough` | *Texto tachado* | Si/No |
| `underline` | *Texto subrayado* | Si/No |
| `chevronBackground` | *Fondo de las flechas del calendario* | Texto |
| `chevronFill` | *Color de las flechas del calendario* | Texto |
| `iconBackground` | *Fondo del icono del calendario* | Texto |
| `iconFill` | *Color del icono del calendario* | Texto |

## 4. Salidas

| Salida | Tipo | Descripcion |
| --- | --- | --- |
| `date` | Texto | Fecha seleccionada en el formato configurado. Vacia si no hay seleccion |
| `selectedDate` | Texto | Mismo valor que `date`. Se conserva para aplicaciones escritas con versiones anteriores del control |

En zona `Local`, ambas salidas son la fecha en el formato `format`. En zona `Utc`, ambas publican una fecha ISO a medianoche UTC, como `2026-09-16T00:00:00Z`. Usa `date` en el codigo nuevo. `DateValue` es adecuado para la salida local; para la salida UTC usa una conversion que tenga en cuenta el sufijo `Z` y la zona deseada.

## 5. Comportamiento

1. **Abrir el panel:** al hacer clic en el campo o en el boton del calendario. El mes visible es el de la fecha precargada; si no hay valor, el mes actual.
2. **Elegir un dia:** el dia queda resaltado, la salida `date` se publica en el formato configurado y el panel se contrae.
3. **Volver a abrir:** el mes visible es el de la fecha ya elegida, con esa fecha resaltada y *hoy* marcado con un borde.
4. **Boton Limpiar** (pie del panel): vacia la seleccion, publica `date` vacio y el campo vuelve al texto de ayuda.
5. **Escribir la fecha** (solo con *Permitir escribir la fecha* activo): se escribe en el campo compacto con el formato configurado y se confirma al presionar Enter o al salir del campo. Una fecha invalida o fuera de limites no cambia la salida.
6. **Limites del calendario:** con *Fecha mínima* y *Fecha máxima* los dias fuera del rango quedan deshabilitados; con *Año inicial del calendario* y *Año final del calendario* la navegacion mensual tambien se detiene en el limite.
7. **Reiniciar desde Power Fx:** cuando el valor de *Reiniciar selección* cambia, la seleccion se limpia y la salida publica vacio.
8. **Precargar:** *Fecha precargada por omision* tiene prioridad sobre *Fecha precargada*. La entrada se aplica al inicializar y cuando cambia; no es un enlace bidireccional con la salida.
9. **Valor inicial invalido:** no rompe el control; se ignora y el panel abre en el mes actual.
10. **Control deshabilitado:** con `DisplayMode` en `View` (o `DisplayMode.Disabled`) no se puede abrir el panel ni cambiar la seleccion.

### 5.1 Formato de la salida frente al formato de la pantalla

El calendario muestra los nombres de mes y dia segun *Idioma*; sin un codigo valido usa los nombres predeterminados en espanol, no necesariamente el idioma del dispositivo. En zona `Local`, la salida `date` respeta *Formato de fecha*. En zona `Utc`, se publica un instante con sufijo `Z` en formato ISO, independientemente de `format`.

## 6. Ejemplos en Power Fx

```powerfx
// 1. Leer la fecha como valor nativo
Set(varFecha, DateValue(DatePicker1.date))

// 2. Filtrar una galeria por el dia elegido
Filter(Pedidos, Fecha = DateValue(DatePicker1.date))

// 3. Mostrar la fecha con el idioma del usuario (para una etiqueta)
Text(DateValue(DatePicker1.date), "[$-es-ES]dddd, dd 'de' mmmm 'de' yyyy")

// 4. Propiedad Fecha precargada = Text(Today(), "yyyy-mm-dd")
//    Propiedad Formato de fecha = YYYY-MM-DD

// 5. Limpiar el control desde un boton
// App.OnStart o Screen.OnVisible: Set(varReiniciarFecha, false)
Set(varReiniciarFecha, !varReiniciarFecha)   // Reiniciar selección = varReiniciarFecha

// 6. Validar antes de guardar
If(IsBlank(DatePicker1.date), Notify("Selecciona una fecha", NotificationType.Warning))

// 7. Propiedades Fecha mínima / Fecha máxima
//    Text(DateAdd(Today(), -30, Days), "yyyy-mm-dd") / Text(Today(), "yyyy-mm-dd")
```

Consejo: si vas a convertir la salida con `DateValue`, deja el formato en `YYYY-MM-DD` (o `YYYY/MM/DD`) para evitar ambiguedades entre dia y mes en equipos con otras convenciones regionales.

## 7. Limites y buenas practicas

- **El control no crece en el lienzo:** el panel flotante es el que crece; el modo compacto mide 32 px de alto. El ancho minimo del panel es 320 px.
- **Paneles superpuestos:** el panel se dibuja con posicion fija en el cuerpo de la pagina, asi que no lo recorta el contenedor. Si en la pantalla hay elementos con `z-index` propio por encima, sube *Prioridad visual del selector*.
- **Zona horaria:** `Local` conserva los componentes de fecha escritos; `Utc` convierte entradas ISO que llevan desplazamiento (`Z` o `+hh:mm`) y publica salidas con `Z`. La opcion no acepta zonas regionales IANA.
- **Formatos:** la salida se escribe tal cual en el formato configurado; el control no cambia el separador decimal ni el idioma de la cadena.
- **Un valor por pantalla:** si necesitas un rango, usa `DateRangePicker`.
- **Precarga, no sincronizacion:** el control aplica el valor inicial cuando cambia; no es una entrada enlazada (no se debe usar como un campo de formulario).

## 8. Problemas comunes

| Sintoma | Causa probable | Solucion |
| --- | --- | --- |
| La salida no cambia al elegir | No se esta leyendo `DatePicker1.date` | Revisa el nombre del control y usa el panel de propiedades |
| La fecha precargada no aparece | El texto no coincide con el formato o con ISO `YYYY-MM-DD` | Escribe la fecha en el formato configurado o ISO |
| El panel se ve detras de otro elemento | Otro elemento del lienzo tiene `z-index` mayor | Sube *Prioridad visual del selector* |
| No se puede limpiar desde un boton | `resetKey` no cambio de valor | Inicializa una variable booleana y alternala con `Set(varR, !varR)` en cada pulsacion |
| Los dias anteriores no se pueden elegir | `minDate`/`maxDate` o `startYear`/`endYear` los deshabilitan | Ajusta los limites |
| `DateValue` devuelve error | El formato configurado es ambiguo para la region del usuario | Usa `YYYY-MM-DD` como formato de salida |

## 9. Verificacion

Comprobaciones rapidas despues de agregar el control a la pantalla:

| # | Accion | Resultado esperado |
| --- | --- | --- |
| 1 | Clic en el campo o en el boton del calendario | Se abre el panel debajo del control con el mes actual |
| 2 | Elegir un dia | El dia se resalta, el panel se contrae y `date` se actualiza |
| 3 | Abrir de nuevo | El mes visible es el de la fecha elegida |
| 4 | Navegar meses con `‹` y `›` | Cambia el mes y conserva la seleccion |
| 5 | Pulsar **Limpiar** | `date` queda vacio y el campo muestra el texto de ayuda |
| 6 | Cambiar *Formato de fecha* a `DD/MM/YYYY` y elegir una fecha | La salida usa el formato nuevo |
| 7 | Cambiar *Reiniciar selección* con un boton | La seleccion se limpia |
| 8 | Poner `DisplayMode` en `View` | No se puede abrir el panel |
| 9 | Configurar `minDate` y `maxDate` | Los dias fuera del rango se ven deshabilitados |

La logica de fechas de este control esta cubierta por el arnes del repositorio (ver [README.md](README.md#9-verificacion-y-pruebas)): parseo del valor inicial en los 12 formatos soportados, salida formateada al elegir un dia, valor vacio que usa el mes actual y valor invalido que no rompe el control.

## 10. Archivos del control

| Archivo | Contenido |
| --- | --- |
| `DatePicker/ControlManifest.Input.xml` | Contrato: propiedades, salidas, recursos y metadatos |
| `DatePicker/index.ts` | Adaptador PCF: lee las propiedades, aplica `resetKey` y la precarga, y publica las salidas |
| `DatePicker/DatePickerView.tsx` | Vista React: modo compacto, calendario, panel y navegacion mensual |
| `DatePicker/DatePicker.css` | Estilos con prefijo de clases `dp-` |
| `DatePicker/strings/DatePicker.1033.resx` | Nombres y descripciones localizados que se ven en el panel de propiedades |
