# Compilación y empaquetado

> Fecha: 2026-09-16  
> Descripcion: Requisitos, comandos y salidas del proceso de compilacion de los controles y de la solucion.

## Requisitos

| Herramienta | Versión verificada | Notas |
| --- | --- | --- |
| Node.js | 24.12.0 | Necesario para `pcf-scripts` y webpack |
| npm | 11.6.2 | Instala dependencias del proyecto raíz y del proyecto anidado |
| .NET SDK | 10.0.400 | Solo para construir el proyecto de solución (`solution.cdsproj`) |
| Power Platform CLI (`pac`) | 2.11.2 | Opcional: empaquetado e importación de soluciones |
| Paquetes NuGet `Microsoft.PowerApps.MSBuild.Pcf` y `Microsoft.PowerApps.MSBuild.Solution` | 1.x | Se restauran automáticamente al compilar la solución |

Las dependencias de JavaScript (`pcf-scripts`, `typescript`, `react`, `react-dom`, `eslint`) están declaradas en `package.json` y se instalan con `npm install`.

## Scripts disponibles (proyecto raíz)

| Comando | Acción |
| --- | --- |
| `npm run build` | Compila los controles (validación ESLint obligatoria + bundle minificado) |
| `npm run rebuild` | Limpia y vuelve a compilar |
| `npm run clean` | Borra la carpeta `out/` |
| `npm run lint` | Ejecuta ESLint sobre las fuentes de los controles |
| `npm run lint:fix` | Aplica correcciones automáticas de ESLint |
| `npm run start` | Inicia el arnés local (`pcf-start`) para probar el control en el navegador |
| `npm run start:watch` | Igual que `start` con recompilación automática |
| `npm run refreshTypes` | Regenera los tipos de los manifiestos |

## Compilar los controles

```powershell
# Desde la raíz del repositorio
npm install
npm run build
```

Salida esperada:

```
[build] Generating build outputs...
[build] Succeeded
```

El build genera:

| Ruta | Contenido |
| --- | --- |
| `out/controls/<Control>/bundle.js` | Bundle minificado del control (React no se incluye: es biblioteca de plataforma) |
| `out/controls/<Control>/ControlManifest.xml` | Manifiesto procesado (con `api-version` y `built-by`) |
| `out/controls/<Control>/<Control>.css` | Estilos del control |
| `out/controls/<Control>/strings/<Control>.1033.resx` | Recursos localizados |
| `<Control>/generated/ManifestTypes.d.ts` | Tipos `IInputs`/`IOutputs` generados desde los manifiestos |

Tamaños actuales de los paquetes compilados (bundle + css + resx):

| Control | Tamaño aproximado |
| --- | --- |
| `DatePicker` | 131 KB |
| `DateRangePicker` | 132 KB |
| `DateTimePicker` | 136 KB |
| `DateTimeRangePicker` | 136 KB |
| `SearchableComboBox` | 140 KB |

### Validación de calidad

`npm run build` ejecuta ESLint antes de generar los recursos: si hay un error de lint, la compilación falla con `[pcf-1065] [Error] ESLint validation error`. Comandos útiles:

```powershell
npm run lint                                        # solo validación
npx eslint DatePicker DateTimePicker SearchableComboBox   # validar carpetas concretas
```

## Compilar el proyecto anidado (`DateTimeRangePicker`)

El control `DateTimeRangePicker` es un proyecto PCF independiente con su propio `package.json` y `node_modules`:

```powershell
Set-Location DateTimeRangePicker
npm install
npm run build
```

Salida: `DateTimeRangePicker/out/controls/DateTimeRangePicker/`.

## Construir el paquete de solución

El proyecto `solution/solution.cdsproj` referencia los dos proyectos PCF:

```xml
<ProjectReference Include="..\ID10005_PCF_DataPicker.pcfproj" />
<ProjectReference Include="..\DateTimeRangePicker\DateTimeRangePicker.pcfproj" />
```

Compílalo después de `npm run build`:

```powershell
Set-Location solution
dotnet build solution.cdsproj -c Release
```

Resultado:

```
Solution: bin\Release\solution.zip generated.
Solution Package Type: Both generated.
Compilación correcta. 0 Advertencia(s) 0 Errores
```

| Archivo | Contenido |
| --- | --- |
| `solution/bin/Release/solution.zip` | Solución no administrada + administrada (`Managed = 2`) |
| `solution/bin/Release/solution_managed.zip` | Solución administrada para producción |

El paquete incluye los cinco componentes (`Controls/id5_ID10005.<Control>/`), el manifiesto de solución (`ID0005_DataPickers`, versión 1.0.1.0, publicador `ID0005`, prefijo `id5`) y los recursos `Other/Solution.xml`, `Other/Customizations.xml` y `Other/Relationships.xml`.

## Recetas para actualizar

### Publicar una versión nueva de un control

1. Sube el atributo `version` en `<Control>/ControlManifest.Input.xml`.
2. `npm run build`.
3. Reconstruye la solución (`dotnet build solution.cdsproj -c Release`).
4. Importa el zip en Dataverse y actualiza el componente en la aplicación de lienzo.

### Subir la versión de la solución

Edita `<Version>` en `solution/src/Other/Solution.xml` (formato `x.y.z.b`) y vuelve a compilar la solución.

## Problemas comunes

| Síntoma | Causa | Solución |
| --- | --- | --- |
| `[pcf-1065] ESLint validation error` | Reglas de calidad incumplidas | Corrige el código o ejecuta `npm run lint:fix`; el build no continúa hasta que pase |
| El bundle del zip no refleja los cambios | Se reutilizó `out/` o el zip no se reconstruyó | `npm run rebuild` y luego `dotnet build solution.cdsproj -c Release` |
| `control_manifest_not_found` | No hay `ControlManifest.Input.xml` en la carpeta | Verifica que cada control esté en su carpeta con el manifiesto |
| La solución no incluye un control nuevo | El control no está dentro de un proyecto referenciado | Colócalo en el proyecto raíz o agrega un `<ProjectReference>` al `cdsproj` |

