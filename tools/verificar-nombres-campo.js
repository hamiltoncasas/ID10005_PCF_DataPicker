/*
 * Fecha: 2026-09-27
 * Descripcion: Arnes de verificacion del reconocimiento de campos del control
 * ExcelReportPicker. Comprueba los dos papeles de cada columna: la columna se
 * **reconoce** por su **nombre visible** (FieldDisplayName), que es el que se
 * escribe en el informe, y el **valor** de la celda se **pide** por su **nombre
 * logico** (FieldName), que es la clave unica del conjunto de datos; el nombre
 * visible, el alias y la forma codificada de SharePoint quedan como respaldo.
 *
 * Uso (desde la raiz del repositorio):
 *   node tools/verificar-nombres-campo.js
 *
 * El arnes compila el control a obj/checks-excel antes de verificar.
 * Salida esperada: "40 de 40 verificaciones correctas" y codigo de salida 0.
 */
const { execFileSync } = require("child_process");
const path = require("path");

const root = path.join(__dirname, "..");
const outputDir = path.join(root, "obj", "checks-excel");

try {
    execFileSync(
        process.execPath,
        [
            path.join(root, "node_modules", "typescript", "bin", "tsc"),
            path.join("ExcelReportPicker", "index.ts"),
            "--outDir", path.join("obj", "checks-excel"),
            "--module", "commonjs",
            "--target", "es2019",
            "--moduleResolution", "node",
            "--jsx", "react",
            "--esModuleInterop",
            "--skipLibCheck",
            "--lib", "ES2020,DOM",
            "--strict",
            "--strictPropertyInitialization", "false",
        ],
        { cwd: root, stdio: "inherit" }
    );
} catch (error) {
    console.log("No se pudo compilar ExcelReportPicker para verificar: " + error.message);
    process.exit(1);
}

const model = require(path.join(outputDir, "reportModel.js"));
const { ExcelReportPicker } = require(path.join(outputDir, "index.js"));

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

function expectedOutput() {
    console.log("\n" + (total - failures) + " de " + total + " verificaciones correctas");
    process.exit(failures === 0 ? 0 : 1);
}

/* --- Datos de prueba: una tabla como la que entrega Power Apps ------------- */
const columnaImporte = { name: "cr673_importe", displayName: "Importe total", dataType: "Currency", alias: "" };
const columnaCliente = { name: "cr673_cliente", displayName: "Cliente", dataType: "SingleLine.Text", alias: "clienteComercial" };
const columnaEstado = { name: "cr673_estado", displayName: "cr673_estado", dataType: "OptionSet", alias: "" };
const columnaCiudad = { name: "cr673_ciudad", displayName: "Ciudad", dataType: "SingleLine.Text", alias: "" };
const columnaTelefono = { name: "cr673_telefono", displayName: "Teléfono fijo", dataType: "SingleLine.Text", alias: "" };
const tabla = { columns: [columnaImporte, columnaCliente, columnaEstado, columnaCiudad, columnaTelefono], rows: [] };

const opciones = {
    dateFormat: "dd/mm/yyyy",
    dateTimeFormat: "dd/mm/yyyy hh:mm",
    timeFormat: "hh:mm",
    integerFormat: "#,##0",
    numberFormat: "#,##0.00",
    currencyFormat: "",
    currencyCode: "",
    percentFormat: "0.00%",
    booleanTrueText: "Si",
    booleanFalseText: "No",
    defaultFileName: "informe.xlsx",
    maxRows: 0,
};

/* Registro del host: solo entrega dato para las claves que se le indican. */
function registro(valores, formateados) {
    return {
        getValue: (clave) => (Object.prototype.hasOwnProperty.call(valores, clave) ? valores[clave] : undefined),
        getFormattedValue: (clave) => (Object.prototype.hasOwnProperty.call(formateados || {}, clave) ? formateados[clave] : ""),
    };
}

/* Definicion normalizada de un informe a partir del JSON que se escribe en Power Apps. */
function informe(json) {
    const definiciones = model.parseReportsDefinition(JSON.stringify(json));
    if (definiciones.errors.length > 0) {
        console.log("FAIL el informe de prueba tiene errores -> " + JSON.stringify(definiciones.errors));
        failures += 1;
    }
    return definiciones.reports[0];
}

const control = new ExcelReportPicker();
const leer = (record, column) => control.readColumnValue(record, column);

/* --- 1. Claves de reconocimiento y claves de lectura de una columna -------- */
check(
    "columnLookupKeys empieza por el nombre visible",
    model.columnLookupKeys(columnaImporte),
    ["Importe total", "cr673_importe"]
);
check(
    "columnLookupKeys agrega el nombre logico y el alias despues",
    model.columnLookupKeys(columnaCliente),
    ["Cliente", "cr673_cliente", "clienteComercial"]
);
check(
    "columnLookupKeys no repite la clave cuando el nombre visible es el logico",
    model.columnLookupKeys({ name: "Total", displayName: "Total", dataType: "", alias: "Total" }),
    ["Total"]
);

/* El valor de la celda se pide al reves: primero el nombre logico (FieldName). */
check(
    "columnValueKeys empieza por el nombre logico",
    model.columnValueKeys(columnaImporte),
    ["cr673_importe", "Importe total", "Importe_x0020_total"]
);
check(
    "columnValueKeys agrega el nombre visible y el alias despues",
    model.columnValueKeys(columnaCliente),
    ["cr673_cliente", "Cliente", "clienteComercial"]
);
check(
    "columnValueKeys no repite la clave codificada cuando el nombre no la necesita",
    model.columnValueKeys({ name: "Total", displayName: "Total", dataType: "", alias: "Total" }),
    ["Total"]
);
check("encodeSharePointKey codifica los espacios", model.encodeSharePointKey("Importe total"), "Importe_x0020_total");
check("encodeSharePointKey deja igual un nombre sin caracteres especiales", model.encodeSharePointKey("Cliente"), "Cliente");
check(
    "encodeSharePointKey acumula varias codificaciones",
    model.encodeSharePointKey("Total $ (mes)"),
    "Total_x0020__x0024__x0020__x0028_mes_x0029_"
);

/* --- 2. Lectura de la celda: la clave es el nombre logico ------------------ */
const registroCompleto = registro(
    { "Importe total": 1500, cr673_importe: 7 },
    { "Importe total": "1.500,00 EUR", cr673_importe: "7,00" }
);
check("celda pide el valor con el nombre logico aunque el nombre visible traiga otro dato", leer(registroCompleto, columnaImporte).raw, 7);
check("celda usa el formato de la clave con la que responde el host", leer(registroCompleto, columnaImporte).formatted, "7,00");

const registroSoloVisible = registro({ "Importe total": 1500 }, { "Importe total": "1.500,00 EUR" });
check("celda usa el nombre visible si el nombre logico no responde", leer(registroSoloVisible, columnaImporte).raw, 1500);
check("celda usa el formato del nombre visible cuando solo responde esa clave", leer(registroSoloVisible, columnaImporte).formatted, "1.500,00 EUR");

const registroCodificado = registro({ Importe_x0020_total: 1500 }, { Importe_x0020_total: "1.500,00" });
check("celda usa la forma codificada de SharePoint como ultimo recurso", leer(registroCodificado, columnaImporte).raw, 1500);
check("celda usa el formato de la forma codificada", leer(registroCodificado, columnaImporte).formatted, "1.500,00");

const registroSoloLogico = registro({ cr673_cliente: "ACME S.L." }, { cr673_cliente: "ACME, S.L." });
check("celda usa el nombre logico si el nombre visible no responde", leer(registroSoloLogico, columnaCliente).raw, "ACME S.L.");
check("celda usa el formato de la clave que responde", leer(registroSoloLogico, columnaCliente).formatted, "ACME, S.L.");

const registroVisibleVacio = registro({ Cliente: "", cr673_cliente: "ACME S.L." }, {});
check("celda usa el nombre logico si el nombre visible esta vacio", leer(registroVisibleVacio, columnaCliente).raw, "ACME S.L.");

const registroSoloAlias = registro({ clienteComercial: "ACME S.L." }, {});
check("celda usa el alias si no responde el nombre visible ni el logico", leer(registroSoloAlias, columnaCliente).raw, "ACME S.L.");

const registroVacio = registro({}, {});
check("celda vacia cuando ninguna clave responde", leer(registroVacio, columnaCliente), { raw: null, formatted: "" });

check(
    "sin nombre visible distinto se lee con el nombre logico",
    leer(registro({ cr673_estado: 894250000 }, { cr673_estado: "Programada" }), columnaEstado),
    { raw: 894250000, formatted: "Programada" }
);

/* --- 3. Reconocimiento de la columna en el informe ------------------------- */
const informeVacio = informe({ x: { nombre: "X" } });
check("resolveColumnName reconoce la columna por su nombre visible", model.resolveColumnName("Importe total", tabla, informeVacio), "cr673_importe");
check("resolveColumnName ignora mayusculas y acentos", model.resolveColumnName("TELEFONO FIJO", tabla, informeVacio), "cr673_telefono");
check("resolveColumnName reconoce la columna por su nombre logico", model.resolveColumnName("cr673_cliente", tabla, informeVacio), "cr673_cliente");
check("resolveColumnName reconoce la columna por su alias", model.resolveColumnName("clienteComercial", tabla, informeVacio), "cr673_cliente");
check("resolveColumnName devuelve vacio si la columna no existe", model.resolveColumnName("no existe", tabla, informeVacio), "");

/* --- 4. Informe escrito con nombres visibles ------------------------------- */
const informeVisible = informe({
    ventas: {
        nombre: "Ventas del periodo",
        columnas: "Importe total, Ciudad",
        titulos: { Ciudad: "Poblacion" },
        tipos: { "Importe total": "moneda" },
        formatos: { "Importe total": "#,##0.00 EUR" },
    },
});
const planVisible = model.buildPlan(tabla, informeVisible, opciones);
check("el informe con nombres visibles no genera errores", planVisible.errors, []);
check("el informe con nombres visibles no genera avisos", planVisible.warnings, []);
check("las columnas declaradas por su nombre visible se resuelven a su nombre logico", planVisible.columns.map((column) => column.name), ["cr673_importe", "cr673_ciudad"]);
check("el encabezado predeterminado es el nombre visible", planVisible.columns[0].title, "Importe total");
check("el titulo declarado por nombre visible se aplica", planVisible.columns[1].title, "Poblacion");
check("el tipo declarado por nombre visible se aplica", planVisible.columns[0].type, "moneda");
check("el formato declarado por nombre visible se aplica", planVisible.columns[0].format, "#,##0.00 EUR");
check("la columna del informe recuerda el nombre visible que se escribio", planVisible.columns[0].requested, "Importe total");

/* Extremo a extremo: informe escrito con el nombre visible, celda leida con el logico. */
const columnaImportePlan = tabla.columns.find((column) => column.name === planVisible.columns[0].name);
check("la primera clave de lectura de la columna es su nombre logico", model.columnValueKeys(columnaImportePlan)[0], planVisible.columns[0].name);
const registroHost = registro({ cr673_importe: 1500 }, { cr673_importe: "1.500,00 EUR" });
check("el informe escrito con el nombre visible lee la celda con el nombre logico", leer(registroHost, columnaImportePlan).raw, 1500);

const informeLogico = informe({
    ventas: {
        nombre: "Ventas del periodo",
        columnas: "cr673_importe, cr673_cliente",
        titulos: { cr673_importe: "Total", Cliente: "Razon social" },
        tipos: { cr673_importe: "moneda" },
    },
});
const planLogico = model.buildPlan(tabla, informeLogico, opciones);
check("el informe escrito con nombres logicos sigue resolviendo las columnas", planLogico.columns.map((column) => column.name), ["cr673_importe", "cr673_cliente"]);
check("el titulo declarado por nombre logico se aplica", planLogico.columns[0].title, "Total");
check("el titulo declarado por nombre visible se aplica sobre columnas logicas", planLogico.columns[1].title, "Razon social");

const informeMezclado = informe({
    ventas: {
        nombre: "Ventas",
        columnas: "cr673_importe",
        titulos: { "Importe total": "Total facturado" },
        formatos: { cr673_importe: "#,##0" },
    },
});
const planMezclado = model.buildPlan(tabla, informeMezclado, opciones);
check("el titulo por nombre visible y el formato por nombre logico conviven", [planMezclado.columns[0].title, planMezclado.columns[0].format], ["Total facturado", "#,##0"]);

expectedOutput();
