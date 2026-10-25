/**
 * Fecha: 2026-10-25
 * Descripcion: Logica criptografica pura del motor de contrasenas. Implementa
 * PBKDF2 con SHA-256 usando Web Crypto, con un respaldo JavaScript para los
 * entornos donde SubtleCrypto no esta disponible. Incluye la codificacion
 * Base64 y la comparacion de tiempo constante. No conserva la contrasena ni
 * expone datos sensibles.
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
const SHA256_BLOCK_BYTES = 64;
const SHA256_OUTPUT_BYTES = 32;
const WEB_CRYPTO_TIMEOUT_MS = 30000;
const FALLBACK_YIELD_ITERATIONS = 5000;

const CRYPTO_UNAVAILABLE_MESSAGE = "El motor criptografico no esta disponible en este entorno.";
const RANDOM_UNAVAILABLE_MESSAGE = "No se pudieron generar datos aleatorios seguros en este entorno.";
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
function encodeUtf8(value: string): Uint8Array {
    return new TextEncoder().encode(value);
}

/** Copia bytes a un ArrayBuffer independiente para Web Crypto. */
function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
    const buffer = new ArrayBuffer(bytes.length);
    new Uint8Array(buffer).set(bytes);
    return buffer;
}

/** Devuelve la API criptografica con generador aleatorio o lanza un error. */
function requireCrypto(cryptoImpl: Crypto | undefined): Crypto {
    if (cryptoImpl === undefined || typeof cryptoImpl.getRandomValues !== "function") {
        throw new PasswordEngineError(CRYPTO_UNAVAILABLE_MESSAGE);
    }
    return cryptoImpl;
}

/** Devuelve SubtleCrypto solo cuando el entorno realmente lo expone. */
function getSubtle(cryptoImpl: Crypto | undefined): SubtleCrypto | undefined {
    if (cryptoImpl === undefined) {
        return undefined;
    }
    try {
        return cryptoImpl.subtle;
    } catch {
        return undefined;
    }
}

/** Genera un salt con el generador criptografico del navegador. */
function createRandomSalt(cryptoImpl: Crypto): Uint8Array {
    const salt = new Uint8Array(SALT_BYTE_LENGTH);
    try {
        cryptoImpl.getRandomValues(salt);
    } catch {
        throw new PasswordEngineError(RANDOM_UNAVAILABLE_MESSAGE);
    }
    return salt;
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

/** Constantes de ronda de SHA-256. */
const SHA256_K: readonly number[] = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
];

/** Estado inicial de SHA-256. */
const SHA256_INITIAL: readonly number[] = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
];

/** Rotacion a la derecha de 32 bits. */
function rotateRight(value: number, bits: number): number {
    return ((value >>> bits) | (value << (32 - bits))) >>> 0;
}

/** SHA-256 de un arreglo de bytes, con relleno FIPS 180-4. */
function sha256(input: Uint8Array): Uint8Array {
    const paddedLength = Math.ceil((input.length + 9) / SHA256_BLOCK_BYTES) * SHA256_BLOCK_BYTES;
    const padded = new Uint8Array(paddedLength);
    padded.set(input);
    padded[input.length] = 0x80;

    const bitLength = input.length * 8;
    const paddedView = new DataView(padded.buffer);
    paddedView.setUint32(paddedLength - 8, Math.floor(bitLength / 0x100000000), false);
    paddedView.setUint32(paddedLength - 4, bitLength >>> 0, false);

    const state = Uint32Array.from(SHA256_INITIAL);
    const schedule = new Uint32Array(64);

    for (let offset = 0; offset < paddedLength; offset += SHA256_BLOCK_BYTES) {
        for (let index = 0; index < 16; index += 1) {
            schedule[index] = paddedView.getUint32(offset + index * 4, false);
        }

        for (let index = 16; index < 64; index += 1) {
            const previous15 = schedule[index - 15];
            const previous2 = schedule[index - 2];
            const sigma0 = rotateRight(previous15, 7) ^ rotateRight(previous15, 18) ^ (previous15 >>> 3);
            const sigma1 = rotateRight(previous2, 17) ^ rotateRight(previous2, 19) ^ (previous2 >>> 10);
            schedule[index] = (schedule[index - 16] + sigma0 + schedule[index - 7] + sigma1) >>> 0;
        }

        let a = state[0];
        let b = state[1];
        let c = state[2];
        let d = state[3];
        let e = state[4];
        let f = state[5];
        let g = state[6];
        let h = state[7];

        for (let index = 0; index < 64; index += 1) {
            const sigma1 = rotateRight(e, 6) ^ rotateRight(e, 11) ^ rotateRight(e, 25);
            const choose = (e & f) ^ (~e & g);
            const temp1 = (h + sigma1 + choose + SHA256_K[index] + schedule[index]) >>> 0;
            const sigma0 = rotateRight(a, 2) ^ rotateRight(a, 13) ^ rotateRight(a, 22);
            const majority = (a & b) ^ (a & c) ^ (b & c);
            const temp2 = (sigma0 + majority) >>> 0;

            h = g;
            g = f;
            f = e;
            e = (d + temp1) >>> 0;
            d = c;
            c = b;
            b = a;
            a = (temp1 + temp2) >>> 0;
        }

        state[0] = (state[0] + a) >>> 0;
        state[1] = (state[1] + b) >>> 0;
        state[2] = (state[2] + c) >>> 0;
        state[3] = (state[3] + d) >>> 0;
        state[4] = (state[4] + e) >>> 0;
        state[5] = (state[5] + f) >>> 0;
        state[6] = (state[6] + g) >>> 0;
        state[7] = (state[7] + h) >>> 0;
    }

    const output = new Uint8Array(SHA256_OUTPUT_BYTES);
    const outputView = new DataView(output.buffer);
    for (let index = 0; index < state.length; index += 1) {
        outputView.setUint32(index * 4, state[index], false);
    }
    return output;
}

/** Une dos arreglos de bytes. */
function concatBytes(left: Uint8Array, right: Uint8Array): Uint8Array {
    const result = new Uint8Array(left.length + right.length);
    result.set(left);
    result.set(right, left.length);
    return result;
}


/** Bloques ipad/opad de HMAC-SHA256 derivados de la clave. */
interface IHmacPads {
    inner: Uint8Array;
    outer: Uint8Array;
}

/** Calcula los bloques internos de HMAC una sola vez por clave. */
function createHmacPads(key: Uint8Array): IHmacPads {
    const normalizedKey = new Uint8Array(SHA256_BLOCK_BYTES);
    normalizedKey.set(key.length > SHA256_BLOCK_BYTES ? sha256(key) : key);

    const inner = new Uint8Array(SHA256_BLOCK_BYTES);
    const outer = new Uint8Array(SHA256_BLOCK_BYTES);
    for (let index = 0; index < SHA256_BLOCK_BYTES; index += 1) {
        inner[index] = normalizedKey[index] ^ 0x36;
        outer[index] = normalizedKey[index] ^ 0x5c;
    }
    return { inner, outer };
}

/** HMAC-SHA256 para un mensaje de longitud variable. */
function hmacSha256(pads: IHmacPads, message: Uint8Array): Uint8Array {
    const innerInput = new Uint8Array(SHA256_BLOCK_BYTES + message.length);
    innerInput.set(pads.inner);
    innerInput.set(message, SHA256_BLOCK_BYTES);

    const innerHash = sha256(innerInput);
    const outerInput = new Uint8Array(SHA256_BLOCK_BYTES + SHA256_OUTPUT_BYTES);
    outerInput.set(pads.outer);
    outerInput.set(innerHash, SHA256_BLOCK_BYTES);
    return sha256(outerInput);
}

/**
 * Crea un HMAC-SHA256 especializado en mensajes de 32 bytes, el tamano de cada
 * bloque U de PBKDF2. Reutiliza los buferes para no asignar memoria en cada
 * iteracion.
 */
function createFixedHmac(pads: IHmacPads): (message: Uint8Array) => Uint8Array {
    const innerInput = new Uint8Array(SHA256_BLOCK_BYTES + SHA256_OUTPUT_BYTES);
    innerInput.set(pads.inner);
    const outerInput = new Uint8Array(SHA256_BLOCK_BYTES + SHA256_OUTPUT_BYTES);
    outerInput.set(pads.outer);

    return (message: Uint8Array): Uint8Array => {
        innerInput.set(message, SHA256_BLOCK_BYTES);
        const innerHash = sha256(innerInput);
        outerInput.set(innerHash, SHA256_BLOCK_BYTES);
        return sha256(outerInput);
    };
}

/** Cede el hilo al anfitrion para que la interfaz no se congele. */
function yieldToHost(): Promise<void> {
    return new Promise<void>((resolve) => {
        setTimeout(resolve, 0);
    });
}

/**
 * PBKDF2-HMAC-SHA256 en JavaScript. Se usa solo cuando SubtleCrypto no esta
 * disponible o no puede completar la derivacion. El calculo se divide en
 * bloques para devolver el control al navegador y mantener la interfaz viva.
 */
async function deriveWithFallback(
    passwordBytes: Uint8Array,
    salt: Uint8Array,
    iterations: number,
    length: number
): Promise<Uint8Array> {
    const rounds = Math.max(1, Math.floor(iterations));
    const blockCount = Math.ceil(length / SHA256_OUTPUT_BYTES);
    const derivedKey = new Uint8Array(blockCount * SHA256_OUTPUT_BYTES);
    const pads = createHmacPads(passwordBytes);
    const fixedHmac = createFixedHmac(pads);
    let pendingYield = 0;

    for (let blockIndex = 1; blockIndex <= blockCount; blockIndex += 1) {
        const blockNumber = new Uint8Array([
            (blockIndex >>> 24) & 0xff,
            (blockIndex >>> 16) & 0xff,
            (blockIndex >>> 8) & 0xff,
            blockIndex & 0xff,
        ]);
        let current = hmacSha256(pads, concatBytes(salt, blockNumber));
        const accumulated = current.slice();

        for (let round = 2; round <= rounds; round += 1) {
            current = fixedHmac(current);
            for (let index = 0; index < accumulated.length; index += 1) {
                accumulated[index] ^= current[index];
            }

            pendingYield += 1;
            if (pendingYield >= FALLBACK_YIELD_ITERATIONS) {
                pendingYield = 0;
                await yieldToHost();
            }
        }

        derivedKey.set(accumulated, (blockIndex - 1) * SHA256_OUTPUT_BYTES);
    }

    return derivedKey.slice(0, length);
}

/** Espera una promesa criptografica con un limite de tiempo controlado. */
async function withTimeout<T>(operation: Promise<T>, milliseconds: number): Promise<T> {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const timeout = new Promise<T>((_resolve, reject) => {
        timer = setTimeout(() => {
            reject(new PasswordEngineError(CRYPTO_UNAVAILABLE_MESSAGE));
        }, milliseconds);
    });

    try {
        return await Promise.race([operation, timeout]);
    } finally {
        if (timer !== undefined) {
            clearTimeout(timer);
        }
    }
}

/** Deriva bytes con Web Crypto cuando esta disponible. */
async function deriveWithWebCrypto(
    subtle: SubtleCrypto,
    passwordBytes: Uint8Array,
    salt: Uint8Array,
    iterations: number,
    length: number
): Promise<Uint8Array> {
    const key = await subtle.importKey(
        "raw",
        toArrayBuffer(passwordBytes),
        PBKDF2_ALGORITHM,
        false,
        ["deriveBits"]
    );
    const derivedBits = await withTimeout(
        subtle.deriveBits(
            {
                name: PBKDF2_ALGORITHM,
                hash: HASH_ALGORITHM,
                salt: toArrayBuffer(salt),
                iterations,
            },
            key,
            length * 8
        ),
        WEB_CRYPTO_TIMEOUT_MS
    );
    return new Uint8Array(derivedBits);
}

/**
 * Deriva bytes prefiriendo Web Crypto. Si SubtleCrypto no existe, lanza un
 * error o supera el tiempo limite, usa PBKDF2 en JavaScript. La salida es
 * identica en ambos caminos.
 */
async function deriveBytes(
    cryptoImpl: Crypto | undefined,
    passwordBytes: Uint8Array,
    salt: Uint8Array,
    iterations: number,
    length: number
): Promise<Uint8Array> {
    const subtle = getSubtle(cryptoImpl);
    if (subtle !== undefined) {
        try {
            return await deriveWithWebCrypto(subtle, passwordBytes, salt, iterations, length);
        } catch {
            // Entornos con SubtleCrypto bloqueado o incompleto usan el respaldo.
        }
    }
    return deriveWithFallback(passwordBytes, salt, iterations, length);
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
    const salt = createRandomSalt(cryptoApi);
    const derivedBytes = await deriveBytes(
        cryptoApi,
        encodeUtf8(password),
        salt,
        iterations,
        HASH_BYTE_LENGTH
    );

    return {
        hash: bytesToBase64(derivedBytes),
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
    const salt = base64ToBytes(storedSaltBase64);
    const expectedHash = base64ToBytes(storedHashBase64);
    if (salt.length === 0 || expectedHash.length === 0) {
        throw new PasswordEngineError(INVALID_STORED_DATA_MESSAGE);
    }

    const derivedBytes = await deriveBytes(
        cryptoImpl,
        encodeUtf8(password),
        salt,
        iterations,
        expectedHash.length
    );
    return constantTimeEquals(derivedBytes, expectedHash);
}
