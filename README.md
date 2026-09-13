# DateRangePicker PCF

> Fecha: 2026-09-12  
> Descripcion: Componente personalizado para Power Apps Canvas que permite seleccionar y publicar un rango de fechas.

Componente personalizado para aplicaciones de lienzo de Power Apps. Permite elegir un rango de fechas en un calendario visual y expone las fechas seleccionadas en formato `YYYY-MM-DD`.

## Propiedades

- `initialStartDate`: entrada opcional. Fecha inicial para precargar el control.
- `initialEndDate`: entrada opcional. Fecha final para precargar el control.
- `startDate`: salida. Fecha inicial elegida.
- `endDate`: salida. Fecha final elegida.

Al seleccionar la primera fecha, el control espera la fecha final. Al seleccionar la segunda, se resalta todo el rango. Una nueva selección después de completar el rango comienza una selección nueva.

## Compilar

```powershell
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

En Canvas, las salidas se pueden usar como `DateValue(DateRangePicker1.startDate)` y `DateValue(DateRangePicker1.endDate)` cuando se necesite un valor de fecha nativo.