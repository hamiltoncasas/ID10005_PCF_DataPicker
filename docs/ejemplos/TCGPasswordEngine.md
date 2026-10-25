# Ejemplo - TCGPasswordEngine

> Fecha: 2026-10-25
> Descripcion: Caso completo de alta, inicio de sesion y cambio de contrasena con TCGPasswordEngine. Referencia del control en [../TCGPasswordEngine.md](../TCGPasswordEngine.md).

## 1. Que construye

Un flujo de **credenciales** con tres operaciones:

1. **Alta:** la contrasena escrita se convierte en hash y se guardan hash, salt, iteraciones y version.
2. **Inicio de sesion:** se cargan los valores almacenados y se valida la contrasena sin guardarla.
3. **Cambio:** se genera un hash nuevo con un salt nuevo y se reemplazan los cuatro valores.

La contrasena original **nunca** se guarda en la coleccion ni en una variable. El motor solo publica resultados criptograficos.

> Limite importante: este control ejecuta PBKDF2 en el cliente. Sirve para no almacenar contrasenas en claro, pero **no sustituye** la autenticacion del servidor ni una politica de identidad. En produccion, valida en un servicio de confianza y protege las columnas de hash con permisos estrictos.

## 2. Datos de prueba

```powerfx
// App.OnStart
ClearCollect(
    colUsuarios,
    {
        ID: 1,
        Usuario: "ana",
        Nombre: "Ana Torres",
        HashPassword: "",
        SaltPassword: "",
        IteracionesPassword: 0,
        VersionPassword: ""
    }
);
Set(varSiguienteUsuario, 2);
Set(varPasswordOperation, "");
Set(varPasswordToken, 0);
Set(varPasswordHash, "");
Set(varPasswordSalt, "");
Set(varPasswordIterations, 0);
Set(varPasswordVersion, "");
Set(varAutenticado, false);
Set(varUsuarioActual, Blank());
Set(varModoPassword, "")
```

En una tabla real usa columnas de texto de longitud suficiente para Base64 y una columna entera para las iteraciones. No agregues una columna de contrasena.

## 3. Pantalla de alta

### 3.1 Elementos

| Elemento | Nombre | Tipo |
| --- | --- | --- |
| Usuario | `txtNuevoUsuario` | Entrada de texto |
| Nombre | `txtNuevoNombre` | Entrada de texto |
| Contrasena | `txtNuevaPassword` | Entrada de texto con `Mode = TextMode.Password` |
| Crear cuenta | `btnCrearCuenta` | Boton |
| Estado | `lblEstadoPassword` | Etiqueta |

### 3.2 Control invisible

Inserta `TCGPasswordEngine`, renombralo `TCGPasswordEngine1` y dejalo en 1 x 1 px. Configura:

| Propiedad | Expresion |
| --- | --- |
| `Operation` | `varPasswordOperation` |
| `Password` | `txtNuevaPassword.Text` |
| `StoredHash` | `varPasswordHash` |
| `StoredSalt` | `varPasswordSalt` |
| `Iterations` | `varPasswordIterations` |
| `HashVersion` | `varPasswordVersion` |
| `ExecutionToken` | `varPasswordToken` |

En el alta, `varPasswordIterations` empieza en `0`; el motor usa `600000` cuando el valor es menor que `100000`.

### 3.3 Boton Crear cuenta

```powerfx
If(
    IsBlank(Trim(txtNuevoUsuario.Text)) || IsBlank(Trim(txtNuevoNombre.Text)),
    Notify("Completa el usuario y el nombre.", NotificationType.Warning),
    Len(txtNuevaPassword.Text) < 10,
    Notify("La contrasena debe tener al menos 10 caracteres.", NotificationType.Warning),
    !IsBlank(LookUp(colUsuarios, Usuario = Trim(txtNuevoUsuario.Text))),
    Notify("Ese usuario ya existe.", NotificationType.Warning),
    Set(varModoPassword, "REGISTRO");
    Set(varPasswordOperation, "CREAR_USUARIO");
    Set(varPasswordToken, varPasswordToken + 1)
)
```

La ultima rama del `If` ejecuta tres acciones separadas por `;`. El incremento del token es el disparador real. `CREAR_USUARIO` es un alias de `GENERATE`; tambien puedes usar `CREATE`.

### 3.4 Evento Al completar la generacion

```powerfx
If(
    !TCGPasswordEngine1.Success,
    // Error de entrada o tecnico: no guardes nada.
    Notify(TCGPasswordEngine1.Message, NotificationType.Warning),

    // Exito: guarda solo los valores generados.
    Set(varPasswordHash, TCGPasswordEngine1.GeneratedHash);
    Set(varPasswordSalt, TCGPasswordEngine1.GeneratedSalt);
    Set(varPasswordIterations, TCGPasswordEngine1.GeneratedIterations);
    Set(varPasswordVersion, TCGPasswordEngine1.GeneratedVersion);

    Collect(
        colUsuarios,
        {
            ID: varSiguienteUsuario,
            Usuario: Trim(txtNuevoUsuario.Text),
            Nombre: Trim(txtNuevoNombre.Text),
            HashPassword: varPasswordHash,
            SaltPassword: varPasswordSalt,
            IteracionesPassword: varPasswordIterations,
            VersionPassword: varPasswordVersion
        }
    );
    Set(varSiguienteUsuario, varSiguienteUsuario + 1);
    Set(varPasswordOperation, "");
    Reset(txtNuevaPassword);
    Notify("Cuenta creada. Ya puedes iniciar sesion.", NotificationType.Success)
)
```

`GeneratedIterations` es el valor realmente usado, no el `0` de entrada. Guardalo tal cual: en la validacion debes pasar el mismo numero.

### 3.5 Estado de la operacion

```powerfx
If(
    TCGPasswordEngine1.IsProcessing,
    "Generando hash...",
    TCGPasswordEngine1.Success,
    "Hash generado correctamente.",
    TCGPasswordEngine1.Message
)
```

## 4. Pantalla de inicio de sesion

### 4.1 Elementos

| Elemento | Nombre | Tipo |
| --- | --- | --- |
| Usuario | `txtUsuarioLogin` | Entrada de texto |
| Contrasena | `txtPasswordLogin` | Entrada de texto con `Mode = TextMode.Password` |
| Iniciar sesion | `btnIniciarSesion` | Boton |
| Estado | `lblLogin` | Etiqueta |

Usa un **segundo** control `TCGPasswordEngine` en esta pantalla, o reutiliza el mismo cambiando `Password` a `txtPasswordLogin.Text`. Si reutilizas el mismo, asegurate de que solo hay una pantalla activa a la vez.

| Propiedad | Expresion |
| --- | --- |
| `Operation` | `varPasswordOperation` |
| `Password` | `txtPasswordLogin.Text` |
| `StoredHash` | `varPasswordHash` |
| `StoredSalt` | `varPasswordSalt` |
| `Iterations` | `varPasswordIterations` |
| `HashVersion` | `varPasswordVersion` |
| `ExecutionToken` | `varPasswordToken` |

### 4.2 Boton Iniciar sesion

```powerfx
Set(
    varUsuarioLogin,
    LookUp(colUsuarios, Usuario = Trim(Lower(txtUsuarioLogin.Text)))
);
If(
    IsBlank(varUsuarioLogin),
    Notify("Usuario o contrasena incorrectos.", NotificationType.Error),
    Set(varPasswordHash, varUsuarioLogin.HashPassword);
    Set(varPasswordSalt, varUsuarioLogin.SaltPassword);
    Set(varPasswordIterations, varUsuarioLogin.IteracionesPassword);
    Set(varPasswordVersion, varUsuarioLogin.VersionPassword);
    Set(varPasswordOperation, "VALIDATE");
    Set(varPasswordToken, varPasswordToken + 1)
)
```

La busqueda por usuario no debe revelar si el usuario existe. El mensaje de error es el mismo para usuario inexistente y contrasena incorrecta.

### 4.3 Evento Al completar la validacion

```powerfx
If(
    TCGPasswordEngine1.Success && TCGPasswordEngine1.IsValid,
    Set(varAutenticado, true);
    Set(varUsuarioActual, varUsuarioLogin);
    Set(varPasswordOperation, "");
    Reset(txtPasswordLogin);
    Notify("Bienvenido, " & varUsuarioLogin.Nombre & ".", NotificationType.Success),
    TCGPasswordEngine1.Success,
    Set(varAutenticado, false);
    Notify("Usuario o contrasena incorrectos.", NotificationType.Error),
    Notify(TCGPasswordEngine1.Message, NotificationType.Warning)
)
```

`Success` verdadero con `IsValid` falso es una contrasena incorrecta. `Success` falso es un error tecnico o de entrada: no lo trates como credencial invalida.

### 4.4 Deshabilitar el boton mientras se procesa

```powerfx
// DisplayMode de btnIniciarSesion
If(TCGPasswordEngine1.IsProcessing, DisplayMode.Disabled, DisplayMode.Edit)
```

### 4.5 Cerrar sesion

```powerfx
Set(varAutenticado, false);
Set(varUsuarioActual, Blank());
Set(varPasswordOperation, "");
Set(varPasswordToken, 0);
Set(varPasswordHash, "");
Set(varPasswordSalt, "");
Set(varPasswordIterations, 0);
Set(varPasswordVersion, "");
Reset(txtPasswordLogin)
```

No hace falta borrar el hash de la coleccion: el cierre de sesion limpia las variables de la aplicacion, no la credencial almacenada.

## 5. Cambio de contrasena

El cambio usa `GENERATE`, `UPDATE` o `CAMBIAR_CLAVE` de nuevo. **Nunca reutilices el salt anterior**: la operacion crea uno nuevo y ese es el correcto.

### 5.1 Boton Generar nuevo hash

```powerfx
If(
    !varAutenticado,
    Notify("Inicia sesion antes de cambiar la contrasena.", NotificationType.Warning),
    Len(txtPasswordNueva.Text) < 10,
    Notify("La nueva contrasena debe tener al menos 10 caracteres.", NotificationType.Warning),
    Set(varModoPassword, "CAMBIO");
    Set(varPasswordOperation, "CAMBIAR_CLAVE");
    Set(varPasswordToken, varPasswordToken + 1)
)
```

`CAMBIAR_CLAVE` es un alias de `GENERATE`; tambien puedes usar `UPDATE`. El evento que se dispara sigue siendo `OnGenerationCompleted`.

### 5.2 Evento Al completar la generacion (control de cambio)

Si la pantalla de cambio tiene **su propio** control `TCGPasswordEngine`, el evento no necesita distinguir modos:

```powerfx
If(
    !TCGPasswordEngine1.Success,
    Notify(TCGPasswordEngine1.Message, NotificationType.Warning),

    Set(varPasswordHash, TCGPasswordEngine1.GeneratedHash);
    Set(varPasswordSalt, TCGPasswordEngine1.GeneratedSalt);
    Set(varPasswordIterations, TCGPasswordEngine1.GeneratedIterations);
    Set(varPasswordVersion, TCGPasswordEngine1.GeneratedVersion);

    Patch(
        colUsuarios,
        LookUp(colUsuarios, ID = varUsuarioActual.ID),
        {
            HashPassword: varPasswordHash,
            SaltPassword: varPasswordSalt,
            IteracionesPassword: varPasswordIterations,
            VersionPassword: varPasswordVersion
        }
    );
    Set(varUsuarioActual, LookUp(colUsuarios, ID = varUsuarioActual.ID));
    Set(varPasswordOperation, "");
    Reset(txtPasswordNueva);
    Notify("Contrasena actualizada.", NotificationType.Success)
)
```

Si reutilizas un unico control para alta y cambio, el evento debe decidir con una variable de modo **antes** de guardar; no mezcles en el mismo `Patch` los datos de un usuario nuevo con los del usuario actual. Lo mas seguro es un control por pantalla.

No guardes la contrasena nueva en `varPasswordActual` ni en ningun otro contenedor.

## 6. Pruebas sugeridas

| # | Accion | Resultado esperado |
| --- | --- | --- |
| 1 | Abrir la pantalla con `Operation` vacia | El motor no procesa nada |
| 2 | Crear una cuenta con 9 caracteres | `Success = false`, mensaje de minimo y sin fila nueva |
| 3 | Crear una cuenta con 10 caracteres o mas | Se guardan los cuatro valores y el evento muestra exito |
| 4 | Revisar la coleccion | No existe ninguna columna con la contrasena |
| 5 | Iniciar sesion con la contrasena correcta | `Success = true`, `IsValid = true` y `varAutenticado = true` |
| 6 | Iniciar sesion con otra contrasena | `Success = true`, `IsValid = false` y aviso generico |
| 7 | Iniciar sesion con un usuario inexistente | Mismo aviso generico; no se ejecuta una validacion |
| 8 | Cambiar la contrasena y volver a entrar | Entra con la nueva y falla con la anterior |
| 9 | Repetir el clic sin cambiar el token | No se ejecuta una segunda operacion |
| 10 | Revisar el salt despues del cambio | Es distinto del salt anterior |

## 7. Variantes utiles

### 7.1 Politica de contrasena en la interfaz

```powerfx
Len(txtNuevaPassword.Text) >= 10 &&
!IsBlank(txtNuevaPassword.Text) &&
txtNuevaPassword.Text = txtConfirmarPassword.Text
```

El motor solo exige 10 caracteres Unicode. La confirmacion, la complejidad y la lista de contrasenas prohibidas son responsabilidad de la aplicacion.

### 7.2 Mostrar el estado sin revelar datos

```powerfx
If(
    TCGPasswordEngine1.IsProcessing,
    "Procesando...",
    TCGPasswordEngine1.Success && TCGPasswordEngine1.IsValid,
    "Credenciales validas.",
    TCGPasswordEngine1.Success,
    "Credenciales invalidas.",
    "No se pudo completar la operacion."
)
```

Nunca muestres `GeneratedHash`, `GeneratedSalt` ni la contrasena en la interfaz. Para diagnostico, muestra solo `Message`.

### 7.3 Bloquear el boton durante el calculo

```powerfx
// DisplayMode del boton de alta o login
If(TCGPasswordEngine1.IsProcessing, DisplayMode.Disabled, DisplayMode.Edit)
```

PBKDF2 con 600000 iteraciones tarda un instante perceptible; el bloqueo evita tokens duplicados por doble clic.

### 7.4 Leer los valores almacenados de un usuario

```powerfx
Set(varPasswordHash, varUsuarioLogin.HashPassword);
Set(varPasswordSalt, varUsuarioLogin.SaltPassword);
Set(varPasswordIterations, varUsuarioLogin.IteracionesPassword);
Set(varPasswordVersion, varUsuarioLogin.VersionPassword)
```

Deben estar asignados **antes** de incrementar el token. La operacion lee las propiedades en el instante del cambio.

## 8. Problemas comunes

| Sintoma | Causa probable | Solucion |
| --- | --- | --- |
| El motor no hace nada | Se cambio `Operation` sin cambiar el token | Incrementa `ExecutionToken` |
| La validacion falla siempre | Iteraciones o version no son las almacenadas | Copia los cuatro valores del registro |
| El evento no se dispara | Se cambio `Operation` sin cambiar el token o el valor de `Operation` no es reconocido | Incrementa `ExecutionToken` y usa `GENERATE`/`CREATE`/`UPDATE` o `VALIDATE` |
| El evento llega con `Success` falso | Error de entrada o tecnico; no es una credencial valida ni invalida | No guardes ni cuentes el intento; muestra `Message` |
| El formulario queda en “Generando hash...” | El manejador no apaga el indicador en la rama de error | Comprueba `Success` al inicio del evento y apaga el indicador en ambas ramas |
| `IsValid` es falso y `Success` verdadero | La contrasena no coincide | Es el resultado normal de una credencial incorrecta |
| `IsValid` es falso y `Success` falso | Error tecnico o de entrada | No muestres "contrasena incorrecta"; muestra `Message` |
| Dos clics generan dos operaciones | El boton no se deshabilita | Usa `IsProcessing` en `DisplayMode` |
| La contrasena se guarda por error | Se enlazo una columna al texto del campo | Guarda solo `GeneratedHash`, `GeneratedSalt`, `GeneratedIterations` y `GeneratedVersion` |

## 9. Seguridad

- No guardes la contrasena ni la envies a una coleccion, un registro o un registro de telemetria.
- No reutilices salt entre usuarios ni entre cambios de contrasena.
- Restringe la lectura de las columnas de hash a los procesos que realmente las necesitan.
- Usa `https` y una politica de contrasena adecuada.
- La validacion en el cliente no autentica al usuario ante el servidor: el control es una herramienta de derivacion, no un sistema de identidad.
- Si migras desde otro algoritmo, guarda la version y define un camino de actualizacion; este control solo acepta `PBKDF2-SHA256-V1`.

## 10. Referencia

- Propiedades, contratos y errores: [../TCGPasswordEngine.md](../TCGPasswordEngine.md)
- Seguridad y limites conocidos: [../TCGPasswordEngine.md](../TCGPasswordEngine.md#11-seguridad)
- Instalacion de la solucion: [../README.md](../README.md#6-instalar-y-usar-en-power-apps)
