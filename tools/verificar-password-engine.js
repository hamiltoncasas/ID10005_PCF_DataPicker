/*
 * Fecha: 2026-10-25
 * Descripcion: Arnes de verificacion de la logica criptografica de TCGPasswordEngine.
 * Compara PBKDF2-SHA256 con vectores independientes de Node, comprueba Unicode,
 * Base64, iteraciones, comparacion en tiempo constante y errores controlados.
 *
 * Uso (desde la raiz del repositorio):
 *   npx tsc TCGPasswordEngine/passwordEngine.ts --outDir obj/checks-password --module commonjs --target es2019 --lib ES2020,DOM --strict --skipLibCheck
 *   node tools/verificar-password-engine.js
 */
"use strict";

const path = require("path");
const nodeCrypto = require("node:crypto");

const enginePath = path.join(__dirname, "..", "obj", "checks-password", "passwordEngine.js");
const {
    DEFAULT_ITERATIONS,
    HASH_BYTE_LENGTH,
    HASH_VERSION,
    MIN_ITERATIONS,
    MIN_PASSWORD_LENGTH,
    PasswordEngineError,
    SALT_BYTE_LENGTH,
    base64ToBytes,
    bytesToBase64,
    constantTimeEquals,
    generatePasswordHash,
    isValidIterationCount,
    passwordLength,
    resolveIterations,
    validatePassword,
} = require(enginePath);

const webcrypto = nodeCrypto.webcrypto;

let failures = 0;
let total = 0;

function check(name, actual, expected) {
    total += 1;
    const ok = JSON.stringify(actual) === JSON.stringify(expected);
    if (!ok) {
        failures += 1;
        console.log("FAIL " + name + " -> " + JSON.stringify(actual) + " esperado " + JSON.stringify(expected));
    } else {
        console.log("ok   " + name);
    }
}

async function checkRejects(name, promise, expectedMessage) {
    total += 1;
    try {
        await promise;
        failures += 1;
        console.log("FAIL " + name + " -> no lanzo error");
    } catch (error) {
        const ok =
            error instanceof PasswordEngineError &&
            (expectedMessage === undefined || error.message === expectedMessage);
        if (!ok) {
            failures += 1;
            console.log("FAIL " + name + " -> " + error.constructor.name + ": " + error.message);
        } else {
            console.log("ok   " + name);
        }
    }
}

async function main() {
    const password = "pässwörd-测试-🔐-123";
    const iterations = 100000;
    const saltBytes = Buffer.from("0123456789abcdef", "utf8");
    const expected = nodeCrypto.pbkdf2Sync(password, saltBytes, iterations, 32, "sha256");

    /* Constantes del contrato. */
    check("version del hash", HASH_VERSION, "PBKDF2-SHA256-V1");
    check("iteraciones predeterminadas", DEFAULT_ITERATIONS, 600000);
    check("iteraciones minimas", MIN_ITERATIONS, 100000);
    check("longitud del salt", SALT_BYTE_LENGTH, 16);
    check("longitud del hash", HASH_BYTE_LENGTH, 32);
    check("longitud minima de contrasena", MIN_PASSWORD_LENGTH, 10);

    /* Longitud Unicode, no unidades UTF-16. */
    check("longitud ASCII", passwordLength("1234567890"), 10);
    check("longitud CJK", passwordLength("密码密码密码"), 6);
    check("longitud emoji", passwordLength("🔐🔐"), 2);
    check("longitud acento combinado", passwordLength("e\u0301"), 2);
    check("longitud mixta", passwordLength(password), Array.from(password).length);

    /* Politica de iteraciones. */
    check("resolver vacio", resolveIterations(undefined), DEFAULT_ITERATIONS);
    check("resolver nulo", resolveIterations(null), DEFAULT_ITERATIONS);
    check("resolver cero", resolveIterations(0), DEFAULT_ITERATIONS);
    check("resolver 50000", resolveIterations(50000), DEFAULT_ITERATIONS);
    check("resolver 99999", resolveIterations(99999), DEFAULT_ITERATIONS);
    check("resolver 100000", resolveIterations(100000), 100000);
    check("resolver decimal", resolveIterations(150000.9), 150000);
    check("resolver NaN", resolveIterations(Number.NaN), DEFAULT_ITERATIONS);
    check("resolver infinito", resolveIterations(Number.POSITIVE_INFINITY), DEFAULT_ITERATIONS);
    check("validar 100000", isValidIterationCount(100000), true);
    check("validar 99999", isValidIterationCount(99999), false);
    check("validar decimal", isValidIterationCount(100000.5), false);
    check("validar texto", isValidIterationCount("100000"), false);
    check("validar nulo", isValidIterationCount(null), false);
    check("validar NaN", isValidIterationCount(Number.NaN), false);

    /* Base64 canonico, sin relleno y entradas invalidas. */
    check("bytes a Base64", bytesToBase64(new Uint8Array([0, 255])), "AP8=");
    check("Base64 a bytes", Array.from(base64ToBytes("AP8=")), [0, 255]);
    check("Base64 sin relleno", Array.from(base64ToBytes("AP8")), [0, 255]);
    check("Base64 con espacios exteriores", Array.from(base64ToBytes("  YWJj  ")), [97, 98, 99]);
    check("Base64 de texto", Buffer.from(base64ToBytes("YWJj")).toString("utf8"), "abc");

    await checkRejects("Base64 vacio", Promise.resolve().then(() => base64ToBytes("")), "Los datos almacenados estan incompletos.");
    await checkRejects("Base64 con asteriscos", Promise.resolve().then(() => base64ToBytes("***")));
    await checkRejects("Base64 longitud imposible", Promise.resolve().then(() => base64ToBytes("abcde")));
    await checkRejects("Base64 relleno interior", Promise.resolve().then(() => base64ToBytes("ab=c")));
    await checkRejects("Base64 relleno de mas", Promise.resolve().then(() => base64ToBytes("YWJj=")));
    await checkRejects("Base64 URL-safe", Promise.resolve().then(() => base64ToBytes("ab-_")));
    await checkRejects("Base64 con salto interior", Promise.resolve().then(() => base64ToBytes("AP\n8=")));

    /* Comparacion en tiempo constante. */
    check("comparar iguales", constantTimeEquals(new Uint8Array([1, 2, 3]), new Uint8Array([1, 2, 3])), true);
    check("comparar distinto", constantTimeEquals(new Uint8Array([1, 2, 3]), new Uint8Array([1, 2, 4])), false);
    check("comparar longitudes distintas", constantTimeEquals(new Uint8Array([1, 2]), new Uint8Array([1, 2, 3])), false);
    check("comparar vacios", constantTimeEquals(new Uint8Array([]), new Uint8Array([])), true);
    check("comparar vacio con dato", constantTimeEquals(new Uint8Array([]), new Uint8Array([0])), false);

    /* Vector independiente: PBKDF2-SHA256 de Node. */
    check(
        "validar vector de Node",
        await validatePassword(webcrypto, password, expected.toString("base64"), saltBytes.toString("base64"), iterations),
        true
    );
    check(
        "rechazar contrasena incorrecta",
        await validatePassword(webcrypto, password + "x", expected.toString("base64"), saltBytes.toString("base64"), iterations),
        false
    );
    check(
        "validar Base64 sin relleno",
        await validatePassword(
            webcrypto,
            password,
            expected.toString("base64").replace(/=+$/, ""),
            saltBytes.toString("base64").replace(/=+$/, ""),
            iterations
        ),
        true
    );

    /* Generacion: salt aleatorio, hash reproducible y mismo resultado que Node. */
    const generated = await generatePasswordHash(webcrypto, password, iterations);
    check("generar version", generated.version, HASH_VERSION);
    check("generar iteraciones", generated.iterations, iterations);
    check("generar longitud del salt", base64ToBytes(generated.salt).length, SALT_BYTE_LENGTH);
    check("generar longitud del hash", base64ToBytes(generated.hash).length, HASH_BYTE_LENGTH);
    check("generar salt distinto", generated.salt !== (await generatePasswordHash(webcrypto, password, iterations)).salt, true);

    const generatedSalt = Buffer.from(base64ToBytes(generated.salt));
    const expectedFromSalt = nodeCrypto.pbkdf2Sync(password, generatedSalt, iterations, 32, "sha256");
    check("generar hash coincide con Node", generated.hash, expectedFromSalt.toString("base64"));
    check(
        "validar hash generado",
        await validatePassword(webcrypto, password, generated.hash, generated.salt, iterations),
        true
    );

    /* Longitud derivada distinta de 32 bytes: el control usa la del hash almacenado. */
    const shortHash = nodeCrypto.pbkdf2Sync(password, saltBytes, iterations, 16, "sha256");
    check(
        "validar hash de 16 bytes",
        await validatePassword(webcrypto, password, shortHash.toString("base64"), saltBytes.toString("base64"), iterations),
        true
    );

    /* Errores de datos almacenados y de Web Crypto. */
    await checkRejects(
        "validar hash vacio",
        validatePassword(webcrypto, password, "", saltBytes.toString("base64"), iterations),
        "Los datos almacenados estan incompletos."
    );
    await checkRejects(
        "validar salt vacio",
        validatePassword(webcrypto, password, expected.toString("base64"), "", iterations),
        "Los datos almacenados estan incompletos."
    );
    await checkRejects(
        "validar Base64 invalido",
        validatePassword(webcrypto, password, "***", saltBytes.toString("base64"), iterations),
        "Los datos almacenados no tienen un formato Base64 valido."
    );
    await checkRejects(
        "generar sin Web Crypto",
        generatePasswordHash(undefined, password, iterations),
        "El motor criptografico no esta disponible en este entorno."
    );
    await checkRejects(
        "generar sin SubtleCrypto",
        generatePasswordHash({}, password, iterations),
        "El motor criptografico no esta disponible en este entorno."
    );
    await checkRejects(
        "validar sin Web Crypto",
        validatePassword(undefined, password, expected.toString("base64"), saltBytes.toString("base64"), iterations),
        "El motor criptografico no esta disponible en este entorno."
    );

    /* Los mensajes de error no filtran la contrasena. */
    total += 1;
    try {
        await generatePasswordHash(undefined, password, iterations);
        failures += 1;
        console.log("FAIL mensaje sin contrasena -> no lanzo error");
    } catch (error) {
        const ok = error instanceof PasswordEngineError && !error.message.includes(password);
        if (!ok) {
            failures += 1;
            console.log("FAIL mensaje sin contrasena -> " + error.message);
        } else {
            console.log("ok   mensaje sin contrasena");
        }
    }

    console.log("");
    console.log(`${total - failures} de ${total} verificaciones correctas`);
    if (failures > 0) {
        process.exitCode = 1;
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
