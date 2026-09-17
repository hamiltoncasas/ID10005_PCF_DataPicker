# Arquitectura

> Fecha: 2026-09-16  
> Descripcion: Estructura del repositorio, ciclo de vida PCF, patrones de implementacion y diseno visual.

## Estructura del repositorio

```
ID10005_PCF_DataPicker/
├─ DatePicker/                       Control nuevo: una sola fecha
│  ├─ ControlManifest.Input.xml      Contrato: propiedades, recursos y metadatos
│  ├─ index.ts                       Adaptador del ciclo de vida PCF
│  ├─ DatePickerView.tsx             Vista React (calendario + panel)
│  ├─ DatePicker.css                 Estilos con prefijo dp-
│  ├─ strings/DatePicker.1033.resx   Nombres y descripciones localizados
│  └─ generated/ManifestTypes.d.ts   Generado por el build (ignorado por git)
├─ DateTimePicker/                   Control nuevo: una sola fecha y hora
├─ SearchableComboBox/               Control nuevo: combobox con busqueda contiene
├─ DateRangePicker/                  Control original del proyecto raiz (rango de fechas)
├─ DateTimeRangePicker/              Proyecto PCF anidado independiente
│  ├─ DateTimeRangePicker.pcfproj    Proyecto MSBuild propio
│  ├─ package.json, tsconfig.json    Copia independiente del entorno de build
│  └─ DateTimeRangePicker/           Control (manifest, index.ts, vista, css, resx)
├─ ID10005_PCF_DataPicker.pcfproj    Proyecto MSBuild raiz (empaqueta 5 controles)
├─ package.json                      Scripts de build/lint/start del proyecto raiz
├─ pcfconfig.json                    outDir: ./out/controls
├─ eslint.config.mjs                 Reglas de calidad (ESLint 9 + reglas Power Apps)
├─ solution/                         Proyecto de solucion (cdsproj) y paquetes zip
├─ docs/                             Documentacion
├─ tools/verificar-controles.js      Arnes de verificacion de logica
└─ out/                              Salida del build (ignorada por git)
```

## Tecnologias

| Elemento | Version | Uso |
| --- | --- | --- |
| React | 16.14.0 | Biblioteca de plataforma declarada en el manifiesto (`platform-library`); no se incluye en el bundle |
| TypeScript | 5.9.3 | Compilacion con `jsx: react`, `target: es6`, `strict: true` |
| pcf-scripts | 1.51.1 | Build, lint, empaquetado y validacion de manifiestos |
| Webpack | 5.x (incluido en pcf-scripts) | Bundle por control en modo minificado |
| ESLint | 9 + `@microsoft/eslint-plugin-power-apps` | Validacion obligatoria durante el build |
| Node.js | 24.x | Entorno de build |
| Power Platform CLI (`pac`) | 2.11.2 | Empaquetado alternativo e importacion de soluciones |
| .NET SDK | 10.x | Construccion del proyecto de solucion (`cdsproj`) |

## Patron de implementacion

Cada control separa responsabilidades en tres archivos:

1. **`ControlManifest.Input.xml`**: contrato con Power Apps. Declara propiedades de entrada, salidas, el conjunto de datos (`data-set` + `property-set`) cuando aplica, los recursos (`index.ts`, CSS, resx) y la biblioteca de plataforma React.
2. **`index.ts`**: adaptador. Implementa `ComponentFramework.ReactControl`:
   - `init`: guarda `notifyOutputChanged`.
   - `updateView`: lee `context.parameters`, transforma los datos (dataset a opciones, fechas a objetos `Date`), aplica `resetKey`, conserva el estado de seleccion y devuelve el elemento React con `React.createElement`.
   - `getOutputs`: publica solo las salidas que dependen del estado propio.
   - `destroy`: reservado para limpieza.
3. **`<Control>View.tsx`**: componente React de clase que dibuja el modo compacto y el panel, y maneja teclado, foco y posicionamiento. No conoce la API de Power Apps: recibe props y comunica cambios con callbacks.

Reglas aplicadas en el repositorio:

- El valor interno se guarda en el adaptador para no perderlo cuando el framework vuelve a llamar a `updateView`.
- Los valores de entrada solo se aplican cuando **cambian** (`initialDate`, `initialDateTime`, `defaultValue`); `resetKey` limpia el estado cuando cambia su valor.
- Los helpers de fecha y parseo se duplican por control para que cada carpeta sea autocontenida y se pueda mover sin dependencias cruzadas.
- Cada control usa su propio prefijo de clases CSS (`dp-`, `dtp-`, `drp-`, `dtrp-`, `scb-`) porque el panel se dibuja fuera del contenedor del control.

## Render del panel

- El panel se crea con `ReactDOM.createPortal(panel, document.body)` y `position: fixed`, por lo que nunca lo recorta un contenedor del lienzo.
- La posición se calcula con `getBoundingClientRect()` del campo compacto: `top = borde inferior + 6 px`, `left = borde izquierdo`.
- `zIndex` se limita con `Math.max(1, Math.min(zIndex, 2147483647))`.
- El combobox además:
  - Escucha `mousedown` en fase de captura para cerrar al hacer clic fuera.
  - Escucha `resize` y `scroll` para recalcular la posición.
  - Mide el panel ya dibujado (máximo 2 pasadas) para no salirse de la ventana y lo coloca encima del campo si no cabe abajo.
- El combobox devuelve un `React.Fragment` con el control y el panel, porque el cuadro de búsqueda vive dentro del control (como en el combobox clásico) mientras la lista flota aparte.

## Manejo del conjunto de datos (`SearchableComboBox`)

1. `updateView` recibe `context.parameters.items` (tipo `DataSet`).
2. Se leen las columnas (`dataset.columns`); si el host no las informa se usan los nombres declarados en el manifiesto (`value`, `label`, `description`).
3. Cada registro se convierte en una opción `{ key, value, label, description, searchText }`, donde `searchText` es la concatenación normalizada de las columnas de búsqueda (sin acentos, en minúsculas).
4. Se solicitan las páginas restantes (`paging.setPageSize(5000)` una vez y `paging.loadNextPage()` hasta 10 veces) para filtrar sobre todos los registros.
5. El filtro y el resaltado se ejecutan en la vista sobre el arreglo ya normalizado, sin notificar cambios al framework al escribir: así se evita un ciclo de `updateView` por cada tecla.

## Diseño visual

| Elemento | Valor |
| --- | --- |
| Fondo del panel | `#fffdf8` con borde `#e7ded0`, radio 16 px y sombra suave |
| Bloque de contenido (calendario / lista) | `#f7f1e8`, radio 12 px |
| Acento de selección | `#b86e49` |
| Hover de día / opción activa | `#8baba0` |
| Etiqueta superior (kicker) | `#ad6b45`, 10 px, mayúsculas, `letter-spacing: 1.4px` |
| Píldora de estado | `#f3eadc`; `#dcefe6` cuando la selección está completa |
| Botón derecho del modo compacto | `#2f5da8`, hover `#244b8b`, 31 px de ancho |
| Modo compacto | 32 px de alto, borde `#8a8a8a`, radio 2 px, foco `#2f5da8` |
| Tipografía | 'Segoe UI', sans-serif |

## Particularidades y limitaciones conocidas

- **Tipos generados compartidos:** el proyecto raíz compila cinco controles, por lo que `generated/ManifestTypes.d.ts` es la unión de todos los manifiestos del proyecto. Cada control usa solo sus propias propiedades; las demás aparecen declaradas pero no se utilizan.
- **Doble compilación del control anidado:** el build del proyecto raíz también descubre `DateTimeRangePicker/DateTimeRangePicker/ControlManifest.Input.xml` y genera su bundle en `out/controls`. Es la misma version y el mismo contenido, así que el paquete de solución incluye un único componente por control.
- **Sin dependencias compartidas entre controles:** no hay carpeta `common/`; cualquier cambio en la lógica de fechas debe replicarse en los controles que la usan.
- **Segundos:** los selectores de hora trabajan en pasos de 15 minutos; `timeFormat` con segundos solo afecta la presentación (`HH:mm:00`).
- **Zona horaria:** las fechas se construyen y formatean en hora local del navegador; no hay conversión UTC.
- **Filtro en memoria:** el combobox filtra del lado cliente sobre los registros cargados (hasta 5000 por página, máximo 10 páginas). Con conjuntos mucho mayores conviene filtrar antes con `Filter()` en Power Fx o usar `searchFields`.
