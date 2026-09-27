/**
 * Fecha: 2026-09-12
 * Descripcion: Vista React del calendario, con navegacion mensual,
 * seleccion visual del rango y estados de inicio, fin y fechas intermedias.
 */
import * as React from "react";
import * as ReactDOM from "react-dom";

/** Propiedades visuales equivalentes a las del selector de fecha nativo. */
export interface IPickerVisualProps {
    chevronBackground?: string;
    chevronFill?: string;
    iconBackground?: string;
    iconFill?: string;
    borderColor?: string;
    borderStyle?: string;
    borderThickness?: number;
    color?: string;
    fill?: string;
    font?: string;
    size?: number;
    fontWeight?: string;
    italic?: boolean;
    strikethrough?: boolean;
    underline?: boolean;
}

/** Estilos del control; admite variables CSS propias ademas de las de React. */
export type PickerStyles = React.CSSProperties & Record<string, string | number | undefined>;

/** Estilos listos para aplicar en cada parte del control. */
export interface IPickerVisualStyles {
    box: PickerStyles;
    input: PickerStyles;
    icon: PickerStyles;
    iconGlyph: PickerStyles;
    chevron: PickerStyles;
}

export interface IDateRangePickerProps extends IPickerVisualProps {
    startDate: string;
    endDate: string;
    dateFormat: string;
    zIndex: number;
    disabled: boolean;
    /** Texto accesible del control; si no se indica se usa el texto generico. */
    accessibleLabel?: string;
    /** Texto que se muestra mientras no hay fechas seleccionadas. */
    placeholderText?: string;
    /** Permite escribir las fechas en el campo de texto. */
    isEditable?: boolean;
    /** Primer ano navegable del calendario; 0 = sin limite. */
    startYear?: number;
    /** Ultimo ano navegable del calendario; 0 = sin limite. */
    endYear?: number;
    /** Primer dia de la semana: nombre del dia o numero 0-6 (0 = domingo). */
    startOfWeek?: string;
    /** Fecha minima elegible en el formato configurado; vacio = sin limite. */
    minDate?: string;
    /** Fecha maxima elegible en el formato configurado; vacio = sin limite. */
    maxDate?: string;
    /** Zona horaria de los valores: Local (por omision) o Utc. */
    dateTimeZone?: string;
    /** Codigo de idioma de los nombres de meses y dias (por ejemplo es-ES). */
    language?: string;
    onRangeChange: (startDate: string, endDate: string) => void;
}

type DateFormat = "YYYY-MM-DD" | "YYYY/MM/DD" | "YYYY.MM.DD" | "YYYYMMDD" | "DD/MM/YYYY" | "MM/DD/YYYY" | "DD-MM-YYYY" | "MM-DD-YYYY" | "DD.MM.YYYY" | "MM.DD.YYYY" | "DDMMYYYY" | "MMDDYYYY";

const supportedDateFormats: DateFormat[] = ["YYYY-MM-DD", "YYYY/MM/DD", "YYYY.MM.DD", "YYYYMMDD", "DD/MM/YYYY", "MM/DD/YYYY", "DD-MM-YYYY", "MM-DD-YYYY", "DD.MM.YYYY", "MM.DD.YYYY", "DDMMYYYY", "MMDDYYYY"];

interface ICalendarDay { date: Date; day: number; isCurrentMonth: boolean; key: string; }

const months = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

/** Etiquetas de los dias de la semana, empezando en domingo. */
const WEEKDAY_LABELS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

/** Quita los acentos para comparar nombres de dia escritos de cualquier forma. */
function normalizeAccents(value: string): string {
    return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

/**
 * Primer dia de la semana configurado (0 = domingo ... 6 = sabado). Acepta el
 * nombre del dia en espanol o ingles y el numero. Sin valor se usa lunes.
 */
function firstWeekday(value: string | undefined): number {
    const text = normalizeAccents((value ?? "").trim().toLowerCase());
    if (!text) return 1;
    const spanish = ["domingo", "lunes", "martes", "miercoles", "jueves", "viernes", "sabado"];
    const english = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    const index = spanish.indexOf(text);
    if (index >= 0) return index;
    const englishIndex = english.indexOf(text);
    if (englishIndex >= 0) return englishIndex;
    const number = Number(text);
    return Number.isInteger(number) && number >= 0 && number <= 6 ? number : 1;
}

/** Formato regional del idioma configurado; null si no se indico o no es valido. */
function localeFormat(language: string | undefined, options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat | null {
    const locale = (language ?? "").trim();
    if (!locale) return null;
    try {
        return new Intl.DateTimeFormat(locale, options);
    } catch {
        return null;
    }
}

/** Primera letra en mayuscula. */
function capitalize(value: string): string {
    return value ? value.charAt(0).toUpperCase() + value.slice(1) : value;
}

/** Nombres de los meses en el idioma configurado; sin idioma se usan los de siempre. */
export function monthLabels(language: string | undefined): string[] {
    const formatter = localeFormat(language, { month: "long" });
    if (!formatter) return months;
    return months.map((month, index) => capitalize(formatter.format(new Date(2026, index, 1))) || month);
}

/** Etiquetas de los dias en el orden y el idioma configurados. */
export function weekdayLabels(startOfWeek: number, language?: string): string[] {
    const formatter = localeFormat(language, { weekday: "short" });
    const labels: string[] = [];
    for (let index = 0; index < 7; index += 1) {
        const day = new Date(2026, 5, 7 + index);
        labels.push(formatter ? capitalize(formatter.format(day).replace(".", "")) : WEEKDAY_LABELS[index]);
    }
    const ordered: string[] = [];
    for (let index = 0; index < 7; index += 1) ordered.push(labels[(startOfWeek + index) % 7]);
    return ordered;
}

/** Zona horaria del control: Local (por omision) o Utc. */
type DateZone = "local" | "utc";

/** Zona horaria configurada a partir del texto de la propiedad. */
function normalizeZone(value: string | undefined): DateZone {
    return normalizeAccents((value ?? "").trim().toLowerCase()) === "utc" ? "utc" : "local";
}

/** Numero de un grupo de la expresion regular; 0 si no viene. */
function groupNumber(match: RegExpExecArray, index: number): number {
    const parsed = Number(String(match[index]));
    return Number.isFinite(parsed) ? parsed : 0;
}

/**
 * Fecha de un valor ISO (YYYY-MM-DD o YYYY-MM-DDTHH:mm[:ss]) ajustada a la zona
 * configurada: con Utc los valores que traen desplazamiento horario (Z, +hh:mm)
 * se convierten a UTC; con Local se leen tal como estan escritos.
 */
function parseZonedDate(value: string, zone: DateZone): Date | null {
    const text = value.trim();
    const match = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?)?(Z|[+-]\d{2}:?\d{2})?$/.exec(text);
    if (!match) return null;
    const year = groupNumber(match, 1);
    const month = groupNumber(match, 2);
    const day = groupNumber(match, 3);
    if (Boolean(match[7]) && zone === "utc") {
        const instant = new Date(Date.parse(text.replace(" ", "T")));
        if (Number.isNaN(instant.getTime())) return null;
        return new Date(instant.getUTCFullYear(), instant.getUTCMonth(), instant.getUTCDate());
    }
    const parsedDate = new Date(year, month - 1, day, groupNumber(match, 4), groupNumber(match, 5), groupNumber(match, 6));
    if (parsedDate.getFullYear() !== year || parsedDate.getMonth() !== month - 1 || parsedDate.getDate() !== day) return null;
    return new Date(year, month - 1, day);
}

/** Fecha de hoy en la zona configurada. */
function currentDate(zone: DateZone): Date {
    const now = new Date();
    return zone === "utc" ? new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) : now;
}

/** Colores nombrados de Power Apps aceptados por las propiedades de color. */
const POWER_APPS_COLORS: Record<string, string> = {
    black: "#000000", blue: "#0b6cff", gray: "#808080", green: "#107c10", grey: "#808080", orange: "#f7630c",
    purple: "#886ce4", red: "#e81123", transparent: "transparent", white: "#ffffff", yellow: "#ffd800",
};

/** Estilos de borde admitidos por la propiedad de estilo del borde. */
const borderStyles = ["solid", "dashed", "dotted", "double", "none"];

/** Grosores de fuente nombrados, equivalentes a FontWeight de Power Apps. */
const fontWeights: Record<string, number> = { lighter: 300, regular: 400, normal: 400, medium: 500, semibold: 600, bold: 700, bolder: 800 };

/** Color CSS del valor configurado; acepta #hex, rgb(), nombres CSS y Color.X. */
function cssColor(value: string | undefined): string | undefined {
    const text = (value ?? "").trim();
    if (!text) return undefined;
    const named = /^Color\.([A-Za-z]+)$/.exec(text);
    if (named) return POWER_APPS_COLORS[named[1].toLowerCase()] ?? text;
    return text;
}

/** Estilo de borde CSS del valor configurado (BorderStyle.Solid, Dashed, ...). */
function cssBorderStyle(value: string | undefined): string | undefined {
    const text = (value ?? "").trim().toLowerCase().replace(/^borderstyle\./, "");
    return borderStyles.includes(text) ? text : undefined;
}

/** Grosor de fuente CSS del valor configurado (FontWeight.Bold, 700, ...). */
function cssFontWeight(value: string | undefined): string | number | undefined {
    const text = (value ?? "").trim().toLowerCase().replace(/^fontweight\./, "");
    const named = fontWeights[text];
    if (named) return named;
    const numeric = Number(text);
    return Number.isFinite(numeric) && numeric >= 100 && numeric <= 900 ? numeric : undefined;
}

/** Fecha minima o maxima configurada, leida con el formato del control. */
/** Estilos configurables de cada parte del control a partir de las propiedades visuales. */
export function visualStyles(props: IPickerVisualProps): IPickerVisualStyles {
    const fill = cssColor(props.fill);
    const color = cssColor(props.color);
    const borderColor = cssColor(props.borderColor);
    const borderStyle = cssBorderStyle(props.borderStyle);
    const font = (props.font ?? "").trim();
    const fontWeight = cssFontWeight(props.fontWeight);
    const iconBackground = cssColor(props.iconBackground);
    const iconFill = cssColor(props.iconFill);
    const chevronBackground = cssColor(props.chevronBackground);
    const chevronFill = cssColor(props.chevronFill);
    const decorations = [props.underline ? "underline" : "", props.strikethrough ? "line-through" : ""].filter((item) => item !== "").join(" ");
    const box: PickerStyles = {};
    if (fill) box.background = fill;
    if (borderColor) box.borderColor = borderColor;
    if (borderStyle) box.borderStyle = borderStyle;
    if (props.borderThickness !== undefined && props.borderThickness >= 0) box.borderWidth = props.borderThickness;
    const input: PickerStyles = {};
    if (fill) input.background = fill;
    if (color) input.color = color;
    if (font) input.fontFamily = font;
    if (props.size !== undefined && props.size > 0) input.fontSize = props.size;
    if (fontWeight !== undefined) input.fontWeight = fontWeight;
    if (props.italic) input.fontStyle = "italic";
    if (decorations) input.textDecoration = decorations;
    const icon: PickerStyles = {};
    if (iconBackground) icon.background = iconBackground;
    const iconGlyph: PickerStyles = {};
    if (iconFill) {
        iconGlyph.borderColor = iconFill;
        iconGlyph["--pcf-icon-fill"] = iconFill;
    }
    const chevron: PickerStyles = {};
    if (chevronBackground) chevron.background = chevronBackground;
    if (chevronFill) chevron.color = chevronFill;
    return { box, input, icon, iconGlyph, chevron };
}

function boundDate(value: string | undefined, dateFormat: DateFormat, zone: DateZone): Date | null {
    const text = (value ?? "").trim();
    return text ? toDate(text, dateFormat, zone) : null;
}

/** Indica si la fecha queda fuera del rango permitido. */
function isOutOfRange(date: Date, min: Date | null, max: Date | null): boolean {
    if (min && date.getTime() < min.getTime()) return true;
    if (max && date.getTime() > max.getTime()) return true;
    return false;
}

/** Ajusta el mes visible a los anos permitidos por StartYear y EndYear. */
function clampMonth(month: Date, startYear: number, endYear: number): Date {
    const year = month.getFullYear();
    const clamped = startYear > 0 && year < startYear ? startYear : endYear > 0 && year > endYear ? endYear : year;
    return clamped === year ? month : new Date(clamped, month.getMonth(), 1);
}

function normalizeDateFormat(value: string): DateFormat {
    const normalizedFormat = value.trim().toUpperCase();
    const matchingFormat = supportedDateFormats.find((dateFormat) => dateFormat === normalizedFormat);
    if (matchingFormat) return matchingFormat;
    return "YYYY-MM-DD";
}

function toDate(value: string, dateFormat: DateFormat, zone: DateZone): Date | null {
    if (/^\d{4}-\d{2}-\d{2}([T ]\d{2}:\d{2}|$)/.test(value.trim())) {
        const zoned = parseZonedDate(value, zone);
        if (zoned) return zoned;
    }
    let day: number;
    let month: number;
    let year: number;
    const dateParts = value.split(/[-/.]/).map(Number);
    if (dateFormat === "YYYYMMDD" || dateFormat === "DDMMYYYY" || dateFormat === "MMDDYYYY") {
        if (!/^\d{8}$/.test(value)) return null;
        const compactParts = dateFormat === "YYYYMMDD" ? [Number(value.slice(0, 4)), Number(value.slice(4, 6)), Number(value.slice(6, 8))] : [Number(value.slice(0, 2)), Number(value.slice(2, 4)), Number(value.slice(4, 8))];
        [year, month, day] = dateFormat === "YYYYMMDD" ? compactParts : dateFormat === "DDMMYYYY" ? [compactParts[2], compactParts[1], compactParts[0]] : [compactParts[2], compactParts[0], compactParts[1]];
    } else if (dateFormat.startsWith("YYYY")) {
        if (!/^\d{4}[-/.]\d{2}[-/.]\d{2}$/.test(value)) return null;
        [year, month, day] = dateParts;
    } else {
        if (!/^\d{2}[-/.]\d{2}[-/.]\d{4}$/.test(value)) return null;
        [day, month, year] = dateFormat.startsWith("DD") ? dateParts : [dateParts[1], dateParts[0], dateParts[2]];
    }
    const parsedDate = new Date(year, month - 1, day);
    if (parsedDate.getFullYear() !== year || parsedDate.getMonth() !== month - 1 || parsedDate.getDate() !== day) return null;
    return parsedDate;
}

function formatDate(date: Date, dateFormat: DateFormat): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return dateFormat.replace("YYYY", String(year)).replace("MM", month).replace("DD", day);
}

function sameDate(first: Date | null, second: Date | null): boolean {
    return !!first && !!second && formatDate(first, "YYYY-MM-DD") === formatDate(second, "YYYY-MM-DD");
}

function createCalendarDays(month: Date, startOfWeek: number): ICalendarDay[] {
    const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
    const mondayOffset = (firstDay.getDay() - startOfWeek + 7) % 7;
    const firstCell = new Date(month.getFullYear(), month.getMonth(), 1 - mondayOffset);
    return Array.from({ length: 42 }, (_, index) => {
        const date = new Date(firstCell.getFullYear(), firstCell.getMonth(), firstCell.getDate() + index);
        return { date, day: date.getDate(), isCurrentMonth: date.getMonth() === month.getMonth(), key: formatDate(date, "YYYY-MM-DD") };
    });
}

export class DateRangePickerView extends React.Component<IDateRangePickerProps, { visibleMonth: Date; isOpen: boolean; overlayPosition: { top: number; left: number; width: number }; draft: string | null }> {
    private compactInput = React.createRef<HTMLInputElement>();
    public constructor(props: IDateRangePickerProps) {
        super(props);
        const zone = normalizeZone(props.dateTimeZone);
        const visibleMonth = clampMonth(toDate(props.startDate, normalizeDateFormat(props.dateFormat), zone) ?? currentDate(zone), props.startYear ?? 0, props.endYear ?? 0);
        this.state = { visibleMonth, isOpen: false, overlayPosition: { top: 0, left: 0, width: 320 }, draft: null };
    }

    /** Zona horaria configurada. */
    private zone(): DateZone {
        return normalizeZone(this.props.dateTimeZone);
    }

    /** Valor publicado: con el formato configurado o como instante UTC si la zona es Utc. */
    private outputValue(date: Date): string {
        return this.zone() === "utc" ? `${formatDate(date, "YYYY-MM-DD")}T00:00:00Z` : formatDate(date, normalizeDateFormat(this.props.dateFormat));
    }

    private selectDate = (date: Date): void => {
        const dateFormat = normalizeDateFormat(this.props.dateFormat);
        const zone = this.zone();
        const start = toDate(this.props.startDate, dateFormat, zone);
        const end = toDate(this.props.endDate, dateFormat, zone);
        if (!start || (start && end)) {
            this.props.onRangeChange(this.outputValue(date), "");
            this.setState({ draft: null });
        } else if (date < start) {
            this.props.onRangeChange(this.outputValue(date), this.outputValue(start));
            this.setState({ isOpen: false, draft: null });
        } else {
            this.props.onRangeChange(this.outputValue(start), this.outputValue(date));
            this.setState({ isOpen: false, draft: null });
        }
    };

    private togglePicker = (): void => {
        this.setState(({ isOpen }) => ({ isOpen: !isOpen }));
    };

    private openPicker = (): void => {
        const inputElement = this.compactInput.current;
        if (!this.props.disabled && inputElement) {
            const bounds = inputElement.getBoundingClientRect();
            this.setState(({ visibleMonth }) => ({
                isOpen: true,
                visibleMonth: clampMonth(visibleMonth, this.props.startYear ?? 0, this.props.endYear ?? 0),
                overlayPosition: { top: bounds.bottom + 6, left: bounds.left, width: Math.max(bounds.width, 320) },
            }));
        }
    };

    /** Fecha minima y maxima configuradas, leidas con el formato del control. */
    private bounds(): { min: Date | null; max: Date | null } {
        const dateFormat = normalizeDateFormat(this.props.dateFormat);
        const zone = this.zone();
        return { min: boundDate(this.props.minDate, dateFormat, zone), max: boundDate(this.props.maxDate, dateFormat, zone) };
    }

    /** La fecha entra en el rango permitido y en un ano navegable. */
    private isSelectable(date: Date): boolean {
        const startYear = this.props.startYear ?? 0;
        const endYear = this.props.endYear ?? 0;
        if (startYear > 0 && date.getFullYear() < startYear) return false;
        if (endYear > 0 && date.getFullYear() > endYear) return false;
        const { min, max } = this.bounds();
        return !isOutOfRange(date, min, max);
    }

    /** La navegacion mensual no se sale de los anos configurados. */
    private canMove(offset: number): boolean {
        const startYear = this.props.startYear ?? 0;
        const endYear = this.props.endYear ?? 0;
        const target = new Date(this.state.visibleMonth.getFullYear(), this.state.visibleMonth.getMonth() + offset, 1);
        if (startYear > 0 && target.getFullYear() < startYear) return false;
        if (endYear > 0 && target.getFullYear() > endYear) return false;
        return true;
    }

    /** Aplica el texto escrito: si es una fecha valida y elegible, la publica. */
    private commitDraft = (): void => {
        if (this.state.draft === null) return;
        const dateFormat = normalizeDateFormat(this.props.dateFormat);
        const parsed = toDate(this.state.draft.trim(), dateFormat, this.zone());
        if (parsed && this.isSelectable(parsed)) this.selectDate(parsed);
        else this.setState({ draft: null });
    };

    private handleInputChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
        if (!this.props.isEditable) return;
        this.setState({ draft: event.target.value });
    };

    private handleInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>): void => {
        if (event.key === "Enter") {
            event.preventDefault();
            this.commitDraft();
            return;
        }
        if (event.key === "Escape") this.setState({ draft: null });
    };

    private moveMonth = (offset: number): void => {
        if (!this.canMove(offset)) return;
        this.setState(({ visibleMonth }) => ({ visibleMonth: new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + offset, 1) }));
    };

    public render(): React.ReactNode {
        const { startDate, endDate, disabled } = this.props;
        const dateFormat = normalizeDateFormat(this.props.dateFormat);
        const zone = this.zone();
        const start = toDate(startDate, dateFormat, zone);
        const end = toDate(endDate, dateFormat, zone);
        const hasRange = !!start && !!end;
        const summary = startDate && endDate ? `${startDate}  →  ${endDate}` : startDate ? `${startDate}  →  Selecciona una fecha final` : "Selecciona una fecha de inicio";
        const label = this.props.accessibleLabel ?? "Selector de rango de fechas";
        const placeholder = this.props.placeholderText ?? "Selecciona fecha";
        const startOfWeek = firstWeekday(this.props.startOfWeek);
        const editable = this.props.isEditable ?? false;
        const inputValue = this.state.draft ?? (hasRange ? summary : placeholder);
        const style = visualStyles(this.props);
        const monthNames = monthLabels(this.props.language);
        if (!this.state.isOpen) {
            return <section className="drp-root drp-root-compact" style={style.box} aria-label={label}><input ref={this.compactInput} className={hasRange ? "drp-compact-input drp-compact-value" : "drp-compact-input drp-compact-placeholder"} style={style.input} type="text" readOnly={!editable} value={inputValue} onChange={this.handleInputChange} onKeyDown={this.handleInputKeyDown} onBlur={this.commitDraft} onClick={editable ? undefined : this.openPicker} onFocus={editable ? undefined : this.openPicker} disabled={disabled} aria-label={label} /><button type="button" className="drp-calendar-button" style={style.icon} onClick={this.openPicker} disabled={disabled} aria-label={label}><span className="drp-calendar-icon" style={style.iconGlyph} aria-hidden="true" /></button></section>;
        }
        const pickerPanel = (
            <section className="drp-root drp-root-expanded" style={{ ...this.state.overlayPosition, zIndex: Math.max(1, Math.min(this.props.zIndex, 2147483647)) }} aria-label={label}>
                <div className="drp-header"><div><span className="drp-kicker">RANGO DE FECHAS</span><div className="drp-summary">{summary}</div></div><div className="drp-header-actions"><div className={`drp-status ${hasRange ? "is-complete" : ""}`}>{hasRange ? "Listo" : "En selección"}</div><button type="button" className="drp-close" onClick={this.togglePicker} aria-label="Contraer selector">×</button></div></div>
                <div className="drp-calendar">
                    <div className="drp-monthbar"><button type="button" className="drp-nav" style={style.chevron} onClick={() => this.moveMonth(-1)} disabled={disabled || !this.canMove(-1)} aria-label="Mes anterior">‹</button><strong>{monthNames[this.state.visibleMonth.getMonth()]} <span>{this.state.visibleMonth.getFullYear()}</span></strong><button type="button" className="drp-nav" style={style.chevron} onClick={() => this.moveMonth(1)} disabled={disabled || !this.canMove(1)} aria-label="Mes siguiente">›</button></div>
                    <div className="drp-weekdays">{weekdayLabels(startOfWeek, this.props.language).map((day) => <span key={day}>{day}</span>)}</div>
                    <div className="drp-grid">{createCalendarDays(this.state.visibleMonth, startOfWeek).map(({ date, day, isCurrentMonth, key }) => { const isStart = sameDate(date, start); const isEnd = sameDate(date, end); const isBetween = !!start && !!end && date > start && date < end; const selectable = this.isSelectable(date); return <button key={key} type="button" className={`drp-day ${isCurrentMonth ? "" : "is-muted"} ${isBetween ? "is-between" : ""} ${isStart ? "is-start" : ""} ${isEnd ? "is-end" : ""}`} onClick={() => this.selectDate(date)} disabled={disabled || !selectable}>{day}</button>; })}</div>
                </div>
                <div className="drp-footer"><span className="drp-dot" /> {hasRange ? "Rango seleccionado" : "Haz clic en dos fechas para completar el rango"}</div>
            </section>
        );
        return ReactDOM.createPortal(pickerPanel, document.body);
    }
}