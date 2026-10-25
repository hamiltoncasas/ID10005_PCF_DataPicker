# Ejemplo - SearchableComboBox

> Fecha: 2026-10-25
> Descripcion: Caso completo de seleccion multiple con busqueda y filtro de una galeria. Referencia del control en [../SearchableComboBox.md](../SearchableComboBox.md).

## 1. Que construye

Un **catalogo de productos** filtrado por categoria. El usuario puede buscar por texto, elegir varias categorias y limpiar la seleccion. La galeria muestra los productos de las categorias elegidas y, si no hay ninguna, muestra todos.

| Elemento | Nombre | Tipo |
| --- | --- | --- |
| Pantalla | `scrCatalogo` | Pantalla |
| Categorias | `cmbCategorias` | SearchableComboBox |
| Galeria | `galProductos` | Galeria vertical |
| Contador | `lblSeleccion` | Etiqueta |
| Limpiar | `btnLimpiarCategorias` | Boton |

## 2. Datos de prueba

### 2.1 Opciones del combo

```powerfx
// App.OnStart
ClearCollect(
    colCategorias,
    { value: "ALI", label: "Alimentos", description: "Productos no perecederos" },
    { value: "BEB", label: "Bebidas", description: "Jugos, agua y refrescos" },
    { value: "ASE", label: "Aseo", description: "Cuidado personal y limpieza" },
    { value: "HOG", label: "Hogar", description: "Utensilios y organizacion" }
)
```

### 2.2 Productos

```powerfx
ClearCollect(
    colProductos,
    { Codigo: 1, Nombre: "Arroz 1 kg", Categoria: "ALI", Precio: 3.5 },
    { Codigo: 2, Nombre: "Frijol 500 g", Categoria: "ALI", Precio: 2.8 },
    { Codigo: 3, Nombre: "Jugo de naranja", Categoria: "BEB", Precio: 2.2 },
    { Codigo: 4, Nombre: "Agua 1 L", Categoria: "BEB", Precio: 1.1 },
    { Codigo: 5, Nombre: "Jabon de bano", Categoria: "ASE", Precio: 1.9 },
    { Codigo: 6, Nombre: "Escoba", Categoria: "HOG", Precio: 4.5 }
);
Set(varLimpiarCategorias, false)
```

## 3. Configuracion del control

| Propiedad | Valor |
| --- | --- |
| **Elementos (tabla o colección)** | `SortByColumns(colCategorias, "label")` |
| *Permitir selección múltiple* | Activada |
| *Permitir búsqueda* | Activada |
| *Campos de búsqueda* | `label,description` |
| *Selección inicial* | `"BEB;ASE"` |
| *Texto sin selección* | `Todas las categorias` |
| *Texto de búsqueda* | `Buscar categoria...` |
| *Reiniciar selección* | `varLimpiarCategorias` |
| *Prioridad visual de la lista* | `2147483647` |
| *Ancho x alto* | `360 x 32` (cerrado) |

`Items` debe contener las columnas `value`, `label` y, opcionalmente, `description`. Los nombres no distinguen mayusculas.

## 4. Formulas de la pantalla

### 4.1 Items de la galeria

```powerfx
If(
    cmbCategorias.selectedCount = 0,
    colProductos,
    Filter(
        colProductos,
        Categoria in Split(cmbCategorias.selectedValues, ";")
    )
)
```

`Split` convierte `BEB;ASE` en una tabla con dos valores y el operador `in` comprueba la pertenencia. La rama `If` evita que una seleccion vacia deje la galeria sin resultados.

### 4.2 Etiqueta de seleccion

```powerfx
If(
    cmbCategorias.selectedCount = 0,
    "Mostrando todas las categorias",
    "Mostrando " & cmbCategorias.selectedCount & " categoria(s): " &
    Substitute(cmbCategorias.selectedLabels, ";", ", ")
)
```

### 4.3 Limpiar la seleccion

```powerfx
Set(varLimpiarCategorias, !varLimpiarCategorias)
```

### 4.4 Precargar desde otra pantalla

```powerfx
// Antes de navegar
Set(varCategoriaElegida, "ALI");

// Propiedad Selección inicial del combo
varCategoriaElegida
```

Con seleccion multiple, usa una cadena separada por `;`: `"ALI;HOG"`.

### 4.5 Seleccion unica

Si el usuario solo puede elegir una categoria:

| Propiedad | Valor |
| --- | --- |
| *Permitir selección múltiple* | Desactivada |
| *Selección inicial* | `varCategoriaElegida` |

```powerfx
If(
    IsBlank(cmbCategorias.selectedValue),
    colProductos,
    Filter(colProductos, Categoria = cmbCategorias.selectedValue)
)
```

Un segundo clic sobre la opcion activa la quita; por eso la galeria debe tratar el valor vacio como "sin filtro".

## 5. Pruebas sugeridas

| # | Accion | Resultado esperado |
| --- | --- | --- |
| 1 | Abrir la pantalla | Aparecen Bebidas y Aseo seleccionadas; la galeria muestra 3 productos |
| 2 | Escribir `agu` en la busqueda | Se muestra solo el producto "Agua 1 L" |
| 3 | Borrar la busqueda | Vuelven los 3 productos de las categorias elegidas |
| 4 | Agregar Hogar | `selectedCount` pasa a 3 y aparecen 4 productos |
| 5 | Quitar una etiqueta con su `x` | La galeria se actualiza |
| 6 | Pulsar Limpiar | No hay etiquetas y se muestran los 6 productos |
| 7 | Buscar `zzz` | Mensaje de sin coincidencias; no se rompe la seleccion |
| 8 | Recorrer con flechas y pulsar Enter | La opcion activa se agrega o se quita |

## 6. Variantes utiles

### 6.1 Enlazar una tabla real

Si la tabla `Categorias` tiene `Codigo`, `Nombre` y `Descripcion`, proyecta las columnas con los nombres que espera el control:

```powerfx
AddColumns(
    Categorias,
    "value", Codigo,
    "label", Nombre,
    "description", Descripcion
)
```

Conserva el `Filter` o el `SortByColumns` que ya usas en la galeria. Evita enlazar filas sin un `value` unico: las salidas se identifican por ese valor.

### 6.2 Buscar solo por etiqueta

```powerfx
// Campos de búsqueda
label
```

Con `searchFields` vacio se buscan todas las columnas, incluida `description`. Si prefieres que el usuario solo encuentre por nombre visible, limita el campo a `label`.

### 6.3 Mostrar las etiquetas en una etiqueta externa

```powerfx
Substitute(cmbCategorias.selectedLabels, ";", " | ")
```

### 6.4 Selection multiple para una coleccion de registros

Si tu origen no tiene un valor unico, crea uno estable antes de enlazarlo:

```powerfx
AddColumns(
    Origen,
    "value", Text(ID),
    "label", Nombre
)
```

No uses la posicion de la fila como `value`: cambia al filtrar u ordenar.

## 7. Problemas comunes

| Sintoma | Causa probable | Solucion |
| --- | --- | --- |
| Las opciones no aparecen | `Items` no tiene `value` o llega vacio | Revisa las columnas y el orden de carga |
| La galeria queda vacia al abrir | La seleccion inicial no coincide con ningun `value` | Usa valores exactos o deja *Selección inicial* vacio |
| No se puede seleccionar mas de una opcion | *Permitir selección múltiple* esta desactivada | Actívala y vuelve a insertar el control |
| La busqueda no encuentra una opcion | `Campos de búsqueda` apunta a una columna sin ese texto | Deja el campo vacio o corrige los nombres |
| Las etiquetas se guardan con `;` | Es el separador disenado de las salidas | Usa `Split` o `Substitute` para presentarlas |
| El filtro falla con la seleccion vacia | `Split` de una cadena vacia no devuelve valores | Trata `selectedCount = 0` como "sin filtro" |

## 8. Referencia

- Propiedades, salidas y busqueda: [../SearchableComboBox.md](../SearchableComboBox.md)
- Datos de ejemplo en JSON: [README.md](README.md)
- Instalacion de la solucion: [../README.md](../README.md#6-instalar-y-usar-en-power-apps)
