/**
 * Fecha: 2026-10-25
 * Descripcion: Logica criptografica pura del motor de contrasenas. Implementa
 * PBKDF2 con SHA-256 usando Web Crypto, la codificacion Base64 y la comparacion
 * de tiempo constante. No conserva la contrasena ni expone datos sensibles.
 */

/** Version del formato de hash admitida por el componente. */
export const HASH_VERSION = "PBKDF2-SHA256-V1";
/** Iteraciones usadas cuando la entrada no es valida. */
export const DEFAULT_ITERATIONS = 600000;
/** Minimo de iteraciones admitido para generar y validar. */
export const MIN_ITERATIONS = 100000;
/** Longitud del salt generado. */
export const SALT_BYTE_LENGTH = 16;
/** Longitud del hash derivado. */
export const HASH_BYTE_LENGTH = 32;
/** Longitud minima de la contrasena para GENERATE. */
export const MIN_PASSWORD_LENGTH = 10;

const PBKDF2_ALGORITHM = "PBKDF2";
const HASH_ALGORITHM = "SHA-256";
const BASE64_PATTERN = /^[A-Za-z0-9+/]+={0,2}$/;

const CRYPTO_UNAVAILABLE_MESSAGE = "El motor criptografico no esta disponible en este entorno.";
const INVALID_BASE64_MESSAGE = "Los datos almacenados no tienen un formato Base64 valido.";
const INVALID_STORED_DATA_MESSAGE = "Los datos almacenados estan incompletos.";

/** Error controlado con un mensaje apto para mostrarse en la aplicacion. */
export class PasswordEngineError extends Error {
    public constructor(message: string) {
        super(message);
        this.name = "PasswordEngineError";
    }
}

/** Resultado de una generacion correcta. */
export interface GeneratedPasswordHash {
    /** Hash derivado en Base64. */
    hash: string;
    /** Salt aleatorio en Base64. */
    salt: string;
    /** Iteraciones efectivamente usadas. */
    iterations: number;
    /** Version del formato. */
    version: string;
}

/** Texto a bytes UTF-8 en un ArrayBuffer propio (compatible con Web Crypto). */
function encodeUtf8(value: string): ArrayBuffer {
    return toArrayBuffer(new TextEncoder().encode(value));
}

/** Copia bytes a un ArrayBuffer independiente para Web Crypto. */
function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
    const buffer = new ArrayBuffer(bytes.length);
    new Uint8Array(buffer).set(bytes);
    return buffer;
}

/** Devuelve la API criptografica o lanza un error controlado. */
function requireCrypto(cryptoImpl: Crypto | undefined): Crypto {
    if (cryptoImpl === undefined) {
        throw new PasswordEngineError(CRYPTO_UNAVAILABLE_MESSAGE);
    }
    return cryptoImpl;
}

/** Devuelve Web Crypto SubtleCrypto o lanza un error controlado. */
function requireSubtle(cryptoImpl: Crypto): SubtleCrypto {
    const subtle = cryptoImpl.subtle;
    if (!subtle) {
        throw new PasswordEngineError(CRYPTO_UNAVAILABLE_MESSAGE);
    }
    return subtle;
}

/**
 * Convierte bytes a Base64 canonico con relleno.
 * @param bytes Arreglo de bytes.
 * @returns Texto Base64.
 */
export function bytesToBase64(bytes: Uint8Array): string {
    let binary = "";
    for (const byte of bytes) {
        binary += String.fromCharCode(byte);
    }
    return btoa(binary);
}

/**
 * Decodifica Base64 y rechaza textos con caracteres, longitud o relleno invalidos.
 * Acepta Base64 sin relleno final para interoperar con otras implementaciones.
 * @param value Texto Base64.
 * @returns Bytes decodificados.
 */
export function base64ToBytes(value: string | null | undefined): Uint8Array {
    const text = (value ?? "").trim();
    if (text.length === 0) {
        throw new PasswordEngineError(INVALID_STORED_DATA_MESSAGE);
    }
    if (!BASE64_PATTERN.test(text) || text.length % 4 === 1) {
        throw new PasswordEngineError(INVALID_BASE64_MESSAGE);
    }

    const paddingLength = (4 - (text.length % 4)) % 4;
    let binary: string;
    try {
        binary = atob(text + "=".repeat(paddingLength));
    } catch {
        throw new PasswordEngineError(INVALID_BASE64_MESSAGE);
    }

    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) {
        bytes[index] = binary.charCodeAt(index);
    }
    return bytes;
}

/**
 * Compara dos arreglos recorriendo siempre la misma cantidad de bytes.
 * La diferencia acumulada con XOR incluye longitudes distintas.
 * @param left Primer arreglo.
 * @param right Segundo arreglo.
 * @returns Verdadero solo si ambos arreglos son iguales.
 */
export function constantTimeEquals(left: Uint8Array, right: Uint8Array): boolean {
    const length = Math.max(left.length, right.length);
    let difference = left.length ^ right.length;
    for (let index = 0; index < length; index += 1) {
        const leftByte = index < left.length ? left[index] : 0;
        const rightByte = index < right.length ? right[index] : 0;
        difference |= leftByte ^ rightByte;
    }
    return difference === 0;
}

/**
 * Resuelve las iteraciones de GENERATE: usa el valor recibido cuando es valido
 * o el valor predeterminado en caso contrario.
 * @param value Iteraciones configuradas.
 * @returns Iteraciones a usar.
 */
export function resolveIterations(value: number | null | undefined): number {
    const candidate = typeof value === "number" && Number.isFinite(value) ? Math.floor(value) : 0;
    return candidate >= MIN_ITERATIONS ? candidate : DEFAULT_ITERATIONS;
}

/**
 * Indica si una cantidad de iteraciones es valida para VALIDATE.
 * @param value Iteraciones configuradas.
 * @returns Verdadero si es un entero mayor o igual al minimo.
 */
export function isValidIterationCount(value: number | null | undefined): boolean {
    return typeof value === "number" && Number.isInteger(value) && value >= MIN_ITERATIONS;
}

/**
 * Cuenta caracteres Unicode, no unidades UTF-16.
 * @param value Texto a medir.
 * @returns Cantidad de caracteres.
 */
export function passwordLength(value: string): number {
    return Array.from(value).length;
}

/**
 * Genera un salt aleatorio y deriva el hash PBKDF2-SHA256 solicitado.
 * @param cryptoImpl Implementacion de Web Crypto (window.crypto).
 * @param password Contrasena temporal en UTF-8.
 * @param iterations Iteraciones PBKDF2.
 * @returns Hash, salt, iteraciones y version en Base64.
 */
export async function generatePasswordHash(
    cryptoImpl: Crypto | undefined,
    password: string,
    iterations: number
): Promise<GeneratedPasswordHash> {
    const cryptoApi = requireCrypto(cryptoImpl);
    const subtle = requireSubtle(cryptoApi);

    const salt = new Uint8Array(SALT_BYTE_LENGTH);
    cryptoApi.getRandomValues(salt);

    const key = await subtle.importKey("raw", encodeUtf8(password), PBKDF2_ALGORITHM, false, ["deriveBits"]);
    const derivedBits = await subtle.deriveBits(
        {
            name: PBKDF2_ALGORITHM,
            hash: HASH_ALGORITHM,
            salt: toArrayBuffer(salt),
            iterations,
        },
        key,
        HASH_BYTE_LENGTH * 8
    );

    return {
        hash: bytesToBase64(new Uint8Array(derivedBits)),
        salt: bytesToBase64(salt),
        iterations,
        version: HASH_VERSION,
    };
}

/**
 * Deriva el hash con el salt y las iteraciones almacenados y lo compara en
 * tiempo constante con el hash esperado.
 * @param cryptoImpl Implementacion de Web Crypto (window.crypto).
 * @param password Contrasena temporal en UTF-8.
 * @param storedHashBase64 Hash almacenado en Base64.
 * @param storedSaltBase64 Salt almacenado en Base64.
 * @param iterations Iteraciones almacenadas.
 * @returns Verdadero si la contrasena coincide.
 */
export async function validatePassword(
    cryptoImpl: Crypto | undefined,
    password: string,
    storedHashBase64: string,
    storedSaltBase64: string,
    iterations: number
): Promise<boolean> {
    const cryptoApi = requireCrypto(cryptoImpl);
    const subtle = requireSubtle(cryptoApi);

    const salt = base64ToBytes(storedSaltBase64);
    const expectedHash = base64ToBytes(storedHashBase64);
    if (salt.length === 0 || expectedHash.length === 0) {
        throw new PasswordEngineError(INVALID_STORED_DATA_MESSAGE);
    }

    const key = await subtle.importKey("raw", encodeUtf8(password), PBKDF2_ALGORITHM, false, ["deriveBits"]);
    const derivedBits = await subtle.deriveBits(
        {
            name: PBKDF2_ALGORITHM,
            hash: HASH_ALGORITHM,
            salt: toArrayBuffer(salt),
            iterations,
        },
        key,
        expectedHash.length * 8
    );

    return constantTimeEquals(new Uint8Array(derivedBits), expectedHash);
}
