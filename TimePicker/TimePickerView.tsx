/**
 * Fecha: 2026-11-10
 * Descripcion: Vista React del selector de hora, con campo compacto, panel de
 * listas de hora, minuto y segundo, y publicacion de la hora tecnica HH:mm:ss.
 */
import * as React from "react";
import * as ReactDOM from "react-dom";

/** Propiedades visuales equivalentes a las del selector de hora nativo. */
export interface ITimePickerVisualProps {
    borderColor?: string;
    borderThickness?: number;
    focusedBorderColor?: string;
    color?: string;
    fill?: string;
    font?: string;
    fontWeight?: string;
    size?: number;
}

/** Estilos del control; admite variables CSS propias ademas de las de React. */
export type TimePickerStyles = React.CSSProperties & Record<string, string | number | undefined>;

/** Estilos listos para aplicar en cada parte del control. */
export interface ITimePickerVisualStyles {
    box: TimePickerStyles;
    input: TimePickerStyles;
}

/** Hora, minuto y segundo en formato de 24 horas. */
export interface ITimeParts {
    hour: number;
    minute: number;
    second: number;
}

export interface ITimePickerProps extends ITimePickerVisualProps {
    /** Hora seleccionada en formato tecnico HH:mm:ss; vacia = sin seleccion. */
    selectedTime: string;
    /** Patron de presentacion (HH:mm:ss, hh:mm A, ...); vacio = automatico. */
    format: string;
    disabled: boolean;
    /** Primera hora elegible (0-23). Un rango 22-6 cruza la medianoche. */
    startHour?: number;
    /** Ultima hora elegible (0-23). */
    endHour?: number;
    /** Paso de la lista de minutos (1-60). */
    minuteInterval?: number;
    /** Muestra y conserva los segundos. */
    showSeconds?: boolean;
    /** Reloj de 24 horas; si es false se usa 1-12 con AM/PM. */
    use24HourFormat?: boolean;
    onTimeChange: (time: string) => void;
}

interface ITimePickerState extends ITimeParts {
    isOpen: boolean;
    overlayPosition: { top: number; left: number; width: number };
}

/** Colores nombrados de Power Apps aceptados por las propiedades de color. */
const POWER_APPS_COLORS: Record<string, string> = {
    black: "#000000", blue: "#0b6cff", gray: "#808080", green: "#107c10", grey: "#808080", orange: "#f7630c",
    purple: "#886ce4", red: "#e81123", transparent: "transparent", white: "#ffffff", yellow: "#ffd800",
};

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

/** Grosor de fuente CSS del valor configurado (FontWeight.Bold, 700, ...). */
function cssFontWeight(value: string | undefined): string | number | undefined {
    const text = (value ?? "").trim().toLowerCase().replace(/^fontweight\./, "");
    const named = fontWeights[text];
    if (named) return named;
    const numeric = Number(text);
    return Number.isFinite(numeric) && numeric >= 100 && numeric <= 900 ? numeric : undefined;
}

/** Estilos configurables de cada parte del control a partir de las propiedades visuales. */
export function visualStyles(props: ITimePickerVisualProps): ITimePickerVisualStyles {
    const fill = cssColor(props.fill);
    const color = cssColor(props.color);
    const borderColor = cssColor(props.borderColor);
    const focusedBorderColor = cssColor(props.focusedBorderColor);
    const font = (props.font ?? "").trim();
    const fontWeight = cssFontWeight(props.fontWeight);
    const box: TimePickerStyles = {};
    if (borderColor) box["--tp-border-color"] = borderColor;
    if (props.borderThickness !== undefined && props.borderThickness >= 0) box["--tp-border-width"] = `${props.borderThickness}px`;
    if (focusedBorderColor) box["--tp-focus-color"] = focusedBorderColor;
    if (fill) box["--tp-fill"] = fill;
    if (font) box["--tp-font"] = `'${font}', 'Segoe UI', sans-serif`;
    const input: TimePickerStyles = {};
    if (color) input.color = color;
    if (font) input.fontFamily = `'${font}', 'Segoe UI', sans-serif`;
    if (props.size !== undefined && props.size > 0) input.fontSize = props.size;
    if (fontWeight !== undefined) input.fontWeight = fontWeight;
    return { box, input };
}

/** Dos digitos con cero a la izquierda. */
export function pad2(value: number): string {
    return String(value).padStart(2, "0");
}

/** Entero dentro de un rango; un valor vacio, no numerico o fuera de rango usa el predeterminado. */
function integerInRange(value: number | undefined, min: number, max: number, fallback: number): number {
    if (value === undefined || !Number.isFinite(value)) return fallback;
    const integer = Math.trunc(value);
    return integer < min ? min : integer > max ? max : integer;
}

/** Paso de minutos normalizado entre 1 y 60. */
export function normalizeInterval(interval: number | undefined): number {
    return integerInRange(interval, 1, 60, 1);
}

/** Hora normalizada entre 0 y 23. */
function normalizeHour(hour: number | undefined): number {
    return integerInRange(hour, 0, 23, 0);
}

/** Rango de horas configurado; si falta un extremo se usa 0 o 23. */
export function normalizeHourRange(startHour: number | undefined, endHour: number | undefined): { start: number; end: number } {
    const end = endHour === undefined || !Number.isFinite(endHour) ? 23 : normalizeHour(endHour);
    return { start: normalizeHour(startHour), end };
}

/** Indica si la hora entra en el rango; un rango 22-6 cruza la medianoche. */
export function isHourInRange(hour: number, startHour: number | undefined, endHour: number | undefined): boolean {
    if (!Number.isInteger(hour) || hour < 0 || hour > 23) return false;
    const { start, end } = normalizeHourRange(startHour, endHour);
    if (start === end) return hour === start;
    return start < end ? hour >= start && hour <= end : hour >= start || hour <= end;
}

/** Horas elegibles del rango, en orden ascendente, incluida la hora actual si queda fuera. */
export function buildHourOptions(startHour: number | undefined, endHour: number | undefined, currentHour?: number): number[] {
    const hours: number[] = [];
    for (let hour = 0; hour < 24; hour += 1) {
        if (isHourInRange(hour, startHour, endHour)) hours.push(hour);
    }
    if (currentHour !== undefined && Number.isInteger(currentHour) && currentHour >= 0 && currentHour <= 23 && !hours.includes(currentHour)) {
        hours.push(currentHour);
        hours.sort((first, second) => first - second);
    }
    return hours;
}

/** Minutos de la lista, incluido el minuto actual si no sigue el paso configurado. */
export function buildMinuteOptions(interval: number | undefined, currentMinute?: number): number[] {
    const step = normalizeInterval(interval);
    const minutes: number[] = [];
    for (let minute = 0; minute < 60; minute += step) minutes.push(minute);
    if (currentMinute !== undefined && Number.isInteger(currentMinute) && currentMinute >= 0 && currentMinute < 60 && !minutes.includes(currentMinute)) {
        minutes.push(currentMinute);
        minutes.sort((first, second) => first - second);
    }
    return minutes;
}

/** 0-23 a 1-12; la medianoche y el mediodia son 12. */
export function to12Hour(hour: number): number {
    const normalized = ((Math.trunc(hour) % 24) + 24) % 24;
    return normalized % 12 === 0 ? 12 : normalized % 12;
}

/** 1-12 con AM/PM a 0-23. */
export function to24Hour(displayHour: number, isPm: boolean): number {
    const base = Math.trunc(displayHour) % 12;
    return isPm ? (base === 0 ? 12 : base + 12) : base;
}

/** Hora tecnica estable de las salidas: HH:mm:ss en 24 horas. */
export function toTechnical(parts: ITimeParts): string {
    return `${pad2(parts.hour)}:${pad2(parts.minute)}:${pad2(parts.second)}`;
}

/** Alinea los minutos al paso configurado y descarta los segundos. */
export function alignToInterval(parts: ITimeParts, interval: number | undefined): ITimeParts {
    const step = normalizeInterval(interval);
    return { hour: parts.hour, minute: Math.floor(parts.minute / step) * step, second: 0 };
}

/** Hora actual alineada al paso, propuesta cuando todavia no hay seleccion. */
export function currentTime(interval: number | undefined): ITimeParts {
    const now = new Date();
    return alignToInterval({ hour: now.getHours(), minute: now.getMinutes(), second: now.getSeconds() }, interval);
}

/**
 * Lee una hora escrita por el usuario. Acepta HH:mm, HH:mm:ss, hh:mm AM/PM,
 * "a. m."/"p. m." y una fecha y hora ISO (2026-11-10T08:30:00). La hora se toma
 * tal como esta escrita: no se convierte entre zonas horarias.
 */
export function parseTimeOfDay(value: string | undefined): ITimeParts | null {
    let text = (value ?? "").trim();
    if (!text) return null;
    const iso = /^\d{4}-\d{2}-\d{2}[T ](\d{1,2}:\d{2}(?::\d{2})?(?:\.\d+)?)/.exec(text);
    if (iso) text = iso[1];
    text = text.replace(/\./g, "").replace(/\s+/g, " ").trim();
    const match = /^(\d{1,2}):(\d{2})(?::(\d{2}))?(?:\s*([ap])\s*m)?$/i.exec(text);
    if (!match) return null;
    const hourText = Number(match[1]);
    const minute = Number(match[2]);
    const second = match[3] ? Number(match[3]) : 0;
    const meridiem = match[4] ? match[4].toLowerCase() : "";
    let hour = hourText;
    if (meridiem) {
        if (hourText < 1 || hourText > 12) return null;
        hour = to24Hour(hourText, meridiem === "p");
    }
    if (!Number.isInteger(hour) || hour < 0 || hour > 23) return null;
    if (!Number.isInteger(minute) || minute < 0 || minute > 59) return null;
    if (!Number.isInteger(second) || second < 0 || second > 59) return null;
    return { hour, minute, second };
}

/** Patron automatico segun las propiedades de reloj y segundos. */
export function defaultTimeFormat(use24HourFormat: boolean | undefined, showSeconds: boolean | undefined): string {
    if (use24HourFormat !== false) return showSeconds === true ? "HH:mm:ss" : "HH:mm";
    return showSeconds === true ? "hh:mm:ss A" : "hh:mm A";
}

/** Tokens admitidos por Format; solo se sustituyen cuando no estan pegados a otras letras. */
const timeTokens = /(^|[^A-Za-z])(HH|hh|H|h|mm|ss|A|a)(?![A-Za-z])/g;

/** Indica si el patron contiene al menos un token de hora. */
function hasTimeToken(pattern: string): boolean {
    return new RegExp(timeTokens.source).test(pattern);
}

/**
 * Presenta la hora con el patron configurado (HH, H, hh, h, mm, ss, A, a).
 * Un patron vacio o sin tokens usa el formato automatico.
 */
export function formatTime(parts: ITimeParts, format: string | undefined, use24HourFormat: boolean | undefined, showSeconds: boolean | undefined): string {
    const configured = (format ?? "").trim();
    const pattern = configured && hasTimeToken(configured) ? configured : defaultTimeFormat(use24HourFormat, showSeconds);
    const hour12 = to12Hour(parts.hour);
    return pattern.replace(timeTokens, (_match: string, prefix: string, token: string) => {
        switch (token) {
            case "HH": return prefix + pad2(parts.hour);
            case "H": return prefix + String(parts.hour);
            case "hh": return prefix + pad2(hour12);
            case "h": return prefix + String(hour12);
            case "mm": return prefix + pad2(parts.minute);
            case "ss": return prefix + pad2(parts.second);
            case "A": return prefix + (parts.hour < 12 ? "AM" : "PM");
            case "a": return prefix + (parts.hour < 12 ? "am" : "pm");
            default: return prefix + token;
        }
    });
}

/** Selector de hora: campo compacto y panel con listas de hora, minuto y segundo. */
export class TimePickerView extends React.Component<ITimePickerProps, ITimePickerState> {
    private compactInput = React.createRef<HTMLInputElement>();

    public constructor(props: ITimePickerProps) {
        super(props);
        const initial = parseTimeOfDay(props.selectedTime) ?? currentTime(props.minuteInterval);
        this.state = {
            isOpen: false,
            overlayPosition: { top: 0, left: 0, width: 300 },
            hour: initial.hour,
            minute: initial.minute,
            second: props.showSeconds === true ? initial.second : 0,
        };
    }

    public componentDidUpdate(previous: ITimePickerProps): void {
        const valueChanged = previous.selectedTime !== this.props.selectedTime;
        const intervalChanged = normalizeInterval(previous.minuteInterval) !== normalizeInterval(this.props.minuteInterval);
        if (!valueChanged && !intervalChanged) return;
        const next = this.normalizeParts(parseTimeOfDay(this.props.selectedTime) ?? currentTime(this.props.minuteInterval));
        if (next.hour === this.state.hour && next.minute === this.state.minute && next.second === this.state.second) return;
        this.setState(next);
    }

    /** Los segundos solo se conservan cuando la propiedad Mostrar segundos esta activa. */
    private normalizeParts(parts: ITimeParts): ITimeParts {
        return { hour: parts.hour, minute: parts.minute, second: this.props.showSeconds === true ? parts.second : 0 };
    }

    private parts(): ITimeParts {
        return { hour: this.state.hour, minute: this.state.minute, second: this.state.second };
    }

    /** Publica la hora tecnica al host y refleja la eleccion en el panel. */
    private publish(parts: ITimeParts): void {
        const next = this.normalizeParts(parts);
        this.setState(next);
        this.props.onTimeChange(toTechnical(next));
    }

    private closePicker = (): void => {
        this.setState({ isOpen: false });
    };

    private openPicker = (): void => {
        if (this.props.disabled) return;
        const parsed = parseTimeOfDay(this.props.selectedTime) ?? currentTime(this.props.minuteInterval);
        this.setState({ ...this.normalizeParts(parsed), isOpen: true, overlayPosition: this.measureOverlay() });
    };

    /** Posicion del panel junto al campo, sin salirse de la ventana. */
    private measureOverlay(): { top: number; left: number; width: number } {
        const input = this.compactInput.current;
        if (!input) return { top: 0, left: 0, width: 300 };
        const bounds = input.getBoundingClientRect();
        const width = Math.max(bounds.width, 300);
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const panelHeight = 330;
        const left = Math.max(8, Math.min(bounds.left, viewportWidth - width - 8));
        const below = bounds.bottom + 6;
        const top = below + panelHeight > viewportHeight && bounds.top > panelHeight ? bounds.top - panelHeight - 6 : below;
        return { top: Math.max(8, top), left, width };
    }

    private changeHour = (value: string): void => {
        const hour = Number(value);
        if (!isHourInRange(hour, this.props.startHour, this.props.endHour)) return;
        this.publish({ ...this.parts(), hour });
    };

    /** En modo de 12 horas se elige 1-12 y se conserva AM/PM cuando el rango lo permite. */
    private changeDisplayHour = (value: string): void => {
        const displayHour = Number(value);
        if (!Number.isInteger(displayHour) || displayHour < 1 || displayHour > 12) return;
        const preferPm = this.state.hour >= 12;
        const preferred = to24Hour(displayHour, preferPm);
        const fallback = to24Hour(displayHour, !preferPm);
        const hour = isHourInRange(preferred, this.props.startHour, this.props.endHour) ? preferred : fallback;
        if (!isHourInRange(hour, this.props.startHour, this.props.endHour)) return;
        this.publish({ ...this.parts(), hour });
    };

    private changeMeridiem = (value: string): void => {
        const hour = to24Hour(to12Hour(this.state.hour), value === "PM");
        if (!isHourInRange(hour, this.props.startHour, this.props.endHour)) return;
        this.publish({ ...this.parts(), hour });
    };

    private changeMinute = (value: string): void => {
        const minute = Number(value);
        if (!Number.isInteger(minute) || minute < 0 || minute > 59) return;
        this.publish({ ...this.parts(), minute });
    };

    private changeSecond = (value: string): void => {
        const second = Number(value);
        if (!Number.isInteger(second) || second < 0 || second > 59) return;
        this.publish({ ...this.parts(), second });
    };

    private useNow = (): void => {
        this.publish(currentTime(this.props.minuteInterval));
    };

    private clearTime = (): void => {
        const now = currentTime(this.props.minuteInterval);
        this.props.onTimeChange("");
        this.setState({ ...this.normalizeParts(now), isOpen: false });
    };

    public render(): React.ReactNode {
        const { disabled, format, use24HourFormat, showSeconds } = this.props;
        const use24 = use24HourFormat !== false;
        const withSeconds = showSeconds === true;
        const style = visualStyles(this.props);
        const selected = parseTimeOfDay(this.props.selectedTime);
        const selectedParts = selected ? this.normalizeParts(selected) : null;
        const summary = selectedParts ? formatTime(selectedParts, format, use24, withSeconds) : "Selecciona una hora";
        if (!this.state.isOpen) {
            return (
                <section className={`tp-root tp-root-compact ${disabled ? "is-disabled" : ""}`} style={style.box} aria-label="Selector de hora">
                    <input
                        ref={this.compactInput}
                        className={`tp-compact-input ${selectedParts ? "tp-compact-value" : "tp-compact-placeholder"}`}
                        style={style.input}
                        type="text"
                        readOnly
                        value={summary}
                        placeholder="Selecciona una hora"
                        onClick={this.openPicker}
                        onFocus={this.openPicker}
                        disabled={disabled}
                        aria-label="Selector de hora"
                        aria-haspopup="dialog"
                    />
                    <button type="button" className="tp-clock-button" onClick={this.openPicker} disabled={disabled} aria-label="Abrir el selector de hora">
                        <span className="tp-clock-icon" aria-hidden="true" />
                    </button>
                </section>
            );
        }
        const parts = this.parts();
        const hours = buildHourOptions(this.props.startHour, this.props.endHour, parts.hour);
        const displayHours = Array.from({ length: 12 }, (_value, index) => index + 1).filter((displayHour) =>
            isHourInRange(to24Hour(displayHour, false), this.props.startHour, this.props.endHour) ||
            isHourInRange(to24Hour(displayHour, true), this.props.startHour, this.props.endHour));
        if (!displayHours.includes(to12Hour(parts.hour))) displayHours.push(to12Hour(parts.hour));
        if (!use24) displayHours.sort((first, second) => first - second);
        const minutes = buildMinuteOptions(this.props.minuteInterval, parts.minute);
        const seconds = Array.from({ length: 60 }, (_value, index) => index);
        const displayHour = to12Hour(parts.hour);
        const meridiem = parts.hour >= 12 ? "PM" : "AM";
        const preview = formatTime(parts, format, use24, withSeconds);
        const position = { ...this.state.overlayPosition, zIndex: 2147483647 };
        const pickerPanel = (
            <section className="tp-root tp-root-expanded" style={position} role="dialog" aria-label="Selector de hora">
                <div className="tp-header">
                    <div><span className="tp-kicker">HORA</span><div className="tp-summary">{summary}</div></div>
                    <div className="tp-header-actions">
                        <div className={`tp-status ${selectedParts ? "is-complete" : ""}`}>{selectedParts ? "Listo" : "En selección"}</div>
                        <button type="button" className="tp-close" onClick={this.closePicker} aria-label="Contraer selector">×</button>
                    </div>
                </div>
                <div className="tp-panel">
                    <div className="tp-preview" aria-live="polite">{preview}</div>
                    <div className="tp-selects">
                        <label className="tp-field"><span>Hora</span>
                            {use24 ? (
                                <select value={String(parts.hour)} onChange={(event) => this.changeHour(event.target.value)} disabled={disabled} aria-label="Hora">
                                    {hours.map((hour) => <option key={hour} value={hour}>{pad2(hour)}</option>)}
                                </select>
                            ) : (
                                <select value={String(displayHour)} onChange={(event) => this.changeDisplayHour(event.target.value)} disabled={disabled} aria-label="Hora">
                                    {displayHours.map((hour) => <option key={hour} value={hour}>{pad2(hour)}</option>)}
                                </select>
                            )}
                        </label>
                        <span className="tp-separator">:</span>
                        <label className="tp-field"><span>Minuto</span>
                            <select value={String(parts.minute)} onChange={(event) => this.changeMinute(event.target.value)} disabled={disabled} aria-label="Minuto">
                                {minutes.map((minute) => <option key={minute} value={minute}>{pad2(minute)}</option>)}
                            </select>
                        </label>
                        {withSeconds ? (
                            <>
                                <span className="tp-separator">:</span>
                                <label className="tp-field"><span>Segundo</span>
                                    <select value={String(parts.second)} onChange={(event) => this.changeSecond(event.target.value)} disabled={disabled} aria-label="Segundo">
                                        {seconds.map((second) => <option key={second} value={second}>{pad2(second)}</option>)}
                                    </select>
                                </label>
                            </>
                        ) : null}
                        {use24 ? null : (
                            <label className="tp-field"><span>AM/PM</span>
                                <select value={meridiem} onChange={(event) => this.changeMeridiem(event.target.value)} disabled={disabled} aria-label="AM o PM">
                                    <option value="AM" disabled={!isHourInRange(to24Hour(displayHour, false), this.props.startHour, this.props.endHour)}>AM</option>
                                    <option value="PM" disabled={!isHourInRange(to24Hour(displayHour, true), this.props.startHour, this.props.endHour)}>PM</option>
                                </select>
                            </label>
                        )}
                    </div>
                </div>
                <div className="tp-footer">
                    <span className="tp-dot" /> {selectedParts ? "Hora seleccionada" : "Elige una hora para seleccionarla"}
                    <button type="button" className="tp-action" onClick={this.useNow} disabled={disabled}>Ahora</button>
                    {selectedParts ? <button type="button" className="tp-clear" onClick={this.clearTime} disabled={disabled}>Limpiar</button> : null}
                </div>
            </section>
        );
        return ReactDOM.createPortal(pickerPanel, document.body);
    }
}

