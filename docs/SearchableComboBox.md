# SearchableComboBox

> Fecha: 2026-09-27
> Descripcion: Combobox con busqueda incremental tipo contiene para Power Apps Canvas: propiedades, comportamiento, ejemplos y pruebas. Indice general en [README.md](README.md).

## 1. Que es

`SearchableComboBox` es un control PCF de tipo `virtual` que replica el combobox de Power Apps de lienzo y agrega el filtro tipo **contiene**: al escribir, la lista muestra todos los registros que contienen el texto en cualquier posicion, **sin distinguir mayusculas ni acentos**, y resalta la coincidencia.

| Dato | Valor |
| --- | --- |
| Identificador de componente | `id5_ID10005.SearchableComboBox` |
| Version | 1.0.1 |
| Salidas | `selectedValue`, `selectedLabel`, `selectedValues`, `selectedLabels`, `selectedCount` |
| Conjunto de datos | `items` (columnas `value`, `label`, `description`) |
| Requiere servicios externos | No |

Estructura visual:

- **Modo compacto:** un campo con el valor elegido (o el texto *Sin seleccion*) y el boton azul a la derecha. Con seleccion multiple se muestran etiquetas removibles en una sola linea.
- **Lista expandida:** se dibuja en superposicion sobre el contenido; incluye el cuadro de busqueda, la lista de opciones con el fragmento coincidente resaltado y el pie con el contador de registros mostrados del total.
- **Texto largo:** cerrado se recorta con puntos suspensivos (el valor completo queda en la sugerencia nativa); abierto, la lista crece con el texto hasta el 92% del ancho de la ventana y 720 px, y si hace falta permite desplazamiento horizontal.

Cuando lo usas: cuando la tabla de origen tiene muchos registros y el combobox nativo no filtra como necesitas, o cuando quieres buscar por cualquier columna y no solo por la etiqueta.

## 2. Guia de uso paso a paso

Esta guia reproduce el caso mas comun: **elegir una o varias categorias para filtrar una galeria**, con busqueda por cualquier columna y sin depender de la primera pagina del origen.

### 2.1 Antes de empezar

| Requisito | Como comprobarlo |
| --- | --- |
| PCF para canvas activo y solucion publicada | Power Platform admin center > Entorno > Caracteristicas; Soluciones > `ID0005_DataPickers` |
| Control disponible en el estudio | **Insertar > Obtener mas componentes > Codigo > SearchableComboBox** |
| Origen de datos o coleccion con un valor unico | Tabla con clave, o una coleccion creada con `ClearCollect` |
| Decision sobre seleccion unica o multiple | *Permitir selección múltiple* activa o desactiva |

### 2.2 Pasos

1. **Inserta el control** desde **Insertar > Obtener mas componentes > Codigo > SearchableComboBox** y renombralo, por ejemplo `cmbCategorias`.
2. **Prepara las opciones:** en **Elementos (tabla o colección)** escribe una tabla con las columnas `value`, `label` y, si hace falta, `description`. Ejemplo con una coleccion:

   ```powerfx
   ClearCollect(
       colCategorias,
       { value: "ALI", label: "Alimentos", description: "Productos no perecederos" },
       { value: "BEB", label: "Bebidas", description: "Jugos, agua y refrescos" },
       { value: "ASE", label: "Aseo", description: "Cuidado personal y limpieza" }
   )
   ```

3. **Enlaza Items:** `cmbCategorias.Items = SortByColumns(colCategorias, "label")`. Si usas una tabla real, proyecta las columnas: `ShowColumns(Categorias, "Codigo"->value, "Nombre"->label)` o crea la forma con `AddColumns`.
4. **Decide la seleccion:** activa *Permitir selección múltiple* si el usuario puede elegir varias categorias. Con seleccion unica, un segundo clic sobre la opcion activa la quita.
5. **Limita la busqueda si hace falta:** en *Campos de búsqueda* escribe `label,description`. Vacio busca en todas las columnas enlazadas; un nombre que no exista hace que se busque en todas.
6. **Precarga una seleccion:** en *Selección inicial* escribe `"BEB;ASE"`. Acepta valores o etiquetas separados por `;`; con seleccion unica solo se toma la primera coincidencia.
7. **Usa las salidas:** lee `selectedValues` para filtrar y `selectedLabels` para mostrar. Valida `selectedCount > 0` antes de consultar. La guia completa esta en [ejemplos/SearchableComboBox.md](ejemplos/SearchableComboBox.md).

### 2.3 Configuracion minima recomendada

| Propiedad | Valor sugerido | Por que |
| --- | --- | --- |
| **Elementos (tabla o colección)** | `SortByColumns(colCategorias, "label")` | Ordena las opciones y fija las columnas que se buscan |
| *Permitir selección múltiple* | Activada | Permite combinar varias categorias en un filtro |
| *Permitir búsqueda* | Activada | Muestra el cuadro de busqueda y el filtro contiene |
| *Campos de búsqueda* | `label,description` | Evita buscar en columnas internas |
| *Selección inicial* | `"BEB;ASE"` | Deja una seleccion inicial visible |
| *Texto sin selección* | `Todas las categorias` | Comunica que no hay filtro aplicado |
| *Reiniciar selección* | `limpiarCategorias` | Permite limpiar la seleccion desde Power Fx |

### 2.4 Comprobar que funciona

1. Abre la lista: el foco pasa al cuadro de busqueda y se ven todas las opciones con el contador del pie.
2. Escribe `beb`: aparecen las coincidencias aunque esten en mayuscula o con acentos, y el fragmento se resalta.
3. Limpia la busqueda, elige dos opciones y comprueba que `selectedCount` sea `2` y `selectedValues` sea `BEB;ASE` en el orden de seleccion.
4. Quita una etiqueta con su `x` o con Retroceso: las salidas se actualizan.
5. Filtra una galeria con `in Split(cmbCategorias.selectedValues, ";")`: solo deben quedar las categorias elegidas.

Resultado: las opciones se muestran con `value` como dato y `label` como texto, y la seleccion se publica en `cmbCategorias.selectedValues`. La guia completa, con datos de productos y filtros, esta en [ejemplos/SearchableComboBox.md](ejemplos/SearchableComboBox.md).

## 3. Enlazar los elementos (propiedad Items)

| Columna | Uso | Obligatoria |
| --- | --- | --- |
| `value` | Valor unico que se publica en las salidas | Si |
| `label` | Texto visible de cada opcion (si falta se usa el valor) | No |
| `description` | Texto secundario de cada opcion | No |

Notas:

- Los nombres no distinguen mayusculas.
- Si el host no informa las columnas, el control intenta leer esos tres nombres directamente.
- La busqueda recorre **todas las columnas enlazadas**, no solo la etiqueta; con *Campos de búsqueda* puedes limitarla.
- En Canvas, la forma habitual es `SortByColumns(Filter(Origen, Condicion), "Columna")`; los filtros se aplican en la propia propiedad **Elementos (tabla o colección)**.

## 4. Propiedades de entrada

| Propiedad (nombre tecnico) | Nombre en Power Apps | Tipo | Predeterminado | Descripcion |
| --- | --- | --- | --- | --- |
| `items` | *Elementos (tabla o colección)* | Conjunto de datos | - | Registros que se muestran como opciones (columnas `value`, `label`, `description`) |
| `defaultValue` | *Selección inicial* | Texto | vacio | Seleccion precargada separada por `;`. Admite valores o etiquetas |
| `selectMultiple` | *Permitir selección múltiple* | Si/No | No | Permite elegir varias opciones; aparece una etiqueta removible por cada una |
| `isSearchable` | *Permitir búsqueda* | Si/No | Si | Muestra el cuadro de busqueda y activa el filtro contiene |
| `searchFields` | *Campos de búsqueda* | Texto | vacio | Columnas donde buscar, separadas por coma. Vacio = todas; si ningun nombre coincide, se buscan todas |
| `noSelectionText` | *Texto sin selección* | Texto | `---` | Texto del campo cuando no hay seleccion |
| `placeholderText` | *Texto de búsqueda* | Texto | `Buscar...` | Texto del cuadro de busqueda |
| `resetKey` | *Reiniciar selección* | Si/No | No | Cuando cambia de valor limpia la seleccion |
| `zIndex` | *Prioridad visual de la lista* | Numero | `2147483647` | `z-index` de la lista expandida |

## 5. Salidas

| Salida | Tipo | Descripcion |
| --- | --- | --- |
| `selectedValue` | Texto | Valor de la primera opcion seleccionada |
| `selectedLabel` | Texto | Etiqueta de la primera opcion seleccionada |
| `selectedValues` | Texto | Todos los valores seleccionados separados por `;` |
| `selectedLabels` | Texto | Todas las etiquetas seleccionadas separadas por `;` |
| `selectedCount` | Numero | Cantidad de opciones seleccionadas |

Con `selectedCount` igual a `0` no hay seleccion y `selectedValue` queda vacio.

## 6. Comportamiento de busqueda

1. Al abrir la lista, el foco pasa al cuadro de busqueda del propio control.
2. Al escribir se filtran **todos** los registros cargados y se conservan los que **contienen** el texto en cualquier posicion, en cualquiera de las columnas de busqueda.
3. La comparacion ignora mayusculas y acentos: escribir `bogota` encuentra `Bogota Norte` y escribir `OTA` tambien lo encuentra.
4. El fragmento coincidente se resalta en cada opcion.
5. Si no hay coincidencias, se muestra un mensaje con el texto buscado y el pie indica cuantos registros se estan mostrando del total.
6. La lista solicita las paginas restantes del conjunto de datos para filtrar sobre todos los registros existentes, no solo sobre la primera pagina (hasta 5000 registros por pagina y 10 paginas).
7. Desactivar *Permitir búsqueda* oculta el cuadro de busqueda y muestra la lista completa.

## 7. Comportamiento de seleccion

- **Seleccion unica:** al hacer clic en la opcion activa, la lista se cierra y se publican `selectedValue` y `selectedLabel`. Volver a hacer clic en la opcion ya seleccionada la quita, igual que un combobox que puede quedar vacio.
- **Seleccion multiple:** cada clic agrega o quita la opcion; la lista permanece abierta, aparecen etiquetas en el campo y cada etiqueta tiene una `×` para quitarla.
- **Selección inicial:** acepta valores o etiquetas separados por `;`; con seleccion unica solo se toma la primera coincidencia. Si los registros todavia no llegaron, la seleccion se aplica cuando el conjunto de datos esta disponible.
- **Reiniciar:** cuando cambia *Reiniciar selección*, la seleccion se limpia y las salidas publican vacio.

## 8. Teclado y cierre

| Tecla | Accion |
| --- | --- |
| `Flecha abajo` / `Flecha arriba` | Mueve la opcion activa (con ciclo al final y al inicio) |
| `Enter` | Selecciona la opcion activa (en seleccion unica cierra la lista) |
| `Esc` | Cierra la lista |
| `Tab` | Cierra la lista y continua el recorrido |
| `Retroceso` | Con la busqueda vacia y seleccion multiple, quita la ultima etiqueta |

Ademas, un clic fuera de la lista la cierra, y al desplazar la pagina o cambiar el tamano de la ventana la lista acompanha al control.

## 9. Ejemplos en Power Fx

```powerfx
// 1. Valor elegido
SearchableComboBox1.selectedValue

// 2. Cuantas opciones hay seleccionadas
SearchableComboBox1.selectedCount

// 3. Convertir la seleccion multiple en una tabla
ForAll(Split(SearchableComboBox1.selectedValues, ";"), { Valor: ThisRecord.Value })

// 4. Etiquetas legibles separadas por coma
Substitute(SearchableComboBox1.selectedLabels, ";", ", ")

// 5. Precargar una seleccion existente (valores o etiquetas)
SearchableComboBox1.defaultValue = "COD-001;COD-014"

// 6. Limpiar la seleccion desde un boton
UpdateContext({ reiniciarCombo: true });   // Reiniciar selección = reiniciarCombo

// 7. Avisar si no hay seleccion
If(SearchableComboBox1.selectedCount = 0, "Elige al menos una opcion")
```

## 10. Limites y buenas practicas

- **Filtro en memoria:** la busqueda se hace del lado del cliente sobre los registros cargados (hasta 5000 por pagina y 10 paginas). Con origenes mucho mayores conviene filtrar antes con `Filter()` en **Elementos (tabla o colección)** o acotar con *Campos de búsqueda*.
- **Reducir columnas:** enlaza solo las columnas necesarias; asi la busqueda es mas rapida.
- **Sin notificacion al escribir:** el filtro no avisa al framework en cada tecla, por lo que no se produce un ciclo de `updateView` por pulsacion.
- **Texto largo:** la lista muestra el texto completo; el campo compacto lo recorta con puntos suspensivos y conserva el valor completo en la sugerencia nativa.
- **Un combobox por campo:** para dos selecciones usa dos controles (o uno en modo multiple y separa los valores en Power Fx).

## 11. Problemas comunes

| Sintoma | Causa probable | Solucion |
| --- | --- | --- |
| La lista aparece vacia | **Elementos (tabla o colección)** no esta enlazado o no incluye la columna `value` | Revisa el enlace y que exista la columna `value` |
| No encuentra un texto que si existe | El registro no esta cargado en las paginas pedidas | Filtra antes con `Filter` o acota `searchFields` |
| La busqueda no cubre la columna esperada | *Campos de búsqueda* con nombres que no coinciden | Revisa los nombres (separados por coma); vacio = todas |
| La lista se ve detras de otro elemento | Otro elemento tiene `z-index` mayor | Sube *Prioridad visual de la lista* |
| Los valores precargados no aparecen | Los registros aun no habian llegado | El control reintenta; verifica que el valor o la etiqueta existan en **Elementos (tabla o colección)** |
| La seleccion multiple no permite mas de una opcion | *Permitir selección múltiple* esta en No | Activa la propiedad |

## 12. Verificacion

| # | Accion | Resultado esperado |
| --- | --- | --- |
| 1 | Enlazar una tabla en **Elementos (tabla o colección)** y abrir la lista | Se muestran las opciones |
| 2 | Escribir un texto que aparece en el medio de una etiqueta | Solo quedan los registros que lo contienen |
| 3 | Escribir sin acentos sobre una etiqueta con tildes | La coincidencia se encuentra y se resalta |
| 4 | Escribir texto de otra columna | La coincidencia se encuentra |
| 5 | Escribir algo inexistente | Mensaje de sin coincidencias y contador `0 de N` |
| 6 | Clic en una opcion (seleccion unica) | La lista se cierra y las salidas se actualizan |
| 7 | Activar *Permitir selección múltiple* y elegir dos opciones | Aparecen las etiquetas y `selectedCount` vale 2 |
| 8 | Quitar una etiqueta con `×` | La seleccion y `selectedValues` se actualizan |
| 9 | Usar `Flecha arriba`, `Flecha abajo`, `Enter` y `Esc` | Navegacion, seleccion y cierre funcionan |
| 10 | Clic fuera de la lista | La lista se cierra |
| 11 | Enlazar una etiqueta muy larga | Cerrado se recorta; abierto se superpone y muestra todo |
| 12 | Desplazar la pagina con la lista abierta | La lista acompanha al control |
| 13 | Escribir dos valores separados por `;` en *Selección inicial* | Se precargan al iniciar la aplicacion |

El arnes del repositorio (ver [README.md](README.md#9-verificacion-y-pruebas)) cubre la normalizacion de acentos y mayusculas, el filtro contiene en medio del texto y en columnas distintas a la etiqueta, el caso sin coincidencias, el texto vacio, la seleccion unica y multiple, el quitar etiquetas, la navegacion con teclado con ciclo y el resaltado.

## 13. Archivos del control

| Archivo | Contenido |
| --- | --- |
| `SearchableComboBox/ControlManifest.Input.xml` | Contrato: conjunto de datos `items`, propiedades, salidas y recursos |
| `SearchableComboBox/index.ts` | Adaptador PCF: convierte los registros en opciones, resuelve la seleccion inicial, solicita paginas y publica las salidas |
| `SearchableComboBox/SearchableComboBoxView.tsx` | Vista React: campo compacto, cuadro de busqueda, lista con resaltado y posicionamiento |
| `SearchableComboBox/SearchableComboBox.css` | Estilos con prefijo de clases `scb-` |
| `SearchableComboBox/strings/SearchableComboBox.1033.resx` | Nombres y descripciones localizados del panel de propiedades |
