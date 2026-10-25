/**
 * Fecha: 2026-10-25
 * Descripcion: Componente PCF invisible que genera y valida contrasenas con
 * PBKDF2-SHA256. Expone salidas genericas y dos eventos de finalizacion; no
 * conserva la contrasena ni dibuja una interfaz visible.
 */
import { IInputs, IOutputs } from "./generated/ManifestTypes";
import {
    HASH_VERSION,
    MIN_ITERATIONS,
    MIN_PASSWORD_LENGTH,
    PasswordEngineError,
    generatePasswordHash,
    isValidIterationCount,
    passwordLength,
    resolveIterations,
    validatePassword,
} from "./passwordEngine";

/** Eventos de finalizacion expuestos al anfitrion. */
interface IPasswordEngineEvents extends ComponentFramework.IEventBag {
    OnGenerationCompleted: () => void;
    OnValidationCompleted: () => void;
}

type Operation = "GENERATE" | "VALIDATE";

const OPERATION_GENERATE = "GENERATE";
const OPERATION_VALIDATE = "VALIDATE";

const MESSAGE_PASSWORD_REQUIRED = "La contrasena no puede estar vacia.";
const MESSAGE_PASSWORD_TOO_SHORT = "La contrasena debe tener al menos 10 caracteres.";
const MESSAGE_STORED_DATA_REQUIRED = "El hash y el salt almacenados son obligatorios.";
const MESSAGE_ITERATIONS_INVALID = "El numero de iteraciones debe ser 100000 o mayor.";
const MESSAGE_VERSION_INVALID = "La version del hash no es compatible.";
const MESSAGE_GENERATING = "Generando hash...";
const MESSAGE_VALIDATING = "Validando contrasena...";
const MESSAGE_GENERATED = "Hash generado correctamente.";
const MESSAGE_VALID = "Contrasena valida.";
const MESSAGE_INVALID = "Usuario o contrasena incorrectos.";
const MESSAGE_GENERATION_FAILED = "No se pudo generar el hash.";
const MESSAGE_VALIDATION_FAILED = "No se pudo validar la contrasena.";

/**
 * Motor criptografico invisible para aplicaciones Canvas.
 * Implementa el ciclo de vida StandardControl y publica las salidas y eventos.
 */
export class TCGPasswordEngine implements ComponentFramework.StandardControl<IInputs, IOutputs, IPasswordEngineEvents> {
    private notifyOutputChanged: (() => void) | undefined;
    private context: ComponentFramework.Context<IInputs, IPasswordEngineEvents> | undefined;
    private container: HTMLDivElement | undefined;

    private lastExecutionToken: number | null = null;
    private operationSequence = 0;
    private activeOperation: Operation | null = null;

    private success = false;
    private isProcessing = false;
    private isValid = false;
    private generatedHash = "";
    private generatedSalt = "";
    private generatedIterations = 0;
    private generatedVersion = "";
    private message = "";

    /**
     * Inicializa el control, guarda el contexto y prepara el contenedor invisible.
     * @param context Contexto de PCF con las propiedades de entrada.
     * @param notifyOutputChanged Callback para publicar las salidas.
     * @param state Estado persistente del control (no se usa).
     * @param container Elemento raiz entregado por el anfitrion.
     */
    public init(
        context: ComponentFramework.Context<IInputs, IPasswordEngineEvents>,
        notifyOutputChanged: () => void,
        state?: ComponentFramework.Dictionary,
        container?: HTMLDivElement
    ): void {
        this.context = context;
        this.notifyOutputChanged = notifyOutputChanged;
        this.container = container;
        this.applyHiddenContainerStyle();
    }

    /**
     * Reacciona a los cambios de propiedades y ejecuta la operacion cuando cambia
     * el token. El control permanece montado aunque no tenga interfaz visible.
     * @param context Contexto de PCF con las propiedades actualizadas.
     */
    public updateView(context: ComponentFramework.Context<IInputs, IPasswordEngineEvents>): void {
        this.context = context;
        this.applyHiddenContainerStyle();

        const operation = this.readOperation(context);
        if (operation === null) {
            return;
        }

        const token = this.readExecutionToken(context);
        if (token === this.lastExecutionToken) {
            return;
        }

        this.lastExecutionToken = token;
        this.operationSequence += 1;
        const sequence = this.operationSequence;
        this.activeOperation = operation;

        if (operation === OPERATION_GENERATE) {
            this.clearGeneratedResults();
            this.startGeneration(context, sequence);
        } else {
            this.startValidation(context, sequence);
        }
    }

    /**
     * Publica el estado y los resultados actuales.
     * @returns Salidas del componente.
     */
    public getOutputs(): IOutputs {
        return {
            Success: this.success,
            IsProcessing: this.isProcessing,
            IsValid: this.isValid,
            GeneratedHash: this.generatedHash,
            GeneratedSalt: this.generatedSalt,
            GeneratedIterations: this.generatedIterations,
            GeneratedVersion: this.generatedVersion,
            Message: this.message,
        };
    }

    /**
     * Cancela resultados pendientes cuando el anfitrion retira el control.
     */
    public destroy(): void {
        this.operationSequence += 1;
        this.activeOperation = null;
        this.context = undefined;
        this.container = undefined;
        this.notifyOutputChanged = undefined;
    }

    /** Interpreta el valor de Operation y descarta valores no reconocidos. */
    private readOperation(context: ComponentFramework.Context<IInputs, IPasswordEngineEvents>): Operation | null {
        const raw = context.parameters.Operation?.raw;
        const text = typeof raw === "string" ? raw.trim().toUpperCase() : "";
        if (text === OPERATION_GENERATE || text === OPERATION_VALIDATE) {
            return text;
        }
        return null;
    }

    /** Lee el token de ejecucion; un valor ausente se trata como cero. */
    private readExecutionToken(context: ComponentFramework.Context<IInputs, IPasswordEngineEvents>): number {
        const raw = context.parameters.ExecutionToken?.raw;
        return typeof raw === "number" && Number.isFinite(raw) ? raw : 0;
    }

    /** Valida las entradas y arranca GENERATE. */
    private startGeneration(
        context: ComponentFramework.Context<IInputs, IPasswordEngineEvents>,
        sequence: number
    ): void {
        const password = String(context.parameters.Password?.raw ?? "");
        if (password.length === 0) {
            this.finishWithError(OPERATION_GENERATE, sequence, MESSAGE_PASSWORD_REQUIRED);
            return;
        }
        if (passwordLength(password) < MIN_PASSWORD_LENGTH) {
            this.finishWithError(OPERATION_GENERATE, sequence, MESSAGE_PASSWORD_TOO_SHORT);
            return;
        }

        const iterations = resolveIterations(context.parameters.Iterations?.raw);
        this.beginProcessing(OPERATION_GENERATE);
        void this.runGeneration(password, iterations, sequence);
    }

    /** Valida las entradas almacenadas y arranca VALIDATE. */
    private startValidation(
        context: ComponentFramework.Context<IInputs, IPasswordEngineEvents>,
        sequence: number
    ): void {
        const password = String(context.parameters.Password?.raw ?? "");
        const storedHash = String(context.parameters.StoredHash?.raw ?? "").trim();
        const storedSalt = String(context.parameters.StoredSalt?.raw ?? "").trim();
        const iterationsRaw = context.parameters.Iterations?.raw;
        const hashVersion = String(context.parameters.HashVersion?.raw ?? "").trim();

        if (password.length === 0) {
            this.finishWithError(OPERATION_VALIDATE, sequence, MESSAGE_PASSWORD_REQUIRED);
            return;
        }
        if (storedHash.length === 0 || storedSalt.length === 0) {
            this.finishWithError(OPERATION_VALIDATE, sequence, MESSAGE_STORED_DATA_REQUIRED);
            return;
        }
        if (!isValidIterationCount(iterationsRaw)) {
            this.finishWithError(OPERATION_VALIDATE, sequence, MESSAGE_ITERATIONS_INVALID);
            return;
        }
        if (hashVersion !== HASH_VERSION) {
            this.finishWithError(OPERATION_VALIDATE, sequence, MESSAGE_VERSION_INVALID);
            return;
        }

        const iterations = Number(iterationsRaw);
        this.beginProcessing(OPERATION_VALIDATE);
        void this.runValidation(password, storedHash, storedSalt, iterations, sequence);
    }

    /** Publica el estado de calculo antes de esperar la promesa criptografica. */
    private beginProcessing(operation: Operation): void {
        this.success = false;
        this.isProcessing = true;
        this.isValid = false;
        this.message = operation === OPERATION_GENERATE ? MESSAGE_GENERATING : MESSAGE_VALIDATING;
        this.publishOutputs();
    }

    /** Ejecuta la generacion y publica el resultado solo si sigue vigente. */
    private async runGeneration(password: string, iterations: number, sequence: number): Promise<void> {
        try {
            const result = await generatePasswordHash(window.crypto, password, iterations);
            if (!this.isCurrent(sequence, OPERATION_GENERATE)) {
                return;
            }

            this.success = true;
            this.isProcessing = false;
            this.isValid = false;
            this.generatedHash = result.hash;
            this.generatedSalt = result.salt;
            this.generatedIterations = result.iterations;
            this.generatedVersion = result.version;
            this.message = MESSAGE_GENERATED;
            this.publishOutputs();
            this.fireCompletedEvent(OPERATION_GENERATE, sequence);
        } catch (error) {
            this.finishWithError(
                OPERATION_GENERATE,
                sequence,
                this.describeError(error, MESSAGE_GENERATION_FAILED)
            );
        } finally {
            this.clearActiveOperation(sequence, OPERATION_GENERATE);
        }
    }

    /** Ejecuta la validacion y publica el resultado solo si sigue vigente. */
    private async runValidation(
        password: string,
        storedHash: string,
        storedSalt: string,
        iterations: number,
        sequence: number
    ): Promise<void> {
        try {
            const isValid = await validatePassword(window.crypto, password, storedHash, storedSalt, iterations);
            if (!this.isCurrent(sequence, OPERATION_VALIDATE)) {
                return;
            }

            this.success = true;
            this.isProcessing = false;
            this.isValid = isValid;
            this.message = isValid ? MESSAGE_VALID : MESSAGE_INVALID;
            this.publishOutputs();
            this.fireCompletedEvent(OPERATION_VALIDATE, sequence);
        } catch (error) {
            this.finishWithError(
                OPERATION_VALIDATE,
                sequence,
                this.describeError(error, MESSAGE_VALIDATION_FAILED)
            );
        } finally {
            this.clearActiveOperation(sequence, OPERATION_VALIDATE);
        }
    }

    /** Publica un error controlado y deja el control listo para otra operacion. */
    private finishWithError(operation: Operation, sequence: number, message: string): void {
        if (!this.isCurrent(sequence, operation)) {
            return;
        }

        this.success = false;
        this.isProcessing = false;
        this.isValid = false;
        this.message = message;
        if (operation === OPERATION_GENERATE) {
            this.clearGeneratedResults();
        }
        this.activeOperation = null;
        this.publishOutputs();
    }

    /** Indica si el resultado de la secuencia sigue siendo el vigente. */
    private isCurrent(sequence: number, operation: Operation): boolean {
        return (
            this.operationSequence === sequence &&
            this.activeOperation === operation &&
            this.context !== undefined
        );
    }

    /** Limpia el estado activo solo cuando coincide con la secuencia terminada. */
    private clearActiveOperation(sequence: number, operation: Operation): void {
        if (this.operationSequence === sequence && this.activeOperation === operation) {
            this.activeOperation = null;
        }
    }

    /** Borra los resultados de una generacion anterior. */
    private clearGeneratedResults(): void {
        this.generatedHash = "";
        this.generatedSalt = "";
        this.generatedIterations = 0;
        this.generatedVersion = "";
    }

    /** Convierte un error en un mensaje controlado sin datos sensibles. */
    private describeError(error: unknown, fallback: string): string {
        return error instanceof PasswordEngineError ? error.message : fallback;
    }

    /** Notifica al anfitrion que las salidas cambiaron. */
    private publishOutputs(): void {
        this.notifyOutputChanged?.();
    }

    /** Dispara el evento generico correspondiente a la operacion terminada. */
    private fireCompletedEvent(operation: Operation, sequence: number): void {
        if (this.operationSequence !== sequence) {
            return;
        }

        const events = this.context?.events;
        if (events === undefined) {
            return;
        }

        if (operation === OPERATION_GENERATE) {
            events.OnGenerationCompleted?.();
        } else {
            events.OnValidationCompleted?.();
        }
    }

    /** Mantiene el contenedor sin contenido visual ni interaccion. */
    private applyHiddenContainerStyle(): void {
        const container = this.container;
        if (container === undefined) {
            return;
        }

        container.style.width = "1px";
        container.style.height = "1px";
        container.style.margin = "0";
        container.style.padding = "0";
        container.style.border = "0";
        container.style.overflow = "hidden";
        container.style.pointerEvents = "none";
        container.style.visibility = "hidden";
        container.setAttribute("aria-hidden", "true");
    }
}
