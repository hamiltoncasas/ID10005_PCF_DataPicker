/**
 * Fecha: 2026-09-16
 * Descripcion: Adaptador PCF del combobox con busqueda. Convierte los registros
 * enlazados en Items en opciones, resuelve la seleccion inicial, mantiene el
 * estado de seleccion y publica los valores y etiquetas elegidos.
 */
import { IInputs, IOutputs } from "./generated/ManifestTypes";
import { ISearchableComboBoxOption, ISearchableComboBoxProps, SearchableComboBoxView, normalizeForSearch } from "./SearchableComboBoxView";
import * as React from "react";

const MAX_RECORDS = 5000;
const MAX_PAGE_REQUESTS = 10;
const VALUE_COLUMN = "value";
const LABEL_COLUMN = "label";
const DESCRIPTION_COLUMN = "description";

export class SearchableComboBox implements ComponentFramework.ReactControl<IInputs, IOutputs> {
    private notifyOutputChanged: () => void;
    private context: ComponentFramework.Context<IInputs>;
    private options: ISearchableComboBoxOption[] = [];
    private selectedValues: string[] = [];
    private lastDefaultValue = "";
    private lastResetKey = false;
    private lastRefreshKey = false;
    private pendingDefaultValue = "";
    private pageRequests = 0;
    private pageSizeRequested = false;
    private morePagesAvailable = false;

    /**
     * Empty constructor.
     */
    constructor() {
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
        const dataset = context.parameters.items;
        const selectMultiple = context.parameters.selectMultiple?.raw ?? false;
        const loadAllRecords = context.parameters.loadAllRecords?.raw ?? false;
        this.options = dataset ? this.buildOptions(dataset, loadAllRecords) : [];
        this.morePagesAvailable = !!dataset && !loadAllRecords && !!dataset.paging && dataset.paging.hasNextPage;

        const defaultValue = String(context.parameters.defaultValue?.raw ?? "");
        const resetKey = context.parameters.resetKey?.raw ?? false;
        if (resetKey !== this.lastResetKey) {
            this.selectedValues = [];
            this.pendingDefaultValue = "";
            this.lastDefaultValue = defaultValue;
            this.lastResetKey = resetKey;
        } else if (defaultValue !== this.lastDefaultValue) {
            this.lastDefaultValue = defaultValue;
            this.applyDefaultValue(defaultValue, selectMultiple);
        }
        if (this.pendingDefaultValue && this.options.length > 0) {
            const pendingDefaultValue = this.pendingDefaultValue;
            this.pendingDefaultValue = "";
            this.applyDefaultValue(pendingDefaultValue, selectMultiple);
        }

        const refreshKey = context.parameters.refreshKey?.raw ?? false;
        if (refreshKey !== this.lastRefreshKey) {
            this.lastRefreshKey = refreshKey;
            this.refreshDataset(dataset);
        }

        const props: ISearchableComboBoxProps = {
            options: this.options,
            selectedValues: this.selectedValues,
            selectMultiple,
            isSearchable: context.parameters.isSearchable?.raw ?? true,
            noSelectionText: String(context.parameters.noSelectionText?.raw ?? "---"),
            placeholderText: String(context.parameters.placeholderText?.raw ?? "Buscar..."),
            zIndex: context.parameters.zIndex.raw ?? 2147483647,
            disabled: context.mode.isControlDisabled,
            morePagesAvailable: this.morePagesAvailable,
            onRefresh: () => this.refreshDataset(dataset),
            onChange: (values) => {
                this.selectedValues = selectMultiple ? values : values.slice(0, 1);
                this.notifyOutputChanged();
            },
        };
        return React.createElement(
            SearchableComboBoxView, props
        );
    }

    /**
     * It is called by the framework prior to a control receiving new data.
     * @returns an object based on nomenclature defined in manifest, expecting object[s] for property marked as "bound" or "output"
     */
    public getOutputs(): IOutputs {
        const labels = this.selectedValues.map((value) => this.labelOf(value));
        return {
            selectedValue: this.selectedValues.length > 0 ? this.selectedValues[0] : "",
            selectedLabel: labels.length > 0 ? labels[0] : "",
            selectedValues: this.selectedValues.join(";"),
            selectedLabels: labels.join(";"),
            selectedCount: this.selectedValues.length,
        };
    }

    /**
     * Called when the control is to be removed from the DOM tree. Controls should use this call for cleanup.
     * i.e. cancelling any pending remote calls, removing listeners, etc.
     */
    public destroy(): void {
        // Add code to cleanup control if necessary
    }

    /**
     * Convierte los registros de Items en opciones del combobox. Usa las columnas
     * value, label y description cuando existen; si no, toma la primera columna.
     */
    private buildOptions(dataset: ComponentFramework.PropertyTypes.DataSet, loadAllRecords: boolean): ISearchableComboBoxOption[] {
        const columns = this.getColumns(dataset);
        if (columns.length === 0) return [];
        if (loadAllRecords) this.loadRemainingPages(dataset);
        const valueColumn = this.findColumn(columns, VALUE_COLUMN);
        const labelColumn = this.findColumn(columns, LABEL_COLUMN);
        const descriptionColumn = this.findColumn(columns, DESCRIPTION_COLUMN);
        const searchFields = this.getSearchFields(columns);
        const options: ISearchableComboBoxOption[] = [];
        dataset.sortedRecordIds.forEach((recordId) => {
            const record = dataset.records[recordId];
            if (!record) return;
            const value = valueColumn ? this.readColumn(record, valueColumn) : this.readColumn(record, columns[0]);
            const label = labelColumn ? this.readColumn(record, labelColumn) : value;
            const description = descriptionColumn ? this.readColumn(record, descriptionColumn) : "";
            if (!value && !label) return;
            options.push({
                key: recordId,
                value: value || label,
                label: label || value,
                description,
                searchText: normalizeForSearch(`${this.readSearchText(record, searchFields)} ${label} ${description} ${value}`),
            });
        });
        return options;
    }

    /**
     * Columnas disponibles en Items. En Canvas las columnas provienen de los
     * campos enlazados; si el host no las reporta se usan los nombres declarados
     * en el manifiesto para seguir leyendo value, label y description.
     */
    private getColumns(dataset: ComponentFramework.PropertyTypes.DataSet): string[] {
        const columns = dataset.columns;
        if (columns && columns.length > 0) return columns.map((column) => column.name).filter((name) => !!name);
        return [VALUE_COLUMN, LABEL_COLUMN, DESCRIPTION_COLUMN];
    }

    private findColumn(columns: string[], expected: string): string {
        return columns.find((column) => column.toLowerCase() === expected) ?? "";
    }

    /**
     * Campos donde se busca el texto escrito. Si searchFields esta vacio se
     * buscan todas las columnas enlazadas, cumpliendo el filtro tipo contiene.
     */
    private getSearchFields(columns: string[]): string[] {
        const configured = String(this.context.parameters.searchFields?.raw ?? "").split(",").map((field) => field.trim()).filter((field) => !!field);
        if (configured.length === 0) return columns;
        const available = configured.map((field) => this.findColumn(columns, field.toLowerCase())).filter((field) => !!field);
        return available.length > 0 ? available : columns;
    }

    private readColumn(record: ComponentFramework.PropertyHelper.DataSetApi.EntityRecord, field: string): string {
        try {
            const raw = record.getValue(field);
            if (raw === null || raw === undefined) return "";
            if (typeof raw === "object") {
                const formatted = record.getFormattedValue(field);
                return formatted ?? "";
            }
            return String(raw);
        } catch {
            return "";
        }
    }

    private readSearchText(record: ComponentFramework.PropertyHelper.DataSetApi.EntityRecord, fields: string[]): string {
        return fields.map((field) => this.readColumn(record, field)).join(" ");
    }

    /**
     * Solicita las paginas restantes solo cuando la propiedad loadAllRecords esta
     * activa. Por omision el control no toca el paginador: asi el paginador de
     * Power Apps del control sigue funcionando y el filtro trabaja sobre los
     * registros cargados de la pagina actual.
     */
    private loadRemainingPages(dataset: ComponentFramework.PropertyTypes.DataSet): void {
        const paging = dataset.paging;
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
     * Resuelve la seleccion inicial admitiendo valores o etiquetas separadas por
     * punto y coma. Si los registros aun no estan cargados se reintenta despues.
     */
    private applyDefaultValue(value: string, selectMultiple: boolean): void {
        const tokens = value.split(";").map((token) => token.trim()).filter((token) => !!token);
        if (tokens.length === 0) {
            this.selectedValues = [];
            return;
        }
        const resolved: string[] = [];
        tokens.forEach((token) => {
            const normalized = normalizeForSearch(token);
            const option = this.options.find((item) => normalizeForSearch(item.value) === normalized) ?? this.options.find((item) => normalizeForSearch(item.label) === normalized);
            if (option && !resolved.includes(option.value)) resolved.push(option.value);
        });
        if (resolved.length === 0) {
            this.pendingDefaultValue = value;
            return;
        }
        this.selectedValues = selectMultiple ? resolved : resolved.slice(0, 1);
    }

    private labelOf(value: string): string {
        const option = this.options.find((item) => item.value === value);
        return option ? option.label : value;
    }

    /**
     * Vuelve a consultar la tabla o coleccion enlazada en Items y reinicia los
     * contadores de paginacion. La data nueva llega en un ciclo posterior de
     * updateView.
     */
    private refreshDataset(dataset: ComponentFramework.PropertyTypes.DataSet): void {
        if (!dataset) return;
        this.pageRequests = 0;
        this.pageSizeRequested = false;
        try {
            dataset.refresh();
        } catch {
            // El host puede no admitir el refresco del conjunto de datos.
        }
    }
}
