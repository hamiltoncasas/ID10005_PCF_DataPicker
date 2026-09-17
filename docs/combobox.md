# SearchableComboBox

> Fecha: 2026-09-16  
> Descripcion: Propiedades, comportamiento y ejemplos del combobox con busqueda incremental para Power Apps Canvas.

> Indice de documentacion: [README.md](README.md) · Referencia general: [controles.md](controles.md)

`SearchableComboBox` replica el combobox clasico de Power Apps de lienzo y agrega el filtro tipo **contiene**: al escribir, la lista muestra todos los registros que contienen el texto en cualquier posicion, sin distinguir mayusculas ni acentos, y resalta la coincidencia.

## Enlazar los elementos

En Canvas, enlaza una tabla o coleccion en la propiedad **Items** y elige los campos. El control reconoce estas columnas:

| Columna | Uso | Obligatoria |
| --- | --- | --- |
| `value` | Valor unico que se publica en las salidas | Si |
| `label` | Texto visible de cada opcion | No (si falta se usa `value`) |
| `description` | Texto secundario por opcion | No |

Si el host no reporta columnas, el control intenta leer `value`, `label` y `description` directamente. La busqueda recorre **todas** las columnas enlazadas, no solo la etiqueta.

## Propiedades de entrada

| Propiedad | Tipo | Descripcion |
| --- | --- | --- |
| `items` | Conjunto de datos | Registros que se muestran como opciones |
| `defaultValue` | Texto | Valores precargados separados por `;`. Admite valores o etiquetas |
| `selectMultiple` | Si/No | Permite elegir varias opciones (etiquetas removibles). Predeterminado: No |
| `isSearchable` | Si/No | Muestra el cuadro de busqueda y activa el filtro contiene. Predeterminado: Si |
| `searchFields` | Texto | Columnas donde buscar, separadas por coma. Vacio = todas |
| `noSelectionText` | Texto | Texto cuando no hay seleccion. Predeterminado: `---` |
| `placeholderText` | Texto | Texto guia del cuadro de busqueda. Predeterminado: `Buscar...` |
| `resetKey` | Si/No | Al cambiar de valor limpia la seleccion |
| `zIndex` | Numero | Prioridad visual de la lista. Predeterminado: `2147483647` |

## Propiedades de salida

| Salida | Descripcion |
| --- | --- |
| `selectedValue` | Valor de la primera opcion seleccionada |
| `selectedLabel` | Etiqueta de la primera opcion seleccionada |
| `selectedValues` | Todos los valores seleccionados separados por `;` |
| `selectedLabels` | Todas las etiquetas seleccionadas separadas por `;` |
| `selectedCount` | Cantidad de opciones seleccionadas |

Con `selectedCount = 0` no hay seleccion y `selectedValue` queda vacio.

## Comportamiento de busqueda

1. Al abrir la lista, el foco pasa al cuadro de busqueda del propio control.
2. Al escribir se filtran **todos** los registros y se conservan los que contienen el texto en cualquier posicion (`contains`), en cualquier columna enlazada.
3. La comparacion ignora mayusculas y acentos: `bogota` encuentra `Bogotá Norte`; `OTA` encuentra `Bogotá Norte`.
4. El fragmento coincidente se resalta en cada opcion.
5. Si no hay coincidencias se muestra un mensaje con el texto buscado y el pie indica cuantos registros se estan mostrando del total.
6. La lista solicita las paginas restantes del conjunto de datos para filtrar sobre todos los registros existentes, no solo sobre la primera pagina.

## Texto largo

- **Cerrado**: el control conserva su tamano normal, el texto se recorta con puntos suspensivos y el valor completo queda disponible en la sugerencia nativa (`title`). En seleccion multiple se muestran etiquetas en una sola linea.
- **Abierto**: la lista se dibuja como superposicion sobre el contenido, crece con el texto (`max-content`, limitado al 92% del ancho de la ventana y 720 px) y muestra el texto completo sin recortarlo. Si el texto supera ese limite, la lista permite desplazamiento horizontal.
- El encabezado del panel muestra el texto completo de la seleccion con salto de linea y desplazamiento vertical, para que nunca se pierda informacion.

## Teclado

| Tecla | Accion |
| --- | --- |
| `Flecha abajo` / `Flecha arriba` | Mueve la opcion activa |
| `Enter` | Selecciona la opcion activa (en seleccion unica cierra la lista) |
| `Esc` | Cierra la lista |
| `Tab` | Cierra la lista y continua el recorrido |
| `Retroceso` | Con la busqueda vacia y seleccion multiple, quita la ultima etiqueta |

## Ejemplos en Power Fx

Enlaza la tabla en `Items` y usa las salidas:

```powerfx
// Valor elegido
SearchableComboBox1.selectedValue

// Cuantas opciones hay seleccionadas
SearchableComboBox1.selectedCount

// Convertir la seleccion multiple en una tabla
ForAll(Split(SearchableComboBox1.selectedValues, ";"), { Valor: ThisRecord.Value })

// Precargar una seleccion existente
SearchableComboBox1.defaultValue = "BOG;MED"
```

## Comportamiento de seleccion

- Seleccion unica: al hacer clic en la opcion activa se cierra la lista. Volver a hacer clic en la opcion seleccionada la quita, igual que un combobox que permite quedar vacio.
- Seleccion multiple: cada clic agrega o quita la opcion, la lista permanece abierta y las etiquetas del control tienen una `×` para quitarlas.
- `resetKey` limpia la seleccion cuando cambia de valor.
