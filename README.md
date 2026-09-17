# ID10005 PCF DataPicker

> Fecha: 2026-09-16  
> Descripcion: Controles personalizados para Power Apps Canvas: selectores de fecha, fecha y hora, rangos y un combobox con busqueda incremental.

Componentes personalizados para aplicaciones de lienzo de Power Apps.

| Control | Que selecciona | Salidas principales |
| --- | --- | --- |
| `DatePicker` | Una sola fecha en un calendario | `date` |
| `DateTimePicker` | Una sola fecha y hora | `dateTime`, `date`, `time` |
| `DateRangePicker` | Fecha inicial y final | `startDate`, `endDate` |
| `DateTimeRangePicker` | Fecha y hora inicial y final | `startDateTime`, `endDateTime` |
| `SearchableComboBox` | Elementos de una tabla o colección con filtro tipo contiene | `selectedValue`, `selectedLabel`, `selectedValues`, `selectedLabels`, `selectedCount` |

## DatePicker

Selector de una sola fecha con el mismo diseno de `DateRangePicker`: modo compacto cerrado (campo de solo lectura y boton de calendario) y panel expandido con navegacion mensual. La fecha de hoy se marca con un borde y la fecha elegida se resalta en color.

- `initialDate`: entrada opcional. Fecha inicial para precargar el control usando el formato configurado.
- `resetKey`: entrada opcional. Cuando cambia de valor, se limpia la fecha seleccionada.
- `format`: entrada opcional. Cualquiera de los formatos de [docs/formatos.md](docs/formatos.md).
- `zIndex`: entrada opcional. Prioridad visual del panel abierto. Predeterminado: `2147483647`.
- `date`: salida. Fecha seleccionada en el formato configurado.

Al elegir un dia el panel se contrae y el valor queda publicado. El boton **Limpiar** del pie del panel borra la seleccion.

## DateTimePicker

Selector de una sola fecha y hora. Ademas del calendario incluye un campo de fecha y un selector de hora cada 15 minutos, con el mismo diseno de `DateTimeRangePicker`. Al elegir un dia se conserva la hora seleccionada (si no hay valor previo se propone la hora actual alineada a 15 minutos).

- `initialDateTime`: entrada opcional con formato `YYYY-MM-DDTHH:mm`, por ejemplo `2026-09-16T08:30`.
- `resetKey`: entrada opcional. Cuando cambia de valor, se limpia la fecha y la hora.
- `format`: entrada opcional. Formato usado en el resumen del panel.
- `timeFormat`: entrada opcional. `24`, `12`, `24:00:00` o `12:00:00`.
- `zIndex`: entrada opcional. Prioridad visual del panel abierto.
- `dateTime`: salida en formato tecnico `YYYY-MM-DDTHH:mm`.
- `date`: salida con la fecha en formato `YYYY-MM-DD`.
- `time`: salida con la hora en formato `HH:mm`.

## DateRangePicker

- `initialStartDate`: entrada opcional. Fecha inicial para precargar el control.
- `initialEndDate`: entrada opcional. Fecha final para precargar el control.
- `format`: entrada opcional. Formato de fechas: `YYYY-MM-DD` (predeterminado), `YYYY/MM/DD`, `YYYY.MM.DD`, `YYYYMMDD`, `DD/MM/YYYY`, `MM/DD/YYYY`, `DD-MM-YYYY`, `MM-DD-YYYY`, `DD.MM.YYYY`, `MM.DD.YYYY`, `DDMMYYYY` o `MMDDYYYY`.
- `zIndex`: entrada opcional. Prioridad visual del panel abierto. Predeterminado: `2147483647`.
- `startDate`: salida. Fecha inicial elegida.
- `endDate`: salida. Fecha final elegida.

Al seleccionar la primera fecha, el control espera la fecha final. Al seleccionar la segunda, se resalta todo el rango. Una nueva selección después de completar el rango comienza una selección nueva.

## DateTimeRangePicker

Selector de fecha y hora de inicio y fin. Sus salidas son `startDateTime` y `endDateTime` en formato `YYYY-MM-DDTHH:mm`, por ejemplo `2026-09-16T08:30`.

- `initialStartDateTime` y `initialEndDateTime`: entradas opcionales con formato `YYYY-MM-DDTHH:mm`.
- `format`: entrada opcional con los formatos del listado anterior.
- `timeFormat`: entrada opcional. `24`, `12`, `24:00:00` o `12:00:00`.
- `zIndex`: entrada opcional. Prioridad visual del panel expandido.

## SearchableComboBox

Combobox con el comportamiento del combobox de lienzo de Power Apps y busqueda incremental. Enlaza una tabla o colección en `Items`, escribe cualquier parte del texto y la lista se filtra por coincidencias tipo **contiene** sobre todas las columnas, sin distinguir mayusculas ni acentos y con la coincidencia resaltada.

- `items`: conjunto de datos enlazado. Columnas `value` (obligatoria), `label` y `description` (opcionales).
- `defaultValue`: valores separados por punto y coma para precargar la selección. Admite valores o etiquetas.
- `selectMultiple`: activa la selección múltiple con etiquetas removibles.
- `isSearchable`: activa el cuadro de búsqueda y el filtro contiene.
- `searchFields`: columnas donde buscar, separadas por coma. Vacío = todas las columnas.
- `noSelectionText`: texto cuando no hay selección. Predeterminado `---`.
- `placeholderText`: texto guía del cuadro de búsqueda. Predeterminado `Buscar...`.
- `resetKey` y `zIndex`: igual que en los selectores de fecha.
- Salidas: `selectedValue`, `selectedLabel`, `selectedValues`, `selectedLabels` (separadas por punto y coma) y `selectedCount`.

Con la lista abierta el texto largo se ve completo: el panel se superpone sobre el contenido, crece con el texto (`max-content`, limitado al 92% del ancho de la ventana) y el encabezado muestra todas las etiquetas seleccionadas. Cerrado, el control conserva su tamaño normal y recorta el texto con puntos suspensivos.

Consulta el detalle de propiedades y ejemplos en [docs/combobox.md](docs/combobox.md).

## Compilar

```powershell
npm install
npm run build
```

El comando de la raíz compila los cinco controles: `DatePicker`, `DateTimePicker`, `DateRangePicker`, `DateTimeRangePicker` y `SearchableComboBox`. El proyecto anidado también se puede compilar por separado:

```powershell
Set-Location DateTimeRangePicker
npm install
npm run build
```

## Agregar a una solución existente

Desde el directorio de un proyecto de solución que ya tenga `cdsproj`, agrega la referencia al proyecto PCF:

```powershell
pac solution add-reference --path "C:\ruta\a\ID10005_PCF_DataPicker"
dotnet build
```

Después, importa el `.zip` generado por el proyecto de solución en Dataverse y agrega el control a la aplicación de lienzo desde **Insertar > Obtener más componentes**.

## Habilitar controles PCF en Canvas

En el Power Platform admin center, abre el entorno destino y ve a **Settings > Product > Features**. Activa **Power Apps component framework for canvas apps**. Esta configuración es del entorno y no se reemplaza con una component library.

Importa primero `solution.zip` desde **make.powerapps.com > Solutions**. Luego abre la aplicación de lienzo, selecciona **Insertar > Obtener más componentes > Código**, busca el control que necesites (`DatePicker`, `DateTimePicker`, `DateRangePicker`, `DateTimeRangePicker` o `SearchableComboBox`) y agrégalo.

En Canvas, las salidas se pueden usar como `DateValue(DatePicker1.date)`, `DateValue(DateRangePicker1.startDate)` o `DateTimeValue(DateTimePicker1.dateTime)` cuando se necesite un valor nativo.

## DateTimeRangePicker

La solución también incluye `DateTimeRangePicker`, un segundo control para seleccionar fecha y hora de inicio y fin. Sus salidas son `startDateTime` y `endDateTime` en formato `YYYY-MM-DDTHH:mm`, por ejemplo `2026-09-12T08:30`.

Sus entradas son `initialStartDateTime`, `initialEndDateTime`, `format` (los formatos del listado anterior) y `timeFormat` (`24`, `12`, `24:00:00` o `12:00:00`).
También acepta `zIndex` para controlar la prioridad visual del panel expandido.

Los formatos cubren los usos habituales de Power Platform y Dataverse (`YYYY-MM-DD`), SQL Server (`YYYYMMDD`, ISO y estilos regionales) y configuraciones regionales de Canvas. Las salidas de fecha y hora conservan siempre el formato técnico sin ambiguedad (`YYYY-MM-DD` y `YYYY-MM-DDTHH:mm`).

## Documentación

Índice completo en [docs/README.md](docs/README.md).

| Documento | Contenido |
| --- | --- |
| [docs/controles.md](docs/controles.md) | Referencia de propiedades, salidas y comportamiento de los 5 controles |
| [docs/formatos.md](docs/formatos.md) | Catálogo de formatos de fecha y hora que aceptan los selectores |
| [docs/combobox.md](docs/combobox.md) | Detalle del combobox con búsqueda tipo contiene |
| [docs/arquitectura.md](docs/arquitectura.md) | Estructura del repositorio, ciclo de vida PCF, diseño visual y decisiones |
| [docs/compilacion.md](docs/compilacion.md) | Requisitos, comandos de compilación y empaquetado de la solución |
| [docs/instalacion.md](docs/instalacion.md) | Importación en Dataverse y uso en aplicaciones de lienzo |
| [docs/pruebas.md](docs/pruebas.md) | Verificaciones automáticas, arnés de lógica y checklist manual |
| [docs/changelog.md](docs/changelog.md) | Historial de cambios por fecha y versión |
| [tools/verificar-controles.js](tools/verificar-controles.js) | Arnés que comprueba fechas, filtro contiene, botones y selección (61 comprobaciones) |

