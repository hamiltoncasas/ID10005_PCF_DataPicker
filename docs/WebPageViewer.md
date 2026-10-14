# WebPageViewer

> Fecha: 2026-10-13
> Descripcion: Visor de paginas web para Power Apps Canvas: propiedades, salidas, comportamiento, ejemplos y pruebas. Indice general en [README.md](README.md).

## 1. Que es

`WebPageViewer` es un control PCF de tipo `virtual` que muestra **una pagina web dentro de la aplicacion de lienzo** (o de un formulario de Dataverse) a traves de un iframe, con barra de acciones propia, aviso de carga y ayuda cuando el sitio no permite mostrarse dentro de la aplicacion.

| Dato | Valor |
| --- | --- |
| Identificador de componente | `id5_ID10005.WebPageViewer` |
| Version | 1.0.1 |
| Salida principal | `currentUrl` |
| Requiere servicios externos | No: el codigo del control no llama a ningun servicio; el iframe carga la direccion que configures |

Comparte el lenguaje visual de los demas controles del repositorio:

- **Barra de acciones (32 px):** punto de estado, direccion resuelta (recortada con puntos suspensivos si es larga) y botones **Recargar** y **Abrir en pestana nueva**.
- **Cuerpo:** la pagina embebida ocupa todo el espacio del control.
- **Mensajes en superposicion:** *Cargando la pagina...* con indicador giratorio mientras carga, *Texto sin direccion* cuando no hay pagina y un aviso con boton de apertura externa cuando la pagina no aparece.

Cuando lo usas: para ver una intranet, un panel, una guia o un informe publicado sin salir de la aplicacion, y para avisar al usuario cuando el sitio no admite iframes. Si el sitio bloquea la integracion, el control no puede forzarla: para esos casos queda **Abrir en pestana nueva** o `Launch()`.

## 2. Empezar rapido

1. En el estudio de Power Apps: **Insertar > Obtener mas componentes > Codigo > WebPageViewer**.
2. Escribe la direccion en la propiedad **Direccion de la pagina** (`url`): completa (`https://es.wikipedia.org/wiki/Power_Apps`) o relativa (`informes/resumen.html`) si configuras **URL base** (`baseUrl`).
3. Opcional: enlaza **Recargar pagina** (`reloadKey`) a una variable para recargar desde Power Fx y ajusta el alto del control en el lienzo (minimo util 120 px).

Resultado: la pagina se ve dentro del visor y la salida `WebPageViewer1.currentUrl` publica la direccion resuelta.

## 3. Propiedades de entrada

### 3.1 Datos y comportamiento

| Propiedad (nombre tecnico) | Nombre en Power Apps | Tipo | Predeterminado | Descripcion |
| --- | --- | --- | --- | --- |
| `url` | *Direccion de la pagina* | Texto | vacio | Direccion que se muestra: completa con esquema (`https://...`, `mailto:...`) o relativa a la **URL base** |
| `baseUrl` | *URL base* | Texto | vacio | Prefijo que se agrega a las direcciones relativas. Se normaliza a `https` cuando no trae esquema |
| `reloadKey` | *Recargar pagina* | Si/No | No | Cuando cambia de valor, el visor vuelve a cargar la pagina indicada |
| `showToolbar` | *Mostrar barra de acciones* | Si/No | Si | Muestra la barra superior con la direccion y los botones |
| `loadingMode` | *Modo de carga* | Texto | `eager` | `eager` carga la pagina de inmediato; `lazy` la carga cuando el visor entra en pantalla (atributo `loading` del iframe). Cualquier otro valor se trata como `eager` |
| `sandbox` | *Restricciones del iframe (sandbox)* | Texto | vacio | Valor del atributo `sandbox`, por ejemplo `allow-scripts allow-same-origin allow-forms`. Vacio = sin restricciones adicionales (mayor compatibilidad) |
| `allowFeatures` | *Permisos del navegador (allow)* | Texto | vacio | Valor del atributo `allow`, por ejemplo `fullscreen; geolocation; camera`. Vacio = permisos predeterminados del navegador |
| `allowFullScreen` | *Permitir pantalla completa* | Si/No | No | Habilita `allowfullscreen` en el iframe para que la propia pagina pueda entrar en pantalla completa |
| `loadTimeoutMs` | *Espera maxima (ms)* | Numero | `12000` | Milisegundos que se espera la pagina antes de mostrar el aviso. `0` o un valor negativo desactivan el aviso |
| `accessibleLabel` | *Etiqueta accesible* | Texto | `Visor de pagina web` | Texto que anuncian los lectores de pantalla para la region y para el iframe |

### 3.2 Textos de la interfaz

Todos son de tipo texto y, cuando se dejan vacios, el control usa el valor predeterminado:

| Propiedad | Nombre en Power Apps | Predeterminado |
| --- | --- | --- |
| `loadingText` | *Texto de carga* | `Cargando la pagina...` |
| `hintText` | *Aviso de pagina no visible* | `La pagina no aparecio. Es posible que el sitio no permita mostrarse dentro de la aplicacion: abre el visor en una pestana nueva para verla completa.` |
| `emptyText` | *Texto sin direccion* | `No se ha indicado ninguna pagina. Escribe la direccion en la propiedad Url.` |
| `openButtonText` | *Texto del boton Abrir* | `Abrir en pestana nueva` (texto y etiqueta accesible) |
| `reloadButtonText` | *Texto del boton Recargar* | `Recargar` (texto y etiqueta accesible) |

### 3.3 Apariencia (equivalentes a los demas controles)

| Propiedad | Nombre en Power Apps | Predeterminado | Descripcion |
| --- | --- | --- | --- |
| `borderColor` | *Color del borde* | vacio | Acepta `#RRGGBB`, `rgb()`, nombres CSS y `Color.X` de Power Apps |
| `borderStyle` | *Estilo del borde* | vacio (`Solid`) | `Solid`, `Dashed`, `Dotted`, `Double` o `None`; tambien se acepta `BorderStyle.None` |
| `borderThickness` | *Grosor del borde* | vacio (`1`) | Grosor en pixeles; `0` quita el borde |
| `fill` | *Color de fondo* | vacio | Fondo de la barra de acciones, del area alrededor de la pagina y del cuerpo |

## 4. Salidas

| Salida | Tipo | Descripcion |
| --- | --- | --- |
| `currentUrl` | Texto | Direccion resuelta que esta mostrando el visor. Vacia cuando no hay direccion configurada |
| `isLoading` | Si/No | Verdadero mientras la pagina esta cargando; falso cuando termina o cuando no hay direccion |
| `hasError` | Si/No | Verdadero cuando la pagina no aparecio dentro de la espera configurada |
| `errorMessage` | Texto | Texto del *Aviso de pagina no visible* cuando `hasError` es verdadero; vacio en caso contrario |

## 5. Comportamiento

### 5.1 Como se resuelve la direccion

La propiedad *Direccion de la pagina* se resuelve contra la **URL base** antes de dibujar el iframe:

| *Direccion de la pagina* | *URL base* | Direccion final (`currentUrl`) |
| --- | --- | --- |
| `https://sitio.com/informes/a.html` | cualquiera | `https://sitio.com/informes/a.html` (trae esquema: se usa tal cual) |
| `mailto:alguien@empresa.com` | cualquiera | `mailto:alguien@empresa.com` |
| `//sitio.com/a.html` | `https://portal.com` | `https://sitio.com/a.html` (toma el esquema de la base) |
| `/informes/a.html` | `https://intranet.empresa.com/portal` | `https://intranet.empresa.com/informes/a.html` (toma el origen de la base) |
| `informes/a.html` | `https://intranet.empresa.com/portal` | `https://intranet.empresa.com/portal/informes/a.html` (agrega la barra final) |
| `informes/a.html` | `intranet.empresa.com` (sin esquema) | `https://intranet.empresa.com/informes/a.html` (la base se normaliza a `https`) |
| `informes/a.html` | vacio | `informes/a.html` (se resuelve contra el host de la aplicacion) |
| vacio | cualquiera | sin pagina: se muestra el *Texto sin direccion* |

### 5.2 Estados del visor

| Estado | Cuando ocurre | Que se ve | Salidas |
| --- | --- | --- | --- |
| Sin direccion | *Direccion de la pagina* vacia | *Texto sin direccion*; botones e iframe deshabilitados | `currentUrl` vacio, `isLoading` falso, `hasError` falso |
| Cargando | direccion nueva o recarga pedida | indicador giratorio y *Texto de carga* sobre la pagina | `isLoading` verdadero |
| Lista | el iframe termino de cargar | la pagina ocupando todo el control | `isLoading` falso, `hasError` falso |
| No visible | vencio la **Espera maxima** sin que el iframe terminara de cargar | aviso *Aviso de pagina no visible* con boton de apertura externa (la pagina sigue cargando debajo) | `hasError` verdadero y `errorMessage` con el aviso |

Un cambio en *Direccion de la pagina* o en *Recargar pagina* reinicia el ciclo: el iframe se vuelve a crear con una clave nueva y arranca en estado *Cargando*.

### 5.3 Barra de acciones y recarga

- La direccion que muestra la barra es la **resuelta** (la misma de `currentUrl`).
- **Recargar** vuelve a pedir la pagina al sitio; no reinicia la aplicacion ni la pantalla.
- **Abrir en pestana nueva** usa `Context.navigation.openUrl` del host. Si el host no permite abrir direcciones externas, la pulsacion se ignora sin mostrar error.
- Con `DisplayMode` en `View` (o *Disabled*) los dos botones se deshabilitan y el iframe no recibe clics.

### 5.4 Seguridad y permisos del iframe

- `sandbox` vacio deja el iframe sin restricciones adicionales: es lo que funciona con la mayoria de los sitios. Si lo configuras, incluye `allow-scripts` y `allow-same-origin`, o la pagina no se dibujara.
- `allowFeatures` se escribe tal cual en el atributo `allow`; hace falta para `fullscreen`, `geolocation` o `camera`. Para pantalla completa tambien debe estar activa *Permitir pantalla completa*.
- El control **no** inyecta codigo en la pagina ni lee su contenido: solo dibuja el iframe con la direccion configurada.

## 6. Ejemplos en Power Fx

```powerfx
// 1. Direccion completa: propiedad Direccion de la pagina
"https://es.wikipedia.org/wiki/Power_Apps"

// 2. Ruta relativa: URL base + Direccion de la pagina
//    URL base ............... "https://intranet.empresa.com/portal/"
//    Direccion de la pagina . "informes/resumen.html"

// 3. Recargar desde un boton (propiedad Recargar pagina enlazada a varRecarga)
Set(varRecarga, !varRecarga)

// 4. Avisar cuando la pagina no se pudo mostrar
If(WebPageViewer1.hasError, Notify(WebPageViewer1.errorMessage, NotificationType.Warning))

// 5. Reflejar la direccion y el estado de carga en otros controles
Label1.Text = If(IsBlank(WebPageViewer1.currentUrl), "Sin pagina", WebPageViewer1.currentUrl)
Timer1.Visible = WebPageViewer1.isLoading

// 6. Cambiar la pagina desde un desplegable (propiedad Direccion de la pagina)
Dropdown1.Selected.Value

// 7. Abrir la misma direccion fuera de la aplicacion
Launch(WebPageViewer1.currentUrl)

// 8. Bloquear el visor mientras la aplicacion guarda (propiedad DisplayMode)
If(varGuardando, DisplayMode.Disabled, DisplayMode.Edit)
```

Inicializa `varRecarga` en `false` al iniciar la pantalla. La propiedad *Recargar pagina* actua cuando cambia de valor; alternar la variable permite pedir otra recarga en cada pulsacion.

## 7. Limites y buenas practicas

- **Sitios que bloquean iframes:** las cabeceras `X-Frame-Options: DENY`/`SAMEORIGIN` o `Content-Security-Policy: frame-ancestors` impiden que la pagina se dibuje dentro de la aplicacion, y el navegador **no** avisa al control. Por eso la unica senal es el aviso por espera; para esos sitios usa **Abrir en pestana nueva** o el boton propio de la aplicacion con `Launch()`.
- **`currentUrl` no sigue la navegacion interna:** si el usuario navega dentro del iframe, la aplicacion no se entera (el navegador bloquea el acceso al contenido de terceros); `currentUrl` es la direccion que fijo la aplicacion.
- **Sesion y cookies:** el iframe no comparte la sesion de Power Apps; los sitios autenticados pediran iniciar sesion de nuevo y algunos navegadores bloquean cookies de terceros. Prueba en el equipo, navegador y red reales antes de publicar.
- **Tamaño:** el alto minimo util es 120 px. Dale al visor todo el alto disponible de la pantalla; el panel no crece solo.
- **Rendimiento:** cada visor carga una pagina completa. En pantallas con varios visores usa *Modo de carga* = `lazy` y evita cambiar *Recargar pagina* en bucle.
- **Una pagina por control:** el control no lleva historial ni barra de direcciones editable; la direccion la decide la aplicacion.
- **Sin servicios externos:** el manifiesto declara `external-service-usage enabled="false"`, asi que el control no es premium; el trafico lo genera el navegador al cargar la pagina configurada.
- **Textos:** las etiquetas son fijas en espanol; si necesitas otro idioma, escribelas en las propiedades de texto.

## 8. Problemas comunes

| Sintoma | Causa probable | Solucion |
| --- | --- | --- |
| La pagina queda en blanco y `hasError` es falso | El sitio bloquea iframes (`X-Frame-Options` o `frame-ancestors`) | Abre la direccion con **Abrir en pestana nueva** o `Launch()`; no hay forma de forzar el iframe |
| Aparece el aviso aunque el sitio funcione | La pagina tarda mas que la *Espera maxima* | Sube *Espera maxima (ms)* (por ejemplo 30000) o pon `0` para desactivar el aviso |
| El visor esta vacio y sin mensaje | *Direccion de la pagina* vacia | Escribe la direccion o conectala a una variable |
| La direccion se queda en relativa | *URL base* vacia o sin host | Completa *URL base* (`https://...`); el control normaliza el esquema pero necesita el host |
| Los botones estan deshabilitados | No hay direccion o `DisplayMode` es `View` | Corrige la direccion o el modo del control |
| La pagina pide iniciar sesion | El iframe no comparte la sesion del usuario | Usa una direccion publica, un portal anonimo o la apertura externa |
| La pagina no carga con *sandbox* configurado | Falta `allow-scripts` o `allow-same-origin` | Corrige *Restricciones del iframe* o deja la propiedad vacia |
| El contenido se ve estrecho o con barras | El sitio tiene ancho minimo o no es responsivo | Amplia el control en el lienzo o usa la apertura externa |
| `Launch(WebPageViewer1.currentUrl)` falla | `currentUrl` esta vacio | Comprueba la salida antes: `If(!IsBlank(WebPageViewer1.currentUrl), Launch(WebPageViewer1.currentUrl))` |

## 9. Verificacion

Comprobaciones rapidas despues de agregar el control a la pantalla:

| # | Accion | Resultado esperado |
| --- | --- | --- |
| 1 | Agregar el control sin direccion | Se ve el *Texto sin direccion* y los botones estan deshabilitados |
| 2 | Escribir `https://es.wikipedia.org/wiki/Power_Apps` en *Direccion de la pagina* | La pagina se muestra y `currentUrl` publica la direccion |
| 3 | Pulsar **Recargar** | La pagina se vuelve a pedir al sitio; `isLoading` es verdadero un momento |
| 4 | Pulsar **Abrir en pestana nueva** | El navegador abre la direccion fuera de la aplicacion |
| 5 | Enlazar *Recargar pagina* a `varRecarga` y alternarla con un boton | La pagina se recarga |
| 6 | Configurar *URL base* `https://es.wikipedia.org/wiki/` y *Direccion de la pagina* `Power_Apps` | La barra muestra la direccion completa y la pagina se ve |
| 7 | Poner *Espera maxima (ms)* en `2000` con una direccion que bloquee iframes | Aparece el aviso, `hasError` es verdadero y `errorMessage` trae el texto del aviso |
| 8 | Desactivar *Mostrar barra de acciones* | El cuerpo ocupa todo el control y no se ven los botones |
| 9 | Poner `DisplayMode` en `View` | Los botones se deshabilitan y el iframe no recibe clics |
| 10 | Cambiar *Color del borde* a `Color.DarkBlue` y *Grosor del borde* a `2` | El marco del visor cambia de color y grosor |
| 11 | Poner *Modo de carga* en `lazy` en una pantalla con varias secciones | La pagina carga cuando el visor entra en pantalla |

El visor depende del navegador y del sitio remoto, por eso no tiene comprobaciones automatizadas: el arnes del repositorio cubre las fechas, la busqueda tipo contiene y la seleccion (ver [README.md](README.md#9-verificacion-y-pruebas)), y esta tabla cubre el visor en la aplicacion.

## 10. Archivos del control

| Archivo | Contenido |
| --- | --- |
| `WebPageViewer/ControlManifest.Input.xml` | Contrato: propiedades, salidas, recursos y metadatos |
| `WebPageViewer/index.ts` | Adaptador PCF: resuelve la direccion, encadena la recarga y publica las salidas |
| `WebPageViewer/WebPageViewerView.tsx` | Vista React: barra de acciones, iframe, avisos y `resolveSourceUrl` |
| `WebPageViewer/WebPageViewer.css` | Estilos con prefijo de clases `wpv-` |
| `WebPageViewer/strings/WebPageViewer.1033.resx` | Nombres y descripciones localizados que se ven en el panel de propiedades |

