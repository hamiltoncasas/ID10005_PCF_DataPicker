/**
 * Fecha: 2026-09-16
 * Descripcion: Vista React del combobox con busqueda incremental tipo contiene,
 * seleccion unica o multiple, resaltado de coincidencias y lista expandible que
 * muestra el texto completo aunque supere el ancho del control.
 */
import * as React from "react";
import * as ReactDOM from "react-dom";

export interface ISearchableComboBoxOption {
    key: string;
    value: string;
    label: string;
    description: string;
    searchText: string;
}

export interface ISearchableComboBoxProps {
    options: ISearchableComboBoxOption[];
    selectedValues: string[];
    selectMultiple: boolean;
    isSearchable: boolean;
    noSelectionText: string;
    placeholderText: string;
    zIndex: number;
    disabled: boolean;
    morePagesAvailable: boolean;
    onRefresh: () => void;
    onChange: (values: string[]) => void;
}

interface IOverlayPosition { top: number; left: number; minWidth: number; }

interface ISearchableComboBoxState {
    isOpen: boolean;
    searchText: string;
    activeIndex: number;
    overlayPosition: IOverlayPosition;
}

const MIN_PANEL_WIDTH = 220;
const VIEWPORT_MARGIN = 8;
const PANEL_GAP = 6;
const MAX_MEASURE_PASSES = 2;

/**
 * Normaliza texto para busquedas tipo contiene: minusculas y sin acentos.
 * Conserva la longitud para poder resaltar la coincidencia en el texto original.
 */
export function normalizeForSearch(value: string): string {
    return value
        .toLowerCase()
        .replace(/[áàäâã]/g, "a")
        .replace(/[éèëê]/g, "e")
        .replace(/[íìïî]/g, "i")
        .replace(/[óòöôõ]/g, "o")
        .replace(/[úùüû]/g, "u")
        .replace(/ñ/g, "n")
        .replace(/ç/g, "c");
}

function highlightMatch(label: string, query: string): React.ReactNode {
    const needle = normalizeForSearch(query.trim());
    if (!needle) return label;
    const index = normalizeForSearch(label).indexOf(needle);
    if (index < 0) return label;
    return [label.slice(0, index), <mark key="match" className="scb-match">{label.slice(index, index + needle.length)}</mark>, label.slice(index + needle.length)];
}

export class SearchableComboBoxView extends React.Component<ISearchableComboBoxProps, ISearchableComboBoxState> {
    private rootRef = React.createRef<HTMLElement>();
    private searchInput = React.createRef<HTMLInputElement>();
    private panelRef = React.createRef<HTMLDivElement>();
    private listRef = React.createRef<HTMLUListElement>();
    private measurePasses = MAX_MEASURE_PASSES;
    private shouldScrollActive = false;

    public constructor(props: ISearchableComboBoxProps) {
        super(props);
        this.state = { isOpen: false, searchText: "", activeIndex: -1, overlayPosition: { top: 0, left: 0, minWidth: MIN_PANEL_WIDTH } };
    }

    public componentDidMount(): void {
        document.addEventListener("mousedown", this.handleDocumentMouseDown, true);
        window.addEventListener("resize", this.handleViewportChange);
        window.addEventListener("scroll", this.handleViewportChange, true);
    }

    public componentDidUpdate(): void {
        if (!this.state.isOpen) {
            this.measurePasses = MAX_MEASURE_PASSES;
            return;
        }
        if (this.props.isSearchable && this.searchInput.current && document.activeElement !== this.searchInput.current) {
            this.searchInput.current.focus();
        }
        if (this.shouldScrollActive) {
            this.shouldScrollActive = false;
            this.scrollActiveIntoView();
        }
        if (this.measurePasses < MAX_MEASURE_PASSES) {
            this.measurePasses += 1;
            this.updateOverlayPosition();
        }
    }

    public componentWillUnmount(): void {
        document.removeEventListener("mousedown", this.handleDocumentMouseDown, true);
        window.removeEventListener("resize", this.handleViewportChange);
        window.removeEventListener("scroll", this.handleViewportChange, true);
    }

    private handleDocumentMouseDown = (event: MouseEvent): void => {
        if (!this.state.isOpen) return;
        const target = event.target as Node | null;
        const root = this.rootRef.current;
        const panel = this.panelRef.current;
        if (target && (root?.contains(target) || panel?.contains(target))) return;
        this.closePanel();
    };

    private handleViewportChange = (): void => {
        if (!this.state.isOpen) return;
        this.measurePasses = 0;
        this.updateOverlayPosition();
    };

    private updateOverlayPosition = (): void => {
        const root = this.rootRef.current;
        if (!root) return;
        const bounds = root.getBoundingClientRect();
        const panel = this.panelRef.current;
        const panelWidth = panel ? panel.offsetWidth : 0;
        const panelHeight = panel ? panel.offsetHeight : 0;
        const minWidth = Math.max(bounds.width, MIN_PANEL_WIDTH);
        let left = bounds.left;
        if (panelWidth > 0 && left + panelWidth > window.innerWidth - VIEWPORT_MARGIN) {
            left = Math.max(VIEWPORT_MARGIN, window.innerWidth - panelWidth - VIEWPORT_MARGIN);
        }
        let top = bounds.bottom + PANEL_GAP;
        if (panelHeight > 0 && top + panelHeight > window.innerHeight - VIEWPORT_MARGIN && bounds.top - panelHeight - PANEL_GAP >= VIEWPORT_MARGIN) {
            top = bounds.top - panelHeight - PANEL_GAP;
        }
        const next: IOverlayPosition = { top, left, minWidth };
        const current = this.state.overlayPosition;
        if (Math.abs(next.top - current.top) > 0.5 || Math.abs(next.left - current.left) > 0.5 || next.minWidth !== current.minWidth) {
            this.setState({ overlayPosition: next });
        }
    };

    private getFilteredOptions(): ISearchableComboBoxOption[] {
        const needle = normalizeForSearch(this.state.searchText.trim());
        if (!needle) return this.props.options;
        return this.props.options.filter((option) => option.searchText.includes(needle));
    }

    private isSelected(value: string): boolean {
        return this.props.selectedValues.includes(value);
    }

    private openPanel = (): void => {
        if (this.props.disabled || this.state.isOpen) return;
        const root = this.rootRef.current;
        if (!root) return;
        const bounds = root.getBoundingClientRect();
        const selectedIndex = this.props.options.findIndex((option) => this.isSelected(option.value));
        this.measurePasses = 0;
        this.shouldScrollActive = true;
        this.setState({
            isOpen: true,
            searchText: "",
            activeIndex: selectedIndex >= 0 ? selectedIndex : this.props.options.length > 0 ? 0 : -1,
            overlayPosition: { top: bounds.bottom + PANEL_GAP, left: bounds.left, minWidth: Math.max(bounds.width, MIN_PANEL_WIDTH) },
        });
    };

    private closePanel = (): void => {
        this.setState({ isOpen: false, searchText: "", activeIndex: -1 });
    };

    private togglePanel = (): void => {
        if (this.state.isOpen) this.closePanel();
        else this.openPanel();
    };

    private toggleOption = (value: string): void => {
        const { selectMultiple, selectedValues, onChange } = this.props;
        if (!selectMultiple) {
            onChange(this.isSelected(value) ? [] : [value]);
            return;
        }
        onChange(this.isSelected(value) ? selectedValues.filter((item) => item !== value) : [...selectedValues, value]);
    };

    private removeTag = (value: string): void => {
        this.props.onChange(this.props.selectedValues.filter((item) => item !== value));
    };

    /** Vuelve a consultar la fuente de datos enlazada en Items. */
    private refreshData = (): void => {
        this.props.onRefresh();
    };

    /**
     * Quita todo lo que el usuario agrego al control: el texto de busqueda y la
     * seleccion. El editor de busqueda queda listo para volver a filtrar.
     */
    private clearFilters = (): void => {
        this.setState({ searchText: "", activeIndex: this.props.options.length > 0 ? 0 : -1 });
        if (this.props.selectedValues.length > 0) this.props.onChange([]);
    };

    private scrollActiveIntoView = (): void => {
        const list = this.listRef.current;
        if (!list) return;
        const activeOption = list.children.item(this.state.activeIndex);
        if (activeOption instanceof HTMLElement) activeOption.scrollIntoView({ block: "nearest" });
    };

    private moveActive = (offset: number): void => {
        const total = this.getFilteredOptions().length;
        if (total === 0) return;
        this.setState(({ activeIndex }) => {
            const nextIndex = activeIndex < 0 ? (offset > 0 ? 0 : total - 1) : (activeIndex + offset + total) % total;
            return { activeIndex: nextIndex };
        }, this.scrollActiveIntoView);
    };

    private handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
        this.setState({ searchText: event.target.value, activeIndex: 0 });
    };

    private handleInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>): void => {
        if (this.props.disabled) return;
        switch (event.key) {
            case "ArrowDown":
                event.preventDefault();
                this.moveActive(1);
                break;
            case "ArrowUp":
                event.preventDefault();
                this.moveActive(-1);
                break;
            case "Enter": {
                const option = this.getFilteredOptions()[this.state.activeIndex];
                if (option) {
                    event.preventDefault();
                    this.toggleOption(option.value);
                    if (!this.props.selectMultiple) this.closePanel();
                }
                break;
            }
            case "Escape":
                event.preventDefault();
                this.closePanel();
                break;
            case "Tab":
                this.closePanel();
                break;
            case "Backspace":
                if (!this.state.searchText && this.props.selectMultiple && this.props.selectedValues.length > 0) {
                    this.removeTag(this.props.selectedValues[this.props.selectedValues.length - 1]);
                }
                break;
            default:
                break;
        }
    };

    public render(): React.ReactNode {
        const { options, selectedValues, selectMultiple, isSearchable, noSelectionText, placeholderText, disabled, morePagesAvailable } = this.props;
        const { isOpen, searchText, activeIndex } = this.state;
        const selectedOptions = selectedValues.map((value) => options.find((option) => option.value === value)).filter((option): option is ISearchableComboBoxOption => !!option);
        const selectedLabels = selectedOptions.map((option) => option.label);
        const summary = selectedLabels.length > 0 ? selectedLabels.join(", ") : noSelectionText;
        const statusText = selectedLabels.length > 0 ? `${selectedLabels.length} seleccionado${selectedLabels.length === 1 ? "" : "s"}` : "Sin selección";

        const compactField = isOpen ? (
            <input ref={this.searchInput} className={isSearchable ? "scb-compact-input scb-compact-search" : "scb-compact-input scb-compact-value"} type="text" readOnly={!isSearchable} value={isSearchable ? searchText : summary} placeholder={isSearchable ? placeholderText : undefined} onChange={this.handleSearchChange} onKeyDown={this.handleInputKeyDown} disabled={disabled} role="combobox" aria-expanded={true} aria-label="Buscar opciones" />
        ) : selectMultiple && selectedOptions.length > 0 ? (
            <div className="scb-tags">{selectedOptions.map((option) => <span key={option.value} className="scb-tag" title={option.label}><span className="scb-tag-text">{option.label}</span>{disabled ? null : <button type="button" className="scb-tag-close" onClick={() => this.removeTag(option.value)} aria-label={`Quitar ${option.label}`}>×</button>}</span>)}</div>
        ) : (
            <input className={selectedOptions.length > 0 ? "scb-compact-input scb-compact-value" : "scb-compact-input scb-compact-placeholder"} type="text" readOnly value={selectedOptions.length > 0 ? selectedOptions[0].label : noSelectionText} title={selectedOptions.length > 0 ? selectedOptions[0].label : undefined} onClick={this.openPanel} onFocus={this.openPanel} disabled={disabled} role="combobox" aria-expanded={false} aria-label="Abrir lista de opciones" />
        );

        const control = (
            <section ref={this.rootRef} className={`scb-root scb-root-compact ${disabled ? "is-disabled" : ""} ${isOpen ? "is-open" : ""}`} aria-label="Combobox con búsqueda">
                {compactField}
                <button type="button" className="scb-chevron-button" onClick={this.togglePanel} disabled={disabled} aria-label={isOpen ? "Contraer lista" : "Abrir lista de opciones"}><span className={`scb-chevron ${isOpen ? "is-open" : ""}`} aria-hidden="true" /></button>
            </section>
        );

        if (!isOpen) return control;

        const filtered = this.getFilteredOptions();
        const emptyMessage = options.length === 0 ? "Sin registros. Enlaza una tabla o colección en Items." : `No se encontraron coincidencias para “${searchText}”.`;
        const panel = (
            <div ref={this.panelRef} className="scb-panel" style={{ top: this.state.overlayPosition.top, left: this.state.overlayPosition.left, minWidth: this.state.overlayPosition.minWidth, zIndex: Math.max(1, Math.min(this.props.zIndex, 2147483647)) }} role="dialog" aria-label="Lista de opciones">
                <div className="scb-header">
                    <div className="scb-header-text"><span className="scb-kicker">REGISTROS</span><div className="scb-summary" title={summary}>{summary}</div></div>
                    <div className="scb-header-actions"><div className={`scb-status ${selectedLabels.length > 0 ? "is-complete" : ""}`}>{statusText}</div><button type="button" className="scb-refresh" onClick={this.refreshData} disabled={disabled} title="Actualizar la fuente de datos" aria-label="Actualizar la fuente de datos"><span className="scb-refresh-icon" aria-hidden="true" /></button><button type="button" className="scb-close" onClick={this.closePanel} aria-label="Contraer lista">×</button></div>
                </div>
                <div className="scb-list-block">
                    {filtered.length === 0 ? <div className="scb-empty">{emptyMessage}</div> : (
                        <ul ref={this.listRef} className="scb-list" role="listbox" aria-multiselectable={selectMultiple}>
                            {filtered.map((option, index) => {
                                const isSelectedOption = this.isSelected(option.value);
                                return (
                                    <li key={option.key} className={`scb-option ${isSelectedOption ? "is-selected" : ""} ${index === activeIndex ? "is-active" : ""}`} role="option" aria-selected={isSelectedOption} title={option.description ? `${option.label} · ${option.description}` : option.label} onMouseDown={(event) => { event.preventDefault(); this.toggleOption(option.value); if (!selectMultiple) this.closePanel(); }} onMouseEnter={() => this.setState({ activeIndex: index })}>
                                        {selectMultiple ? <span className={`scb-check ${isSelectedOption ? "is-on" : ""}`} aria-hidden="true" /> : null}
                                        <span className="scb-option-body"><span className="scb-option-text">{highlightMatch(option.label, searchText)}</span>{option.description ? <span className="scb-option-description">{highlightMatch(option.description, searchText)}</span> : null}</span>
                                        {!selectMultiple && isSelectedOption ? <span className="scb-check is-on" aria-hidden="true" /> : null}
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>
                <div className="scb-footer"><span className="scb-dot" /> {filtered.length} de {options.length} registros · coincidencias en cualquier parte del texto{searchText || selectedValues.length > 0 ? <button type="button" className="scb-clear" onClick={this.clearFilters} disabled={disabled} title="Quita el texto de búsqueda y la selección">Limpiar filtros</button> : null}</div>
                {morePagesAvailable ? <div className="scb-hint">Hay más registros sin cargar: usa el paginador de Power Apps del control o activa <strong>Cargar todos los registros</strong> para buscarlos todos.</div> : null}
            </div>
        );
        return <React.Fragment>{control}{ReactDOM.createPortal(panel, document.body)}</React.Fragment>;
    }
}
