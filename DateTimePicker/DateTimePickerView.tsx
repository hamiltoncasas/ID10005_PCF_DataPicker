/**
 * Fecha: 2026-09-16
 * Descripcion: Vista React del selector de fecha y hora simple, con calendario
 * de seleccion unica, campo de fecha, selector de hora y navegacion mensual.
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

export interface IDateTimePickerProps extends IPickerVisualProps {
    dateTime: string;
    dateFormat: string;
    timeFormat: string;
    zIndex: number;
    disabled: boolean;
    /** Texto accesible del control; si no se indica se usa el texto generico. */
    accessibleLabel?: string;
    /** Texto que se muestra mientras no hay fecha y hora seleccionadas. */
    placeholderText?: string;
    /** Permite escribir la fecha y la hora en el campo de texto. */
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
    onDateTimeChange: (dateTime: string) => void;
}

interface ICalendarDay { date: Date; day: number; isCurrentMonth: boolean; key: string; }

interface IDateTimePickerState {
    visibleMonth: Date;
    time: string;
    isOpen: boolean;
    overlayPosition: { top: number; left: number; width: number };
    /** Texto escrito por el usuario cuando IsEditable esta activo. */
    draft: string | null;
}

const months = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

/** Etiquetas de los dias de la semana, empezando en domingo. */
const WEEKDAY_LABELS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

type DateFormat = "YYYY-MM-DD" | "YYYY/MM/DD" | "YYYY.MM.DD" | "YYYYMMDD" | "DD/MM/YYYY" | "MM/DD/YYYY" | "DD-MM-YYYY" | "MM-DD-YYYY" | "DD.MM.YYYY" | "MM.DD.YYYY" | "DDMMYYYY" | "MMDDYYYY";

const supportedDateFormats: DateFormat[] = ["YYYY-MM-DD", "YYYY/MM/DD", "YYYY.MM.DD", "YYYYMMDD", "DD/MM/YYYY", "MM/DD/YYYY", "DD-MM-YYYY", "MM-DD-YYYY", "DD.MM.YYYY", "MM.DD.YYYY", "DDMMYYYY", "MMDDYYYY"];

function normalizeDateFormat(value: string): DateFormat {
    const normalizedFormat = value.trim().toUpperCase();
    const matchingFormat = supportedDateFormats.find((dateFormat) => dateFormat === normalizedFormat);
    if (matchingFormat) return matchingFormat;
    return "YYYY-MM-DD";
}

/** Lee una fecha escrita con uno de los formatos admitidos. */
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

/** Indica si el valor trae desplazamiento horario (Z, +hh:mm o -hh:mm). */
function hasZoneOffset(value: string): boolean {
    return /(Z|[+-]\d{2}:?\d{2})$/.test(value.trim());
}

/**
 * Fecha y hora de un valor ISO (YYYY-MM-DD o YYYY-MM-DDTHH:mm[:ss]) ajustada a la
 * zona configurada: con Utc los valores que traen desplazamiento horario se
 * convierten a hora UTC; con Local se leen tal como estan escritos.
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
        return new Date(instant.getUTCFullYear(), instant.getUTCMonth(), instant.getUTCDate(), instant.getUTCHours(), instant.getUTCMinutes(), instant.getUTCSeconds());
    }
    const parsedDate = new Date(year, month - 1, day, groupNumber(match, 4), groupNumber(match, 5), groupNumber(match, 6));
    if (parsedDate.getFullYear() !== year || parsedDate.getMonth() !== month - 1 || parsedDate.getDate() !== day) return null;
    return parsedDate;
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

function boundDate(value: string | undefined, dateFormat: string, zone: DateZone): Date | null {
    const text = (value ?? "").trim();
    if (!text) return null;
    const iso = toDate(text.slice(0, 10), "YYYY-MM-DD", zone);
    return iso ?? toDate(text, normalizeDateFormat(dateFormat), zone);
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

const timeOptions = Array.from({ length: 96 }, (_, index) => {
    const hours = String(Math.floor(index / 4)).padStart(2, "0");
    const minutes = String((index % 4) * 15).padStart(2, "0");
    return `${hours}:${minutes}`;
});

function parseDate(value: string): Date | null {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
    const [year, month, day] = value.split("-").map(Number);
    const parsedDate = new Date(year, month - 1, day);
    return parsedDate.getFullYear() === year && parsedDate.getMonth() === month - 1 && parsedDate.getDate() === day ? parsedDate : null;
}

function parseDateTime(value: string, zone: DateZone): { date: Date; time: string } | null {
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value)) return null;
    const date = parseZonedDate(value, zone);
    if (!date) return null;
    const converted = zone === "utc" && hasZoneOffset(value);
    return { date, time: converted ? `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}` : value.slice(11, 16) };
}

function formatCalendarDate(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function composeDateTime(date: Date, time: string, zone: DateZone): string {
    return `${formatCalendarDate(date)}T${time || "00:00"}${zone === "utc" ? "Z" : ""}`;
}

function getDefaultTime(zone: DateZone): string {
    const now = new Date();
    const hours = zone === "utc" ? now.getUTCHours() : now.getHours();
    const minutes = Math.floor((zone === "utc" ? now.getUTCMinutes() : now.getMinutes()) / 15) * 15;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function formatDateValue(date: Date, dateFormat: string): string {
    const year = String(date.getFullYear());
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    switch (dateFormat.trim().toUpperCase()) {
        case "YYYY/MM/DD": return `${year}/${month}/${day}`;
        case "YYYY.MM.DD": return `${year}.${month}.${day}`;
        case "YYYYMMDD": return `${year}${month}${day}`;
        case "DD/MM/YYYY": return `${day}/${month}/${year}`;
        case "MM/DD/YYYY": return `${month}/${day}/${year}`;
        case "DD-MM-YYYY": return `${day}-${month}-${year}`;
        case "MM-DD-YYYY": return `${month}-${day}-${year}`;
        case "DD.MM.YYYY": return `${day}.${month}.${year}`;
        case "MM.DD.YYYY": return `${month}.${day}.${year}`;
        case "DDMMYYYY": return `${day}${month}${year}`;
        case "MMDDYYYY": return `${month}${day}${year}`;
        default: return `${year}-${month}-${day}`;
    }
}

function formatTimeValue(time: string, timeFormat: string, language?: string): string {
    const withSeconds = timeFormat === "24:00:00" || timeFormat === "12:00:00";
    if (!timeFormat.startsWith("12")) return withSeconds ? `${time}:00` : time;
    const [hours, minutes] = time.split(":").map(Number);
    const clock = new Date(2026, 0, 1, Number.isNaN(hours) ? 0 : hours, Number.isNaN(minutes) ? 0 : minutes);
    const formatter = localeFormat(language, { hour: "2-digit", minute: "2-digit", hour12: true });
    return formatter ? formatter.format(clock) : clock.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true });
}

function sameDate(first: Date | null, second: Date | null): boolean {
    return !!first && !!second && formatCalendarDate(first) === formatCalendarDate(second);
}

function createCalendarDays(month: Date, startOfWeek: number): ICalendarDay[] {
    const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
    const mondayOffset = (firstDay.getDay() - startOfWeek + 7) % 7;
    const firstCell = new Date(month.getFullYear(), month.getMonth(), 1 - mondayOffset);
    return Array.from({ length: 42 }, (_, index) => {
        const date = new Date(firstCell.getFullYear(), firstCell.getMonth(), firstCell.getDate() + index);
        return { date, day: date.getDate(), isCurrentMonth: date.getMonth() === month.getMonth(), key: formatCalendarDate(date) };
    });
}


export class DateTimePickerView extends React.Component<IDateTimePickerProps, IDateTimePickerState> {
    private compactInput = React.createRef<HTMLInputElement>();

    public constructor(props: IDateTimePickerProps) {
        super(props);
        const zone = normalizeZone(props.dateTimeZone);
        const initial = parseDateTime(props.dateTime, zone);
        const visibleMonth = clampMonth(initial?.date ?? currentDate(zone), props.startYear ?? 0, props.endYear ?? 0);
        this.state = { visibleMonth, time: initial?.time ?? getDefaultTime(zone), isOpen: false, overlayPosition: { top: 0, left: 0, width: 340 }, draft: null };
    }

    /** Zona horaria configurada. */
    private zone(): DateZone {
        return normalizeZone(this.props.dateTimeZone);
    }

    /** Cambia la hora manteniendo la fecha seleccionada. */
    private updateTime = (time: string): void => {
        this.setState({ time });
        const current = parseDateTime(this.props.dateTime, this.zone());
        if (current) this.props.onDateTimeChange(composeDateTime(current.date, time, this.zone()));
    };

    private updateDateInput = (value: string): void => {
        if (!value) {
            this.props.onDateTimeChange("");
            return;
        }
        const date = parseDate(value);
        if (date) this.props.onDateTimeChange(composeDateTime(date, this.state.time, this.zone()));
    };

    private selectDate = (date: Date): void => {
        this.props.onDateTimeChange(composeDateTime(date, this.state.time, this.zone()));
        this.setState({ isOpen: false, draft: null });
    };

    private clearDateTime = (): void => {
        this.props.onDateTimeChange("");
        this.setState({ isOpen: false, draft: null });
    };

    private togglePicker = (): void => {
        this.setState(({ isOpen }) => ({ isOpen: !isOpen }));
    };

    private openPicker = (): void => {
        const inputElement = this.compactInput.current;
        if (!this.props.disabled && inputElement) {
            const bounds = inputElement.getBoundingClientRect();
            const current = parseDateTime(this.props.dateTime, this.zone());
            this.setState((state) => ({
                isOpen: true,
                visibleMonth: clampMonth(current?.date ?? state.visibleMonth, this.props.startYear ?? 0, this.props.endYear ?? 0),
                time: current?.time ?? state.time,
                overlayPosition: { top: bounds.bottom + 6, left: bounds.left, width: Math.max(bounds.width, 340) },
            }));
        }
    };

    /** Fecha minima y maxima configuradas, leidas con el formato del control. */
    private bounds(): { min: Date | null; max: Date | null } {
        const zone = this.zone();
        return { min: boundDate(this.props.minDate, this.props.dateFormat, zone), max: boundDate(this.props.maxDate, this.props.dateFormat, zone) };
    }

    /** El dia entra en el rango permitido y en un ano navegable. */
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

    /**
     * Fecha y hora escritas por el usuario: acepta la fecha tecnica, la del
     * formato configurado y, si se escribe, la hora (HH:mm).
     */
    private parseDraft(): { date: Date; time: string } | null {
        if (this.state.draft === null) return null;
        const text = this.state.draft.trim().replace("T", " ");
        const separator = text.indexOf(" ");
        const dateText = separator < 0 ? text : text.slice(0, separator);
        const clockText = separator < 0 ? "" : text.slice(separator + 1, separator + 6);
        const date = parseDate(dateText.slice(0, 10)) ?? toDate(dateText, normalizeDateFormat(this.props.dateFormat), this.zone());
        if (!date) return null;
        const clock = /^(\d{1,2}):(\d{2})$/.exec(clockText);
        return { date, time: clock ? `${clock[1].padStart(2, "0")}:${clock[2]}` : this.state.time };
    }

    /** Aplica el texto escrito: si la fecha es valida y elegible, la publica. */
    private commitDraft = (): void => {
        if (this.state.draft === null) return;
        const parsed = this.parseDraft();
        const zone = this.zone();
        if (parsed && this.isSelectable(parsed.date)) this.props.onDateTimeChange(composeDateTime(parsed.date, parsed.time, zone));
        this.setState({ draft: null });
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
        const { dateTime, dateFormat, timeFormat, disabled } = this.props;
        const zone = this.zone();
        const current = parseDateTime(dateTime, zone);
        const hasValue = !!current;
        const today = currentDate(zone);
        const summary = current ? `${formatDateValue(current.date, dateFormat)} · ${formatTimeValue(current.time, timeFormat, this.props.language)}` : "Selecciona fecha y hora";
        const options = this.state.time && !timeOptions.includes(this.state.time) ? [...timeOptions, this.state.time].sort() : timeOptions;
        const label = this.props.accessibleLabel ?? "Selector de fecha y hora";
        const placeholder = this.props.placeholderText ?? "Selecciona fecha";
        const startOfWeek = firstWeekday(this.props.startOfWeek);
        const editable = this.props.isEditable ?? false;
        const inputValue = this.state.draft ?? (hasValue ? summary : placeholder);
        const style = visualStyles(this.props);
        const monthNames = monthLabels(this.props.language);
        if (!this.state.isOpen) {
            return <section className="dtp-root dtp-root-compact" style={style.box} aria-label={label}><input ref={this.compactInput} className={hasValue ? "dtp-compact-input dtp-compact-value" : "dtp-compact-input dtp-compact-placeholder"} style={style.input} type="text" readOnly={!editable} value={inputValue} onChange={this.handleInputChange} onKeyDown={this.handleInputKeyDown} onBlur={this.commitDraft} onClick={editable ? undefined : this.openPicker} onFocus={editable ? undefined : this.openPicker} disabled={disabled} aria-label={label} /><button type="button" className="dtp-calendar-button" style={style.icon} onClick={this.openPicker} disabled={disabled} aria-label={label}><span className="dtp-calendar-icon" style={style.iconGlyph} aria-hidden="true" /></button></section>;
        }
        const pickerPanel = (
            <section className="dtp-root dtp-root-expanded" style={{ ...this.state.overlayPosition, zIndex: Math.max(1, Math.min(this.props.zIndex, 2147483647)) }} aria-label={label}>
                <div className="dtp-header"><div><span className="dtp-kicker">FECHA Y HORA</span><div className="dtp-summary">{summary}</div></div><div className="dtp-header-actions"><div className={`dtp-status ${hasValue ? "is-complete" : ""}`}>{hasValue ? "Listo" : "En selección"}</div><button type="button" className="dtp-close" onClick={this.togglePicker} aria-label="Contraer selector">×</button></div></div>
                <div className="dtp-calendar">
                    <div className="dtp-monthbar"><button type="button" className="dtp-nav" style={style.chevron} onClick={() => this.moveMonth(-1)} disabled={disabled || !this.canMove(-1)} aria-label="Mes anterior">‹</button><strong>{monthNames[this.state.visibleMonth.getMonth()]} <span>{this.state.visibleMonth.getFullYear()}</span></strong><button type="button" className="dtp-nav" style={style.chevron} onClick={() => this.moveMonth(1)} disabled={disabled || !this.canMove(1)} aria-label="Mes siguiente">›</button></div>
                    <div className="dtp-weekdays">{weekdayLabels(startOfWeek, this.props.language).map((day) => <span key={day}>{day}</span>)}</div>
                    <div className="dtp-grid">{createCalendarDays(this.state.visibleMonth, startOfWeek).map(({ date: dayDate, day, isCurrentMonth, key }) => { const selectable = this.isSelectable(dayDate); return <button key={key} type="button" className={`dtp-day ${isCurrentMonth ? "" : "is-muted"} ${sameDate(dayDate, current?.date ?? null) ? "is-selected" : ""} ${sameDate(dayDate, today) ? "is-today" : ""}`} onClick={() => this.selectDate(dayDate)} disabled={disabled || !selectable}>{day}</button>; })}</div>
                </div>
                <div className="dtp-fields">
                    <label className="dtp-field"><span>Fecha y hora</span><div><input type="date" value={current ? formatCalendarDate(current.date) : ""} onChange={(event) => this.updateDateInput(event.target.value)} disabled={disabled} aria-label="Fecha seleccionada" /><span className="dtp-time-picker"><span className="dtp-clock-icon" aria-hidden="true" /><select value={this.state.time} onChange={(event) => this.updateTime(event.target.value)} disabled={disabled} aria-label="Hora seleccionada">{options.map((time) => <option key={time} value={time}>{formatTimeValue(time, timeFormat, this.props.language)}</option>)}</select></span></div></label>
                </div>
                <div className="dtp-footer"><span className="dtp-dot" /> {hasValue ? "Fecha y hora seleccionadas" : "Haz clic en una fecha para seleccionarla"}{hasValue ? <button type="button" className="dtp-clear" onClick={this.clearDateTime} disabled={disabled}>Limpiar</button> : null}</div>
            </section>
        );
        return ReactDOM.createPortal(pickerPanel, document.body);
    }
}
