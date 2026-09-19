/**
 * Fecha: 2026-09-18
 * Descripcion: Modelo del exportador de informes a Excel. Concentra la logica
 * pura (sin React ni API de PCF): lectura de la definicion JSON de informes,
 * valores de filtros entrantes, resolucion de columnas del dataset, deteccion
 * del tipo de dato, conversion de valores, filtros dinamicos y calculo de los
 * formatos nativos de Excel.
 */

/** Tipos de dato que el exportador reconoce y sabe formatear. */
export type ReportColumnType =
    | "texto"
    | "entero"
    | "numero"
    | "moneda"
    | "porcentaje"
    | "fecha"
    | "fechaHora"
    | "hora"
    | "booleano";

export const REPORT_COLUMN_TYPES: ReportColumnType[] = [
    "texto",
    "entero",
    "numero",
    "moneda",
    "porcentaje",
    "fecha",
    "fechaHora",
    "hora",
    "booleano",
];

/** Operadores admitidos en las reglas de filtro de cada informe. */
export type FilterOperator = "=" | "<>" | ">" | ">=" | "<" | "<=" | "contiene" | "empieza" | "termina" | "entre";

const OPERATOR_ALIASES: Record<string, FilterOperator> = {
    "=": "=",
    "==": "=",
    igual: "=",
    eq: "=",
    "<>": "<>",
    "!=": "<>",
    distinto: "<>",
    dif: "<>",
    ne: "<>",
    ">": ">",
    mayor: ">",
    ">=": ">=",
    "=>": ">=",
    "<": "<",
    menor: "<",
    "<=": "<=",
    "=<": "<=",
    contiene: "contiene",
    contains: "contiene",
    empieza: "empieza",
    comienza: "empieza",
    empiezacon: "empieza",
    termina: "termina",
    finaliza: "termina",
    terminacon: "termina",
    entre: "entre",
    between: "entre",
};

const OPERATOR_TEXT: Record<FilterOperator, string> = {
    "=": "igual a",
    "<>": "distinto de",
    ">": "mayor que",
    ">=": "mayor o igual que",
    "<": "menor que",
    "<=": "menor o igual que",
    contiene: "contiene",
    empieza: "empieza con",
    termina: "termina con",
    entre: "entre",
};

/** Pistas en el nombre del filtro que definen el operador cuando no se indica. */
const FROM_HINTS = ["inicio", "desde", "inicial", "from", "start", "min", "menor"];
const TO_HINTS = ["fin", "final", "hasta", "to", "end", "max", "mayor"];

export const MIN_COLUMN_WIDTH = 8;
export const MAX_COLUMN_WIDTH = 60;
export const TEXT_FORMAT = "@";

/** Regla de filtro normalizada de un informe. */
export interface IReportFilterRule {
    /** Texto original de la regla, se usa en los mensajes al usuario. */
    raw: string;
    /** Columna solicitada; vacio cuando la regla se resuelve por heuristica. */
    column: string;
    operator: FilterOperator;
    /** Clave del valor en la propiedad de valores de filtros. */
    valueKey: string;
    /** Segunda clave para el operador "entre". */
    valueKey2: string;
    /** Valor literal indicado en la regla; tiene prioridad sobre la clave. */
    literal: string;
    /** Segundo valor literal para el operador "entre". */
    literal2: string;
}

/** Definicion normalizada de un informe. */
export interface IReportDefinition {
    key: string;
    name: string;
    description: string;
    /** Columnas solicitadas; vacio significa todas las columnas enlazadas. */
    columns: string[];
    titles: Record<string, string>;
    types: Record<string, ReportColumnType>;
    formats: Record<string, string>;
    fileName: string;
    sheetName: string;
    filters: IReportFilterRule[];
    sortBy: string;
    sortDescending: boolean;
}

/** Opciones globales tomadas de las propiedades del control. */
export interface IReportOptions {
    dateFormat: string;
    dateTimeFormat: string;
    timeFormat: string;
    integerFormat: string;
    numberFormat: string;
    currencyFormat: string;
    currencyCode: string;
    percentFormat: string;
    booleanTrueText: string;
    booleanFalseText: string;
    defaultFileName: string;
    maxRows: number;
}

/** Columna tal como la informa el conjunto de datos enlazado. */
export interface IDatasetColumn {
    name: string;
    displayName: string;
    dataType: string;
    alias: string;
}

/** Fila del conjunto de datos con el valor nativo y el formateado por el host. */
export interface IDatasetRow {
    recordId: string;
    raw: Record<string, unknown>;
    formatted: Record<string, string>;
}

/** Columna ya resuelta y lista para escribirse en el libro de Excel. */
export interface IExportColumn {
    name: string;
    requested: string;
    title: string;
    type: ReportColumnType;
    format: string;
    width: number;
}

/** Plan de exportacion de un informe: columnas resueltas, errores y avisos. */
export interface IReportPlan {
    definition: IReportDefinition;
    columns: IExportColumn[];
    errors: string[];
    warnings: string[];
}

/** Resultado de aplicar los filtros dinamicos. */
export interface IFilterResult {
    rows: IDatasetRow[];
    applied: string[];
    warnings: string[];
}

/** Quita tildes, espacios sobrantes y pasa a minusculas para comparar textos. */
export function normalizeText(value: string): string {
    return value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();
}

/** Convierte un valor en texto seguro para mensajes. */
export function textOf(value: unknown): string {
    if (value === null || value === undefined) return "";
    if (typeof value === "string") return value;
    if (typeof value === "number" || typeof value === "boolean") return String(value);
    return JSON.stringify(value) ?? "";
}

/**
 * Convierte un valor en numero. Admite puntos o comas como separador de miles y
 * de decimales, simbolos de moneda y el signo de porcentaje.
 */
export function parseNumber(value: unknown): number | null {
    if (typeof value === "number") return Number.isFinite(value) ? value : null;
    if (typeof value !== "string") return null;
    let text = value.replace(/[\s\u00a0]/g, "").replace(/[$€£¥]/g, "");
    if (!text) return null;
    let negative = false;
    if (/^\(.*\)$/.test(text)) {
        negative = true;
        text = text.slice(1, -1);
    }
    if (text.endsWith("%")) text = text.slice(0, -1);
    if (text.startsWith("-")) {
        negative = true;
        text = text.slice(1);
    } else if (text.startsWith("+")) {
        text = text.slice(1);
    }
    const dots = (text.match(/\./g) ?? []).length;
    const commas = (text.match(/,/g) ?? []).length;
    if (dots > 0 && commas > 0) {
        if (text.lastIndexOf(",") > text.lastIndexOf(".")) text = text.replace(/\./g, "").replace(",", ".");
        else text = text.replace(/,/g, "");
    } else if (commas === 1 && /^\d{1,3}(,\d{3})+$/.test(text)) {
        text = text.replace(/,/g, "");
    } else if (commas > 0) {
        text = text.replace(/,/g, ".");
    } else if (dots === 1 && /^\d{1,3}(\.\d{3})+$/.test(text)) {
        text = text.replace(/\./g, "");
    }
    if (!/^\d+(\.\d+)?$/.test(text)) return null;
    const parsed = Number(text);
    if (!Number.isFinite(parsed)) return null;
    return negative ? -parsed : parsed;
}

function buildDate(year: number, month: number, day: number, hours: number, minutes: number, seconds: number): Date | null {
    if (month < 1 || month > 12 || day < 1 || day > 31) return null;
    const date = new Date(year, month - 1, day, hours, minutes, seconds, 0);
    if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
    return date;
}

/** Orden de los componentes de fecha segun el formato configurado (d, m, y). */
function dateOrderOf(format: string): string {
    const digits = normalizeText(format).replace(/[^dmy]/g, "");
    if (digits.length < 3) return "dmy";
    if (digits.startsWith("y")) return "ymd";
    if (digits.startsWith("m")) return "mdy";
    return "dmy";
}

/** Serial de Excel (sistema 1900) de una fecha, con la hora local como reloj. */
export function dateToExcelSerial(date: Date): number {
    const epoch = Date.UTC(1899, 11, 30);
    const wallClock = Date.UTC(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        date.getHours(),
        date.getMinutes(),
        date.getSeconds(),
        0
    );
    return (wallClock - epoch) / 86400000;
}

/** Fecha local a partir de un serial de Excel (sistema 1900). */
export function serialToDate(serial: number): Date {
    const epoch = Date.UTC(1899, 11, 30);
    const utc = new Date(epoch + Math.round(serial * 86400000));
    return new Date(
        utc.getUTCFullYear(),
        utc.getUTCMonth(),
        utc.getUTCDate(),
        utc.getUTCHours(),
        utc.getUTCMinutes(),
        utc.getUTCSeconds(),
        0
    );
}

/**
 * Convierte un valor en fecha. Admite objetos Date, seriales de Excel y textos
 * ISO o con el separador del formato configurado (por ejemplo 18/09/2026).
 */
export function parseDateValue(value: unknown, formatHint: string): Date | null {
    if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
    if (typeof value === "number" && Number.isFinite(value)) return value > 0 ? serialToDate(value) : null;
    if (typeof value !== "string") return null;
    const text = value.trim();
    if (!text) return null;
    const isoDate = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
    if (isoDate) return buildDate(Number(isoDate[1]), Number(isoDate[2]), Number(isoDate[3]), 0, 0, 0);
    const isoDateTime = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?(?:\.\d+)?$/.exec(text);
    if (isoDateTime) {
        return buildDate(
            Number(isoDateTime[1]),
            Number(isoDateTime[2]),
            Number(isoDateTime[3]),
            Number(isoDateTime[4]),
            Number(isoDateTime[5]),
            Number(isoDateTime[6] ?? "0")
        );
    }
    const parsedIso = new Date(text);
    if (/^\d{4}-\d{2}-\d{2}T/.test(text) && !Number.isNaN(parsedIso.getTime())) return parsedIso;
    const parts = /^(\d{1,4})[/\-.](\d{1,2})[/\-.](\d{1,4})(?:[T ](\d{1,2}):(\d{2})(?::(\d{2}))?\s*(am|pm|a\.m\.|p\.m\.)?)?$/i.exec(text);
    if (!parts) return null;
    const first = Number(parts[1]);
    const second = Number(parts[2]);
    const third = Number(parts[3]);
    let year = third;
    let month = second;
    let day = first;
    if (parts[1].length === 4) {
        year = first;
        month = second;
        day = third;
    } else if (first > 12 && second <= 12) {
        day = first;
        month = second;
    } else if (second > 12 && first <= 12) {
        day = second;
        month = first;
    } else if (dateOrderOf(formatHint) === "mdy") {
        day = second;
        month = first;
    }
    if (year < 100) year = 2000 + year;
    let hours = Number(parts[4] ?? "0");
    const minutes = Number(parts[5] ?? "0");
    const seconds = Number(parts[6] ?? "0");
    const meridiem = (parts[7] ?? "").toLowerCase().replace(/\./g, "");
    if (meridiem.startsWith("p") && hours < 12) hours += 12;
    if (meridiem.startsWith("a") && hours === 12) hours = 0;
    return buildDate(year, month, day, hours, minutes, seconds);
}

/** Formato nativo de Excel por defecto para cada tipo de dato. */
export function defaultFormat(type: ReportColumnType, options: IReportOptions): string {
    switch (type) {
        case "entero":
            return options.integerFormat || "#,##0";
        case "numero":
            return options.numberFormat || "#,##0.00";
        case "moneda":
            if (options.currencyFormat) return options.currencyFormat;
            return options.currencyCode
                ? `#,##0.00 "${options.currencyCode.replace(/"/g, "")}"`
                : '"$" #,##0.00';
        case "porcentaje":
            return options.percentFormat || "0.00%";
        case "fecha":
            return options.dateFormat || "dd/mm/yyyy";
        case "fechaHora":
            return options.dateTimeFormat || "dd/mm/yyyy hh:mm";
        case "hora":
            return options.timeFormat || "hh:mm";
        default:
            return TEXT_FORMAT;
    }
}

function typeFromDataType(dataType: string): ReportColumnType | null {
    const value = normalizeText(dataType).replace(/\s/g, "");
    if (!value) return null;
    if (value.includes("dateandtime")) return value.includes("dateonly") ? "fecha" : "fechaHora";
    if (value.includes("currency") || value.includes("money")) return "moneda";
    if (value.startsWith("whole")) return "entero";
    if (value.startsWith("decimal") || value.startsWith("fp") || value.includes("float") || value.includes("double")) return "numero";
    if (value.includes("twooptions") || value === "boolean") return "booleano";
    if (value.includes("optionset") || value.includes("multiselect")) return "texto";
    if (value.includes("lookup")) return "texto";
    if (value.includes("singleline") || value.includes("multiple")) return "texto";
    if (value.includes("email") || value.includes("phone") || value.includes("url") || value.includes("ticker")) return "texto";
    return null;
}

const TRUE_TOKENS = ["true", "verdadero", "si", "yes", "y", "1", "x"];
const FALSE_TOKENS = ["false", "falso", "no", "n", "0"];

function isBooleanToken(value: string): boolean {
    const token = normalizeText(value);
    return TRUE_TOKENS.includes(token) || FALSE_TOKENS.includes(token);
}

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}([T ]\d{2}:\d{2}(:\d{2})?)?/;

/**
 * Detecta el tipo de dato de una columna. Primero revisa el tipo informado por
 * el host y, si no es concluyente, deduce el tipo a partir de los valores.
 */
export function detectColumnType(dataType: string, samples: IDatasetRow[], columnName: string): ReportColumnType {
    const fromMetadata = typeFromDataType(dataType);
    if (fromMetadata && fromMetadata !== "texto") return fromMetadata;
    let count = 0;
    let dates = 0;
    let dateTimes = 0;
    let numbers = 0;
    let integers = 0;
    let booleans = 0;
    let percents = 0;
    let currencies = 0;
    let isoDates = 0;
    let texts = 0;
    samples.forEach((row) => {
        const raw = row.raw[columnName];
        const formatted = row.formatted[columnName] ?? "";
        if (raw === null || raw === undefined || raw === "") {
            if (!formatted) return;
        }
        count += 1;
        if (raw instanceof Date) {
            dates += 1;
            if (raw.getHours() !== 0 || raw.getMinutes() !== 0 || raw.getSeconds() !== 0) dateTimes += 1;
            return;
        }
        if (typeof raw === "number") {
            numbers += 1;
            if (Number.isInteger(raw)) integers += 1;
            return;
        }
        if (typeof raw === "boolean") {
            booleans += 1;
            return;
        }
        const text = typeof raw === "string" && raw ? raw : formatted;
        if (!text) {
            texts += 1;
            return;
        }
        if (text.includes("%") && parseNumber(text) !== null) {
            percents += 1;
            return;
        }
        if (/[$€£¥]/.test(text) && parseNumber(text) !== null) {
            currencies += 1;
            return;
        }
        if (ISO_DATE_PATTERN.test(text.trim()) && parseDateValue(text, "") !== null) {
            isoDates += 1;
            if (/[T ]\d{2}:\d{2}/.test(text) && !/([T ]00:00(:00)?)$/.test(text.trim())) dateTimes += 1;
            return;
        }
        if (parseNumber(text) !== null && !isBooleanToken(text)) {
            numbers += 1;
            if (/^\d+$/.test(text.trim())) integers += 1;
            return;
        }
        if (isBooleanToken(text)) {
            booleans += 1;
            return;
        }
        texts += 1;
    });
    if (count === 0) return fromMetadata ?? "texto";
    const majority = count * 0.6;
    if (dates > 0 && dates >= majority) return dateTimes > 0 ? "fechaHora" : "fecha";
    if (isoDates > 0 && isoDates >= majority) return dateTimes > 0 ? "fechaHora" : "fecha";
    if (booleans > 0 && booleans >= majority) return "booleano";
    if (percents > 0 && percents >= majority) return "porcentaje";
    if (currencies > 0 && currencies >= majority) return "moneda";
    if (numbers > 0 && numbers >= majority) return integers === numbers ? "entero" : "numero";
    return "texto";
}

/**
 * Convierte el valor de una celda al valor nativo que Excel entiende: serial de
 * fecha, numero o texto. Los booleanos se escriben como texto configurable.
 */
export function toCellValue(
    raw: unknown,
    formatted: string,
    type: ReportColumnType,
    options: IReportOptions
): string | number {
    const source = raw === null || raw === undefined || raw === "" ? formatted : raw;
    switch (type) {
        case "fecha":
        case "fechaHora":
        case "hora": {
            const hint = type === "fecha" ? options.dateFormat : type === "hora" ? options.timeFormat : options.dateTimeFormat;
            const date = parseDateValue(source, hint);
            if (!date) return textOf(source) || textOf(raw);
            const serial = dateToExcelSerial(date);
            if (type === "hora") return serial - Math.floor(serial);
            return serial;
        }
        case "entero":
        case "numero":
        case "moneda":
        case "porcentaje": {
            const number = parseNumber(source);
            if (number === null) return textOf(source) || textOf(raw);
            if (type === "porcentaje" && typeof raw === "string" && raw.includes("%")) return number / 100;
            return number;
        }
        case "booleano": {
            const token = typeof raw === "boolean" ? String(raw) : textOf(source);
            const normalized = normalizeText(token);
            if (TRUE_TOKENS.includes(normalized)) return options.booleanTrueText || "Si";
            if (FALSE_TOKENS.includes(normalized)) return options.booleanFalseText || "No";
            return token;
        }
        default: {
            if (typeof raw === "string" && raw) return raw;
            if (typeof raw === "number" || typeof raw === "boolean") return String(raw);
            return formatted;
        }
    }
}

/** Texto que se usa para estimar el ancho de una columna. */
export function widthSampleText(raw: unknown, formatted: string, type: ReportColumnType): string {
    if (type === "texto") {
        if (typeof raw === "string" && raw) return raw;
        return formatted || textOf(raw);
    }
    return formatted || textOf(raw);
}

/** Ancho sugerido de la columna segun el titulo y el contenido. */
export function estimateColumnWidth(title: string, rows: IDatasetRow[], column: IExportColumn, sampleLimit = 200): number {
    let width = title.length;
    const limit = Math.min(rows.length, sampleLimit);
    for (let index = 0; index < limit; index += 1) {
        const row = rows[index];
        const sample = widthSampleText(row.raw[column.name], row.formatted[column.name] ?? "", column.type);
        if (sample.length > width) width = sample.length;
    }
    return Math.min(MAX_COLUMN_WIDTH, Math.max(MIN_COLUMN_WIDTH, width + 2));
}

function readText(value: unknown): string {
    if (typeof value === "string") return value.trim();
    if (typeof value === "number" || typeof value === "boolean") return String(value);
    return "";
}

function readStringList(value: unknown): string[] {
    if (Array.isArray(value)) return value.map((item) => readText(item)).filter((item) => !!item);
    const text = readText(value);
    if (!text) return [];
    return text
        .split(/[,;]/)
        .map((item) => item.trim())
        .filter((item) => !!item);
}

function readStringMap(value: unknown): Record<string, string> {
    const map: Record<string, string> = Object.create(null) as Record<string, string>;
    if (!value || typeof value !== "object" || Array.isArray(value)) return map;
    Object.entries(value as Record<string, unknown>).forEach(([key, item]) => {
        const text = readText(item);
        if (text) map[key] = text;
    });
    return map;
}

function readBoolean(value: unknown, fallback: boolean): boolean {
    if (typeof value === "boolean") return value;
    if (typeof value === "number") return value !== 0;
    const text = normalizeText(readText(value));
    if (["true", "si", "yes", "1", "verdadero"].includes(text)) return true;
    if (["false", "no", "0", "falso"].includes(text)) return false;
    return fallback;
}

function readTypeMap(value: unknown, reportKey: string, errors: string[]): Record<string, ReportColumnType> {
    const map: Record<string, ReportColumnType> = Object.create(null) as Record<string, ReportColumnType>;
    if (!value || typeof value !== "object" || Array.isArray(value)) return map;
    Object.entries(value as Record<string, unknown>).forEach(([key, item]) => {
        const token = normalizeText(readText(item)).replace(/[\s_-]/g, "");
        const type = REPORT_COLUMN_TYPES.find((candidate) => normalizeText(candidate) === token);
        if (!type) {
            errors.push(
                `El informe "${reportKey}" define el tipo "${readText(item)}" para la columna "${key}", que no es valido. Use uno de: ${REPORT_COLUMN_TYPES.join(", ")}.`
            );
            return;
        }
        map[key] = type;
    });
    return map;
}

/**
 * Lee una clave de un mapa declarado por el usuario sin recorrer el prototipo:
 * evita que nombres de campo como "constructor" o "toString" devuelvan
 * funciones heredadas en lugar del valor declarado en el informe.
 */
function readOwnValue<T>(map: Record<string, T>, key: string): T | undefined {
    if (!key) return undefined;
    return Object.prototype.hasOwnProperty.call(map, key) ? map[key] : undefined;
}

/**
 * Quita de un texto los caracteres que Excel y el XML no admiten: los de
 * control (salvo tabulador y saltos de linea), los de la zona 0x7F-0x9F y los
 * no caracteres 0xFFFE y 0xFFFF. Se recorre el texto caracter a caracter para
 * no escribir una expresion regular con caracteres de control.
 */
export function stripUnsafeChars(value: string, replacement = ""): string {
    let result = "";
    for (let index = 0; index < value.length; index += 1) {
        const code = value.charCodeAt(index);
        const noValido =
            (code < 0x20 && code !== 0x09 && code !== 0x0a && code !== 0x0d) ||
            (code >= 0x7f && code <= 0x9f) ||
            code === 0xfffe ||
            code === 0xffff;
        result += noValido ? replacement : value.charAt(index);
    }
    return result;
}

const STRIP_HINTS = ["inicial", "inicio", "desde", "final", "hasta", "start", "end", "valor", "value", "filtro", "filter", "texto", "seleccion", "menor", "mayor"];

/** Quita de un token de filtro las palabras de direccion y de origen del valor. */
export function filterNameBase(token: string): string {
    let result = normalizeText(token).replace(/[\s_-]/g, "");
    STRIP_HINTS.forEach((word) => {
        if (result.endsWith(word) && result.length > word.length) result = result.slice(0, -word.length);
    });
    return result;
}

/** Direccion sugerida por el nombre del filtro cuando no hay operador explicito. */
export function filterDirection(token: string): "from" | "to" | "" {
    const key = normalizeText(token).replace(/[\s_-]/g, "");
    if (FROM_HINTS.some((hint) => key.endsWith(hint))) return "from";
    if (TO_HINTS.some((hint) => key.endsWith(hint))) return "to";
    return "";
}

function readLiteral(token: string): string {
    const quoted = /^["'](.+)["']$/.exec(token);
    if (quoted) return quoted[1];
    if (/^-?\d+([.,]\d+)?$/.test(token)) return token;
    if (ISO_DATE_PATTERN.test(token)) return token;
    return "";
}

function parseFilterRuleText(text: string, reportKey: string, errors: string[]): IReportFilterRule | null {
    const trimmed = text.trim();
    if (!trimmed) return null;
    const tokens = trimmed.split(/\s+/);
    if (tokens.length === 1) {
        return { raw: trimmed, column: "", operator: "=", valueKey: tokens[0], valueKey2: "", literal: "", literal2: "" };
    }
    const operator = OPERATOR_ALIASES[normalizeText(tokens[1]).replace(/[^<>=!a-z]/g, "")];
    if (!operator) {
        errors.push(
            `La regla de filtro "${trimmed}" del informe "${reportKey}" no usa un operador valido. Ejemplos: "fecha >= fechaInicio", "cliente contiene textoCliente", "fecha entre fechaInicio y fechaFin".`
        );
        return null;
    }
    const valueToken = tokens[2] ?? "";
    if (!valueToken) {
        errors.push(`La regla de filtro "${trimmed}" del informe "${reportKey}" no indica el valor que se va a comparar.`);
        return null;
    }
    const literal = readLiteral(valueToken);
    const rule: IReportFilterRule = {
        raw: trimmed,
        column: tokens[0],
        operator,
        valueKey: literal ? "" : valueToken,
        valueKey2: "",
        literal,
        literal2: "",
    };
    if (operator === "entre") {
        const connector = tokens[3] ?? "";
        const second = normalizeText(connector) === "y" ? tokens[4] : tokens[3];
        if (!second) {
            errors.push(`La regla "entre" del informe "${reportKey}" necesita dos valores, por ejemplo "fecha entre fechaInicio y fechaFin".`);
            return null;
        }
        rule.literal2 = readLiteral(second);
        rule.valueKey2 = rule.literal2 ? "" : second;
    }
    return rule;
}

function parseFilterRuleObject(source: Record<string, unknown>, reportKey: string, errors: string[]): IReportFilterRule | null {
    const column = readText(source.columna ?? source.column ?? source.campo ?? source.field);
    const operatorToken = OPERATOR_ALIASES[normalizeText(readText(source.operador ?? source.operator ?? source.op ?? "=")).replace(/[^<>=!a-z]/g, "")];
    const valueKey = readText(source.valor ?? source.value ?? source.clave ?? source.key ?? source.filtro);
    const valueKey2 = readText(source.valor2 ?? source.value2);
    const fromKey = readText(source.desde ?? source.from ?? source.inicio);
    const toKey = readText(source.hasta ?? source.fin ?? source.to);
    const operator = operatorToken ?? (fromKey && toKey ? "entre" : "=");
    const primary = fromKey || valueKey;
    const secondary = toKey || valueKey2;
    const raw = JSON.stringify(source);
    if (!primary && !column) {
        errors.push(
            `Una regla de filtro del informe "${reportKey}" no indica columna ni valor. Ejemplo: { "columna": "col02", "operador": "entre", "desde": "fechaInicio", "hasta": "fechaFin" }.`
        );
        return null;
    }
    if (!primary) {
        errors.push(`La regla de filtro ${raw} del informe "${reportKey}" no indica el valor que se va a comparar.`);
        return null;
    }
    return { raw, column, operator, valueKey: primary, valueKey2: secondary, literal: "", literal2: "" };
}

function parseFilterRules(value: unknown, reportKey: string, errors: string[]): IReportFilterRule[] {
    if (value === null || value === undefined || value === "") return [];
    if (!Array.isArray(value)) {
        errors.push(
            `La propiedad "filtros" del informe "${reportKey}" debe ser una lista. Ejemplo: ["fechaInicio", "fechaFin"] o [{ "columna": "fecha", "operador": "entre", "desde": "fechaInicio", "hasta": "fechaFin" }].`
        );
        return [];
    }
    const rules: IReportFilterRule[] = [];
    value.forEach((item) => {
        if (typeof item === "string") {
            const rule = parseFilterRuleText(item, reportKey, errors);
            if (rule) rules.push(rule);
            return;
        }
        if (item && typeof item === "object" && !Array.isArray(item)) {
            const rule = parseFilterRuleObject(item as Record<string, unknown>, reportKey, errors);
            if (rule) rules.push(rule);
            return;
        }
        errors.push(`La definicion del informe "${reportKey}" contiene una regla de filtro que no es texto ni objeto.`);
    });
    return rules;
}

function buildReportDefinition(key: string, source: Record<string, unknown>, errors: string[]): IReportDefinition {
    return {
        key,
        name: readText(source.nombre ?? source.name ?? source.titulo) || key,
        description: readText(source.descripcion ?? source.description),
        columns: readStringList(source.columnas ?? source.columns),
        titles: readStringMap(source.titulos ?? source.titles ?? source.encabezados),
        types: readTypeMap(source.tipos ?? source.types, key, errors),
        formats: readStringMap(source.formatos ?? source.formats),
        fileName: readText(source.archivo ?? source.fileName ?? source.nombreArchivo),
        sheetName: readText(source.hoja ?? source.sheetName ?? source.nombreHoja),
        filters: parseFilterRules(source.filtros ?? source.filters, key, errors),
        sortBy: readText(source.ordenarPor ?? source.sortBy),
        sortDescending: readBoolean(source.ordenDescendente ?? source.sortDescending, false),
    };
}

/**
 * Lee la propiedad de definicion de informes. Acepta un objeto con un informe
 * por clave, donde cada informe declara nombre, columnas, archivo y filtros.
 */
export function parseReportsDefinition(text: string): { reports: IReportDefinition[]; errors: string[] } {
    const errors: string[] = [];
    const trimmed = (text ?? "").trim();
    if (!trimmed) return { reports: [], errors };
    let parsed: unknown;
    try {
        parsed = JSON.parse(trimmed) as unknown;
    } catch (error) {
        const detail = error instanceof Error ? error.message : String(error);
        errors.push(`La definicion de informes no es un JSON valido: ${detail}`);
        return { reports: [], errors };
    }
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        errors.push(
            'La definicion de informes debe ser un objeto con un informe por clave. Ejemplo: { "ventas": { "nombre": "Informe de ventas", "columnas": ["col01", "col02"], "archivo": "ventas.xlsx" } }'
        );
        return { reports: [], errors };
    }
    const entries = Object.entries(parsed as Record<string, unknown>);
    if (entries.length === 0) {
        errors.push("La definicion de informes no contiene ningun informe.");
        return { reports: [], errors };
    }
    const reports: IReportDefinition[] = [];
    entries.forEach(([key, value]) => {
        if (!value || typeof value !== "object" || Array.isArray(value)) {
            errors.push(`El informe "${key}" debe ser un objeto con sus propiedades. Ejemplo: { "nombre": "Informe", "columnas": ["col01"], "archivo": "informe.xlsx" }`);
            return;
        }
        reports.push(buildReportDefinition(key, value as Record<string, unknown>, errors));
    });
    return { reports, errors };
}

/**
 * Lee la propiedad de valores de filtros. Admite JSON ({"fechaInicio":"2026-01-01"})
 * o pares clave=valor separados por punto y coma (fechaInicio=2026-01-01;ciudad=Bogota).
 */
export function parseFilterValues(text: string): { values: Record<string, string>; errors: string[] } {
    const errors: string[] = [];
    const values: Record<string, string> = Object.create(null) as Record<string, string>;
    const trimmed = (text ?? "").trim();
    if (!trimmed) return { values, errors };
    if (trimmed.startsWith("{")) {
        let parsed: unknown;
        try {
            parsed = JSON.parse(trimmed) as unknown;
        } catch (error) {
            const detail = error instanceof Error ? error.message : String(error);
            errors.push(`Los valores de filtros no son un JSON valido: ${detail}`);
            return { values, errors };
        }
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
            errors.push('Los valores de filtros deben ser un objeto JSON. Ejemplo: { "fechaInicio": "2026-01-01", "fechaFin": "2026-03-31" }');
            return { values, errors };
        }
        Object.entries(parsed as Record<string, unknown>).forEach(([key, value]) => {
            if (Array.isArray(value)) {
                values[key] = value.map((item) => readText(item)).filter((item) => !!item).join(";");
                return;
            }
            values[key] = readText(value);
        });
        return { values, errors };
    }
    trimmed.split(/[;\n]/).forEach((pair) => {
        const separator = pair.indexOf("=");
        if (separator < 0) {
            if (pair.trim()) errors.push(`El valor de filtro "${pair.trim()}" no tiene el formato clave=valor.`);
            return;
        }
        const key = pair.slice(0, separator).trim();
        const value = pair.slice(separator + 1).trim();
        if (key) values[key] = value;
    });
    return { values, errors };
}

/** Conjunto de datos ya leido del control: columnas y filas. */
export interface IReportTable {
    columns: IDatasetColumn[];
    rows: IDatasetRow[];
}

/** Busca el nombre real de una columna a partir de lo solicitado en el informe. */
export function resolveColumnName(requested: string, table: IReportTable, definition: IReportDefinition): string {
    const target = normalizeText(requested);
    if (!target) return "";
    const direct = table.columns.find((column) => normalizeText(column.name) === target);
    if (direct) return direct.name;
    const byDisplay = table.columns.find((column) => normalizeText(column.displayName) === target);
    if (byDisplay) return byDisplay.name;
    const byAlias = table.columns.find((column) => normalizeText(column.alias) === target);
    if (byAlias) return byAlias.name;
    const titledKey = Object.keys(definition.titles).find((key) => normalizeText(definition.titles[key]) === target);
    if (titledKey) {
        const byTitle = table.columns.find((column) => normalizeText(column.name) === normalizeText(titledKey));
        if (byTitle) return byTitle.name;
    }
    return "";
}

function columnTypeOf(columnName: string, table: IReportTable): ReportColumnType {
    const meta = table.columns.find((column) => column.name === columnName);
    return detectColumnType(meta ? meta.dataType : "", table.rows, columnName);
}

function rowHasValue(row: IDatasetRow, name: string): boolean {
    const raw = row.raw[name];
    if (raw !== null && raw !== undefined && raw !== "") return true;
    return !!(row.formatted[name] ?? "");
}

/**
 * Columnas del conjunto de datos que tienen datos en los registros cargados.
 * Sirve para no exportar los campos declarados en el manifiesto que el usuario
 * no mapeo; si no hay datos se devuelven todas.
 */
export function columnsWithData(table: IReportTable): IDatasetColumn[] {
    const withData = table.columns.filter((column) => table.rows.some((row) => rowHasValue(row, column.name)));
    return withData.length > 0 ? withData : table.columns;
}

/**
 * Nombres de campo declarados en las definiciones de informes (columnas,
 * titulos, tipos, formatos, filtros y orden). Se usa como respaldo cuando el
 * host no informa las columnas del conjunto de datos enlazado.
 */
export function collectDeclaredFields(definitions: IReportDefinition[]): string[] {
    const names: string[] = [];
    const push = (value: string): void => {
        if (value && !names.includes(value)) names.push(value);
    };
    definitions.forEach((definition) => {
        definition.columns.forEach(push);
        Object.keys(definition.titles).forEach(push);
        Object.keys(definition.types).forEach(push);
        Object.keys(definition.formats).forEach(push);
        definition.filters.forEach((rule) => push(rule.column));
        push(definition.sortBy);
    });
    return names;
}

/**
 * Construye el plan de un informe: resuelve las columnas solicitadas, calcula el
 * tipo de dato y el formato nativo de Excel de cada una y valida la definicion.
 */
export function buildPlan(table: IReportTable, definition: IReportDefinition, options: IReportOptions): IReportPlan {
    const errors: string[] = [];
    const warnings: string[] = [];
    const columns: IExportColumn[] = [];
    if (table.columns.length === 0) {
        errors.push(
            'No hay datos para exportar. Configura la propiedad Datos (JSON) con el resultado de JSON(Tabla) o JSON(Filter(Tabla, ...)).'
        );
        return { definition, columns, errors, warnings };
    }
    const requested = definition.columns.length > 0 ? definition.columns : columnsWithData(table).map((column) => column.name);
    requested.forEach((item) => {
        const name = resolveColumnName(item, table, definition);
        if (!name) {
            warnings.push(`El informe "${definition.name}" pide la columna "${item}", que no esta enlazada en el conjunto de datos.`);
            return;
        }
        if (columns.some((column) => column.name === name)) return;
        const meta = table.columns.find((column) => column.name === name);
        const type = readOwnValue(definition.types, item) ?? readOwnValue(definition.types, name) ?? columnTypeOf(name, table);
        const format = readOwnValue(definition.formats, item) ?? readOwnValue(definition.formats, name) ?? defaultFormat(type, options);
        const displayName = meta ? meta.displayName : "";
        columns.push({
            name,
            requested: item,
            title: readOwnValue(definition.titles, item) ?? readOwnValue(definition.titles, name) ?? (displayName !== "" ? displayName : name),
            type,
            format,
            width: 0,
        });
    });
    if (columns.length === 0) {
        errors.push(
            `El informe "${definition.name}" no tiene columnas validas para exportar. Revisa la propiedad "columnas" del informe o el enlace de campos del control.`
        );
    }
    columns.forEach((column) => {
        column.width = estimateColumnWidth(column.title, table.rows, column);
    });
    return { definition, columns, errors, warnings };
}

interface IResolvedFilter {
    column: string;
    title: string;
    type: ReportColumnType;
    operator: FilterOperator;
    value1: string;
    value2: string;
    description: string;
}

function filterValueValid(value: string, type: ReportColumnType, options: IReportOptions): boolean {
    switch (type) {
        case "fecha":
        case "fechaHora":
        case "hora":
            return parseDateValue(value, options.dateFormat) !== null;
        case "entero":
        case "numero":
        case "moneda":
        case "porcentaje":
            return parseNumber(value) !== null;
        default:
            return true;
    }
}

function describeFilter(filter: IResolvedFilter): string {
    const text = OPERATOR_TEXT[filter.operator];
    return filter.operator === "entre"
        ? `${filter.title} ${text} ${filter.value1} y ${filter.value2}`
        : `${filter.title} ${text} ${filter.value1}`;
}

/**
 * Asocia una regla de filtro con una columna del informe. Si la regla no indica
 * columna se resuelve por el nombre del filtro y, como ultimo recurso, por el
 * tipo del valor (fechas de inicio y fin sobre la primera columna de fecha).
 */
function resolveFilterRule(
    rule: IReportFilterRule,
    plan: IReportPlan,
    table: IReportTable,
    values: Record<string, string>,
    options: IReportOptions,
    warnings: string[]
): IResolvedFilter | null {
    const literal = rule.literal;
    const keyed = rule.valueKey !== "" ? readOwnValue(values, rule.valueKey) ?? "" : "";
    const literal2 = rule.literal2;
    const keyed2 = rule.valueKey2 !== "" ? readOwnValue(values, rule.valueKey2) ?? "" : "";
    const value1 = literal !== "" ? literal : keyed;
    const value2 = literal2 !== "" ? literal2 : keyed2;
    if (!value1) return null;
    if (rule.operator === "entre" && !value2) return null;
    let columnName = rule.column ? resolveColumnName(rule.column, table, plan.definition) : "";
    let operator = rule.operator;
    if (rule.column && !columnName) {
        warnings.push(`La columna "${rule.column}" del filtro "${rule.raw}" no esta enlazada en el conjunto de datos.`);
        return null;
    }
    if (!columnName) {
        const base = filterNameBase(rule.valueKey);
        const byToken = resolveColumnName(rule.valueKey, table, plan.definition);
        columnName = byToken !== "" ? byToken : base ? resolveColumnName(base, table, plan.definition) : "";
        if (columnName && operator === "=") {
            const direction = filterDirection(rule.valueKey);
            operator = direction === "from" ? ">=" : direction === "to" ? "<=" : "=";
        }
        if (!columnName) {
            const direction = filterDirection(rule.valueKey);
            const dateColumns = plan.columns.filter((column) => column.type === "fecha" || column.type === "fechaHora");
            if (direction && dateColumns.length > 0 && parseDateValue(value1, options.dateFormat) !== null) {
                columnName = dateColumns[0].name;
                operator = direction === "from" ? ">=" : "<=";
            } else {
                warnings.push(
                    `No se pudo asociar el filtro "${rule.raw}" a una columna del informe. Nombra el filtro igual que la columna o usa la forma "columna operador valor".`
                );
                return null;
            }
        }
    }
    const planned = plan.columns.find((column) => column.name === columnName);
    const type = planned ? planned.type : columnTypeOf(columnName, table);
    const title = planned ? planned.title : columnName;
    if (!filterValueValid(value1, type, options) || (operator === "entre" && !filterValueValid(value2, type, options))) {
        warnings.push(
            `El valor "${value1}" del filtro "${rule.raw}" no corresponde al tipo de dato de la columna "${title}" (${type}). El filtro no se aplica.`
        );
        return null;
    }
    const resolved: IResolvedFilter = { column: columnName, title, type, operator, value1, value2, description: "" };
    resolved.description = describeFilter(resolved);
    return resolved;
}

function daySerial(date: Date): number {
    const epoch = Date.UTC(1899, 11, 30);
    return (Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) - epoch) / 86400000;
}

function minuteSerial(date: Date): number {
    return Math.floor(dateToExcelSerial(date) * 1440);
}

function hasTimePart(date: Date): boolean {
    return date.getHours() !== 0 || date.getMinutes() !== 0 || date.getSeconds() !== 0;
}

function compareValues(value: number | string, filter: IResolvedFilter, first: number | string, second: number | string): boolean {
    switch (filter.operator) {
        case "=":
            return value === first;
        case "<>":
            return value !== first;
        case ">":
            return value > first;
        case ">=":
            return value >= first;
        case "<":
            return value < first;
        case "<=":
            return value <= first;
        case "contiene":
            return typeof value === "string" && typeof first === "string" && value.includes(first);
        case "empieza":
            return typeof value === "string" && typeof first === "string" && value.startsWith(first);
        case "termina":
            return typeof value === "string" && typeof first === "string" && value.endsWith(first);
        case "entre":
            return value >= first && value <= second;
        default:
            return true;
    }
}

function rowMatches(row: IDatasetRow, filter: IResolvedFilter, options: IReportOptions): boolean {
    const raw = row.raw[filter.column];
    const formatted = row.formatted[filter.column] ?? "";
    if (filter.type === "fecha" || filter.type === "fechaHora" || filter.type === "hora") {
        const value = parseDateValue(raw, options.dateFormat) ?? parseDateValue(formatted, options.dateFormat);
        const from = parseDateValue(filter.value1, options.dateFormat);
        const to = filter.operator === "entre" ? parseDateValue(filter.value2, options.dateFormat) : null;
        if (!value || !from || (filter.operator === "entre" && !to)) return false;
        if (filter.type === "hora") {
            const valueMinutes = Math.floor((dateToExcelSerial(value) % 1) * 1440);
            const fromMinutes = Math.floor((dateToExcelSerial(from) % 1) * 1440);
            const toMinutes = to ? Math.floor((dateToExcelSerial(to) % 1) * 1440) : 0;
            return compareValues(valueMinutes, filter, fromMinutes, toMinutes);
        }
        const withTime = filter.type === "fechaHora" && (hasTimePart(from) || (to !== null && hasTimePart(to)));
        if (withTime) return compareValues(minuteSerial(value), filter, minuteSerial(from), to ? minuteSerial(to) : 0);
        return compareValues(daySerial(value), filter, daySerial(from), to ? daySerial(to) : 0);
    }
    if (filter.type === "entero" || filter.type === "numero" || filter.type === "moneda" || filter.type === "porcentaje") {
        const value = parseNumber(raw) ?? parseNumber(formatted);
        const from = parseNumber(filter.value1);
        const to = filter.operator === "entre" ? parseNumber(filter.value2) : null;
        if (value === null || from === null) return false;
        return compareValues(value, filter, from, to ?? 0);
    }
    const text = typeof raw === "string" && raw ? raw : formatted || textOf(raw);
    return compareValues(normalizeText(text), filter, normalizeText(filter.value1), normalizeText(filter.value2));
}

/** Aplica los filtros dinamicos del informe sobre las filas del conjunto de datos. */
export function applyReportFilters(
    table: IReportTable,
    plan: IReportPlan,
    values: Record<string, string>,
    options: IReportOptions
): IFilterResult {
    const warnings: string[] = [];
    const applied: string[] = [];
    const filters: IResolvedFilter[] = [];
    plan.definition.filters.forEach((rule) => {
        const resolved = resolveFilterRule(rule, plan, table, values, options, warnings);
        if (resolved) {
            filters.push(resolved);
            applied.push(resolved.description);
        }
    });
    if (filters.length === 0) return { rows: table.rows.slice(), applied, warnings };
    return { rows: table.rows.filter((row) => filters.every((filter) => rowMatches(row, filter, options))), applied, warnings };
}

function compareRowValues(left: IDatasetRow, right: IDatasetRow, column: IExportColumn, options: IReportOptions): number {
    const leftRaw = left.raw[column.name];
    const rightRaw = right.raw[column.name];
    const leftText = typeof leftRaw === "string" ? leftRaw : textOf(leftRaw) || left.formatted[column.name] || "";
    const rightText = typeof rightRaw === "string" ? rightRaw : textOf(rightRaw) || right.formatted[column.name] || "";
    if (!leftText && !rightText) return 0;
    if (!leftText) return 1;
    if (!rightText) return -1;
    if (column.type === "fecha" || column.type === "fechaHora" || column.type === "hora") {
        const leftDate = parseDateValue(leftRaw, options.dateFormat) ?? parseDateValue(leftText, options.dateFormat);
        const rightDate = parseDateValue(rightRaw, options.dateFormat) ?? parseDateValue(rightText, options.dateFormat);
        if (!leftDate) return 1;
        if (!rightDate) return -1;
        return dateToExcelSerial(leftDate) - dateToExcelSerial(rightDate);
    }
    if (column.type === "entero" || column.type === "numero" || column.type === "moneda" || column.type === "porcentaje") {
        const leftNumber = parseNumber(leftRaw) ?? parseNumber(leftText);
        const rightNumber = parseNumber(rightRaw) ?? parseNumber(rightText);
        if (leftNumber === null) return 1;
        if (rightNumber === null) return -1;
        return leftNumber - rightNumber;
    }
    return normalizeText(leftText).localeCompare(normalizeText(rightText));
}

/** Ordena las filas segun la columna indicada en el informe. */
export function sortRows(rows: IDatasetRow[], plan: IReportPlan, options: IReportOptions): IDatasetRow[] {
    const requested = plan.definition.sortBy;
    if (!requested) return rows;
    const target = normalizeText(requested);
    const column = plan.columns.find(
        (candidate) =>
            normalizeText(candidate.requested) === target || normalizeText(candidate.name) === target || normalizeText(candidate.title) === target
    );
    if (!column) return rows;
    const factor = plan.definition.sortDescending ? -1 : 1;
    const sorted = rows.slice();
    sorted.sort((left, right) => factor * compareRowValues(left, right, column, options));
    return sorted;
}

function pad(value: number): string {
    return String(value).padStart(2, "0");
}

/** Nombres de archivo reservados en Windows, que no se pueden usar tal cual. */
const RESERVED_FILE_NAMES = ["CON", "PRN", "AUX", "NUL", "COM1", "COM2", "COM3", "COM4", "COM5", "COM6", "COM7", "COM8", "COM9", "LPT1", "LPT2", "LPT3", "LPT4", "LPT5", "LPT6", "LPT7", "LPT8", "LPT9"];

/** Limite prudente de longitud del nombre del archivo, sin la extension. */
const MAX_FILE_NAME_LENGTH = 120;

/**
 * Limpia un texto que se usara como nombre de archivo: quita caracteres de
 * control y separadores de ruta, evita secuencias ".." y nombres reservados,
 * y recorta la longitud. El nombre resultante no puede salir de la carpeta de
 * descargas del usuario.
 */
export function sanitizeFileNamePart(value: string): string {
    let name = stripUnsafeChars(value ?? "")
        .replace(/[\\/:*?"<>|]/g, "_")
        .replace(/\.{2,}/g, ".")
        .replace(/^[.\s]+|[.\s]+$/g, "")
        .trim();
    if (RESERVED_FILE_NAMES.includes(name.replace(/\.[^.]*$/, "").toUpperCase())) name = `_${name}`;
    return name.slice(0, MAX_FILE_NAME_LENGTH);
}

/**
 * Nombre del archivo. Admite las marcas {informe}, {nombre}, {fecha} y {hora}
 * dentro de la propiedad "archivo" de cada informe.
 */
export function buildFileName(definition: IReportDefinition, options: IReportOptions, now: Date): string {
    const pattern = definition.fileName || options.defaultFileName || "informe.xlsx";
    const expanded = pattern
        .replace(/\{informe\}/gi, definition.key)
        .replace(/\{nombre\}/gi, definition.name)
        .replace(/\{fecha\}/gi, `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`)
        .replace(/\{hora\}/gi, `${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`);
    const clean = sanitizeFileNamePart(expanded).replace(/\.xlsx$/i, "");
    return `${clean || "informe"}.xlsx`;
}

/** Nombre de la hoja de Excel del informe, con el limite de 31 caracteres. */
export function buildSheetName(definition: IReportDefinition): string {
    const raw = definition.sheetName || definition.name || definition.key;
    const clean = stripUnsafeChars(raw ?? "", " ")
        .replace(/[[\]\\/?*:]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
    const sliced = clean.slice(0, 31).replace(/[.\s]+$/, "");
    return sliced || "Informe";
}

/** Descripcion de las columnas detectadas, para el panel y para las salidas. */
export interface IColumnInfo {
    name: string;
    displayName: string;
    dataType: string;
    tipo: ReportColumnType;
    formato: string;
    hasData: boolean;
}

export function describeColumns(table: IReportTable, options: IReportOptions): IColumnInfo[] {
    return table.columns.map((column) => {
        const type = detectColumnType(column.dataType, table.rows, column.name);
        return {
            name: column.name,
            displayName: column.displayName,
            dataType: column.dataType,
            tipo: type,
            formato: defaultFormat(type, options),
            hasData: table.rows.some((row) => rowHasValue(row, column.name)),
        };
    });
}

/** Claves de las que se toma el valor visible cuando un valor es un objeto. */
const VALUE_KEY_CANDIDATES = ["Name", "name", "DisplayName", "displayName", "Label", "label", "Text", "text", "Value", "value", "Id", "id"];

/** Texto visible de un valor que llega en el JSON de datos. */
export function valueToText(value: unknown): string {
    if (value === null || value === undefined) return "";
    if (typeof value === "string") return value;
    if (typeof value === "number") return String(value);
    if (typeof value === "boolean") return String(value);
    if (Array.isArray(value)) {
        return value
            .map((item) => valueToText(item))
            .filter((item) => item !== "")
            .join("; ");
    }
    if (typeof value === "object") {
        const source = value as Record<string, unknown>;
        const key = VALUE_KEY_CANDIDATES.find((candidate) => {
            const item = source[candidate];
            return item !== null && item !== undefined && typeof item !== "object";
        });
        if (key) return String(source[key]);
        return JSON.stringify(value) ?? "";
    }
    return "";
}

/** Valor con su tipo nativo cuando el JSON lo entrega (numero, booleano o texto). */
function valueToRaw(value: unknown): string | number | boolean | null {
    if (value === null || value === undefined) return null;
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return value;
    if (Array.isArray(value)) {
        const text = valueToText(value);
        return text === "" ? null : text;
    }
    if (typeof value === "object") {
        const source = value as Record<string, unknown>;
        const key = VALUE_KEY_CANDIDATES.find((candidate) => {
            const item = source[candidate];
            return item !== null && item !== undefined && typeof item !== "object";
        });
        if (key) {
            const item = source[key];
            if (typeof item === "string" || typeof item === "number" || typeof item === "boolean") return item;
        }
        const text = valueToText(value);
        return text === "" ? null : text;
    }
    return null;
}

const ROW_ARRAY_KEYS = ["rows", "value", "values", "items", "data", "records", "result"];

/**
 * Lee un texto con los registros ya convertidos en JSON. Admite:
 *   - un arreglo de registros: [ { "Campo": "valor" }, ... ]
 *   - un objeto con los registros en rows, value, items, data, records o result
 *   - un unico registro: { "Campo": "valor" }
 * El control ya no usa el JSON de datos (los registros llegan en Items); queda
 * disponible para reprocesar texto con la misma logica del modelo.
 */
export function parseDataTable(text: string): { table: IReportTable; errors: string[] } {
    const errors: string[] = [];
    const empty: IReportTable = { columns: [], rows: [] };
    const trimmed = (text ?? "").trim();
    if (!trimmed) return { table: empty, errors };
    let parsed: unknown;
    try {
        parsed = JSON.parse(trimmed) as unknown;
    } catch (error) {
        const detail = error instanceof Error ? error.message : String(error);
        errors.push(`Los datos en texto no son un JSON valido: ${detail}`);
        return { table: empty, errors };
    }
    let source: unknown = parsed;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        const wrapper = parsed as Record<string, unknown>;
        const found = ROW_ARRAY_KEYS.map((key) => readOwnValue(wrapper, key)).find((item) => Array.isArray(item));
        source = found ?? [parsed];
    }
    if (!Array.isArray(source)) {
        errors.push(
            'Los datos en texto deben ser un arreglo de registros. Tambien se acepta un objeto con los registros en "rows" o "value".'
        );
        return { table: empty, errors };
    }
    if (source.length === 0) {
        errors.push("Los datos en texto no tienen registros. Revisa el origen que los alimenta.");
        return { table: empty, errors };
    }
    const rows: IDatasetRow[] = [];
    const names: string[] = [];
    const seen: Record<string, boolean> = Object.create(null) as Record<string, boolean>;
    source.forEach((item, index) => {
        if (!item || typeof item !== "object" || Array.isArray(item)) {
            if (errors.length < 3) errors.push(`El registro ${index + 1} de los datos no es un objeto.`);
            return;
        }
        const raw: Record<string, unknown> = Object.create(null) as Record<string, unknown>;
        const formatted: Record<string, string> = Object.create(null) as Record<string, string>;
        Object.entries(item as Record<string, unknown>).forEach(([key, value]) => {
            const rawValue = valueToRaw(value);
            raw[key] = rawValue;
            formatted[key] = valueToText(rawValue);
            if (!seen[key]) {
                seen[key] = true;
                names.push(key);
            }
        });
        rows.push({ recordId: String(index + 1), raw, formatted });
    });
    if (rows.length === 0) {
        errors.push("La propiedad Datos (JSON) no tiene registros validos.");
        return { table: empty, errors };
    }
    const columns: IDatasetColumn[] = names.map((name) => ({ name, displayName: name, dataType: "", alias: "" }));
    return { table: { columns, rows }, errors };
}











/** Texto legible de una fecha para los mensajes de filtros aplicados. */
export function formatDateForMessage(date: Date, withTime: boolean): string {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const base = `${day}/${month}/${date.getFullYear()}`;
    if (!withTime) return base;
    return `${base} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}


