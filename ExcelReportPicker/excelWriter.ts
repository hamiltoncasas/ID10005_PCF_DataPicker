/**
 * Fecha: 2026-09-18
 * Descripcion: Construccion del libro de Excel de un informe con SheetJS.
 * Escribe las fechas como seriales nativos de Excel, los numeros con el formato
 * regional configurado y los textos como texto, ademas de los anchos de columna
 * y el autofiltro, para que el archivo se comporte como un informe creado en
 * Excel.
 */
import * as XLSX from "xlsx";
import {
    IDatasetRow,
    IReportOptions,
    IReportPlan,
    buildSheetName,
    formatDateForMessage,
    stripUnsafeChars,
    toCellValue,
} from "./reportModel";

export const EXCEL_FILE_MIME_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

/** Opciones de presentacion del libro. */
export interface IWorkbookOptions {
    includeHeaderRow: boolean;
    includeTitle: boolean;
    includeFilterSummary: boolean;
    autoFilter: boolean;
    autoColumnWidth: boolean;
}

/** Resultado de generar el libro de Excel. */
export interface IWorkbookResult {
    data: ArrayBuffer;
    sheetName: string;
    rowCount: number;
    /** Fila (1-based) del encabezado; 0 si el informe no escribe encabezado. */
    headerRow: number;
}

/** Limite de columnas de una hoja de Excel. */
const MAX_EXCEL_COLUMNS = 16384;

/** Limite de caracteres de una celda de Excel. */
const MAX_CELL_TEXT = 32767;

/** Quita los medios pares suplentes que dejan un texto Unicode invalido. */
function stripLoneSurrogates(text: string): string {
    let result = "";
    for (let index = 0; index < text.length; index += 1) {
        const code = text.charCodeAt(index);
        if (code >= 0xd800 && code <= 0xdbff) {
            const next = text.charCodeAt(index + 1);
            if (next >= 0xdc00 && next <= 0xdfff) {
                result += text.slice(index, index + 2);
                index += 1;
            }
            continue;
        }
        if (code >= 0xdc00 && code <= 0xdfff) continue;
        result += text.charAt(index);
    }
    return result;
}

/**
 * Prepara un texto para una celda de Excel: quita caracteres que Excel y el XML
 * no admiten (caracteres de control, zona 0x7F-0x9F, no caracteres y medios
 * pares suplentes) y recorta la longitud al limite de una celda. Los valores se
 * escriben siempre como texto, asi que un dato que empiece por "=" no se evalua
 * al abrir el archivo.
 */
export function sanitizeExcelText(value: string): string {
    const clean = stripLoneSurrogates(stripUnsafeChars(value ?? ""));
    return clean.length > MAX_CELL_TEXT ? clean.slice(0, MAX_CELL_TEXT) : clean;
}

/** Valor de celda listo para el libro: los textos se sanean, los numeros se copian. */
function toSafeCellValue(value: string | number): string | number {
    return typeof value === "string" ? sanitizeExcelText(value) : value;
}

function toArrayBuffer(output: ArrayBuffer | Uint8Array): ArrayBuffer {
    if (output instanceof Uint8Array) {
        const copy = new Uint8Array(output.byteLength);
        copy.set(output);
        return copy.buffer;
    }
    return output;
}

/**
 * Genera el libro de Excel del informe: lineas informativas opcionales,
 * encabezado, filas con valores nativos y formatos de Excel por columna.
 */
export function buildReportWorkbook(
    rows: IDatasetRow[],
    plan: IReportPlan,
    reportOptions: IReportOptions,
    options: IWorkbookOptions,
    appliedFilters: string[],
    generatedAt: Date
): IWorkbookResult {
    const columns = plan.columns;
    if (columns.length === 0) {
        throw new Error(`El informe "${plan.definition.name}" no tiene columnas para exportar.`);
    }
    if (columns.length > MAX_EXCEL_COLUMNS) {
        throw new Error(`El informe "${plan.definition.name}" supera el limite de ${MAX_EXCEL_COLUMNS} columnas de Excel.`);
    }

    const matrix: (string | number)[][] = [];
    const infoLines: string[] = [];
    if (options.includeTitle && plan.definition.name) infoLines.push(plan.definition.name);
    if (options.includeFilterSummary) {
        const parts = [`Generado: ${formatDateForMessage(generatedAt, true)}`, `Registros: ${rows.length}`];
        if (appliedFilters.length > 0) parts.push(`Filtros: ${appliedFilters.join("; ")}`);
        infoLines.push(parts.join(" | "));
    }
    infoLines.forEach((line) => matrix.push([sanitizeExcelText(line)]));
    if (infoLines.length > 0) matrix.push([]);

    let headerRow = 0;
    if (options.includeHeaderRow) {
        matrix.push(columns.map((column) => sanitizeExcelText(column.title)));
        headerRow = matrix.length;
    }
    rows.forEach((row) => {
        matrix.push(
            columns.map((column) =>
                toSafeCellValue(toCellValue(row.raw[column.name], row.formatted[column.name] ?? "", column.type, reportOptions))
            )
        );
    });

    // Los valores del informe son datos, no formulas. Si la libreria llegara a
    // interpretar un texto como formula, se sustituye por ese mismo texto: el
    // archivo nunca contiene formulas que Excel pueda evaluar al abrirlo.
    const sheet = XLSX.utils.aoa_to_sheet(matrix);
    Object.keys(sheet).forEach((address) => {
        if (address.startsWith("!")) return;
        const cell = sheet[address] as XLSX.CellObject | undefined;
        if (!cell?.f) return;
        cell.t = "s";
        cell.v = String(cell.f);
        delete cell.f;
    });
    const firstDataRow = matrix.length - rows.length + 1;
    columns.forEach((column, index) => {
        if (!column.format) return;
        const letter = XLSX.utils.encode_col(index);
        for (let rowNumber = firstDataRow; rowNumber <= matrix.length; rowNumber += 1) {
            const cell = sheet[letter + String(rowNumber)] as XLSX.CellObject | undefined;
            if (cell) cell.z = column.format;
        }
    });
    if (options.autoColumnWidth) {
        sheet["!cols"] = columns.map((column) => ({ wch: column.width }));
    }
    if (options.autoFilter && options.includeHeaderRow && rows.length > 0) {
        const first = `${XLSX.utils.encode_col(0)}${headerRow}`;
        const last = `${XLSX.utils.encode_col(columns.length - 1)}${headerRow}`;
        sheet["!autofilter"] = { ref: `${first}:${last}` };
    }

    const sheetName = buildSheetName(plan.definition);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, sheetName);
    const written = XLSX.write(workbook, { bookType: "xlsx", type: "array" }) as ArrayBuffer | Uint8Array;
    return { data: toArrayBuffer(written), sheetName, rowCount: rows.length, headerRow };
}
