/**
 * Fecha: 2026-09-18
 * Descripcion: Vista React del exportador de informes. Dibuja un unico elemento
 * visual compacto que, al abrirse, muestra el panel con la lista de informes, el
 * boton de descarga del informe elegido, los mensajes de resultado y las
 * columnas detectadas en el conjunto de datos.
 */
import * as React from "react";
import * as ReactDOM from "react-dom";

/** Informe listo para mostrarse en la lista del panel. */
export interface IReportRow {
    key: string;
    name: string;
    description: string;
    fileName: string;
    columnCount: number;
    errors: string[];
    warnings: string[];
}

/** Columna detectada en el conjunto de datos. */
export interface IColumnRow {
    name: string;
    displayName: string;
    type: string;
    format: string;
}

/** Textos configurables desde Power Apps. */
export interface IViewTexts {
    button: string;
    panelTitle: string;
    panelHint: string;
    download: string;
    exporting: string;
    success: string;
    noReports: string;
    emptyData: string;
    errorTitle: string;
    loading: string;
    ready: string;
}

/** Resultado de la ultima exportacion que se muestra en el panel. */
export interface IExportResultView {
    ok: boolean;
    fileName: string;
    rowCount: number;
    messages: string[];
    error: string;
}

export interface IExcelReportPickerProps {
    reports: IReportRow[];
    columns: IColumnRow[];
    rowCount: number;
    globalErrors: string[];
    selectedKey: string;
    texts: IViewTexts;
    zIndex: number;
    disabled: boolean;
    lastResult: IExportResultView | null;
    /** El conjunto de datos enlazado todavia se esta cargando. */
    dataLoading: boolean;
    dataColumns: number;
    dataRecords: number;
    /** Avisa mientras carga y muestra el mensaje de listo cuando termina. */
    showDataStatus: boolean;
    /** Milisegundos que se mantiene el mensaje de listo; 0 lo deja visible. */
    readyNoticeMs: number;
    onSelect: (key: string) => void;
    onExport: (key: string) => Promise<IExportResultView>;
}

interface IMessage {
    kind: "ok" | "error";
    title: string;
    details: string[];
}

interface IOverlayPosition {
    top: number;
    left: number;
    minWidth: number;
}

interface IExcelReportPickerState {
    isOpen: boolean;
    activeIndex: number;
    exporting: boolean;
    message: IMessage | null;
    overlayPosition: IOverlayPosition;
    showColumns: boolean;
    copied: boolean;
    /** Se muestra el mensaje de "datos cargados". */
    showReady: boolean;
    /** El origen no termino de cargar en el tiempo maximo previsto. */
    loadTimedOut: boolean;
}

const MIN_PANEL_WIDTH = 260;
const VIEWPORT_MARGIN = 8;
const PANEL_GAP = 6;
const MAX_MEASURE_PASSES = 2;
/**
 * Tiempo maximo que se mantiene el aviso de carga si el host no confirma que
 * termino: evita que el giro quede visible para siempre.
 */
export const DATA_LOAD_TIMEOUT_MS = 15000;

/** Textos internos del panel que no se configuran por propiedades. */
export const PANEL_LABELS = {
    kicker: "INFORMES",
    records: "Registros",
    columns: "Columnas",
    detected: "Columnas detectadas",
    copy: "Copiar nombres",
    copied: "Nombres copiados",
    copyError: "No se pudo copiar al portapapeles",
    noColumns: "Sin datos. Enlaza una tabla o coleccion en Items.",
    columnsHint: "Cada campo se reconoce por su nombre visible; si el origen no lo informa se usa el nombre logico.",
    filters: "Los filtros se aplican con los valores actuales de la aplicacion.",
    selectHint: "Selecciona un informe de la lista para descargarlo.",
    warnings: "Avisos",
    loadingHint: "Leyendo la tabla o coleccion enlazada en Items.",
};

export class ExcelReportPickerView extends React.Component<IExcelReportPickerProps, IExcelReportPickerState> {
    private rootRef = React.createRef<HTMLElement>();
    private panelRef = React.createRef<HTMLDivElement>();
    private measurePasses = MAX_MEASURE_PASSES;
    private mounted = true;
    private readyTimerId = 0;
    private loadTimerId = 0;

    public constructor(props: IExcelReportPickerProps) {
        super(props);
        this.state = {
            isOpen: false,
            activeIndex: props.reports.length > 0 ? 0 : -1,
            exporting: false,
            message: null,
            overlayPosition: { top: 0, left: 0, minWidth: MIN_PANEL_WIDTH },
            showColumns: false,
            copied: false,
            showReady: false,
            loadTimedOut: false,
        };
    }

    public componentDidMount(): void {
        document.addEventListener("mousedown", this.handleDocumentMouseDown, true);
        window.addEventListener("resize", this.handleViewportChange);
        window.addEventListener("scroll", this.handleViewportChange, true);
        if (this.props.dataLoading) {
            this.startLoadWatchdog();
        } else {
            // El origen puede llegar ya cargado (memoria del host): se avisa igual.
            this.announceReady();
        }
    }

    public componentDidUpdate(prevProps: IExcelReportPickerProps): void {
        if (prevProps.dataLoading !== this.props.dataLoading) {
            if (this.props.dataLoading) {
                this.clearReadyNotice();
                if (this.state.loadTimedOut) this.setState({ loadTimedOut: false });
                this.startLoadWatchdog();
            } else {
                this.clearLoadTimer();
                this.announceReady();
            }
        }
        if (!this.state.isOpen) {
            this.measurePasses = MAX_MEASURE_PASSES;
            return;
        }
        if (this.measurePasses > 0) {
            this.measurePasses -= 1;
            this.updateOverlayPosition();
        }
    }

    public componentWillUnmount(): void {
        this.mounted = false;
        this.clearReadyTimer();
        this.clearLoadTimer();
        document.removeEventListener("mousedown", this.handleDocumentMouseDown, true);
        window.removeEventListener("resize", this.handleViewportChange);
        window.removeEventListener("scroll", this.handleViewportChange, true);
    }

    /** Verdadero mientras se muestra el aviso de carga (con tiempo maximo). */
    private isLoading(): boolean {
        return this.props.dataLoading && !this.state.loadTimedOut;
    }

    /** Muestra el mensaje de "datos cargados" durante el tiempo configurado. */
    private announceReady(): void {
        if (!this.props.showDataStatus) return;
        this.clearReadyTimer();
        this.setState({ showReady: true });
        const notice = this.props.readyNoticeMs;
        if (notice <= 0) return;
        this.readyTimerId = window.setTimeout(() => {
            if (this.mounted) this.setState({ showReady: false });
        }, notice);
    }

    private clearReadyNotice(): void {
        this.clearReadyTimer();
        if (this.state.showReady) this.setState({ showReady: false });
    }

    private clearReadyTimer(): void {
        if (this.readyTimerId === 0) return;
        window.clearTimeout(this.readyTimerId);
        this.readyTimerId = 0;
    }

    /** Corta el aviso de carga si el host no confirma que termino de cargar. */
    private startLoadWatchdog(): void {
        this.clearLoadTimer();
        this.loadTimerId = window.setTimeout(() => {
            if (this.mounted) this.setState({ loadTimedOut: true });
        }, DATA_LOAD_TIMEOUT_MS);
    }

    private clearLoadTimer(): void {
        if (this.loadTimerId === 0) return;
        window.clearTimeout(this.loadTimerId);
        this.loadTimerId = 0;
    }

    public render(): React.ReactElement {
        const { disabled, reports, texts } = this.props;
        const { isOpen } = this.state;
        const message = this.state.message ?? this.resultMessage(this.props.lastResult);
        const selected = this.selectedReport();
        const loading = this.props.showDataStatus && this.isLoading();
        const ready = this.props.showDataStatus && this.state.showReady && !loading;
        const label = selected ? `${texts.button}: ${selected.name}` : texts.button;
        const statusText = loading ? texts.loading : ready ? texts.ready : label;
        const statusTitle = loading
            ? PANEL_LABELS.loadingHint
            : ready
              ? `${this.props.dataRecords} ${PANEL_LABELS.records.toLowerCase()} · ${this.props.dataColumns} ${PANEL_LABELS.columns.toLowerCase()}`
              : selected
                ? selected.fileName
                : texts.panelHint;

        const control = (
            <section
                ref={this.rootRef}
                className={`erp-root erp-root-compact ${disabled ? "is-disabled" : ""} ${isOpen ? "is-open" : ""} ${loading ? "is-loading" : ""} ${ready ? "is-ready" : ""}`}
                aria-label={texts.button}
            >
                <button type="button" className="erp-trigger" onClick={this.togglePanel} disabled={disabled} aria-expanded={isOpen} aria-haspopup="dialog">
                    {loading ? (
                        <span className="erp-spinner" aria-hidden="true" />
                    ) : ready ? (
                        <span className="erp-check" aria-hidden="true">
                            ✓
                        </span>
                    ) : (
                        <span className="erp-icon" aria-hidden="true" />
                    )}
                    <span className="erp-trigger-text" role="status" aria-live="polite" title={statusTitle}>
                        {statusText}
                    </span>
                </button>
                <button
                    type="button"
                    className="erp-chevron-button"
                    onClick={this.togglePanel}
                    disabled={disabled}
                    aria-label={isOpen ? "Contraer informes" : "Abrir informes"}
                >
                    <span className={`erp-chevron ${isOpen ? "is-open" : ""}`} aria-hidden="true" />
                </button>
            </section>
        );

        if (!isOpen) return control;

        const panel = (
            <div
                ref={this.panelRef}
                className="erp-panel"
                style={{
                    top: this.state.overlayPosition.top,
                    left: this.state.overlayPosition.left,
                    minWidth: this.state.overlayPosition.minWidth,
                    zIndex: Math.max(1, Math.min(this.props.zIndex, 2147483647)),
                }}
                role="dialog"
                aria-label={this.props.texts.panelTitle}
                onKeyDown={this.handlePanelKeyDown}
            >
                <div className="erp-header">
                    <div className="erp-header-text">
                        <span className="erp-kicker">{PANEL_LABELS.kicker}</span>
                        <div className="erp-title">{this.props.texts.panelTitle}</div>
                        <div className="erp-subtitle">{this.props.texts.panelHint}</div>
                    </div>
                    <div className="erp-header-actions">
                        <div className={`erp-status ${this.isLoading() ? "is-loading" : ""}`}>
                            {this.isLoading()
                                ? texts.loading
                                : `${PANEL_LABELS.records}: ${this.props.rowCount} · ${PANEL_LABELS.columns}: ${this.props.columns.length}`}
                        </div>
                        <button type="button" className="erp-close" onClick={this.closePanel} aria-label="Contraer panel">
                            ×
                        </button>
                    </div>
                </div>
                {this.isLoading() ? <div className="erp-hint">{texts.loading}</div> : null}
                {this.renderGlobalErrors()}
                {this.renderSelectionBar(selected)}
                {this.renderReportList(reports)}
                {message ? this.renderMessage(message) : null}
                {this.renderColumns()}
                <div className="erp-footer">
                    <span className="erp-dot" aria-hidden="true" />
                    {PANEL_LABELS.filters}
                </div>
            </div>
        );

        return (
            <React.Fragment>
                {control}
                {ReactDOM.createPortal(panel, document.body)}
            </React.Fragment>
        );
    }

    private renderGlobalErrors(): React.ReactNode {
        if (this.props.globalErrors.length === 0) return null;
        return (
            <div className="erp-alert is-error">
                <div className="erp-alert-title">{this.props.texts.errorTitle}</div>
                <ul className="erp-alert-list">
                    {this.props.globalErrors.map((item, index) => (
                        <li key={`global-${String(index)}`}>{item}</li>
                    ))}
                </ul>
            </div>
        );
    }

    private renderSelectionBar(selected: IReportRow | undefined): React.ReactNode {
        const { texts, rowCount, disabled, reports } = this.props;
        const { exporting } = this.state;
        if (!selected) {
            return <div className="erp-hint">{reports.length === 0 ? texts.noReports : PANEL_LABELS.selectHint}</div>;
        }
        const blocked = selected.errors.length > 0;
        const busy = this.isLoading();
        return (
            <div className="erp-action-bar">
                <div className="erp-action-info">
                    <div className="erp-action-name">{selected.name}</div>
                    <div className="erp-action-file" title={selected.fileName}>
                        {selected.fileName} · {selected.columnCount} {PANEL_LABELS.columns.toLowerCase()} · {rowCount} {PANEL_LABELS.records.toLowerCase()}
                    </div>
                </div>
                <button type="button" className="erp-download" onClick={this.handleDownloadClick} disabled={disabled || exporting || blocked || busy}>
                    {exporting ? texts.exporting : busy ? texts.loading : texts.download}
                </button>
            </div>
        );
    }

    private renderReportList(reports: IReportRow[]): React.ReactNode {
        if (reports.length === 0) return null;
        const { selectedKey } = this.props;
        const { activeIndex } = this.state;
        return (
            <div className="erp-list-block">
                <ul className="erp-list" role="listbox" aria-label={this.props.texts.panelTitle}>
                    {reports.map((report, index) => {
                        const isSelected = report.key === selectedKey;
                        const badge =
                            report.errors.length > 0
                                ? `${PANEL_LABELS.warnings}: ${report.errors.length}`
                                : `${report.columnCount} ${PANEL_LABELS.columns.toLowerCase()}`;
                        return (
                            <li
                                key={report.key}
                                className={`erp-option ${isSelected ? "is-selected" : ""} ${index === activeIndex ? "is-active" : ""}`}
                                role="option"
                                aria-selected={isSelected}
                                onMouseEnter={() => this.setState({ activeIndex: index })}
                                onClick={() => this.handleSelect(report.key)}
                            >
                                <span className="erp-option-body">
                                    <span className="erp-option-name">{report.name}</span>
                                    {report.description ? <span className="erp-option-description">{report.description}</span> : null}
                                </span>
                                <span className={`erp-badge ${report.errors.length > 0 ? "is-warning" : ""}`}>{badge}</span>
                            </li>
                        );
                    })}
                </ul>
            </div>
        );
    }

    private renderMessage(message: IMessage): React.ReactNode {
        return (
            <div className={`erp-alert ${message.kind === "ok" ? "is-ok" : "is-error"}`}>
                <div className="erp-alert-title">{message.title}</div>
                {message.details.length > 0 ? (
                    <ul className="erp-alert-list">
                        {message.details.map((item, index) => (
                            <li key={`detail-${String(index)}`}>{item}</li>
                        ))}
                    </ul>
                ) : null}
            </div>
        );
    }

    private renderColumns(): React.ReactNode {
        const { columns } = this.props;
        const { showColumns, copied } = this.state;
        return (
            <div className="erp-columns">
                <div className="erp-columns-header">
                    <button type="button" className="erp-link" onClick={() => this.setState({ showColumns: !showColumns })} aria-expanded={showColumns}>
                        {PANEL_LABELS.detected} ({columns.length})
                    </button>
                    <button type="button" className="erp-link" onClick={this.handleCopyClick} disabled={columns.length === 0}>
                        {copied ? PANEL_LABELS.copied : PANEL_LABELS.copy}
                    </button>
                </div>
                {showColumns ? (
                    columns.length === 0 ? (
                        <div className="erp-hint">{PANEL_LABELS.noColumns}</div>
                    ) : (
                        <React.Fragment>
                            <div className="erp-hint">{PANEL_LABELS.columnsHint}</div>
                            <ul className="erp-columns-list">
                                {columns.map((column) => (
                                    <li key={column.name} className="erp-column-item">
                                        <span className="erp-column-primary" title={column.displayName || column.name}>
                                            {column.displayName || column.name}
                                        </span>
                                        {column.name && column.name !== column.displayName ? (
                                            <span className="erp-column-secondary" title={column.name}>
                                                {column.name}
                                            </span>
                                        ) : null}
                                        <span className="erp-column-type">{column.type}</span>
                                        <span className="erp-column-format" title={column.format}>
                                            {column.format}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </React.Fragment>
                    )
                ) : null}
            </div>
        );
    }

    private selectedReport(): IReportRow | undefined {
        return this.props.reports.find((report) => report.key === this.props.selectedKey);
    }

    private reportAt(index: number): IReportRow | undefined {
        return index >= 0 && index < this.props.reports.length ? this.props.reports[index] : undefined;
    }

    private togglePanel = (): void => {
        if (this.props.disabled) return;
        this.setState({ isOpen: !this.state.isOpen, message: null });
    };

    private closePanel = (): void => {
        this.setState({ isOpen: false });
    };

    private handleDocumentMouseDown = (event: MouseEvent): void => {
        if (!this.state.isOpen) return;
        if (this.rootRef.current && event.target instanceof Node && this.rootRef.current.contains(event.target)) return;
        if (this.panelRef.current && event.target instanceof Node && this.panelRef.current.contains(event.target)) return;
        this.closePanel();
    };

    private handleViewportChange = (): void => {
        if (this.state.isOpen) this.updateOverlayPosition();
    };

    private updateOverlayPosition(): void {
        const root = this.rootRef.current;
        if (!root) return;
        const rect = root.getBoundingClientRect();
        const panel = this.panelRef.current;
        const panelHeight = panel ? panel.offsetHeight : 0;
        const below = window.innerHeight - rect.bottom - PANEL_GAP - VIEWPORT_MARGIN;
        const above = rect.top - PANEL_GAP - VIEWPORT_MARGIN;
        const openUp = panelHeight > 0 && panelHeight > below && above > below;
        const top = openUp ? Math.max(VIEWPORT_MARGIN, rect.top - PANEL_GAP - panelHeight) : rect.bottom + PANEL_GAP;
        const minWidth = Math.max(MIN_PANEL_WIDTH, rect.width);
        const maxLeft = window.innerWidth - MIN_PANEL_WIDTH - VIEWPORT_MARGIN;
        const left = Math.max(VIEWPORT_MARGIN, Math.min(rect.left, Math.max(VIEWPORT_MARGIN, maxLeft)));
        if (top !== this.state.overlayPosition.top || left !== this.state.overlayPosition.left || minWidth !== this.state.overlayPosition.minWidth) {
            this.setState({ overlayPosition: { top, left, minWidth } });
        }
    }

    private handlePanelKeyDown = (event: React.KeyboardEvent<HTMLDivElement>): void => {
        if (event.key === "Escape") {
            event.preventDefault();
            this.closePanel();
            return;
        }
        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            const step = event.key === "ArrowDown" ? 1 : -1;
            const total = this.props.reports.length;
            if (total === 0) return;
            const next = (this.state.activeIndex + step + total) % total;
            this.setState({ activeIndex: next });
            return;
        }
        if (event.key === "Enter") {
            const report = this.reportAt(this.state.activeIndex);
            if (report && report.errors.length === 0) {
                event.preventDefault();
                this.handleSelect(report.key);
            }
        }
    };

    private handleSelect(key: string): void {
        this.props.onSelect(key);
        this.setState({ message: null });
    }

    private handleDownloadClick = (): void => {
        void this.handleDownload();
    };

    private async handleDownload(): Promise<void> {
        const selected = this.selectedReport();
        if (!selected || this.state.exporting) return;
        this.setState({ exporting: true, message: null });
        let result: IExportResultView | null = null;
        try {
            result = await this.props.onExport(selected.key);
        } catch (error) {
            const detail = error instanceof Error ? error.message : String(error);
            result = { ok: false, fileName: selected.fileName, rowCount: 0, messages: [], error: detail };
        }
        if (!this.mounted) return;
        this.setState({ exporting: false, message: this.resultMessage(result) });
    }

    private resultMessage(result: IExportResultView | null): IMessage | null {
        if (!result) return null;
        if (!result.ok) {
            return { kind: "error", title: result.error || this.props.texts.errorTitle, details: result.messages };
        }
        const details = [`${result.fileName} · ${result.rowCount} ${PANEL_LABELS.records.toLowerCase()}`];
        if (this.props.rowCount === 0) details.push(this.props.texts.emptyData);
        result.messages.forEach((item) => details.push(item));
        return { kind: "ok", title: this.props.texts.success, details };
    }

    private handleCopyClick = (): void => {
        void this.copyColumns();
    };

    /**
     * Copia una definicion lista para pegar en la propiedad de informes. Las
     * columnas se declaran con su **nombre visible** (FieldDisplayName), que es la
     * clave con la que el control reconoce cada campo y el encabezado que Excel
     * escribe, asi que no hace falta declarar `titulos`.
     */
    private async copyColumns(): Promise<void> {
        const snippet = JSON.stringify(
            { columnas: this.props.columns.map((column) => column.displayName || column.name) },
            null,
            2
        );
        try {
            if (!navigator.clipboard) throw new Error(PANEL_LABELS.copyError);
            await navigator.clipboard.writeText(snippet);
            if (!this.mounted) return;
            this.setState({ copied: true, message: null });
            window.setTimeout(() => {
                if (this.mounted) this.setState({ copied: false });
            }, 2000);
        } catch {
            if (!this.mounted) return;
            this.setState({ message: { kind: "error", title: PANEL_LABELS.copyError, details: [] } });
        }
    }
}




