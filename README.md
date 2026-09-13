# DateRangePicker PCF

> Fecha: 2026-09-12  
> Descripcion: Componente personalizado para Power Apps Canvas que permite seleccionar y publicar un rango de fechas.

Componente personalizado para aplicaciones de lienzo de Power Apps. Permite elegir un rango de fechas en un calendario visual y expone las fechas seleccionadas en formato `YYYY-MM-DD`.

## Propiedades

- `initialStartDate`: entrada opcional. Fecha inicial para precargar el control.
- `initialEndDate`: entrada opcional. Fecha final para precargar el control.
- `format`: entrada opcional. Formato de fechas: `YYYY-MM-DD` (predeterminado), `YYYY/MM/DD`, `YYYY.MM.DD`, `YYYYMMDD`, `DD/MM/YYYY`, `MM/DD/YYYY`, `DD-MM-YYYY`, `MM-DD-YYYY`, `DD.MM.YYYY`, `MM.DD.YYYY`, `DDMMYYYY` o `MMDDYYYY`.
- `zIndex`: entrada opcional. Prioridad visual del panel abierto. Predeterminado: `2147483647`.
- `startDate`: salida. Fecha inicial elegida.
- `endDate`: salida. Fecha final elegida.

Al seleccionar la primera fecha, el control espera la fecha final. Al seleccionar la segunda, se resalta todo el rango. Una nueva selección después de completar el rango comienza una selección nueva.

## Compilar

```powershell
npm install
npm run build
```

Para compilar el segundo control desde su proyecto:

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

Importa primero `solution.zip` desde **make.powerapps.com > Solutions**. Luego abre la aplicación de lienzo, selecciona **Insertar > Obtener más componentes > Código**, busca `DateRangePicker` y agrégalo.

En Canvas, las salidas se pueden usar como `DateValue(DateRangePicker1.startDate)` y `DateValue(DateRangePicker1.endDate)` cuando se necesite un valor de fecha nativo.

## DateTimeRangePicker

La solución también incluye `DateTimeRangePicker`, un segundo control para seleccionar fecha y hora de inicio y fin. Sus salidas son `startDateTime` y `endDateTime` en formato `YYYY-MM-DDTHH:mm`, por ejemplo `2026-09-12T08:30`.

Sus entradas son `initialStartDateTime`, `initialEndDateTime`, `format` (los formatos del listado anterior) y `timeFormat` (`24`, `12`, `24:00:00` o `12:00:00`).
También acepta `zIndex` para controlar la prioridad visual del panel expandido.

Los formatos cubren los usos habituales de Power Platform y Dataverse (`YYYY-MM-DD`), SQL Server (`YYYYMMDD`, ISO y estilos regionales) y configuraciones regionales de Canvas. La salida de `DateTimeRangePicker` conserva siempre el formato técnico sin ambiguedad `YYYY-MM-DDTHH:mm`.

Consulta el catálogo completo y ejemplos de conversión en [docs/formatos.md](docs/formatos.md).