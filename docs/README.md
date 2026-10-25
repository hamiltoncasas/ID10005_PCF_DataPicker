# Documentacion - ID10005 PCF DataPicker

> Fecha: 2026-10-25
> Descripcion: Indice general del proyecto y de la documentacion de los ocho controles PCF para Power Apps Canvas.

Este repositorio entrega **ocho controles PCF** para Power Apps Canvas: siete visuales de tipo `control-type="virtual"` y un motor invisible de tipo `standard`. La documentacion tiene **un archivo por control** y este indice con todo lo que es comun a los ocho.

El proyecto PCF de la raiz contiene siete controles. `DateTimeRangePicker` vive en un proyecto anidado independiente; la solucion de Dataverse compila ambos proyectos y empaqueta los ocho. Por eso `npm run build` desde la raiz no compila el selector de rango de fecha y hora.

Excepcion de visibilidad: `TCGPasswordEngine` es un control **invisible** (no dibuja nada). Se agrega a la pantalla solo para ejecutar la generacion o validacion de contrasenas y comunicar el resultado mediante salidas y eventos.


## 1. Controles incluidos

| Control | Version | Que resuelve | Salidas principales | Documento |
| --- | --- | --- | --- | --- |
| `DatePicker` | 1.0.3 | Seleccionar **una sola fecha** en un calendario | `date`, `selectedDate` | [DatePicker.md](DatePicker.md) |
| `DateTimePicker` | 1.0.3 | Seleccionar **una sola fecha y hora** | `dateTime`, `date`, `time`, `selectedDate` | [DateTimePicker.md](DateTimePicker.md) |
| `DateRangePicker` | 1.0.11 | Seleccionar un **rango de fechas** | `startDate`, `endDate`, `selectedDate` | [DateRangePicker.md](DateRangePicker.md) |
| `DateTimeRangePicker` | 1.0.11 | Seleccionar un **rango de fecha y hora** | `startDateTime`, `endDateTime`, `selectedDate` | [DateTimeRangePicker.md](DateTimeRangePicker.md) |
| `SearchableComboBox` | 1.0.1 | Elegir elementos de una tabla o coleccion con **busqueda tipo contiene** | `selectedValue`, `selectedLabel`, `selectedValues`, `selectedLabels`, `selectedCount` | [SearchableComboBox.md](SearchableComboBox.md) |
| `ExcelReportPicker` | 1.4.2 | Desplegar **informes definidos en JSON** sobre la tabla enlazada y descargarlos en Excel | `selectedReport`, `lastReport`, `lastReportName`, `lastFile`, `lastRows`, `lastStatus`, `errorMessage`, `hasError`, `columnsDetected`, `availableColumnsJson`, `isLoading`, `dataStatus` | [ExcelReportPicker.md](ExcelReportPicker.md) |
| `WebPageViewer` | 1.0.1 | Mostrar una **pagina web** dentro de la aplicacion, con aviso cuando el sitio no admite iframes | `currentUrl`, `isLoading`, `hasError`, `errorMessage` | [WebPageViewer.md](WebPageViewer.md) |
| `TCGPasswordEngine` | 1.0.1 | **Generar y validar contrasenas** con PBKDF2-HMAC-SHA256 sin dibujar interfaz; se dispara con un token y notifica por eventos | `GeneratedHash`, `GeneratedSalt`, `GeneratedIterations`, `IsValid`, `Success`, `Message`, `IsProcessing` y senales de evento | [TCGPasswordEngine.md](TCGPasswordEngine.md) |

Datos de identidad de los componentes:

| Dato | Valor |
| --- | --- |
| Espacio de nombres | `ID10005` |
| Identificador de componente | `id5_ID10005.<Constructor>` (por ejemplo `id5_ID10005.DatePicker`) |
| Tipo de control | Siete `virtual` (visuales) y `TCGPasswordEngine` `standard` (invisible, solo lienzo) |
| Biblioteca de plataforma | React 16.14.0 (la carga el host: no se duplica en el bundle) |
| Servicios externos | Ninguno (`external-service-usage enabled="false"`) |

## 2. Identidad de la solucion

| Dato | Valor |
| --- | --- |
| Nombre unico | `ID0005_DataPickers` |
| Version | `1.0.2.9` |
| Publicador / prefijo | `ID0005` / `id5` |
| Tipo de paquete | `Unmanaged` (`<Managed>0</Managed>`) |
| Archivo generado | `solution/bin/Release/solution.zip` |

> El proyecto de solucion esta configurado como **no administrada**: genera un solo `solution.zip`. Si necesitas tambien el paquete administrado, pon `SolutionPackageType` en `Both` (`solution/solution.cdsproj`) y `<Managed>` en `2` (`solution/src/Other/Solution.xml`), y vuelve a compilar.

## 3. Estructura del repositorio

```text
ID10005_PCF_DataPicker/
|- DatePicker/                        Control: una sola fecha
|  |- ControlManifest.Input.xml       Contrato: propiedades, salidas, recursos
|  |- index.ts                        Adaptador del ciclo de vida PCF
|  |- DatePickerView.tsx              Vista React
|  |- DatePicker.css                  Estilos (prefijo dp-)
|  |- strings/DatePicker.1033.resx    Textos del panel de propiedades
|  \- generated/ManifestTypes.d.ts    Tipos generados por el build (no se versionan)
|- DateTimePicker/                    Control: una sola fecha y hora (prefijo dtp-)
|- DateRangePicker/                   Control: rango de fechas (prefijo drp-)
|- SearchableComboBox/                Control: combobox con busqueda contiene (prefijo scb-)
|- ExcelReportPicker/                 Control: informes en JSON y descarga a Excel
|  |- index.ts                        Adaptador PCF
|  |- ExcelReportPickerView.tsx       Vista React del panel
|  |- reportModel.ts                  Logica pura: definicion de informes, tipos, filtros, formatos
|  \- excelWriter.ts                  Construccion del libro de Excel
|- WebPageViewer/                     Control: visor de paginas web embebidas (prefijo wpv-)
|- TCGPasswordEngine/                 Control invisible: PBKDF2-HMAC-SHA256 (prefijo tcgpe-)
|  |- index.ts                        Adaptador PCF (token, eventos y salidas)
|  \- passwordEngine.ts              Logica pura: PBKDF2, Base64, Unicode y constantes
|- DateTimeRangePicker/               Proyecto PCF anidado (rango de fecha y hora, prefijo dtrp-)
|  |- DateTimeRangePicker.pcfproj     Proyecto MSBuild propio
|  |- package.json / tsconfig.json    Entorno de build independiente
|  \- DateTimeRangePicker/            Control (manifest, index.ts, vista, css, resx)
|- ID10005_PCF_DataPicker.pcfproj     Proyecto MSBuild raiz (paquete con 7 controles)
|- package.json                       Scripts de build, lint y arnes local
|- pcfconfig.json                     outDir: ./out/controls
|- eslint.config.mjs                  Reglas de calidad (ESLint 9 + reglas Power Apps)
|- solution/solution.cdsproj          Proyecto de solucion y paquetes zip
|- docs/                              Un documento por control, los ejemplos y este indice
|- docs/ejemplos/                     Ejemplos JSON inventados (sin datos de clientes)
|- tools/verificar-controles.js       Arnes de logica (70 comprobaciones)
|- tools/verificar-nombres-campo.js   Arnes de columnas de ExcelReportPicker (40 comprobaciones)
|- tools/verificar-password-engine.js Arnes criptografico de TCGPasswordEngine (61 comprobaciones)
\- out/                               Salida del build (no se versiona)
```

Cada control visual separa responsabilidades en tres archivos: el **manifiesto** (contrato con Power Apps), el **adaptador** `index.ts` (ciclo de vida `init` / `updateView` / `getOutputs` / `destroy`) y la **vista** React. `TCGPasswordEngine` no tiene vista: su adaptador dispara la operacion y publica salidas. La logica que no depende de React ni del host vive en modulos aparte (`reportModel.ts`, `excelWriter.ts`, `passwordEngine.ts`), lo que permite verificarla con Node sin navegador.

## 4. Compilar los controles

Requisitos:

| Herramienta | Version verificada | Notas |
| --- | --- | --- |
| Node.js | 24.x | Necesario para `pcf-scripts` y webpack |
| npm | 11.x | Instala las dependencias del proyecto raiz y del anidado |
| .NET SDK | 10.x | Solo para construir el proyecto de solucion (`solution.cdsproj`) |
| Power Platform CLI (`pac`) | 2.x | Opcional: empaquetado e importacion de soluciones |

Scripts del proyecto raiz:

| Comando | Accion |
| --- | --- |
| `npm install` | Instala dependencias |
| `npm run build` | Compila los controles (valida ESLint y genera bundles minificados) |
| `npm run rebuild` | Limpia y vuelve a compilar |
| `npm run clean` | Borra la carpeta `out/` |
| `npm run lint` | Ejecuta ESLint sobre las fuentes |
| `npm run lint:fix` | Aplica correcciones automaticas de ESLint |
| `npm run start` | Abre el arnes local (`pcf-start`) para probar el control en el navegador |
| `npm run start:watch` | Igual que `start` con recompilacion automatica |
| `npm run refreshTypes` | Regenera los tipos de los manifiestos |

```powershell
# Desde la raiz del repositorio
npm install
npm run build
```

El build deja en `out/controls/<Control>/` el `bundle.js` minificado (sin React: es biblioteca de plataforma), el `ControlManifest.xml` procesado, el CSS y el `.resx`, y genera `<Control>/generated/ManifestTypes.d.ts` con los tipos `IInputs` / `IOutputs`.

El control `DateTimeRangePicker` vive en un proyecto anidado con su propio `package.json` y se puede compilar por separado:

```powershell
Set-Location DateTimeRangePicker
npm install
npm run build
```

`npm run build` ejecuta ESLint antes de generar los recursos: si hay un error de lint, la compilacion falla con `[pcf-1065] [Error] ESLint validation error`.

## 5. Construir el paquete de solucion

El proyecto `solution/solution.cdsproj` referencia los dos proyectos PCF:

```xml
<ProjectReference Include="..\ID10005_PCF_DataPicker.pcfproj" />
<ProjectReference Include="..\DateTimeRangePicker\DateTimeRangePicker.pcfproj" />
```

Compilalo **despues** de `npm run build` para que el paquete incluya los bundles actuales:

```powershell
Set-Location solution
dotnet build solution.cdsproj -c Release
```

Salida esperada:

```text
Solution: bin\Release\solution.zip generated.
Compilacion correcta. 0 Advertencia(s) 0 Errores
```

| Archivo | Contenido |
| --- | --- |
| `solution/bin/Release/solution.zip` | Solucion **no administrada** con los 7 controles en `Controls/id5_ID10005.<Control>/` |

El empaquetado toma la carpeta `solution/src/` (los componentes compilados, `Other/Solution.xml` y `Other/Customizations.xml`) y arma el `.zip` con `solution.xml`, `customizations.xml`, `Controls/...` y `[Content_Types].xml`.

### 5.1 Version del paquete (`.zip`)

La version que muestra **Soluciones** al importar el `.zip` sale de `<Version>` en `solution/src/Other/Solution.xml` (formato `x.y.z.b`); el empaquetador no la toma de ningun otro sitio. **Version actual del paquete: `1.0.2.9`.**

```xml
<Version>1.0.2.9</Version>
```

Para una entrega nueva: sube ese valor, ejecuta `dotnet build solution.cdsproj -c Release` y comprueba el paquete **antes de importarlo**:

```powershell
Expand-Archive solution\bin\Release\solution.zip -DestinationPath tmp\sol -Force
Select-String -Path tmp\sol\solution.xml -Pattern '<Version>|<Managed>'
```

Salida esperada: `<Version>1.0.2.9</Version>` y `<Managed>0</Managed>` (paquete no administrado).

La version del paquete es independiente de la version de cada control (`<Control>/ControlManifest.Input.xml`): puedes subir una sin la otra, pero en una entrega conviene subir ambas.


Si tu entrega necesita el paquete administrado, cambia `SolutionPackageType` a `Both` en `solution/solution.cdsproj` y `<Managed>` a `2` en `solution/src/Other/Solution.xml`, y vuelve a compilar: se genera ademas `solution_managed.zip`. Alternativa con Power Platform CLI:

```powershell
pac solution pack --zipfile out\solucion.zip --folder solution\src --packagetype Both
```

### 5.2 Recetas

| Necesidad | Pasos |
| --- | --- |
| Publicar una version nueva de un control | Sube `version` en `<Control>/ControlManifest.Input.xml`, ejecuta `npm run build` y reconstruye la solucion |
| Subir la version del paquete (`.zip`) | Edita `<Version>` en `solution/src/Other/Solution.xml` (formato `x.y.z.b`) y ejecuta `dotnet build solution.cdsproj -c Release` |
| Reconstruir desde cero | `npm run rebuild` y luego `dotnet build solution.cdsproj -c Release` |

## 6. Instalar y usar en Power Apps

### 6.1 Habilitar controles de codigo en el entorno

En el **Power Platform admin center** abre el entorno destino, ve a **Configuracion > Producto > Caracteristicas** y activa **Power Apps component framework for canvas apps**. Es una configuracion del entorno (no se reemplaza con una biblioteca de componentes) y es requisito para que los controles aparezcan en el estudio.

### 6.2 Importar la solucion

1. Ve a **make.powerapps.com > Soluciones > Importar solucion** y selecciona `solution/bin/Release/solution.zip`.
2. Comprueba que la solucion contenga los siete controles en **Objetos > Controles personalizados**.
3. Publica todos los cambios personalizados.

### 6.3 Agregar el control a la aplicacion de lienzo

1. Abre la aplicacion y entra en **Insertar > Obtener mas componentes > Codigo**.
2. Busca el control por su nombre (`DatePicker`, `DateTimePicker`, `DateRangePicker`, `DateTimeRangePicker`, `SearchableComboBox`, `ExcelReportPicker`, `WebPageViewer` o `TCGPasswordEngine`) y agregalo.
3. Configura las propiedades de entrada en el panel derecho con el control seleccionado.

Los siete controles visuales son de tipo `virtual`, por lo que funcionan igual en aplicaciones de lienzo y en formularios de Dataverse. `TCGPasswordEngine` es de tipo `standard` e invisible: se agrega solo en aplicaciones de lienzo para ejecutar operaciones y leer sus salidas.

### 6.4 Leer las salidas en Power Fx

| Necesidad | Expresion |
| --- | --- |
| Fecha nativa (zona `Local`) | `DateValue(DatePicker1.date)` |
| Inicio y fin de un rango | `DateValue(DateRangePicker1.startDate)` y `DateValue(DateRangePicker1.endDate)` |
| Fecha y hora nativa (zona `Local`) | `DateTimeValue(DateTimePicker1.dateTime)` |
| Valores de un combobox | `SearchableComboBox1.selectedValues` (separados por `;`) |
| Resultado de una exportacion | `ExcelReportPicker1.lastFile`, `ExcelReportPicker1.lastRows`, `ExcelReportPicker1.lastStatus` |
| Estado del visor de paginas web | `WebPageViewer1.currentUrl`; el aviso de pagina no visible esta en `WebPageViewer1.hasError` y `WebPageViewer1.errorMessage` |
| Resultado del motor de contrasenas | `TCGPasswordEngine1.GeneratedHash`, `TCGPasswordEngine1.GeneratedSalt`, `TCGPasswordEngine1.IsValid`, `TCGPasswordEngine1.Message` |
| Reiniciar un selector | Alterna una variable con `Set(varReset, !varReset)` y enlazala a *Reiniciar selección* |

## 7. Formatos de fecha y hora

Los cuatro selectores de fecha comparten la propiedad *Formato de fecha* (`format`) y los de fecha y hora agregan *Formato de hora* (`timeFormat`).

### 7.1 Formatos de fecha

| Formato | Ejemplo | Uso habitual |
| --- | --- | --- |
| `YYYY-MM-DD` | `2026-09-12` | ISO 8601, Dataverse y Power Platform (predeterminado) |
| `YYYY/MM/DD` | `2026/09/12` | ISO visual con barras |
| `YYYY.MM.DD` | `2026.09.12` | Formato tecnico con puntos |
| `YYYYMMDD` | `20260912` | SQL Server estilo 112 |
| `DD/MM/YYYY` | `12/09/2026` | Regional latino y europeo, SQL Server estilo 103 |
| `MM/DD/YYYY` | `09/12/2026` | Regional de Estados Unidos, SQL Server estilo 101 |
| `DD-MM-YYYY` | `12-09-2026` | Regional con guiones |
| `MM-DD-YYYY` | `09-12-2026` | Regional de Estados Unidos con guiones |
| `DD.MM.YYYY` | `12.09.2026` | Regional europeo con puntos |
| `MM.DD.YYYY` | `09.12.2026` | Regional de Estados Unidos con puntos |
| `DDMMYYYY` | `12092026` | Compacto dia-mes-ano |
| `MMDDYYYY` | `09122026` | Compacto mes-dia-ano |

Un formato desconocido no rompe el control: se usa `YYYY-MM-DD`.

### 7.2 Formatos de hora

| Valor | Ejemplo | Descripcion |
| --- | --- | --- |
| `24` | `18:30` | Reloj de 24 horas sin segundos (predeterminado) |
| `12` | `06:30 PM` | Reloj de 12 horas sin segundos |
| `24:00:00` | `18:30:45` | Reloj de 24 horas con segundos |
| `12:00:00` | `06:30:45 PM` | Reloj de 12 horas con segundos |

`timeFormat` solo cambia la **presentacion**; no agrega precision a la seleccion, que es de 15 minutos. En zona `Local`, las salidas usan `YYYY-MM-DDTHH:mm`. En zona `Utc`, las salidas incluyen el sufijo `Z`, por ejemplo `2026-09-16T08:30Z`.

### 7.3 Conversion en Power Fx

```powerfx
DateValue(DatePicker1.date)
DateValue(DateRangePicker1.startDate)
DateTimeValue(DateTimePicker1.dateTime)
DateTimeValue(DateTimeRangePicker1.endDateTime)
```

## 8. Convenciones comunes de los controles

| Tema | Comportamiento |
| --- | --- |
| `resetKey` (*Reiniciar selección*; en ExcelReportPicker la etiqueta es *Reiniciar seleccion*, Si/No) | Cuando el valor cambia, el control limpia la seleccion. Se usa para reiniciar desde Power Fx |
| `zIndex` (*Prioridad visual del selector*, *Prioridad visual de la lista* o *Prioridad visual del panel*, segun el control) | `z-index` del panel flotante; se limita entre 1 y 2147483647; el predeterminado es `2147483647` |
| `dateTimeZone` (*Zona horaria de los valores*) | `Local` (predeterminado) lee las fechas y horas como estan escritas; `Utc` convierte entradas ISO con desplazamiento (`Z`, `+hh:mm`) y publica valores UTC con `Z`. No es una zona regional como `America/Bogota` |
| `startOfWeek` (*Primer día de la semana*) | Acepta nombres completos de dias en espanol o ingles, o numeros de 0 (domingo) a 6 (sabado); vacio o invalido usa lunes |
| `language` (*Idioma del calendario*) | Un codigo BCP 47 valido (por ejemplo `en-US`) localiza meses y dias; sin valor o con codigo invalido se usan los nombres predeterminados en espanol |
| Paneles superpuestos | Los paneles se dibujan fuera del contenedor (posicion fija), asi que no los recorta el lienzo; el combobox y el exportador siguen ademas el desplazamiento de la pagina |
| Control deshabilitado | Con `DisplayMode` en `View` o `Disabled` no se abre el panel ni se cambia el valor |
| Salidas de texto | Las fechas, horas y valores publicados son texto; se convierten con `DateValue`, `DateTimeValue` o `Value` |
| Accesibilidad | Los campos y botones exponen etiquetas `aria-*` (por ejemplo *Mes anterior*, *Mes siguiente*, *Contraer selector*) y admiten navegacion por teclado |
| Tema visual | Todos comparten el mismo diseno: modo compacto de 32 px, boton azul a la derecha y panel con encabezado, cuerpo y pie |
| Visor de páginas web | El visor resuelve *Dirección de la página* contra la *URL base*, vuelve a cargar con *Recargar página* y avisa con `hasError` y `errorMessage` cuando la pagina no aparece. Un sitio que bloquea iframes solo se puede ver con **Abrir en pestana nueva** |
| React | Se declara como biblioteca de plataforma (`platform-library name="React" version="16.14.0"`), por lo que se carga desde el host |

## 9. Verificacion y pruebas

### 9.1 Comandos de calidad

```powershell
npm run lint          # ESLint sobre las fuentes (0 errores)
npm run build         # compila los 7 controles en out/controls
Get-ChildItem out\controls -Directory | Select-Object Name
```

### 9.2 Arnes de logica (70 comprobaciones)

Ejercita las vistas reales con Node, sin navegador:

```powershell
npx tsc DatePicker/DatePickerView.tsx DateTimePicker/DateTimePickerView.tsx SearchableComboBox/SearchableComboBoxView.tsx --outDir obj/checks --module commonjs --target es2019 --jsx react --esModuleInterop --lib ES2020,DOM --strict --skipLibCheck
node tools/verificar-controles.js
```

Cubre el parseo y el formato de fechas en los 12 formatos, el mes visible, la conservacion de la hora, la publicacion de `YYYY-MM-DDTHH:mm`, la normalizacion de acentos, la busqueda tipo contiene, el resaltado, la seleccion unica y multiple y la navegacion por teclado. Salida esperada:

```text
70 de 70 verificaciones correctas
```

El visor de paginas web no tiene arnes automatizado: depende del navegador y del sitio remoto, por eso se verifica con la tabla manual de [WebPageViewer.md](WebPageViewer.md#9-verificacion).

### 9.3 Arnes criptografico del motor de contrasenas (61 comprobaciones)

```powershell
npx tsc TCGPasswordEngine/passwordEngine.ts --outDir obj/checks-password --module commonjs --target es2019 --lib ES2020,DOM --strict --skipLibCheck
node tools/verificar-password-engine.js
```

El script compara `validatePassword` y `generatePasswordHash` con vectores independientes de `node:crypto.pbkdf2Sync`, y comprueba la version del hash, la politica de iteraciones (`GENERATE` usa 600000 por debajo del minimo; `VALIDATE` exige un entero mayor o igual a 100000), la longitud Unicode (emoji y CJK cuentan como un caracter), el Base64 canonico con y sin relleno, el rechazo de Base64 invalido, la comparacion en tiempo constante, la generacion de un salt distinto por llamada, la derivacion con una longitud de hash distinta de 32 bytes y los mensajes de error que no filtran la contrasena. Salida esperada:

```text
61 de 61 verificaciones correctas
```

### 9.4 Arnes de columnas del exportador (40 comprobaciones)

```powershell
node tools/verificar-nombres-campo.js
```

El script compila `ExcelReportPicker` a `obj/checks-excel` y verifica el reconocimiento de columnas por **nombre visible**, el respaldo por **nombre logico** y alias, la lectura de la celda con la clave correcta, la forma codificada de los nombres con espacios y un informe completo de punta a punta. Salida esperada:

```text
40 de 40 verificaciones correctas
```

Los tres arneses terminan con codigo de salida 1 si alguna comprobacion falla y muestran `FAIL <nombre> -> <valor obtenido> esperado <valor esperado>`. No validan el render (no hay navegador ni jsdom): cubren funciones puras, la lectura de celdas con un registro simulado y los vectores criptograficos.

### 9.5 Rutina antes de publicar

```powershell
# 0. Sube <Version> en solution/src/Other/Solution.xml (version del .zip de esta entrega)
npm run lint
npm run build
npx tsc DatePicker/DatePickerView.tsx DateTimePicker/DateTimePickerView.tsx SearchableComboBox/SearchableComboBoxView.tsx --outDir obj/checks --module commonjs --target es2019 --jsx react --esModuleInterop --lib ES2020,DOM --strict --skipLibCheck
node tools/verificar-controles.js
node tools/verificar-nombres-campo.js
npx tsc TCGPasswordEngine/passwordEngine.ts --outDir obj/checks-password --module commonjs --target es2019 --lib ES2020,DOM --strict --skipLibCheck
node tools/verificar-password-engine.js
Set-Location solution; dotnet build solution.cdsproj -c Release
```

Criterios de aceptacion: lint sin errores, build correcto, `70 de 70`, `40 de 40` y `61 de 61` verificaciones correctas, y paquete de solucion generado con los 7 componentes y la version esperada en `solution/src/Other/Solution.xml` (`1.0.2.9` en esta entrega). Cada documento de control incluye ademas su propia lista de comprobaciones manuales en la aplicacion.

## 10. Problemas comunes

| Sintoma | Que revisar |
| --- | --- |
| El control no aparece en **Obtener mas componentes** | Que la caracteristica de PCF para canvas este activa en el entorno y que la solucion este importada y publicada |
| El panel se ve detras de otro elemento | Sube la propiedad de prioridad visual del control |
| Las salidas no se actualizan en la aplicacion | Que la expresion use el nombre real del control y que no haya un `resetKey` cambiando constantemente |
| `DateValue` o `DateTimeValue` devuelven error | Deja *Formato de fecha* en `YYYY-MM-DD` (las salidas de fecha y hora ya usan `YYYY-MM-DD` y `YYYY-MM-DDTHH:mm`) |
| Se ve una version anterior del control | `npm run rebuild`, reconstruye la solucion, sube la version del manifiesto y reimporta |
| El valor reiniciado vuelve a aparecer | *Reiniciar selección* debe cambiar de valor una sola vez (por ejemplo con una variable que alterna) |
| El combobox o el exportador no traen todos los registros | El control pide paginas adicionales (hasta 5000 registros por pagina y 10 paginas); filtra antes con `Filter`/`ShowColumns` |

## 11. Convenciones de esta documentacion

- Idioma: espanol. Los nombres de propiedades y salidas se escriben **tal como aparecen** en el panel de Power Apps (en cursiva) o con su nombre tecnico del manifiesto (en `codigo`).
- Fechas en formato `YYYY-MM-DD`.
- Las rutas son relativas a la raiz del repositorio.
- Los bloques `powerfx` son ejemplos listos para pegar; los bloques `text` y `xml` describen salidas o fragmentos de configuracion.

## 12. Datos de ejemplo

Todos los ejemplos de esta documentacion usan **datos inventados** (pedidos, movimientos, eventos y selecciones de prueba). No contienen nombres de tablas, campos, entornos ni datos de ningun cliente.

Los ejemplos que se pueden copiar como archivo estan en `docs/ejemplos/`, que es la unica excepcion de `.gitignore` para archivos de datos:

| Archivo | Contenido | Guia |
| --- | --- | --- |
| `docs/ejemplos/ExcelReportPicker-informes.json` | Tres informes de ejemplo: dos en espanol y uno con los alias en ingles | [ExcelReportPicker.md](ExcelReportPicker.md#7-definicion-de-informes-json) |
| `docs/ejemplos/ExcelReportPicker-items.json` | Seis pedidos inventados que ilustran la forma de **Items** | [ExcelReportPicker.md](ExcelReportPicker.md#11-ejemplo-completo-datos-inventados) |
| `docs/ejemplos/README.md` | Que hay en la carpeta y como usarlo | - |

Los extractos reales (`.csv`, `.tsv`, `.xlsx`, `.accdb`) siguen excluidos por `.gitignore`: no se versionan en ningun caso.
