/**
 * Fecha: 2026-09-18
 * Descripcion: Adaptador PCF del exportador de informes a Excel. Lee los datos
 * de la propiedad JSON, interpreta la definicion JSON de informes, aplica los
 * filtros con los valores que llegan de otros controles del lienzo y genera el
 * archivo Excel con formatos nativos, publicando el resultado en las salidas.
 */
import { IInputs, IOutputs } from "./generated/ManifestTypes";
import { ExcelReportPickerView, IColumnRow, IExcelReportPickerProps, IExportResultView, IReportRow, IViewTexts } from "./ExcelReportPickerView";
import { buildReportWorkbook, EXCEL_FILE_MIME_TYPE } from "./excelWriter";
import {
    IColumnInfo,
    IDatasetColumn,
    IDatasetRow,
    IReportDefinition,
    IReportOptions,
    IReportPlan,
    IReportTable,
    buildFileName,
    buildPlan,
    collectDeclaredFields,
    describeColumns,
    parseReportsDefinition,
    sortRows,
} from "./reportModel";
import * as React from "react";

const MAX_RECORDS = 5000;
const MAX_PAGE_REQUESTS = 10;
const DEFAULT_Z_INDEX = 2147483647;

interface IReportEntry {
    definition: IReportDefinition;
    plan: IReportPlan;
    row: IReportRow;
}

function emptyOptions(): IReportOptions {
    return {
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
}

export class ExcelReportPicker implements ComponentFramework.ReactControl<IInputs, IOutputs> {
    private notifyOutputChanged: () => void;
    private context: ComponentFramework.Context<IInputs>;
    private options: IReportOptions = emptyOptions();
    private dataset: ComponentFramework.PropertyTypes.DataSet;
    private table: IReportTable = { columns: [], rows: [] };
    private entries: IReportEntry[] = [];
    private definitionErrors: string[] = [];
    private pageRequests = 0;
    private pageSizeRequested = false;
    private selectedKey = "";
    private lastResult: IExportResultView | null = null;
    private lastResetKey = false;
    private lastDefaultReport = "";
    private outputReport = "";
    private outputReportName = "";
    private outputFile = "";
    private outputRows = 0;
    private outputStatus = "listo";
    private outputError = "";
    private columnsJson = "[]";

    /**
     * Empty constructor.
     */
    public constructor() {
        // Empty
    }

    /**
     * Used to initialize the control instance. Controls can kick off remote server calls and other initialization actions here.
     * Data-set values are not initialized here, use updateView.
     * @param context The entire property bag available to control via Context Object; It contains values as set up by the customizer mapped to property names defined in the manifest, as well as utility functions.
     * @param notifyOutputChanged A callback method to alert the framework that the control has new outputs ready to be retrieved asynchronously.
     * @param state A piece of data that persists in one session for a single user. Can be set at any point in a controls life cycle by calling 'setControlState' in the Mode interface.
     */
    public init(
        context: ComponentFramework.Context<IInputs>,
        notifyOutputChanged: () => void,
        state: ComponentFramework.Dictionary
    ): void {
        this.notifyOutputChanged = notifyOutputChanged;
    }

    /**
     * Called when any value in the property bag has changed. This includes field values, data-sets, global values such as container height and width, offline status, control metadata values such as label, visible, etc.
     * @param context The entire property bag available to control via Context Object; It contains values as set up by the customizer mapped to names defined in the manifest, as well as utility functions
     * @returns ReactElement root react element for the control
     */
    public updateView(context: ComponentFramework.Context<IInputs>): React.ReactElement {
        this.context = context;
        this.options = this.readOptions(context);
        const declared = collectDeclaredFields(parseReportsDefinition(String(context.parameters.reportsJson?.raw ?? "")).reports);
        const dataset = context.parameters.items;
        this.dataset = dataset;
        this.ensureAllRecordsLoaded(dataset);
        this.table = this.readItems(dataset, declared);
        this.rebuildEntries(context);
        this.applySelectionState(context);
        const info: IColumnInfo[] = describeColumns(this.table, this.options);
        const columns: IColumnRow[] = info
            .filter((column) => column.hasData)
            .map((column) => ({ name: column.name, displayName: column.displayName, type: column.tipo, format: column.formato }));
        this.columnsJson = JSON.stringify(info);
        return React.createElement(ExcelReportPickerView, this.buildViewProps(columns, info));
    }

    private rebuildEntries(context: ComponentFramework.Context<IInputs>): void {
        const definitions = parseReportsDefinition(String(context.parameters.reportsJson?.raw ?? ""));
        this.definitionErrors = definitions.errors.slice();
        this.entries = definitions.reports.map((definition) => {
            const plan = buildPlan(this.table, definition, this.options);
            const row: IReportRow = {
                key: definition.key,
                name: definition.name,
                description: definition.description,
                fileName: buildFileName(definition, this.options, new Date()),
                columnCount: plan.columns.length,
                errors: this.strictFilters ? plan.warnings : [],
                warnings: plan.warnings,
            };
            return { definition, plan, row };
        });
    }

    private applySelectionState(context: ComponentFramework.Context<IInputs>): void {
        const resetKey = context.parameters.resetKey?.raw ?? false;
        const defaultReport = String(context.parameters.defaultReport?.raw ?? "").trim();
        if (resetKey !== this.lastResetKey) {
            this.lastResetKey = resetKey;
            this.selectedKey = defaultReport;
            this.lastResult = null;
        } else if (defaultReport && defaultReport !== this.lastDefaultReport) {
            this.selectedKey = defaultReport;
        }
        this.lastDefaultReport = defaultReport;
        if (this.selectedKey && !this.entries.some((entry) => entry.definition.key === this.selectedKey)) {
            this.selectedKey = "";
        }
    }

    private get strictFilters(): boolean {
        return this.context.parameters.strictFilters?.raw ?? false;
    }

    private buildViewProps(columns: IColumnRow[], info: IColumnInfo[]): IExcelReportPickerProps {
        const texts: IViewTexts = {
            button: this.textValue(this.context.parameters.buttonText?.raw, "Informes"),
            panelTitle: this.textValue(this.context.parameters.panelTitleText?.raw, "Exportar a Excel"),
            panelHint: this.textValue(
                this.context.parameters.panelHintText?.raw,
                "Elige un informe y descarga el archivo Excel con los datos filtrados."
            ),
            download: this.textValue(this.context.parameters.downloadText?.raw, "Descargar Excel"),
            exporting: this.textValue(this.context.parameters.exportingText?.raw, "Generando Excel..."),
            success: this.textValue(this.context.parameters.successText?.raw, "Excel generado"),
            noReports: this.textValue(
                this.context.parameters.noReportsText?.raw,
                "No hay informes definidos. Configura la propiedad Definicion de informes (JSON)."
            ),
            emptyData: this.textValue(this.context.parameters.emptyDataText?.raw, "Sin registros para exportar con los filtros actuales."),
            errorTitle: this.textValue(this.context.parameters.errorTitleText?.raw, "Revisa la configuracion del informe"),
        };
        const globalErrors = this.definitionErrors.slice();
        if (columns.length === 0 && globalErrors.length === 0) {
            globalErrors.push("Sin datos. Enlaza una tabla o coleccion en Items.");
        }
        return {
            reports: this.entries.map((entry) => entry.row),
            columns,
            rowCount: this.table.rows.length,
            globalErrors,
            selectedKey: this.selectedKey,
            texts,
            zIndex: this.context.parameters.zIndex?.raw ?? DEFAULT_Z_INDEX,
            disabled: this.context.mode.isControlDisabled,
            lastResult: this.lastResult,
            onSelect: (key: string) => this.handleSelect(key),
            onExport: (key: string) => this.handleExport(key),
        };
    }

    private readOptions(context: ComponentFramework.Context<IInputs>): IReportOptions {
        const options = emptyOptions();
        options.dateFormat = this.textValue(context.parameters.dateFormat?.raw, options.dateFormat);
        options.dateTimeFormat = this.textValue(context.parameters.dateTimeFormat?.raw, options.dateTimeFormat);
        options.timeFormat = this.textValue(context.parameters.timeFormat?.raw, options.timeFormat);
        options.integerFormat = this.textValue(context.parameters.integerFormat?.raw, options.integerFormat);
        options.numberFormat = this.textValue(context.parameters.numberFormat?.raw, options.numberFormat);
        options.currencyFormat = this.textValue(context.parameters.currencyFormat?.raw, options.currencyFormat);
        options.currencyCode = this.textValue(context.parameters.currencyCode?.raw, options.currencyCode);
        options.percentFormat = this.textValue(context.parameters.percentFormat?.raw, options.percentFormat);
        options.booleanTrueText = this.textValue(context.parameters.booleanTrueText?.raw, options.booleanTrueText);
        options.booleanFalseText = this.textValue(context.parameters.booleanFalseText?.raw, options.booleanFalseText);
        options.maxRows = context.parameters.maxRows?.raw ?? 0;
        return options;
    }

    private booleanValue(value: boolean | null | undefined, fallback: boolean): boolean {
        return value ?? fallback;
    }

    private textValue(value: string | null | undefined, fallback: string): string {
        return value === null || value === undefined || value === "" ? fallback : value;
    }

    private handleSelect(key: string): void {
        this.selectedKey = key;
        this.lastResult = null;
        this.notifyOutputChanged();
    }

    /** Tabla de trabajo respetando el limite de filas configurado. */
    private limitedTable(): IReportTable {
        const limit = this.options.maxRows;
        if (limit <= 0 || limit >= this.table.rows.length) return this.table;
        return { columns: this.table.columns, rows: this.table.rows.slice(0, limit) };
    }

    /** Lee el conjunto de datos enlazado en Items (tabla o coleccion filtrada). */
    private readItems(dataset: ComponentFramework.PropertyTypes.DataSet, declaredFields: string[]): IReportTable {
        const columns = this.readColumns(dataset, declaredFields);
        return { columns, rows: this.readRows(dataset, columns) };
    }

    /**
     * Columnas del conjunto de datos. Se usan las que informa el host y, como
     * respaldo, los campos declarados en la definicion de informes.
     */
    private readColumns(dataset: ComponentFramework.PropertyTypes.DataSet, declaredFields: string[]): IDatasetColumn[] {
        const columns: IDatasetColumn[] = [];
        const seen: Record<string, boolean> = Object.create(null) as Record<string, boolean>;
        const push = (column: IDatasetColumn): void => {
            if (!column.name || seen[column.name]) return;
            seen[column.name] = true;
            columns.push(column);
        };
        const reported = dataset ? dataset.columns ?? [] : [];
        reported.forEach((column) => {
            push({
                name: column.name,
                displayName: column.displayName ? column.displayName : column.name,
                dataType: column.dataType ? column.dataType : "",
                alias: column.alias ? column.alias : "",
            });
        });
        declaredFields.forEach((name) => push({ name, displayName: name, dataType: "", alias: "" }));
        return columns;
    }

    private readRows(dataset: ComponentFramework.PropertyTypes.DataSet, columns: IDatasetColumn[]): IDatasetRow[] {
        const rows: IDatasetRow[] = [];
        if (!dataset) return rows;
        const ids = dataset.sortedRecordIds ? dataset.sortedRecordIds : [];
        ids.forEach((recordId) => {
            const record = dataset.records[recordId];
            if (!record) return;
            const raw: Record<string, unknown> = Object.create(null) as Record<string, unknown>;
            const formatted: Record<string, string> = Object.create(null) as Record<string, string>;
            columns.forEach((column) => {
                raw[column.name] = this.readRawValue(record, column.name);
                formatted[column.name] = this.readFormattedValue(record, column.name);
            });
            rows.push({ recordId, raw, formatted });
        });
        return rows;
    }

    private readRawValue(record: ComponentFramework.PropertyHelper.DataSetApi.EntityRecord, name: string): unknown {
        try {
            const value: unknown = record.getValue(name);
            return value === undefined ? null : value;
        } catch {
            return null;
        }
    }

    private readFormattedValue(record: ComponentFramework.PropertyHelper.DataSetApi.EntityRecord, name: string): string {
        try {
            const value = record.getFormattedValue(name);
            return value ?? "";
        } catch {
            return "";
        }
    }

    /**
     * Solicita el resto de paginas para que el informe incluya todos los
     * registros disponibles y no solo la primera pagina cargada.
     */
    private ensureAllRecordsLoaded(dataset: ComponentFramework.PropertyTypes.DataSet): void {
        const paging = dataset ? dataset.paging : undefined;
        if (!paging) return;
        if (!this.pageSizeRequested && paging.pageSize > 0 && paging.pageSize < MAX_RECORDS) {
            this.pageSizeRequested = true;
            try {
                paging.setPageSize(MAX_RECORDS);
            } catch {
                // El host puede no admitir el cambio de tamano de pagina.
            }
        }
        if (paging.hasNextPage && this.pageRequests < MAX_PAGE_REQUESTS) {
            this.pageRequests += 1;
            try {
                paging.loadNextPage();
            } catch {
                // El host puede no admitir la paginacion del conjunto de datos.
            }
        }
    }

    /**
     * Exporta el informe solicitado. Se resuelve en el siguiente ciclo del
     * navegador para que el panel pueda mostrar el estado "generando".
     */
    private async handleExport(key: string): Promise<IExportResultView> {
        await new Promise<void>((resolve) => window.setTimeout(resolve, 0));
        return this.exportReport(key);
    }

    private exportReport(key: string): IExportResultView {
        const entry = this.entries.find((item) => item.definition.key === key);
        if (!entry) {
            return this.fail(`El informe "${key}" no esta definido en la propiedad de definicion de informes.`);
        }
        const table = this.limitedTable();
        const plan = buildPlan(table, entry.definition, this.options);
        const messages = plan.warnings.slice();
        if (plan.errors.length > 0) return this.fail(plan.errors.join(" "), messages);
        if (this.strictFilters && plan.warnings.length > 0) {
            return this.fail("El control esta en modo de validacion estricta y el informe tiene avisos de configuracion.", messages);
        }
        if (table.rows.length === 0) {
            messages.push("Items no tiene registros con los filtros actuales; el archivo se genera solo con el encabezado.");
        }
        const rows = sortRows(table.rows, plan, this.options);
        const now = new Date();
        const fileName = buildFileName(entry.definition, this.options, now);
        const workbook = buildReportWorkbook(
            rows,
            plan,
            this.options,
            {
                includeHeaderRow: this.booleanValue(this.context.parameters.includeHeaderRow?.raw, true),
                includeTitle: this.booleanValue(this.context.parameters.includeTitle?.raw, true),
                includeFilterSummary: this.booleanValue(this.context.parameters.includeFilterSummary?.raw, true),
                autoFilter: this.booleanValue(this.context.parameters.autoFilter?.raw, true),
                autoColumnWidth: this.booleanValue(this.context.parameters.autoColumnWidth?.raw, true),
            },
            [],
            now
        );
        let ok = true;
        let error = "";
        try {
            this.downloadFile(workbook.data, fileName);
        } catch (downloadError) {
            ok = false;
            error = downloadError instanceof Error ? downloadError.message : String(downloadError);
        }
        const result: IExportResultView = { ok, fileName, rowCount: rows.length, messages, error };
        this.lastResult = result;
        this.outputReport = entry.definition.key;
        this.outputReportName = entry.definition.name;
        this.outputFile = fileName;
        this.outputRows = rows.length;
        this.outputStatus = ok ? "exportado" : "error";
        this.outputError = error;
        this.notifyOutputChanged();
        return result;
    }

    private fail(error: string, messages: string[] = []): IExportResultView {
        const result: IExportResultView = { ok: false, fileName: "", rowCount: 0, messages, error };
        this.lastResult = result;
        this.outputStatus = "error";
        this.outputError = error;
        this.notifyOutputChanged();
        return result;
    }

    /** Descarga el libro generado en el navegador del usuario. */
    private downloadFile(data: ArrayBuffer, fileName: string): void {
        const blob = new Blob([data], { type: EXCEL_FILE_MIME_TYPE });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = fileName;
        anchor.rel = "noopener";
        anchor.style.display = "none";
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
        window.setTimeout(() => URL.revokeObjectURL(url), 10000);
    }

    /**
     * It is called by the framework prior to a control receiving new data.
     * @returns an object based on nomenclature defined in manifest, expecting object[s] for property marked as "bound" or "output"
     */
    public getOutputs(): IOutputs {
        return {
            selectedReport: this.selectedKey,
            lastReport: this.outputReport,
            lastReportName: this.outputReportName,
            lastFile: this.outputFile,
            lastRows: this.outputRows,
            lastStatus: this.outputStatus,
            errorMessage: this.outputError,
            hasError: this.outputStatus === "error",
            columnsDetected: this.table.columns.length,
            availableColumnsJson: this.columnsJson,
        };
    }

    /**
     * Called when the control is to be removed from the DOM tree. Controls should use this call for cleanup.
     * i.e. cancelling any pending remote calls, removing listeners, etc.
     */
    public destroy(): void {
        // No hay recursos que liberar: la vista React retira sus propios listeners.
    }
}




