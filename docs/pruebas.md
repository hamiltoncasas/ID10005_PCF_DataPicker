# Pruebas y verificación

> Fecha: 2026-09-16  
> Descripcion: Verificaciones automáticas ejecutadas, arnés de comprobación de lógica y checklist de pruebas manuales en Canvas.

## 1. Validaciones automáticas

| Validación | Comando | Resultado (2026-09-16) |
| --- | --- | --- |
| Compilación de los 5 controles | `npm run build` | Succeeded, 5 bundles generados en `out/controls` |
| Calidad de código | `npm run lint` | Succeeded, 0 errores |
| Lógica de fechas, contiene y selección | ver sección 3 | 61 de 61 verificaciones correctas |
| Empaquetado de la solución | `dotnet build solution.cdsproj -c Release` | Compilación correcta, 0 advertencias, 0 errores |
| Contenido del paquete | Inspección de `solution.zip` | 5 componentes: DatePicker, DateTimePicker, DateRangePicker, DateTimeRangePicker y SearchableComboBox |

## 2. Compilación por control

Cada control debe generar su bundle y no superar los límites de tamaño del host:

```powershell
npm run build
Get-ChildItem out\controls -Directory | Select-Object Name
```

Resultado esperado: `DatePicker`, `DateRangePicker`, `DateTimePicker`, `DateTimeRangePicker`, `SearchableComboBox`, cada uno con `bundle.js` (minificado), `ControlManifest.xml`, su CSS y su resx.

## 3. Arnés de verificación de lógica

El archivo [`tools/verificar-controles.js`](../tools/verificar-controles.js) ejercita las vistas reales con Node (sin navegador): compila las vistas a `obj/checks` y las instancia emulando `setState` para comprobar el comportamiento de los métodos que dependen del estado.

```powershell
# 1. Compilar las vistas a JavaScript
npx tsc DatePicker/DatePickerView.tsx DateTimePicker/DateTimePickerView.tsx SearchableComboBox/SearchableComboBoxView.tsx --outDir obj/checks --module commonjs --target es2019 --jsx react --esModuleInterop --lib ES2020,DOM --strict --skipLibCheck

# 2. Ejecutar las verificaciones
node tools/verificar-controles.js
```

Salida esperada (resumen final):

```
61 de 61 verificaciones correctas
```

Si alguna comprobación falla, el script termina con código de salida 1 y muestra `FAIL <nombre> -> <valor obtenido> esperado <valor esperado>`.

### Qué cubre

| Bloque | Verificaciones |
| --- | --- |
| `DatePicker` | Parseo del valor inicial en los 12 formatos (mes visible correcto), salida formateada al elegir un día, valor vacío usa el mes actual, valor inválido no rompe |
| `DateTimePicker` | Hora inicial tomada del valor, cambio de hora publica `YYYY-MM-DDTHH:mm` y conserva el estado, cambio de fecha conserva la hora, selección de día cierra el panel, hora por defecto alineada a 15 minutos, sin fecha no publica, limpiar publica vacío, valor inválido no rompe |
| Búsqueda | `normalizeForSearch` (acentos y mayúsculas), contiene en el medio del texto, contiene en una columna distinta a la etiqueta, sin coincidencias, sin texto devuelve todo, sin registros no activa ninguna opción |
| Selección | Selección única publica el valor, `isSelected`, selección múltiple agrega y quita, quitar etiqueta, navegación con teclado con ciclado al final y vuelta al inicio |
| Botón Actualizar | `refreshData` avisa al adaptador para refrescar `Items` y se puede repetir |
| Botón Limpiar filtros | Quita el texto de búsqueda, reinicia la opción activa y limpia la selección (única y múltiple); sin registros no activa ninguna opción |
| Resaltado | Cálculo del fragmento coincidente con texto parcial |

### Limitaciones del arnés

- No valida el render (no hay jsdom): no comprueba CSS, posicionamiento del panel, foco ni eventos del navegador.
- No cubre `DateRangePicker` ni `DateTimeRangePicker` (controles existentes sin cambios en esta entrega).
- No simula un `context` de Power Apps ni el `DataSet` completo; la conversión de registros a opciones se revisa con el checklist manual (sección 4).

## 4. Checklist de pruebas manuales en Canvas

Ejecútalo después de importar la solución en el entorno y agregar los controles a una aplicación.

### DatePicker

| # | Acción | Resultado esperado |
| --- | --- | --- |
| 1 | Clic en el campo o en el botón de calendario | Se abre el panel debajo del control, con mes actual |
| 2 | Elegir un día | Se resalta el día, el panel se contrae y `date` se actualiza |
| 3 | Abrir de nuevo | El mes visible es el de la fecha elegida |
| 4 | Navegar meses con `‹` y `›` | Cambia el mes sin perder la selección |
| 5 | Pulsar **Limpiar** | `date` queda vacío y el campo muestra el texto de ayuda |
| 6 | Cambiar `format` a `DD/MM/YYYY` y elegir una fecha | La salida se muestra en el formato nuevo |
| 7 | Cambiar `resetKey` a `true` con un botón | La selección se limpia |
| 8 | Poner `DisplayMode` en `View` | No se puede abrir el panel |

### DateTimePicker

| # | Acción | Resultado esperado |
| --- | --- | --- |
| 1 | Abrir el panel sin valor previo | El selector de hora muestra la hora actual alineada a 15 minutos |
| 2 | Cambiar la hora y luego elegir un día | `dateTime` combina el día elegido con la hora seleccionada |
| 3 | Elegir un día y volver a abrir el panel | La hora y el mes se mantienen coherentes con el valor |
| 4 | Vaciar el campo de fecha del panel | `dateTime`, `date` y `time` quedan vacíos |
| 5 | Cambiar `timeFormat` a `12` | El resumen muestra la hora en formato de 12 horas |

### SearchableComboBox

| # | Acción | Resultado esperado |
| --- | --- | --- |
| 1 | Enlazar una tabla en `Items` | Se muestran las opciones al abrir la lista |
| 2 | Escribir un texto que aparece en el medio de una etiqueta | Solo quedan los registros que contienen el texto |
| 3 | Escribir sin acentos (`bogota`) sobre una etiqueta con tildes | La coincidencia se encuentra y se resalta |
| 4 | Escribir texto de otra columna | La coincidencia se encuentra |
| 5 | Escribir algo inexistente | Mensaje de sin coincidencias y contador `0 de N` |
| 6 | Clic en una opción (selección única) | La lista se cierra y `selectedValue`/`selectedLabel` se actualizan |
| 7 | Activar `selectMultiple` y elegir dos opciones | Aparecen las etiquetas, `selectedCount` vale 2 |
| 8 | Quitar una etiqueta con `×` | La selección y `selectedValues` se actualizan |
| 9 | Usar `↑`, `↓`, `Enter`, `Esc` | Navegación, selección y cierre funcionan |
| 10 | Clic fuera de la lista | La lista se cierra |
| 11 | Enlazar una etiqueta muy larga | Cerrado: el texto se recorta con puntos suspensivos. Abierto: la lista se superpone y muestra todo el texto |
| 12 | Desplazar la página con la lista abierta | La lista acompaña al control sin desalinearse |
| 13 | Poner `defaultValue` con dos valores separados por `;` | Se precargan al iniciar la aplicación |
| 14 | Pulsar **Actualizar** (⟳) en el encabezado del panel | La lista se vuelve a consultar: aparecen los registros nuevos o editados de `Items` |
| 15 | Escribir un texto y pulsar **Limpiar filtros** | Se borra el texto, vuelven todos los registros y se quita la selección |
| 16 | Cambiar `refreshKey` desde un botón de la app | La fuente de datos se vuelve a consultar igual que con el botón **Actualizar** |
| 17 | Con el paginador de Power Apps, avanzar a la página 2 | El combobox muestra los registros de esa página (con `loadAllRecords = No`) |

## 5. Rutina de regresión antes de publicar

```powershell
npm run lint
npm run build
npx tsc DatePicker/DatePickerView.tsx DateTimePicker/DateTimePickerView.tsx SearchableComboBox/SearchableComboBoxView.tsx --outDir obj/checks --module commonjs --target es2019 --jsx react --esModuleInterop --lib ES2020,DOM --strict --skipLibCheck
node tools/verificar-controles.js
Set-Location solution; dotnet build solution.cdsproj -c Release
```

Criterios de aceptación: lint sin errores, build correcto, `61 de 61` verificaciones correctas y paquete de solución generado con los 5 componentes.

