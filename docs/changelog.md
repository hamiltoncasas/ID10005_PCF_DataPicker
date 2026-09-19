# Historial de cambios

> Fecha: 2026-09-16  
> Descripcion: Resumen cronologico de los cambios del repositorio, con las versiones de los controles y de la solucion.

El proyecto versiona dos cosas de forma independiente:

- **Controles:** atributo `version` en cada `ControlManifest.Input.xml`.
- **Solución:** etiqueta `<Version>` en `solution/src/Other/Solution.xml` (actualmente `1.0.2.3`).

## 2026-09-19 · ExcelReportPicker 1.3.0: filtros por informe con símbolos

**Cambios:**

- La definición de informes (`reportsJson`) admite la clave `filtros` con **valores literales** y notación de símbolos: `=`, `<>`, `>`, `>=`, `<`, `<=`, `%texto%` (contiene), `texto%` (empieza), `%texto` (termina), `!` para negar, `[a, b]` para listas, `a..b` para rangos y `= ""` para columnas vacías. Varias reglas se separan con `;` y se combinan con AND.
- Los filtros se aplican **por informe** sobre las filas que llegan en `Items`, antes del orden y del límite de filas; el panel muestra los registros ya filtrados y el resumen del libro escribe las condiciones aplicadas.
- Con **Validación estricta** activa, un filtro que no resuelve la columna o cuyo valor no cuadra con el tipo bloquea la descarga; si no, se avisa en el panel.
- Solución `ID0005_DataPickers` de 1.0.2.2 a **1.0.2.3**; paquete regenerado en `solution/bin/Release`.

## 2026-09-18 · ExcelReportPicker 1.2.0: un solo conjunto de datos (`Items`) y endurecimiento

**Cambios:**

- `ExcelReportPicker` sube de 1.1.0 a **1.2.0**: los registros llegan en la propiedad `items` (conjunto de datos enlazado, como una galería) y los filtros se escriben en esa propiedad con Power Fx. Se eliminan `dataJson` y `filtersJson`; se mantiene `reportsJson`.
- El informe declara sus columnas por nombre real de campo y `columnas` admite la cadena separada por comas que produce `JSON({...})`; la clave `filtros` queda ignorada.
- **Seguridad:** los valores se escriben siempre como texto (el libro no contiene fórmulas ni hipervínculos, aunque el dato empiece por `=`), se limpian los caracteres inválidos y se recorta cada celda a 32767 caracteres, se sanean los nombres de archivo y de hoja, y las lecturas de `titulos`, `tipos` y `formatos` no recorren el prototipo. El control no usa servicios externos, red, `eval` ni almacenamiento del navegador.
- `.gitignore` bloquea extractos y exportaciones de clientes (`*.csv`, `*.tsv`, `*.xlsx`, `*.xls`, `*.accdb`, `*.mdb`).
- Solución `ID0005_DataPickers` de 1.0.2.1 a **1.0.2.2**; paquete regenerado en `solution/bin/Release`.

## 2026-09-17 · Nueva compilación del paquete: solución 1.0.1.1

**Cambios:**

- Se sube **solo** la versión de la solución `ID0005_DataPickers` de 1.0.1.0 a **1.0.1.1**, para poder importarla como actualización (Dataverse rechaza versiones menores a la instalada).
- Los controles no cambian: `SearchableComboBox` 1.0.1, `DatePicker` 1.0.1, `DateTimePicker` 1.0.1, `DateRangePicker` 1.0.9 y `DateTimeRangePicker` 1.0.9.
- Paquete regenerado: `solution/bin/Release/solution.zip` y `solution_managed.zip`.

## 2026-09-16 · Versión 1.0.1 de los controles nuevos y solución 1.0.1.0

**Subida de versiones:**

- `DatePicker` 1.0.0 → **1.0.1**
- `DateTimePicker` 1.0.0 → **1.0.1**
- `SearchableComboBox` 1.0.0 → **1.0.1**
- `DateRangePicker` y `DateTimeRangePicker` permanecen en **1.0.9** (no se modificaron)
- Solución `ID0005_DataPickers` 1.0.0.9 → **1.0.1.0**

**Cambios:**

- Nuevo paquete de solución regenerado con las versiones nuevas: `solution/bin/Release/solution.zip` y `solution_managed.zip`.
- Documentación alineada con las versiones publicadas (índice, referencia de controles y compilación).
- Commit de la versión: `cccd5cc568` (*Release 1.0.1 of the new controls and solution 1.0.1.0*).

**Compatibilidad:** sin cambios funcionales ni de contrato; los controles existentes mantienen sus nombres, propiedades y salidas. Al reimportar la solución, actualiza el componente en la aplicación de lienzo para que tome la versión nueva.

## 2026-09-16 · Controles de valor único y combobox con búsqueda

Commit `35b5f1e43c` — *Add single date, date-time and searchable combobox controls*

**Nuevos controles (versión 1.0.0):**

- `DatePicker`: selección de una sola fecha con el mismo diseño compacto/expandido de `DateRangePicker`, marca de hoy, selección resaltada y botón *Limpiar*. Entradas `initialDate`, `format`, `resetKey`, `zIndex`; salida `date`.
- `DateTimePicker`: selección de una sola fecha y hora con calendario, campo de fecha y horas cada 15 minutos. Entradas `initialDateTime`, `format`, `timeFormat`, `resetKey`, `zIndex`; salidas `dateTime`, `date`, `time`.
- `SearchableComboBox`: combobox con conjunto de datos (`items` con columnas `value`, `label`, `description`) y **filtro tipo contiene** sobre todas las columnas, sin distinguir mayúsculas ni acentos, con resaltado de la coincidencia, selección única o múltiple con etiquetas, navegación por teclado, cierre al hacer clic fuera y lista superpuesta que muestra el texto largo completo. Entradas `defaultValue`, `selectMultiple`, `isSearchable`, `searchFields`, `noSelectionText`, `placeholderText`, `resetKey`, `zIndex`; salidas `selectedValue`, `selectedLabel`, `selectedValues`, `selectedLabels`, `selectedCount`.

**Otros cambios:**

- El paquete de solución se regeneró: `solution/bin/Release/solution.zip` y `solution_managed.zip` ahora contienen los cinco componentes.
- Documentación completa en `docs/`: índice, referencia de controles, formatos, combobox, arquitectura, compilación, instalación, pruebas y este historial.
- Nuevo arnés de verificación `tools/verificar-controles.js` (54 comprobaciones de lógica).

**Compatibilidad:** no se modificó `DateRangePicker` (1.0.9) ni `DateTimeRangePicker` (1.0.9), por lo que las aplicaciones existentes siguen funcionando igual.

## 2026-09-15 · Metadatos de solución y reinicio booleano

| Commit | Cambio |
| --- | --- |
| `e2177b63b4` | Actualización de los paquetes de solución con los metadatos renombrados |
| `3723defc53` | Renombrado de los metadatos de la solución y del publicador |
| `4e6b822fb7` | Ajuste de las versiones de manifiesto para que la solución sea importable |
| `1ed74b1873` | Corrección de la entrada booleana de reinicio en los selectores |
| `b31c42c5fa` | Ajustes varios de los controles de fecha |
| `d4b336687f` | Subida de versiones de los controles para la corrección de reinicio |
| `10d5b4fe83` | Estilos finales del selector de fecha y actualización del paquete |
| `8c4c4153eb` | El selector de fecha y hora replica el calendario del rango |
| `6241c97053` | Actualización de los controles de fecha y hora |

## 2026-09-13 · Prioridad visual y modo compacto

| Commit | Cambio |
| --- | --- |
| `427555007b` | Prioridad visual (`zIndex`) del panel superpuesto |
| `5ddda904f9` | Selectores compactos en la versión 1.0.3 |

## 2026-09-12 · Primera versión

| Commit | Cambio |
| --- | --- |
| `2297488aed` | Limpieza de dependencias no usadas y artefactos locales |
| `072055cc02` | Subida de versiones para actualizar la solución |
| `396475e3cb` | Reconstrucción de los paquetes de solución con los dos controles PCF |
| `229149c7e7` | Limpieza de la solución y actualización de ambos paquetes |
| `6d3ade5fbe` | `DateTimeRangePicker` y descripciones de formatos localizadas |
| `73b4170be6` | Paquetes de solución importables de Power Platform |
| `becceaf40b` | Preparación del paquete de solución compatible con Canvas |
| `fc367d3cc8` | Eliminación de la biblioteca Fluent no soportada |
| `3cc4f7b5ba` | Selector de rango de fechas inicial |

## Cómo registrar un cambio

1. Agrega una sección nueva con la fecha (formato `YYYY-MM-DD`) al inicio de este archivo.
2. Indica los controles afectados con su versión nueva.
3. Anota el hash del commit, el impacto en la solución y cualquier cambio incompatible.
4. Si subiste la versión de la solución, actualiza también la fila correspondiente en [README.md](README.md) y en [controles.md](controles.md).

