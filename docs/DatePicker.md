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

## 2. Empezar rapido

1. En el estudio de Power Apps: **Insertar > Obtener mas componentes > Codigo > DatePicker**.
2. Opcional: escribe un formato en la propiedad **Formato de fecha** (por ejemplo `DD/MM/YYYY`). Si la dejas vacia se usa `YYYY-MM-DD`.
3. Opcional: precarga con la propiedad **Fecha inicial** (`initialDate`) y conecta **Reiniciar seleccion** (`resetKey`) a una variable si quieres poder limpiar el control desde Power Fx.

Resultado: el control muestra la fecha elegida y publica la salida `DatePicker1.date` en el formato configurado.

## 3. Propiedades de entrada

### 3.1 Datos y comportamiento

| Propiedad (nombre tecnico) | Nombre en Power Apps | Tipo | Predeterminado | Descripcion |
| --- | --- | --- | --- | --- |
| `initialDate` | *Fecha inicial* | Texto | vacio | Fecha para precargar el control. Se interpreta con el formato de **Formato de fecha** |
| `defaultDate` | *Fecha predeterminada* | Texto | vacio | Valor de mayor prioridad: si no esta vacio, sustituye a *Fecha inicial*. Se usa cuando la aplicacion escribe el valor |
| `format` | *Formato de fecha* | Texto | `YYYY-MM-DD` | Formato de la salida y de la precarga. Catalogo en [README.md](README.md#7-formatos-de-fecha-y-hora) |
| `resetKey` | *Reiniciar seleccion* | Si/No | No | Cuando cambia de valor, el control limpia la fecha seleccionada. Ideal para un boton *Limpiar* |
| `zIndex` | *Prioridad visual del panel* | Numero | `2147483647` | `z-index` del panel abierto. Se limita entre 1 y 2147483647 |
| `placeholderText` | *Texto de ayuda* | Texto | `Selecciona fecha` | Texto del campo cuando no hay fecha elegida |
| `isEditable` | *Editable* | Si/No | No | Permite **escribir** la fecha en el campo (ademas de elegirla en el calendario). El texto escrito se interpreta con el formato configurado |
| `accessibleLabel` | *Etiqueta accesible* | Texto | vacio | Texto para lectores de pantalla cuando la etiqueta del lienzo no basta |
| `minDate` | *Fecha minima* | Texto | vacio | Primer dia seleccionable. Los dias anteriores se ven deshabilitados |
| `maxDate` | *Fecha maxima* | Texto | vacio | Ultimo dia seleccionable |
| `startYear` | *Ano inicial* | Numero | `0` | Ano menor del calendario (`0` = sin limite) |
| `endYear` | *Ano final* | Numero | `0` | Ano mayor del calendario (`0` = sin limite) |
| `startOfWeek` | *Primer dia de la semana* | Texto | regional | `auto`, `sunday`, `monday`, `tuesday`, `wednesday`, `thursday`, `friday` o `saturday` |
| `dateTimeZone` | *Zona horaria* | Texto | local del dispositivo | Zona usada para calcular *hoy* y la fecha inicial |
| `language` | *Idioma* | Texto | regional | Codigo de idioma para los nombres de meses y dias (por ejemplo `es-ES` o `en-US`) |

### 3.2 Apariencia (equivalentes al selector nativo)

Estas propiedades siguen los mismos nombres y el mismo espiritu que las del control de fecha nativo de Power Apps. Todas son opcionales: si no se definen, el control usa su diseno propio.

| Propiedad | Nombre en Power Apps | Tipo |
| --- | --- | --- |
| `borderColor` | *Color del borde* | Texto |
| `borderStyle` | *Estilo del borde* | Texto |
| `borderThickness` | *Grosor del borde* | Numero |
| `color` | *Color del texto* | Texto |
| `fill` | *Relleno* | Texto |
| `font` | *Fuente* | Texto |
| `size` | *Tamano de fuente* | Numero |
| `fontWeight` | *Grosor de fuente* | Texto |
| `italic` | *Cursiva* | Si/No |
| `strikethrough` | *Tachado* | Si/No |
| `underline` | *Subrayado* | Si/No |
| `chevronBackground` | *Fondo de las flechas* | Texto |
| `chevronFill` | *Color de las flechas* | Texto |
| `iconBackground` | *Fondo del icono* | Texto |
| `iconFill` | *Color del icono* | Texto |

## 4. Salidas

| Salida | Tipo | Descripcion |
| --- | --- | --- |
| `date` | Texto | Fecha seleccionada en el formato configurado. Vacia si no hay seleccion |
| `selectedDate` | Texto | Mismo valor que `date`. Se conserva para aplicaciones escritas con versiones anteriores del control |

Las dos salidas publican siempre lo mismo: usa `date` en el codigo nuevo.

## 5. Comportamiento

1. **Abrir el panel:** al hacer clic en el campo o en el boton del calendario. El mes visible es el de la fecha precargada; si no hay valor, el mes actual.
2. **Elegir un dia:** el dia queda resaltado, la salida `date` se publica en el formato configurado y el panel se contrae.
3. **Volver a abrir:** el mes visible es el de la fecha ya elegida, con esa fecha resaltada y *hoy* marcado con un borde.
4. **Boton Limpiar** (pie del panel): vacia la seleccion, publica `date` vacio y el campo vuelve al texto de ayuda.
5. **Escribir la fecha** (solo con *Editable* activo): el texto se interpreta con el formato configurado; si es valido se publica, si no, el valor anterior no cambia.
6. **Limites del calendario:** con *Fecha minima* y *Fecha maxima* los dias fuera del rango quedan deshabilitados; con *Ano inicial* y *Ano final* la navegacion mensual tambien se detiene en el limite.
7. **Reiniciar desde Power Fx:** cuando el valor de *Reiniciar seleccion* cambia, la seleccion se limpia y la salida publica vacio.
8. **Precargar:** el valor de *Fecha predeterminada* tiene prioridad; si esta vacio se usa *Fecha inicial*. El valor se aplica cuando cambia (por ejemplo al abrir la pantalla o al alimentarlo desde otra pantalla) y se interpreta con el formato configurado.
9. **Valor inicial invalido:** no rompe el control; se ignora y el panel abre en el mes actual.
10. **Control deshabilitado:** con `DisplayMode` en `View` (o `DisplayMode.Disabled`) no se puede abrir el panel ni cambiar la seleccion.

### 5.1 Formato de la salida frente al formato de la pantalla

El calendario muestra los nombres de mes y dia segun el **idioma del dispositivo** (o el de la propiedad *Idioma*). La **salida** `date` siempre se escribe con el formato de la propiedad *Formato de fecha*, asi que es estable: la misma configuracion produce la misma cadena en cualquier equipo.

## 6. Ejemplos en Power Fx

```powerfx
// 1. Leer la fecha como valor nativo
Set(varFecha, DateValue(DatePicker1.date))

// 2. Filtrar una galeria por el dia elegido
Filter(Pedidos, Fecha = DateValue(DatePicker1.date))

// 3. Mostrar la fecha con el idioma del usuario (para una etiqueta)
Text(DateValue(DatePicker1.date), "[$-es-ES]dddd, dd 'de' mmmm 'de' yyyy")

// 4. Precargar la fecha de hoy al abrir la pantalla
//    Propiedad Fecha inicial = Text(Today(), "yyyy-mm-dd")

// 5. Limpiar el control desde un boton
UpdateContext({ reiniciarFecha: true });   // y en el control: Reiniciar seleccion = reiniciarFecha

// 6. Validar antes de guardar
If(IsBlank(DatePicker1.date), Notify("Selecciona una fecha", NotificationType.Warning))

// 7. Solo permitir hasta hoy
//    Propiedad Fecha maxima = Text(Today(), "yyyy-mm-dd")
```

Consejo: si vas a convertir la salida con `DateValue`, deja el formato en `YYYY-MM-DD` (o `YYYY/MM/DD`) para evitar ambiguedades entre dia y mes en equipos con otras convenciones regionales.

## 7. Limites y buenas practicas

- **El control no crece en el lienzo:** el panel flotante es el que crece; el modo compacto mide 32 px de alto. El ancho minimo del panel es 320 px.
- **Paneles superpuestos:** el panel se dibuja con posicion fija en el cuerpo de la pagina, asi que no lo recorta el contenedor. Si en la pantalla hay elementos con `z-index` propio por encima, sube *Prioridad visual del panel*.
- **Zona horaria:** las fechas se construyen y comparan en la hora local del navegador (o en la zona de *Zona horaria*); no hay conversion a UTC.
- **Formatos:** la salida se escribe tal cual en el formato configurado; el control no cambia el separador decimal ni el idioma de la cadena.
- **Un valor por pantalla:** si necesitas un rango, usa `DateRangePicker`.
- **Precarga, no sincronizacion:** el control aplica el valor inicial cuando cambia; no es una entrada enlazada (no se debe usar como un campo de formulario).

## 8. Problemas comunes

| Sintoma | Causa probable | Solucion |
| --- | --- | --- |
| La salida no cambia al elegir | No se esta leyendo `DatePicker1.date` | Revisa el nombre del control y usa el panel de propiedades |
| La fecha inicial no aparece | El texto no coincide con el formato configurado | Escribe el valor con el mismo formato de *Formato de fecha* (`2026-09-27`) |
| El panel se ve detras de otro elemento | Otro elemento del lienzo tiene `z-index` mayor | Sube *Prioridad visual del panel* |
| No se puede limpiar desde un boton | `resetKey` recibe el mismo valor | Cambia el valor solo cuando quieras reiniciar (por ejemplo `Set(varR, !varR)`) |
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
| 7 | Cambiar *Reiniciar seleccion* con un boton | La seleccion se limpia |
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
