# Instalación y uso en Power Apps

> Fecha: 2026-09-16  
> Descripcion: Como importar la solucion en Dataverse y usar los controles en una aplicacion de lienzo.

## 1. Habilitar controles de código en el entorno

En el **Power Platform admin center** abre el entorno destino y ve a **Configuración > Producto > Características** y activa **Power Apps component framework for canvas apps**.

Esta configuración es por entorno, no se reemplaza con una biblioteca de componentes, y es requisito para que los controles aparezcan en el panel de la aplicación de lienzo.

## 2. Importar la solución

1. Exporta o usa el zip ya generado: `solution/bin/Release/solution.zip`.
2. Ve a **make.powerapps.com > Soluciones > Importar solución** y selecciona el archivo.
3. Verifica que la solución contenga los cinco controles en **Objetos > Controles personalizados**:
   - `ID10005.DatePicker`
   - `ID10005.DateTimePicker`
   - `ID10005.DateRangePicker`
   - `ID10005.DateTimeRangePicker`
   - `ID10005.SearchableComboBox`
4. Publica todos los cambios personalizados.

Para producción usa preferentemente `solution_managed.zip` (solución administrada).

## 3. Agregar el control a la aplicación de lienzo

1. Abre la aplicación, entra en **Insertar > Obtener más componentes > Código**.
2. Busca el control por nombre (`DatePicker`, `DateTimePicker`, `DateRangePicker`, `DateTimeRangePicker`, `SearchableComboBox`) y agrégalo.
3. Con el control seleccionado, configura las propiedades de entrada en el panel derecho.

Los controles son de tipo `virtual`, por lo que funcionan igual en aplicaciones de lienzo y en formularios de Dataverse.

## 4. Enlazar datos al combobox

1. Selecciona el control `SearchableComboBox`.
2. En la propiedad **Items** enlaza la tabla o colección, por ejemplo `Clientes` o `colProductos`.
3. Elige los campos: `value` (obligatorio), `label` y `description` (opcionales). Si la tabla usa otras columnas, el control busca sobre todas las columnas enlazadas.
4. Opcional: activa `selectMultiple` y define `defaultValue` con valores separados por `;`.

Ejemplo de enlace:

```powerfx
// Items
SortByColumns(Filter(Productos, Activo), "Nombre")

// defaultValue
"PRD-001;PRD-014"
```

## 5. Ejemplos de uso frecuentes

```powerfx
// Fecha seleccionada como fecha nativa
Set(varFecha, DateValue(DatePicker1.date))

// Filtrar una galeria por la fecha elegida
Filter(Pedidos, Fecha = DateValue(DatePicker1.date))

// Rango de fechas
Filter(Pedidos, Fecha >= DateValue(DateRangePicker1.startDate) && Fecha <= DateValue(DateRangePicker1.endDate))

// Fecha y hora de un registro
Patch(Eventos, ThisItem, { InicioFecha: DateTimeValue(DateTimePicker1.dateTime) })

// Reiniciar un control desde un boton
UpdateContext({ reiniciar: true });   // con resetKey = reiniciar
```

## 6. Depuración

| Síntoma | Qué revisar |
| --- | --- |
| El control no aparece en **Obtener más componentes** | Que la característica de canvas esté activa en el entorno y que la solución esté importada y publicada |
| El panel se ve detrás de otro elemento | Aumenta el valor de `zIndex` del control |
| El combobox muestra "Sin registros" | Que `Items` esté enlazado y que las columnas seleccionadas incluyan `value` |
| No se ven todos los registros | El control filtra los registros de la página cargada. Activa `loadAllRecords` para buscar en todas las páginas o encadena `Items` con `Filter()` |
| El paginador del pie del control queda en una sola página | Tienes `loadAllRecords` activo: al cargar todas las páginas no queda nada que paginar. Desactívalo para recuperar el paginador |
| Se ve la versión anterior del control | Reconstruye la solución, reimporta y actualiza el componente; considera subir la versión del manifiesto |
| El valor no se reinicia | Usa `resetKey`: el control limpia la selección cuando ese valor cambia |

## 7. Notas de despliegue

- La solución se empaqueta como **administrada y no administrada** (`Managed = 2`). En entornos de producción importa solo la administrada.
- Los controles no requieren servicios externos: el manifiesto declara `external-service-usage enabled="false"`, por lo que no son componentes premium por uso de red.
- React se declara como **biblioteca de plataforma** (`platform-library name="React" version="16.14.0"`), así que se carga desde el host y no se duplica en cada bundle.
- Las salidas son texto (`SingleLine.Text`) salvo `selectedCount` (`Whole.None`). Conviértelas con `DateValue`, `DateTimeValue` o `Value` según necesites.

