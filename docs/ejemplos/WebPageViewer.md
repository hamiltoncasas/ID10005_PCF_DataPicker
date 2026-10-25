# Ejemplo - WebPageViewer

> Fecha: 2026-10-25
> Descripcion: Caso completo de visor de ayuda con navegacion, URL relativa, recarga y aviso de bloqueo de iframe. Referencia del control en [../WebPageViewer.md](../WebPageViewer.md).

## 1. Que construye

Un **centro de ayuda** dentro de la aplicacion. Tres botones cambian la pagina visible, un campo permite buscar en la guia y el usuario puede recargar o abrir la pagina en una pestana nueva. El ejemplo usa una URL base y rutas relativas para no repetir el dominio.

| Elemento | Nombre | Tipo |
| --- | --- | --- |
| Pantalla | `scrAyuda` | Pantalla |
| Visor | `vwAyuda` | WebPageViewer |
| Boton inicio | `btnInicio` | Boton |
| Boton guia | `btnGuia` | Boton |
| Boton preguntas | `btnPreguntas` | Boton |
| Recargar | `btnRecargarAyuda` | Boton |
| Busqueda | `txtBuscarAyuda` | Entrada de texto |

## 2. Configuracion del visor

| Propiedad | Valor |
| --- | --- |
| *Dirección de la página* | `varPaginaAyuda` |
| *URL base* | `"https://ayuda.ejemplo.com/"` |
| *Recargar página* | `varRecargarAyuda` |
| *Mostrar barra de acciones* | Activada |
| *Modo de carga* | `eager` |
| *Espera máxima (ms)* | `12000` |
| *Permitir pantalla completa* | Desactivado |
| *Etiqueta accesible* | `Centro de ayuda` |
| *Ancho x alto* | `900 x 600` |

`https://ayuda.ejemplo.com` es un dominio ficticio. Sustituyelo por la direccion real de tu intranet o sitio publicado.

## 3. Variables y navegacion

### 3.1 Al mostrar la pantalla

```powerfx
Set(varPaginaAyuda, "inicio.html");
Set(varRecargarAyuda, false)
```

### 3.2 Botones de navegacion

```powerfx
// Inicio
Set(varPaginaAyuda, "inicio.html")

// Guia de uso
Set(varPaginaAyuda, "guias/primeros-pasos.html")

// Preguntas frecuentes
Set(varPaginaAyuda, "faq.html")
```

La salida `vwAyuda.currentUrl` se actualiza con la direccion resuelta, por ejemplo `https://ayuda.ejemplo.com/guias/primeros-pasos.html`.

### 3.3 Busqueda en el sitio

```powerfx
// OnChange de txtBuscarAyuda, solo si el texto no esta vacio
If(
    !IsBlank(Trim(txtBuscarAyuda.Text)),
    Set(varPaginaAyuda, "buscar.html?q=" & EncodeUrl(Trim(txtBuscarAyuda.Text)))
)
```

`EncodeUrl` convierte espacios y caracteres especiales para que la URL sea valida. Si cambias la URL en cada pulsacion, el visor recarga la pagina; para busquedas frecuentes es mejor hacerlo desde un boton **Buscar**.

### 3.4 Recargar

```powerfx
Set(varRecargarAyuda, !varRecargarAyuda)
```

La recarga se dispara cuando cambia el valor. Asignar `true` dos veces seguidas no vuelve a recargar.

## 4. Estado y diagnostico

### 4.1 Etiqueta de estado

```powerfx
If(
    vwAyuda.isLoading,
    "Cargando la ayuda...",
    vwAyuda.hasError,
    "No se pudo mostrar la pagina: " & vwAyuda.errorMessage,
    "Pagina actual: " & vwAyuda.currentUrl
)
```

`hasError` no siempre significa que la URL sea invalida: el sitio puede estar disponible en una pestana normal y, aun asi, impedir su visualizacion dentro de un iframe.

### 4.2 Aviso al usuario

```powerfx
If(
    vwAyuda.hasError,
    Notify("La pagina no se puede mostrar aqui. Usa Abrir en pestana nueva.", NotificationType.Warning)
)
```

No pongas este `Notify` en una formula que se evalua en cada render sin controlar el estado: el aviso se repetiria. Enlazalo a una accion del usuario o a un cambio observado.

## 5. Pruebas sugeridas

| # | Accion | Resultado esperado |
| --- | --- | --- |
| 1 | Abrir la pantalla | Se ve `inicio.html` y `currentUrl` es la URL completa |
| 2 | Pulsar Guia de uso | Se ve la guia y `currentUrl` termina en `/guias/primeros-pasos.html` |
| 3 | Pulsar Recargar | Aparece el indicador de carga y la pagina vuelve a cargar |
| 4 | Buscar `primeros pasos` | La URL codifica el espacio como `%20` y el sitio recibe la busqueda |
| 5 | Pulsar Abrir en pestana nueva | Se abre la misma direccion que muestra `currentUrl` |
| 6 | Usar una URL de un sitio que bloquea iframes | Aparece el aviso y el boton de apertura externa |
| 7 | Borrar la direccion | Aparece *Texto sin dirección*, sin errores en la consola |

## 6. Variantes utiles

### 6.1 URL completa sin URL base

```powerfx
// Dirección de la página
"https://es.wikipedia.org/wiki/Power_Apps"
```

Si la URL trae esquema, *URL base* se ignora. No mezcles una URL absoluta con una base que ya incluya una ruta.

### 6.2 Visor de un informe publicado

```powerfx
Set(varPaginaAyuda, "https://informes.ejemplo.com/ventas?periodo=" & Text(Today(), "yyyy-MM"))
```

El servidor del informe debe permitir la inclusion. Un informe que exige inicio de sesion interactivo puede fallar dentro del iframe aunque funcione en una pestana.

### 6.3 Pagina asociada al registro seleccionado

```powerfx
Set(
    varPaginaAyuda,
    "fichas/cliente.html?id=" & EncodeUrl(Text(galClientes.Selected.ID))
)
```

Valida que el identificador no venga vacio antes de cambiar la URL.

### 6.4 Visor solo de lectura sin barra

| Propiedad | Valor |
| --- | --- |
| *Mostrar barra de acciones* | Desactivado |
| *Ancho x alto* | `100% x 500` |

Sin barra desaparecen **Recargar** y **Abrir en pestana nueva**. Deja una recarga externa si la pagina puede quedar bloqueada.

### 6.5 Sitios que no permiten iframes

El navegador aplica `X-Frame-Options` y `Content-Security-Policy: frame-ancestors`; el control no puede desactivarlos. Opciones:

1. Usar **Abrir en pestana nueva** o `Launch()` para esos sitios.
2. Publicar una version del contenido disenada para incrustarse.
3. Cambiar la cabecera en el servidor del sitio, solo si es propio y la politica de seguridad lo permite.

No intentes evitar la restriccion con un proxy abierto: rompe la autenticacion y expone los datos.

## 7. Problemas comunes

| Sintoma | Causa probable | Solucion |
| --- | --- | --- |
| La pagina queda en blanco | El sitio bloquea iframes o exige autenticacion interactiva | Abre en pestana nueva y revisa la consola del navegador |
| La URL relativa no carga | Falta la barra final en *URL base* | Usa `https://sitio.com/guias/`, no `https://sitio.com/guias` |
| El visor muestra una direccion vieja | La variable no cambio de valor | Asigna una ruta distinta o alterna *Recargar página* |
| El aviso de error aparece tarde | La pagina tarda mas que *Espera máxima (ms)* | Sube el valor a `20000` o desactiva el aviso con `0` |
| La pagina ocupa poco alto | El control esta en modo compacto | Aumenta el alto en el lienzo; la barra consume 32 px |
| El contenido no es accesible | El sitio interno no esta publicado para el usuario | Comprueba permisos y red; el visor no autentica por ti |

## 8. Seguridad y buenas practicas

- Incrusta solo sitios de confianza y con `https`.
- No pases tokens, contrasenas ni datos personales en la URL: quedan en el historial y en la barra.
- Revisa la politica de `sandbox` antes de agregar permisos; cuanto mas restrictiva, mejor.
- No uses el visor para eludir el inicio de sesion del sitio.
- Documenta para el usuario que algunos sitios solo funcionan en una pestana nueva.

## 9. Referencia

- Propiedades, salidas y limites: [../WebPageViewer.md](../WebPageViewer.md)
- Instalacion de la solucion: [../README.md](../README.md#6-instalar-y-usar-en-power-apps)
- Verificacion manual del visor: [../WebPageViewer.md](../WebPageViewer.md#9-verificacion)
