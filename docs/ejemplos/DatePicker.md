# Ejemplo - DatePicker

> Fecha: 2026-10-25
> Descripcion: Caso completo de captura y guardado de una fecha con DatePicker. Indice de ejemplos en [README.md](README.md); referencia del control en [../DatePicker.md](../DatePicker.md).

## 1. Que construye

Una pantalla de **registro de entregas** con tres campos: cliente, fecha de entrega y notas. El usuario elige la fecha, la aplicacion valida que exista y guarda la entrega en una coleccion. El ejemplo tambien muestra como precargar la fecha al editar y como limpiarla.

| Elemento | Nombre | Tipo |
| --- | --- | --- |
| Pantalla | `scrEntrega` | Pantalla |
| Campo de cliente | `txtCliente` | Entrada de texto |
| Selector de fecha | `dtpFechaEntrega` | DatePicker |
| Campo de notas | `txtNotas` | Entrada de texto |
| Boton guardar | `btnGuardar` | Boton |
| Boton limpiar | `btnLimpiar` | Boton |

## 2. Datos de prueba

En `App.OnStart` crea una coleccion con la forma de la tabla. No se necesitan datos de ningun entorno:

```powerfx
ClearCollect(
    colEntregas,
    { ID: 1, Cliente: "Cliente Norte", FechaEntrega: Date(2026, 10, 28), Notas: "Franja de manana" }
);
Set(varSiguienteEntrega, 2);
Set(varLimpiarFecha, false)
```

## 3. Configuracion del control

| Propiedad | Valor |
| --- | --- |
| *Formato de fecha* | `YYYY-MM-DD` |
| *Fecha precargada* | `If(!IsBlank(varEntregaEditada), Text(varEntregaEditada.FechaEntrega, "yyyy-mm-dd"))` |
| *Fecha precargada por omision* | Vacia (no la uses junto con la precarga) |
| *Reiniciar selección* | `varLimpiarFecha` |
| *Fecha mínima* | `Text(Today(), "yyyy-mm-dd")` |
| *Fecha máxima* | `Text(DateAdd(Today(), 365, Days), "yyyy-mm-dd")` |
| *Primer día de la semana* | `monday` |
| *Texto de ayuda del campo* | `Selecciona la fecha de entrega` |
| *Etiqueta accesible* | `Fecha de entrega` |
| *Ancho x alto* | `320 x 32` (cerrado) |

Si el formulario es solo de alta, deja *Fecha precargada* vacia. La expresion anterior supone que `varEntregaEditada` es un registro o `Blank()`.

## 4. Formulas de la pantalla

### 4.1 Al mostrar la pantalla

```powerfx
// OnVisible de scrEntrega
Set(varEntregaEditada, Blank());
Set(varLimpiarFecha, false)
```

### 4.2 Boton Guardar

```powerfx
If(
    IsBlank(dtpFechaEntrega.date),
    Notify("Selecciona la fecha de entrega.", NotificationType.Warning),
    Collect(
        colEntregas,
        {
            ID: varSiguienteEntrega,
            Cliente: Trim(txtCliente.Text),
            FechaEntrega: DateValue(dtpFechaEntrega.date),
            Notas: Trim(txtNotas.Text)
        }
    );
    Set(varSiguienteEntrega, varSiguienteEntrega + 1);
    Set(varLimpiarFecha, !varLimpiarFecha);
    Notify("Entrega guardada.", NotificationType.Success)
)
```

El `Set(varLimpiarFecha, !varLimpiarFecha)` cambia el valor de *Reiniciar selección* y deja el selector vacio despues de guardar. No hace falta tocar `dtpFechaEntrega.date`: es una salida de solo lectura.

### 4.3 Boton Limpiar

```powerfx
Set(varLimpiarFecha, !varLimpiarFecha);
Reset(txtCliente);
Reset(txtNotas)
```

### 4.4 Etiqueta de resumen

```powerfx
If(
    IsBlank(dtpFechaEntrega.date),
    "Sin fecha seleccionada",
    "Entrega: " & Text(DateValue(dtpFechaEntrega.date), "dddd, dd 'de' mmmm 'de' yyyy")
)
```

### 4.5 Editar una entrega existente

Al seleccionar una fila de una galeria:

```powerfx
Set(varEntregaEditada, ThisItem)
```

Con *Fecha precargada* enlazada a `varEntregaEditada`, el control muestra la fecha del registro. No alternes *Reiniciar selección* en la misma accion: el reinicio tiene prioridad y dejaria el selector vacio. Para guardar los cambios:

```powerfx
Patch(
    colEntregas,
    LookUp(colEntregas, ID = varEntregaEditada.ID),
    {
        Cliente: Trim(txtCliente.Text),
        FechaEntrega: DateValue(dtpFechaEntrega.date),
        Notas: Trim(txtNotas.Text)
    }
);
Set(varEntregaEditada, Blank());
Set(varLimpiarFecha, !varLimpiarFecha)
```

## 5. Pruebas sugeridas

| # | Accion | Resultado esperado |
| --- | --- | --- |
| 1 | Abrir la pantalla | El selector muestra el texto de ayuda y `date` esta vacio |
| 2 | Pulsar Guardar sin fecha | Aviso de advertencia; no se agrega ningun registro |
| 3 | Elegir el 28/10/2026 | `dtpFechaEntrega.date` publica `2026-10-28` |
| 4 | Pulsar Guardar | Se agrega una fila con `FechaEntrega` de tipo fecha |
| 5 | Pulsar Limpiar | El selector vuelve al texto de ayuda |
| 6 | Editar la fila creada | El selector muestra `2026-10-28` |
| 7 | Elegir una fecha anterior a hoy | El calendario la deshabilita por *Fecha mínima* |

## 6. Variantes utiles

### 6.1 Formato local para mostrar

Mantener `YYYY-MM-DD` en el control y cambiar solo la presentacion evita errores de conversion:

```powerfx
Text(DateValue(dtpFechaEntrega.date), "dd/mm/yyyy")
```

### 6.2 Fecha por omision al crear

```powerfx
// Propiedad Fecha precargada, solo en el formulario de alta
If(IsBlank(varEntregaEditada), Text(Today(), "yyyy-mm-dd"))
```

### 6.3 Limpiar al cambiar de cliente

```powerfx
// OnChange del campo txtCliente
If(!IsBlank(dtpFechaEntrega.date), Set(varLimpiarFecha, !varLimpiarFecha))
```

## 7. Problemas comunes

| Sintoma | Causa probable | Solucion |
| --- | --- | --- |
| El boton Guardar no hace nada | La funcion `If` devuelve `Blank()` sin `Notify` | Revisa la condicion y agrega un aviso en la rama falsa |
| `DateValue` devuelve otra fecha | El formato del control y la configuracion regional no coinciden | Usa `YYYY-MM-DD` en el control o `DateValue(texto, "es-ES")` |
| La fecha precargada no aparece | `defaultDate` tiene prioridad o el texto no usa el formato configurado | Deja `defaultDate` vacia y usa `Text(campo, "yyyy-mm-dd")` |
| El control no se limpia | Se asigno una constante a *Reiniciar selección* | Enlaza una variable y alterna su valor |
| El panel queda detras de otros elementos | El control usa una capa propia | Ajusta *Prioridad visual del selector* o reordena los controles del lienzo |

## 8. Referencia

- Propiedades, salidas y formatos: [../DatePicker.md](../DatePicker.md)
- Formatos compartidos: [../README.md](../README.md#7-formatos-de-fecha-y-hora)
- Instalacion de la solucion: [../README.md](../README.md#6-instalar-y-usar-en-power-apps)
