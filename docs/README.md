# Documentación · ID10005 PCF DataPicker

> Fecha: 2026-09-16  
> Descripcion: Indice general de la documentacion de los controles PCF para Power Apps Canvas.

Este repositorio contiene cinco controles personalizados (PCF) listos para Power Apps Canvas y Dataverse. Aqui encuentras toda la documentacion organizada por tema.

## Mapa de la documentación

| Documento | Contenido |
| --- | --- |
| [../README.md](../README.md) | Resumen del proyecto e inicio rápido |
| [controles.md](controles.md) | Referencia completa de propiedades, salidas y comportamiento de los 5 controles |
| [formatos.md](formatos.md) | Catálogo de formatos de fecha y hora aceptados |
| [combobox.md](combobox.md) | Detalle del combobox con búsqueda incremental (contiene) |
| [informes.md](informes.md) | Manual de uso del exportador de informes a Excel (`ExcelReportPicker`) |
| [arquitectura.md](arquitectura.md) | Estructura del repositorio, ciclo de vida PCF, diseño visual y decisiones técnicas |
| [compilacion.md](compilacion.md) | Requisitos, comandos de compilación y empaquetado de la solución |
| [instalacion.md](instalacion.md) | Importación en Dataverse y uso en aplicaciones de lienzo |
| [pruebas.md](pruebas.md) | Verificaciones automáticas realizadas y checklist de pruebas manuales |
| [changelog.md](changelog.md) | Historial de cambios |
| [../tools/verificar-controles.js](../tools/verificar-controles.js) | Arnés que comprueba la lógica de fechas, contiene y selección |

## Controles incluidos

| Control | Versión | Qué resuelve | Salidas |
| --- | --- | --- | --- |
| `DatePicker` | 1.0.1 | Seleccionar **una sola fecha** en un calendario | `date` |
| `DateTimePicker` | 1.0.1 | Seleccionar **una sola fecha y hora** | `dateTime`, `date`, `time` |
| `DateRangePicker` | 1.0.9 | Seleccionar **un rango de fechas** | `startDate`, `endDate` |
| `DateTimeRangePicker` | 1.0.9 | Seleccionar **un rango de fecha y hora** | `startDateTime`, `endDateTime` |
| `SearchableComboBox` | 1.0.1 | Elegir elementos de una tabla con **búsqueda tipo contiene** | `selectedValue`, `selectedLabel`, `selectedValues`, `selectedLabels`, `selectedCount` |

Todos comparten el mismo lenguaje visual: modo compacto cerrado (32 px, borde gris, botón azul a la derecha) y panel expandido en superposición con el mismo juego de colores, tipografía y estados.

## Estado actual

| Dato | Valor |
| --- | --- |
| Fecha de la documentación | 2026-09-16 |
| Rama de trabajo | `fix/remove-unsupported-fluent` |
| Compilación y calidad | `npm run build` y `npm run lint` correctos; arnés 54 de 54 |
| Paquete de solución | `solution/bin/Release/solution.zip` y `solution_managed.zip` con los 5 controles |
| Versión de la solución | `ID0005_DataPickers` 1.0.1.1, publicador `ID0005`, prefijo `id5` |
| Versiones de los controles | `DatePicker` 1.0.1 · `DateTimePicker` 1.0.1 · `SearchableComboBox` 1.0.1 · `DateRangePicker` 1.0.9 · `DateTimeRangePicker` 1.0.9 |

## Inicio rápido

```powershell
# 1. Compilar los controles del proyecto raiz
npm install
npm run build

# 2. Generar el paquete de solucion (incluye los controles compilados)
Set-Location solution
dotnet build solution.cdsproj -c Release
```

Despues importa `solution/bin/Release/solution.zip` en Dataverse y agrega el control desde **Insertar > Obtener más componentes > Código**. El detalle esta en [instalacion.md](instalacion.md).

## Convenciones de esta documentación

- Idioma: español, sin tildes en los encabezados y bloques de codigo para evitar problemas de codificacion.
- Fechas en formato `YYYY-MM-DD`.
- Los nombres de propiedades y salidas se escriben tal como aparecen en el panel de propiedades de Power Apps.
- Las rutas son relativas a la raiz del repositorio.
