# ID10005 PCF DataPicker

> Fecha: 2026-10-13
> Descripcion: Siete controles personalizados (PCF) para Power Apps Canvas: selectores de fecha, fecha y hora y rangos, un combobox con busqueda incremental, un exportador de informes a Excel y un visor de paginas web.

Componentes personalizados para aplicaciones de lienzo de Power Apps y para formularios de Dataverse. Cada control tiene **su propio documento** con propiedades, salidas, comportamiento, ejemplos y pruebas.

## Controles

| Control | Que resuelve | Salidas principales | Version | Documentacion |
| --- | --- | --- | --- | --- |
| `DatePicker` | Seleccionar una sola fecha en un calendario | `date` | 1.0.3 | [docs/DatePicker.md](docs/DatePicker.md) |
| `DateTimePicker` | Seleccionar una sola fecha y hora | `dateTime`, `date`, `time` | 1.0.3 | [docs/DateTimePicker.md](docs/DateTimePicker.md) |
| `DateRangePicker` | Seleccionar un rango de fechas | `startDate`, `endDate` | 1.0.11 | [docs/DateRangePicker.md](docs/DateRangePicker.md) |
| `DateTimeRangePicker` | Seleccionar un rango de fecha y hora | `startDateTime`, `endDateTime` | 1.0.11 | [docs/DateTimeRangePicker.md](docs/DateTimeRangePicker.md) |
| `SearchableComboBox` | Elegir elementos de una tabla o coleccion con busqueda tipo contiene | `selectedValue`, `selectedLabel`, `selectedValues`, `selectedLabels`, `selectedCount` | 1.0.1 | [docs/SearchableComboBox.md](docs/SearchableComboBox.md) |
| `ExcelReportPicker` | Desplegar informes definidos en JSON sobre la tabla enlazada y descargarlos en Excel | `lastFile`, `lastRows`, `lastStatus`, `errorMessage`, `columnsDetected`, `isLoading`, `dataStatus` | 1.4.2 | [docs/ExcelReportPicker.md](docs/ExcelReportPicker.md) |
| `WebPageViewer` | Mostrar una pagina web dentro de la aplicacion con aviso cuando el sitio no admite iframes | `currentUrl`, `isLoading`, `hasError`, `errorMessage` | 1.0.1 | [docs/WebPageViewer.md](docs/WebPageViewer.md) |

Todos comparten el mismo lenguaje visual: modo compacto cerrado de 32 px con borde gris y boton azul a la derecha, y panel expandido en superposicion con encabezado, cuerpo y pie. El espacio de nombres es `ID10005`, por lo que el identificador de cada componente es `id5_ID10005.<Constructor>`.

**Alcance de los proyectos:** el proyecto PCF raiz compila seis controles (`DatePicker`, `DateTimePicker`, `DateRangePicker`, `SearchableComboBox`, `ExcelReportPicker` y `WebPageViewer`). `DateTimeRangePicker` tiene un proyecto PCF anidado y se compila por separado. El proyecto de solucion referencia ambos proyectos y empaqueta los siete controles.

## Documentacion

| Documento | Contenido |
| --- | --- |
| [docs/README.md](docs/README.md) | Indice general: estructura del repositorio, compilacion, paquete de solucion, instalacion, formatos de fecha y hora compartidos, verificacion y convenciones |
| [docs/DatePicker.md](docs/DatePicker.md) | Selector de una sola fecha |
| [docs/DateTimePicker.md](docs/DateTimePicker.md) | Selector de una sola fecha y hora |
| [docs/DateRangePicker.md](docs/DateRangePicker.md) | Selector de rango de fechas |
| [docs/DateTimeRangePicker.md](docs/DateTimeRangePicker.md) | Selector de rango de fecha y hora |
| [docs/SearchableComboBox.md](docs/SearchableComboBox.md) | Combobox con busqueda incremental tipo contiene |
| [docs/ExcelReportPicker.md](docs/ExcelReportPicker.md) | Exportador de informes a Excel (informes en JSON, tipos, formatos, filtros y aviso de carga) |
| [docs/WebPageViewer.md](docs/WebPageViewer.md) | Visor de paginas web dentro de la aplicacion (direccion y URL base, barra de acciones, aviso de carga y limites de los iframes) |
| [docs/ejemplos/](docs/ejemplos/README.md) | Ejemplos JSON inventados (informes y registros de prueba) para copiar y pegar, sin datos de clientes |
| [tools/verificar-controles.js](tools/verificar-controles.js) | Arnes de logica: fechas, filtro contiene y seleccion (70 comprobaciones) |
| [tools/verificar-nombres-campo.js](tools/verificar-nombres-campo.js) | Arnes de columnas del exportador: reconocimiento por nombre visible y lectura por nombre logico (40 comprobaciones) |

## Inicio rapido

```powershell
# 1. Compilar los controles
npm install
npm run build

# 2. Generar el paquete de solucion (incluye los controles compilados)
Set-Location solution
dotnet build solution.cdsproj -c Release
```

Despues importa `solution/bin/Release/solution.zip` (paquete **1.0.2.8**, definido en `solution/src/Other/Solution.xml`) en la solucion de tu entorno y agrega el control desde **Insertar > Obtener mas componentes > Codigo**. El detalle esta en [docs/README.md](docs/README.md#6-instalar-y-usar-en-power-apps).

## Uso en Power Fx

```powerfx
// Fechas
DateValue(DatePicker1.date)
DateValue(DateRangePicker1.startDate)
DateTimeValue(DateTimePicker1.dateTime)

// Limpiar un selector desde un boton (propiedad Reiniciar seleccion = reiniciar)
Set(varReiniciar, !varReiniciar)

// Combobox con seleccion multiple
ForAll(Split(SearchableComboBox1.selectedValues, ";"), { Valor: ThisRecord.Value })

// Resultado de una exportacion a Excel
ExcelReportPicker1.lastFile

// Visor de paginas web: direccion mostrada y aviso de pagina no visible
WebPageViewer1.currentUrl
If(WebPageViewer1.hasError, Notify(WebPageViewer1.errorMessage, NotificationType.Warning))
```

Inicializa `varReiniciar` en `false` al iniciar la pantalla o la aplicacion. La propiedad *Reiniciar seleccion* actua cuando cambia de valor; alternar la variable permite volver a activarla en cada pulsacion.

## Verificacion

```powershell
npm run lint                        # ESLint (0 errores)
npm run build                       # compila los controles
node tools/verificar-controles.js    # 70 de 70 verificaciones correctas
node tools/verificar-nombres-campo.js  # 40 de 40 verificaciones correctas

Set-Location solution
dotnet build solution.cdsproj -c Release
```

El detalle de los arneses, los criterios de aceptacion y la rutina completa antes de publicar estan en [docs/README.md](docs/README.md#9-verificacion-y-pruebas).

## Convenciones

- Idioma: espanol. Los nombres de propiedades se citan como aparecen en Power Apps o con su nombre tecnico del manifiesto.
- Fechas en formato `YYYY-MM-DD`.
- Todos los ejemplos usan **datos inventados**: no contienen nombres de tablas, campos, entornos ni datos de ningun cliente.
- Licencia: ver [LICENSE](LICENSE).
