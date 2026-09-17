# Formatos de fecha y hora

> Fecha: 2026-09-16  
> Descripcion: Catalogo de formatos aceptados por `DatePicker`, `DateTimePicker`, `DateRangePicker` y `DateTimeRangePicker`.

> Indice de documentacion: [README.md](README.md) · Referencia general: [controles.md](controles.md)

## Formatos de fecha

Configura la propiedad `format` con uno de estos valores exactos:

| Formato | Ejemplo | Uso habitual |
| --- | --- | --- |
| `YYYY-MM-DD` | `2026-09-12` | ISO 8601, Dataverse y Power Platform |
| `YYYY/MM/DD` | `2026/09/12` | ISO visual con barras |
| `YYYY.MM.DD` | `2026.09.12` | Formato técnico con puntos |
| `YYYYMMDD` | `20260912` | SQL Server estilo 112 |
| `DD/MM/YYYY` | `12/09/2026` | Regional latino/europeo, SQL Server estilo 103 |
| `MM/DD/YYYY` | `09/12/2026` | Regional Estados Unidos, SQL Server estilo 101 |
| `DD-MM-YYYY` | `12-09-2026` | Regional con guiones |
| `MM-DD-YYYY` | `09-12-2026` | Regional Estados Unidos con guiones |
| `DD.MM.YYYY` | `12.09.2026` | Regional europeo con puntos |
| `MM.DD.YYYY` | `09.12.2026` | Regional Estados Unidos con puntos |
| `DDMMYYYY` | `12092026` | Formato compacto día-mes-año |
| `MMDDYYYY` | `09122026` | Formato compacto mes-día-año |

El valor predeterminado es `YYYY-MM-DD`. Si se recibe un formato desconocido, el control usa ese valor predeterminado.

## Formatos de hora

`DateTimeRangePicker` usa la propiedad `timeFormat` para mostrar la hora en el resumen:

| Valor | Ejemplo | Descripcion |
| --- | --- | --- |
| `24` | `18:30` | Reloj de 24 horas, sin segundos |
| `12` | `06:30 PM` | Reloj de 12 horas, sin segundos |
| `24:00:00` | `18:30:45` | Reloj de 24 horas con segundos |
| `12:00:00` | `06:30:45 PM` | Reloj de 12 horas con segundos |

Los controles nativos del dispositivo pueden mostrar el calendario y la hora con la configuración regional del sistema. La salida de `DateTimeRangePicker` permanece siempre en formato técnico local `YYYY-MM-DDTHH:mm`, por ejemplo `2026-09-12T18:30`.

## Conversión en Power Fx

Para convertir una salida del selector de fecha:

```powerfx
DateValue(DateRangePicker1.startDate)
```

Para convertir una salida del selector de fecha y hora:

```powerfx
DateTimeValue(DateTimeRangePicker1.startDateTime)
```

Para enviarla a SQL Server, Dataverse o una API, se recomienda conservar `YYYY-MM-DD` para fechas y `YYYY-MM-DDTHH:mm` para fecha y hora, porque evitan ambiguedad entre día y mes.
