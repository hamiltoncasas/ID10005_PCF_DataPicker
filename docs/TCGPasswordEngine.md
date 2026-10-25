# TCGPasswordEngine

> Fecha: 2026-10-25
> Descripcion: Motor criptografico invisible para Power Apps Canvas: genera y valida hashes PBKDF2-SHA256, expone salidas y eventos de finalizacion, y nunca devuelve la contrasena. Indice general en [README.md](README.md).

## 1. Que es

`TCGPasswordEngine` es un control PCF de tipo `standard` que **no dibuja interfaz visible**. Se ejecuta como un motor criptografico dentro de la aplicacion de lienzo: recibe una contrasena temporal, deriva un hash con **PBKDF2-HMAC-SHA256** mediante Web Crypto y publica el resultado o la comparacion en propiedades de salida.

| Dato | Valor |
| --- | --- |
| Identificador de componente | `id5_ID10005.TCGPasswordEngine` |
| Version | 1.0.1 |
| Tipo de control | `standard` (invisible) |
| Algoritmo | PBKDF2 con SHA-256, hash de 32 bytes y salt aleatorio de 16 bytes |
| Version de formato | `PBKDF2-SHA256-V1` |
| Salida principal | `GeneratedHash`, `GeneratedSalt`, `GeneratedIterations`, `GeneratedVersion`, `IsValid` |
| Requiere servicios externos | No: usa `window.crypto` del navegador y, si no hay `subtle`, un respaldo PBKDF2 en JavaScript |

El control sirve para dos operaciones:

- **GENERATE (o sus alias `CREATE`, `UPDATE`, `CREAR_USUARIO`, `CAMBIAR_CLAVE`, `REGISTRO` y `CAMBIO`):** crea un salt nuevo y deriva el hash de la contrasena. Devuelve hash, salt, iteraciones y version para guardarlos en Dataverse, SharePoint, SQL o cualquier almacenamiento que ya uses. Usa el mismo alias para **crear** y para **actualizar** una contrasena: en ambos casos se genera un hash nuevo con un salt nuevo.
- **VALIDATE (o sus alias `LOGIN` e `INICIAR_SESION`):** toma el hash, el salt y las iteraciones almacenados, deriva el hash de la contrasena escrita por el usuario y compara ambos valores en tiempo constante. Devuelve `IsValid`.

La contrasena **no se guarda** en propiedades privadas, no se escribe en las salidas y no se incluye en los mensajes. El control tampoco llama a ningun servicio externo ni requiere una licencia premium.

> Importante: el control es invisible, pero el lienzo le asigna un espacio. Deja el control en **1 x 1 px** y no lo ocultes con `Visible = false`; si el anfitrion deja de actualizarlo, las operaciones no se ejecutan. El propio control aplica `visibility: hidden`, tamano de 1 x 1 px y `aria-hidden` a su contenedor.

## 2. Guia de uso paso a paso

Esta guia reproduce el caso mas comun: **registrar una contrasena y validarla despues**. La aplicacion nunca guarda la contrasena: guarda el hash, el salt, las iteraciones y la version que publica el motor.

### 2.1 Antes de empezar

| Requisito | Como comprobarlo |
| --- | --- |
| PCF para canvas activo y solucion publicada | Power Platform admin center > Entorno > Caracteristicas; Soluciones > `ID0005_DataPickers` |
| Control disponible en el estudio | **Insertar > Obtener mas componentes > Codigo > TCGPasswordEngine** |
| Destino para los cuatro valores generados | Tabla con columnas de texto para hash/salt/version y una columna entera para iteraciones |
| Navegador con `crypto.getRandomValues` | El salt necesita aleatoriedad criptografica. `crypto.subtle` es lo recomendado; si no esta disponible, el control usa un respaldo PBKDF2 en JavaScript |

### 2.2 Pasos

1. **Prepara las variables** en `App.OnStart`. `Operation` empieza vacia para que el motor no trabaje al montar la pantalla:

   ```powerfx
   Set(varPasswordOperation, "");
   Set(varPasswordToken, 0);
   Set(varPasswordHash, "");
   Set(varPasswordSalt, "");
   Set(varPasswordIterations, 0);
   Set(varPasswordVersion, "");
   Set(varPasswordMessage, "");
   ```

2. **Inserta el control invisible** desde **Insertar > Obtener mas componentes > Codigo > TCGPasswordEngine**, renombralo a `TCGPasswordEngine1` (o ajusta las formulas) y dejalo en **1 x 1 px**. No uses `Visible = false`: el anfitrion debe seguir actualizandolo para que las operaciones se ejecuten.
3. **Enlaza las entradas del motor** en el panel de propiedades:

   | Propiedad | Expresion |
   | --- | --- |
   | `Operation` | `varPasswordOperation` |
   | `Password` | `txtPassword.Text` |
   | `StoredHash` | `varPasswordHash` |
   | `StoredSalt` | `varPasswordSalt` |
   | `Iterations` | `varPasswordIterations` (o `600000` al generar) |
   | `HashVersion` | `varPasswordVersion` |
   | `ExecutionToken` | `varPasswordToken` |

4. **Dispara la generacion** desde el boton **Crear cuenta**. El incremento del token es lo que inicia la operacion; cambiar solo `Operation` no basta:

   ```powerfx
   Set(varPasswordOperation, "GENERATE");
   Set(varPasswordToken, varPasswordToken + 1)
   ```

5. **Guarda el resultado en el evento** *Al completar la generacion* (`OnGenerationCompleted`). Las salidas ya estan publicadas cuando se dispara el evento:

   ```powerfx
   Set(varPasswordHash, TCGPasswordEngine1.GeneratedHash);
   Set(varPasswordSalt, TCGPasswordEngine1.GeneratedSalt);
   Set(varPasswordIterations, TCGPasswordEngine1.GeneratedIterations);
   Set(varPasswordVersion, TCGPasswordEngine1.GeneratedVersion);
   Patch(
       Usuarios,
       varUsuarioActual,
       {
           HashPassword: varPasswordHash,
           SaltPassword: varPasswordSalt,
           IteracionesPassword: varPasswordIterations,
           VersionPassword: varPasswordVersion
       }
   );
   Notify("Contrasena registrada.", NotificationType.Success)
   ```

6. **Carga los valores al validar:** antes de incrementar el token, asigna a `varPasswordHash`, `varPasswordSalt`, `varPasswordIterations` y `varPasswordVersion` los valores almacenados del usuario. Enlaza `Operation` a `"VALIDATE"` y en el boton **Iniciar sesion** ejecuta `Set(varPasswordToken, varPasswordToken + 1)`.
7. **Interpreta el resultado en el evento** *Al completar la validacion* (`OnValidationCompleted`). `Success` indica que la operacion termino; `IsValid` indica si la contrasena coincide. El evento tambien se dispara cuando hay un error tecnico o de entrada, con `Success = false`: muestra `Message` y no cuentes ese caso como intento fallido. La guia completa, con alta, login y cambio de contrasena, esta en [ejemplos/TCGPasswordEngine.md](ejemplos/TCGPasswordEngine.md).

### 2.3 Configuracion minima recomendada

| Ajuste | Valor sugerido | Por que |
| --- | --- | --- |
| *Operacion* | `varPasswordOperation` | Permite alternar entre `GENERATE` y `VALIDATE` |
| *Contrasena temporal* | `txtPassword.Text` | Es la unica entrada que contiene la contrasena |
| *Iteraciones* | `600000` al generar | Valor recomendado por el control; en validacion se usan las almacenadas |
| *Version del hash* | `varPasswordVersion` | En validacion debe ser `PBKDF2-SHA256-V1` |
| *Token de ejecucion* | `varPasswordToken` | Unico disparador de cada operacion |
| **Tamano en el lienzo** (no es una propiedad) | 1 x 1 px, sin `Visible = false` | El control necesita seguir activo |

### 2.4 Comprobar que funciona

1. Con `Operation` vacia, el motor no procesa nada al abrir la pantalla.
2. Genera con una contrasena de menos de 10 caracteres: `Success` es falso, `Message` explica el minimo y el evento se dispara con `Success = false` para que puedas apagar el indicador de carga.
3. Genera con una contrasena valida: `GeneratedHash`, `GeneratedSalt`, `GeneratedIterations` y `GeneratedVersion` tienen valor, y el evento guarda el registro.
4. Valida con la contrasena correcta: `Success = true` e `IsValid = true`.
5. Valida con otra contrasena: `Success = true` e `IsValid = false`.
6. Repite la operacion sin cambiar el token: no ocurre nada; incrementalo de nuevo.
7. Revisa la tabla: no debe existir ninguna columna con la contrasena original.

Resultado: la contrasena se transforma en hash y la aplicacion guarda los cuatro valores necesarios para validarla mas adelante. La contrasena original no se guarda. La guia completa, con los contratos de cada operacion y el manejo de errores, esta en [ejemplos/TCGPasswordEngine.md](ejemplos/TCGPasswordEngine.md).

## 3. Como se dispara una operacion

El control **no se ejecuta en cada cambio de propiedad**. Solo lo hace cuando cambia `ExecutionToken` y la operacion es reconocida:

1. Lee `Operation`; se aceptan `GENERATE`, `CREATE`, `UPDATE`, `CREAR_USUARIO`, `CAMBIAR_CLAVE`, `REGISTRO` y `CAMBIO` como generacion, y `VALIDATE`, `LOGIN` e `INICIAR_SESION` como validacion. No distingue mayusculas y recorta espacios exteriores. Cualquier otro valor se ignora.
2. Compara `ExecutionToken` con el ultimo token consumido. Si es igual, no hace nada, aunque hayan cambiado la contrasena u otras entradas.
3. Si el token es distinto, inicia la operacion. Un mismo token nunca ejecuta dos veces la misma operacion.
4. Si mientras se calcula llega otro token, el resultado anterior se descarta y solo se publica el resultado vigente.

Consecuencias practicas:

- Para repetir una operacion con la misma contrasena, **incrementa el token**.
- Cambiar `Operation` de `GENERATE` a `VALIDATE` sin cambiar el token **no** inicia la validacion.
- El token que ya existe cuando el control se monta se considera consumido. Por eso conviene mantener `Operation` vacia hasta que el usuario pida la operacion e incrementar `ExecutionToken` en el boton; asi el control no trabaja al montar la pantalla.
- La operacion se lee en el momento del cambio de token. Las entradas deben estar actualizadas en ese instante.

## 4. Propiedades de entrada

| Propiedad | Nombre en Power Apps | Tipo | Predeterminado | Uso |
| --- | --- | --- | --- | --- |
| `Operation` | *Operacion* | Texto | vacio | `GENERATE`/`CREATE`/`UPDATE` para generar, `VALIDATE` para validar. Tambien acepta `CREAR_USUARIO`, `CAMBIAR_CLAVE`, `REGISTRO`, `CAMBIO`, `LOGIN` e `INICIAR_SESION`. Se recorta y se ignora cualquier otro valor |
| `Password` | *Contrasena temporal* | Texto | vacio | Contrasena que se procesa. No se almacena ni se devuelve |
| `StoredHash` | *Hash almacenado* | Texto | vacio | Hash Base64 guardado. Obligatorio en `VALIDATE` |
| `StoredSalt` | *Salt almacenado* | Texto | vacio | Salt Base64 guardado. Obligatorio en `VALIDATE` |
| `Iterations` | *Iteraciones* | Numero entero | 0 | En `GENERATE`, si es menor que 100000 se usa 600000. En `VALIDATE` debe ser 100000 o mayor |
| `HashVersion` | *Version del hash* | Texto | vacio | En `VALIDATE` debe ser exactamente `PBKDF2-SHA256-V1`. En `GENERATE` se ignora |
| `ExecutionToken` | *Token de ejecucion* | Numero entero | 0 | Cada cambio inicia una operacion nueva |

Reglas de la contrasena:

- `GENERATE` exige al menos **10 caracteres Unicode**. Un emoji o un caracter fuera del plano basico cuenta como uno.
- `VALIDATE` solo exige que no este vacia: una contrasena antigua mas corta debe poder compararse con su hash.
- El control **no recorta** la contrasena. Los espacios al inicio o al final forman parte de ella; si tu interfaz debe eliminarlos, usa `Trim()` en Power Fx antes de enlazarla.
- La contrasena se codifica en UTF-8, por lo que acentos, caracteres CJK y emojis producen el mismo hash en cualquier navegador compatible.

## 5. Propiedades de salida

| Propiedad | Nombre en Power Apps | Tipo | Significado |
| --- | --- | --- | --- |
| `Success` | *Operacion correcta* | Si/No | Verdadero cuando la operacion termino sin errores tecnicos ni de validacion de entradas. En `VALIDATE` es verdadero aunque la contrasena no coincida |
| `IsProcessing` | *En proceso* | Si/No | Verdadero mientras se calcula el hash; falso al terminar |
| `IsValid` | *Contrasena valida* | Si/No | Resultado de `VALIDATE`. En `GENERATE`, `CREATE` y `UPDATE` siempre es falso |
| `GeneratedHash` | *Hash generado* | Texto | Hash PBKDF2-SHA256 en Base64 producido por `GENERATE`, `CREATE` o `UPDATE` |
| `GeneratedSalt` | *Salt generado* | Texto | Salt aleatorio de 16 bytes en Base64 producido por `GENERATE`, `CREATE` o `UPDATE` |
| `GeneratedIterations` | *Iteraciones generadas* | Numero entero | Iteraciones realmente usadas por `GENERATE`, `CREATE` o `UPDATE` (incluido el valor predeterminado) |
| `GeneratedVersion` | *Version generada* | Texto | Version del formato producida por `GENERATE`, `CREATE` o `UPDATE`: `PBKDF2-SHA256-V1` |
| `Message` | *Mensaje* | Texto | Estado o error controlado. Nunca contiene la contrasena, el hash ni el salt |

`Success` e `IsValid` son cosas distintas:

- `Success = true` e `IsValid = true`: la validacion termino y la contrasena coincide.
- `Success = true` e `IsValid = false`: la validacion termino y la contrasena **no** coincide.
- `Success = false`: hubo un error de entrada o un fallo tecnico. **No** interpretes `IsValid = false` como una contrasena incorrecta; muestra `Message`.
- `Success` vuelve a `false` al comenzar cualquier operacion, por lo que no lo uses como resultado historico. Guarda el resultado en una variable desde el evento.

Las salidas generadas se limpian al comenzar cada `GENERATE` y tambien si ese `GENERATE` falla. `VALIDATE` no las modifica: despues de validar puedes seguir leyendo el ultimo hash generado.

## 6. Eventos

| Evento | Nombre en Power Apps | Cuando se dispara |
| --- | --- | --- |
| `OnGenerationCompleted` | *Al completar la generacion* | Una vez por cada `GENERATE`, `CREATE` o `UPDATE` aceptado, despues de publicar las salidas. `Success` indica si termino bien |
| `OnValidationCompleted` | *Al completar la validacion* | Una vez por cada `VALIDATE` aceptado, despues de publicar las salidas. `Success` distingue una validacion real de un error de entrada o tecnico |

Los eventos no reciben argumentos. El manejador lee las salidas del control por su nombre, por ejemplo `TCGPasswordEngine1.GeneratedHash`, y el control publica las salidas antes de disparar el evento.

El evento se dispara tanto si la operacion termina bien como si falla. Comprueba siempre `Success` primero:

```powerfx
// OnGenerationCompleted
If(
    !TCGPasswordEngine1.Success,
    // Error de entrada o tecnico: apaga el indicador y muestra el motivo.
    Set(varCreandoUsuario, false);
    Notify(TCGPasswordEngine1.Message, NotificationType.Warning),

    // Exito: aqui puedes leer GeneratedHash, GeneratedSalt, etc.
    Set(varHashUsuario, TCGPasswordEngine1.GeneratedHash)
)
```

```powerfx
// OnValidationCompleted
If(
    !TCGPasswordEngine1.Success,
    // Error tecnico o de entrada: NO es una contrasena incorrecta.
    Set(varErrorLogin, TCGPasswordEngine1.Message);
    Set(varValidandoLogin, false),

    !TCGPasswordEngine1.IsValid,
    // La validacion termino y la contrasena no coincide.
    Notify("Usuario o contrasena incorrectos.", NotificationType.Error),

    // La validacion termino y la contrasena coincide.
    Notify("Credenciales validas.", NotificationType.Success)
)
```

## 7. Contrato de GENERATE

Requisitos:

- `Operation = "GENERATE"`.
- `Password` con 10 caracteres Unicode o mas.
- `ExecutionToken` distinto del ultimo consumido.

Comportamiento:

1. Borra los resultados generados anteriores y publica `IsProcessing = true`, `Success = false`, `IsValid = false` y `Message = "Generando hash..."`.
2. Genera 16 bytes aleatorios con `crypto.getRandomValues`.
3. Deriva 32 bytes con PBKDF2-HMAC-SHA256.
4. Si `Iterations` es un numero finito mayor o igual que 100000, usa ese valor; en cualquier otro caso usa **600000**. Los decimales se redondean hacia abajo.
5. Publica `Success = true`, `IsProcessing = false`, las cuatro salidas generadas y `Message = "Hash generado correctamente."`.
6. Dispara `OnGenerationCompleted`.

Ejemplo de valores de iteraciones:

| `Iterations` recibido | Iteraciones usadas | `GeneratedIterations` |
| --- | --- | --- |
| vacio / 0 | 600000 | 600000 |
| 50000 | 600000 | 600000 |
| 100000 | 100000 | 100000 |
| 250000.9 | 250000 | 250000 |

## 8. Contrato de VALIDATE

Requisitos:

- `Operation = "VALIDATE"`.
- `Password` no vacia.
- `StoredHash` y `StoredSalt` no vacios y en Base64 valido.
- `Iterations` entero mayor o igual que 100000.
- `HashVersion` exactamente `PBKDF2-SHA256-V1`.
- `ExecutionToken` distinto del ultimo consumido.

Comportamiento:

1. Publica `IsProcessing = true`, `Success = false`, `IsValid = false` y `Message = "Validando contrasena..."`.
2. Decodifica el salt y el hash almacenados. Acepta Base64 con o sin relleno final; rechaza caracteres fuera del alfabeto Base64, longitudes imposibles y relleno incorrecto.
3. Deriva un hash de la misma longitud que el hash almacenado con el salt y las iteraciones indicados.
4. Compara los bytes con XOR acumulado, sin detenerse en la primera diferencia.
5. Publica `Success = true`, `IsProcessing = false`, `IsValid` con el resultado y un mensaje: `"Contrasena valida."` o `"Usuario o contrasena incorrectos."`.
6. Dispara `OnValidationCompleted`.

`VALIDATE` no exige una longitud minima de contrasena. La comparacion se hace con la contrasena exacta, sin recortar.

## 9. Mensajes y errores

| Situacion | `Success` | `IsValid` | `Message` |
| --- | --- | --- | --- |
| Generacion correcta | true | false | `Hash generado correctamente.` |
| Contrasena vacia | false | false | `La contrasena no puede estar vacia.` |
| Menos de 10 caracteres en `GENERATE` | false | false | `La contrasena debe tener al menos 10 caracteres.` |
| Falta hash o salt en `VALIDATE` | false | false | `El hash y el salt almacenados son obligatorios.` |
| Iteraciones invalidas en `VALIDATE` | false | false | `El numero de iteraciones debe ser 100000 o mayor.` |
| Version distinta de `PBKDF2-SHA256-V1` | false | false | `La version del hash no es compatible.` |
| Base64 invalido | false | false | `Los datos almacenados no tienen un formato Base64 valido.` |
| Base64 vacio o datos incompletos | false | false | `Los datos almacenados estan incompletos.` |
| Web Crypto no disponible | false | false | `El motor criptografico no esta disponible en este entorno.` |
| Fallo inesperado al generar | false | false | `No se pudo generar el hash.` |
| Fallo inesperado al validar | false | false | `No se pudo validar la contrasena.` |
| Contrasena incorrecta | true | false | `Usuario o contrasena incorrectos.` |

Los mensajes son textos controlados y estables para que puedas compararlos o mostrarlos. No incluyen datos de la contrasena ni valores criptograficos.

Cada fila de la tabla termina con el evento correspondiente (`OnGenerationCompleted` o `OnValidationCompleted`) y `IsProcessing = false`. En los errores, `Success = false`; no interpretes una validacion fallida como contrasena incorrecta salvo que `Success` sea verdadero e `IsValid` sea falso.

## 10. Ejemplos en Power Fx

### 10.1 Generar y guardar

```powerfx
// App.OnStart
Set(varPasswordOperation, "");
Set(varPasswordToken, 0);
Set(varPasswordHash, "");
Set(varPasswordSalt, "");
Set(varPasswordIterations, 0);
Set(varPasswordVersion, "");

// Boton "Crear cuenta"
Set(varPasswordOperation, "GENERATE");
Set(varPasswordToken, varPasswordToken + 1)

// Evento OnGenerationCompleted del control
Set(varPasswordHash, TCGPasswordEngine1.GeneratedHash);
Set(varPasswordSalt, TCGPasswordEngine1.GeneratedSalt);
Set(varPasswordIterations, TCGPasswordEngine1.GeneratedIterations);
Set(varPasswordVersion, TCGPasswordEngine1.GeneratedVersion);
Patch(
    Usuarios,
    varUsuarioActual,
    {
        HashPassword: varPasswordHash,
        SaltPassword: varPasswordSalt,
        IteracionesPassword: varPasswordIterations,
        VersionPassword: varPasswordVersion
    }
)
```

### 10.2 Validar una contrasena

```powerfx
// Propiedades del control
// Operation ............... "VALIDATE"
// Password ................ txtPassword.Text
// StoredHash .............. varPasswordHash
// StoredSalt .............. varPasswordSalt
// Iterations .............. varPasswordIterations
// HashVersion ............. varPasswordVersion
// ExecutionToken .......... varPasswordToken

// Boton "Iniciar sesion"
Set(varPasswordToken, varPasswordToken + 1)

// Evento OnValidationCompleted del control
If(
    TCGPasswordEngine1.Success && TCGPasswordEngine1.IsValid,
    Set(varAutenticado, true),
    Set(varAutenticado, false)
);
If(
    !TCGPasswordEngine1.Success,
    Notify(TCGPasswordEngine1.Message, NotificationType.Warning)
)
```

`Operation` puede quedar fijo en `"VALIDATE"` si el control solo valida. El token sigue siendo el disparador; las propiedades almacenadas deben estar cargadas antes de incrementarlo.

### 10.3 Cambiar entre generar y validar

```powerfx
// Generar
Set(varPasswordOperation, "GENERATE");
Set(varPasswordToken, varPasswordToken + 1)

// Validar despues de generar (las salidas ya estan en variables)
Set(varPasswordStoredHash, TCGPasswordEngine1.GeneratedHash);
Set(varPasswordStoredSalt, TCGPasswordEngine1.GeneratedSalt);
Set(varPasswordStoredIterations, TCGPasswordEngine1.GeneratedIterations);
Set(varPasswordStoredVersion, TCGPasswordEngine1.GeneratedVersion);
Set(varPasswordOperation, "VALIDATE");
Set(varPasswordToken, varPasswordToken + 1)
```

No reutilices el token: cambiar solo `Operation` no inicia la nueva operacion.

### 10.4 Mostrar el estado

```powerfx
// Etiqueta de estado
TCGPasswordEngine1.Message

// Deshabilitar el boton mientras el motor trabaja
If(TCGPasswordEngine1.IsProcessing, DisplayMode.Disabled, DisplayMode.Edit)
```

### 10.5 Un solo control para crear y actualizar

El mismo control sirve para el alta y para el cambio de contrasena. En ambos casos la operacion es de generacion: se crea un salt nuevo y se derivan los cuatro valores. La diferencia esta en la accion que guarda el resultado.

```powerfx
// Boton Guardar de alta
Set(varPasswordInputUsuario, txtNuevaClave.Text);
Set(varAccionHashUsuario, "CREAR_USUARIO");
Set(varPasswordOperationUsuario, "CREAR_USUARIO"); // alias de GENERATE
Set(varTokenPasswordUsuario, varTokenPasswordUsuario + 1)
```

```powerfx
// Boton Guardar de actualizacion
Set(varPasswordInputUsuario, txtNuevaClave.Text);
Set(varAccionHashUsuario, "CAMBIAR_CLAVE");
Set(varPasswordOperationUsuario, "CAMBIAR_CLAVE"); // alias de GENERATE
Set(varTokenPasswordUsuario, varTokenPasswordUsuario + 1)
```

Propiedades del control:

| Propiedad | Expresion |
| --- | --- |
| `Operation` | `varPasswordOperationUsuario` |
| `Password` | `varPasswordInputUsuario` |
| `ExecutionToken` | `varTokenPasswordUsuario` |
| `Iterations` | `varIteracionesUsuario` |
| `HashVersion` | `varVersionHashUsuario` |

En el evento `OnGenerationCompleted`, comprueba primero `Success` y despues usa `varAccionHashUsuario` para decidir si haces `Patch` sobre `Defaults(Usuarios)` (alta) o sobre `LookUp(Usuarios, ID = varIdUsuarioCambioClave)` (actualizacion). Limpia las variables sensibles al final:

```powerfx
If(
    !TCGPasswordEngine1.Success,
    Set(varErrorNuevoUsuario, Coalesce(TCGPasswordEngine1.Message, "No fue posible generar la contrasena."));
    Set(varCreandoUsuario, false);
    Set(varProcesandoCambioClave, false),

    Switch(
        varAccionHashUsuario,
        "CREAR_USUARIO",
        Patch(
            Usuarios,
            Defaults(Usuarios),
            {
                HashClave: TCGPasswordEngine1.GeneratedHash,
                SaltClave: TCGPasswordEngine1.GeneratedSalt,
                IteracionesHash: TCGPasswordEngine1.GeneratedIterations,
                VersionHash: TCGPasswordEngine1.GeneratedVersion
            }
        ),
        "CAMBIAR_CLAVE",
        Patch(
            Usuarios,
            LookUp(Usuarios, ID = varIdUsuarioCambioClave),
            {
                HashClave: TCGPasswordEngine1.GeneratedHash,
                SaltClave: TCGPasswordEngine1.GeneratedSalt,
                IteracionesHash: TCGPasswordEngine1.GeneratedIterations,
                VersionHash: TCGPasswordEngine1.GeneratedVersion
            }
        )
    )
);

Set(varPasswordInputUsuario, "");
Set(varPasswordOperationUsuario, "");
Set(varAccionHashUsuario, "");
Set(varCreandoUsuario, false);
Set(varProcesandoCambioClave, false)
```

No enlaces `StoredHash` ni `StoredSalt` para generar: esas entradas solo se usan en `VALIDATE`. En la actualizacion tampoco reutilices el salt anterior; el control genera uno nuevo.


## 11. Seguridad

- **Nunca guardes la contrasena.** Guarda `GeneratedHash`, `GeneratedSalt`, `GeneratedIterations` y `GeneratedVersion`. La contrasena solo debe existir en el control de texto y en la memoria del navegador durante la operacion.
- **Un salt por contrasena.** `GENERATE` crea un salt aleatorio nuevo cada vez. No reutilices el salt de otro usuario ni generes el hash dos veces con el mismo salt para la misma contrasena.
- **Guarda las iteraciones y la version con el hash.** Sin esos dos valores no se puede reproducir el hash. `VALIDATE` no adivina los parametros.
- **Compara en tiempo constante.** El control usa XOR acumulado y recorre siempre la misma longitud. Aun asi, la validacion definitiva debe vivir en el servidor cuando la seguridad sea critica.
- **La validacion en Canvas se ejecuta en el cliente.** Un usuario con acceso al navegador puede inspeccionar el bundle, modificar variables o saltarse la pantalla. Este control es util para flujos de baja criticidad, demostraciones o para preparar el hash antes de enviarlo; **no sustituye** la autenticacion ni la autorizacion del servidor.
- **PBKDF2 no es memory-hard.** Es ampliamente compatible y suficiente para muchos escenarios, pero Argon2id o scrypt son preferibles cuando el servidor los soporta.
- **HTTPS y Web Crypto.** `crypto.subtle` solo esta disponible en contextos seguros (HTTPS o localhost). Si el WebView no lo expone, el control aplica un respaldo PBKDF2 en JavaScript con el mismo formato; si tampoco existe `crypto.getRandomValues`, devuelve el mensaje de motor no disponible.
- **No hay secretos en el control.** El algoritmo y el bundle son publicos: la seguridad depende de la contrasena, el salt y las iteraciones, no de ocultar el codigo.
- **No registres valores sensibles.** Evita `Trace`, `Notify` o etiquetas con la contrasena, el hash o el salt. `Message` ya esta disenado para mostrarse.

## 12. Problemas comunes

| Sintoma | Causa probable | Solucion |
| --- | --- | --- |
| No ocurre nada al pulsar el boton | El token no cambio o `Operation` esta vacia o tiene un valor no reconocido | Revisa la formula del boton y usa `GENERATE`, `CREATE`, `UPDATE` o `VALIDATE` |
| El evento no se dispara | El token no cambio, `Operation` no es valida o el resultado se descarto por un token mas reciente | Revisa `Success`, `IsProcessing` y `Message`; corrige la entrada e incrementa el token |
| El formulario queda en “Generando hash...” | El manejador del evento no revisa `Success` o no se ejecuto | En `OnGenerationCompleted`, comprueba `Success` antes de leer las salidas y apaga el indicador tambien en la rama de error |
| `GeneratedHash` queda vacio | La ultima operacion fue `VALIDATE` o el `GENERATE` fallo | Ejecuta `GENERATE` de nuevo y comprueba `Success` |
| `IsValid` es falso aunque la contrasena sea correcta | El hash, salt, iteraciones o version no son los que se usaron al generar; la contrasena tiene espacios distintos | Usa los cuatro valores generados juntos y no recortes la contrasena si se genero con espacios |
| Mensaje de iteraciones invalidas | `Iterations` esta vacio, es decimal o es menor que 100000 en `VALIDATE` | Usa `GeneratedIterations` o un entero mayor o igual que 100000 |
| Mensaje de version no compatible | `HashVersion` no es exactamente `PBKDF2-SHA256-V1` | Usa `GeneratedVersion` o el literal exacto |
| Mensaje de Base64 invalido | El hash o el salt se truncaron, tienen saltos de linea o usan Base64 URL-safe | Guarda y pega el valor Base64 completo, sin modificarlo |
| El control no ejecuta operaciones al montar | `Operation` empieza vacia | Es el comportamiento recomendado: asigna la operacion y luego incrementa el token |
| El control ocupa espacio en la pantalla | Todo control del lienzo tiene un rectangulo | Dejalo en 1 x 1 px; no lo pongas en `Visible = false` |

## 13. Verificacion

La logica criptografica y el contrato del componente se comprueban sin navegador:

```powershell
# Compilar la logica pura a obj/checks-password
npx tsc TCGPasswordEngine/passwordEngine.ts --outDir obj/checks-password --module commonjs --target es2019 --lib ES2020,DOM --strict --skipLibCheck

# Vectores independientes de Node, Base64, Unicode, iteraciones y errores
node tools/verificar-password-engine.js
```

La prueba compara el hash del control con `crypto.pbkdf2Sync` de Node para la misma contrasena, salt e iteraciones, y cubre:

- Contrasenas Unicode (acentos, CJK y emojis) y longitud por caracteres.
- Base64 con y sin relleno, rechazo de caracteres y relleno invalidos.
- Comparacion en tiempo constante con longitudes iguales y distintas.
- Iteraciones predeterminadas, minimo, decimales y validacion estricta.
- Generacion con salt aleatorio, validacion del hash generado y hashes de una longitud distinta de 32 bytes.
- Fallos controlados cuando Web Crypto no esta disponible y ausencia de la contrasena en los mensajes.

Salida esperada:

```text
65 de 65 verificaciones correctas
```

Durante el desarrollo, el ciclo de vida del control (tokens, eventos, errores y descarte de resultados obsoletos) se probo con un contexto de PCF simulado en `obj/checks-component`, fuera del codigo versionado; ese arnes no forma parte de la entrega. La rutina completa de compilacion esta en [README.md](README.md#9-verificacion-y-pruebas).


## 14. Limites conocidos

- No hay interfaz ni campos visuales: la aplicacion debe aportar el control de texto, el boton y las etiquetas de estado.
- Los eventos no llevan parametros; el manejador debe leer las propiedades de salida del control.
- Los errores no tienen un evento propio; llegan por el evento de finalizacion con `Success = false` y el motivo en `Message`.
- El control no cifra, no compara contra una base de datos y no aplica politicas de complejidad. Solo deriva y compara hashes.
- El algoritmo y los parametros son fijos (`PBKDF2-SHA256-V1`, hash de 32 bytes, salt de 16 bytes). Cambiar el formato exige una version nueva y conservar la anterior para validar hashes existentes.
