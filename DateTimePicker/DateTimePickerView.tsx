/**
 * Fecha: 2026-09-16
 * Descripcion: Vista React del selector de fecha y hora simple, con calendario
 * de seleccion unica, campo de fecha, selector de hora y navegacion mensual.
 */
import * as React from "react";
import * as ReactDOM from "react-dom";

export interface IDateTimePickerProps {
    dateTime: string;
    dateFormat: string;
    timeFormat: string;
    zIndex: number;
    disabled: boolean;
    onDateTimeChange: (dateTime: string) => void;
}

interface ICalendarDay { date: Date; day: number; isCurrentMonth: boolean; key: string; }

interface IDateTimePickerState {
    visibleMonth: Date;
    time: string;
    isOpen: boolean;
    overlayPosition: { top: number; left: number; width: number };
}

const weekdays = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const months = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

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

function parseDateTime(value: string): { date: Date; time: string } | null {
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value)) return null;
    const date = parseDate(value.slice(0, 10));
    if (!date) return null;
    return { date, time: value.slice(11, 16) };
}

function formatCalendarDate(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function composeDateTime(date: Date, time: string): string {
    return `${formatCalendarDate(date)}T${time || "00:00"}`;
}

function getDefaultTime(): string {
    const now = new Date();
    const minutes = Math.floor(now.getMinutes() / 15) * 15;
    return `${String(now.getHours()).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
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

function formatTimeValue(time: string, timeFormat: string): string {
    const withSeconds = timeFormat === "24:00:00" || timeFormat === "12:00:00";
    if (!timeFormat.startsWith("12")) return withSeconds ? `${time}:00` : time;
    const [hours, minutes] = time.split(":").map(Number);
    const clock = new Date(2026, 0, 1, Number.isNaN(hours) ? 0 : hours, Number.isNaN(minutes) ? 0 : minutes);
    return clock.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true });
}

function sameDate(first: Date | null, second: Date | null): boolean {
    return !!first && !!second && formatCalendarDate(first) === formatCalendarDate(second);
}

function createCalendarDays(month: Date): ICalendarDay[] {
    const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
    const mondayOffset = (firstDay.getDay() + 6) % 7;
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
        const initial = parseDateTime(props.dateTime);
        this.state = { visibleMonth: initial?.date ?? new Date(), time: initial?.time ?? getDefaultTime(), isOpen: false, overlayPosition: { top: 0, left: 0, width: 340 } };
    }

    private updateTime = (time: string): void => {
        this.setState({ time });
        const current = parseDateTime(this.props.dateTime);
        if (current) this.props.onDateTimeChange(composeDateTime(current.date, time));
    };

    private updateDateInput = (value: string): void => {
        if (!value) {
            this.props.onDateTimeChange("");
            return;
        }
        const date = parseDate(value);
        if (date) this.props.onDateTimeChange(composeDateTime(date, this.state.time));
    };

    private selectDate = (date: Date): void => {
        this.props.onDateTimeChange(composeDateTime(date, this.state.time));
        this.setState({ isOpen: false });
    };

    private clearDateTime = (): void => {
        this.props.onDateTimeChange("");
        this.setState({ isOpen: false });
    };

    private togglePicker = (): void => {
        this.setState(({ isOpen }) => ({ isOpen: !isOpen }));
    };

    private openPicker = (): void => {
        const inputElement = this.compactInput.current;
        if (!this.props.disabled && inputElement) {
            const bounds = inputElement.getBoundingClientRect();
            const current = parseDateTime(this.props.dateTime);
            this.setState((state) => ({
                isOpen: true,
                visibleMonth: current?.date ?? state.visibleMonth,
                time: current?.time ?? state.time,
                overlayPosition: { top: bounds.bottom + 6, left: bounds.left, width: Math.max(bounds.width, 340) },
            }));
        }
    };

    private moveMonth = (offset: number): void => {
        this.setState(({ visibleMonth }) => ({ visibleMonth: new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + offset, 1) }));
    };

    public render(): React.ReactNode {
        const { dateTime, dateFormat, timeFormat, disabled } = this.props;
        const current = parseDateTime(dateTime);
        const hasValue = !!current;
        const today = new Date();
        const summary = current ? `${formatDateValue(current.date, dateFormat)} · ${formatTimeValue(current.time, timeFormat)}` : "Selecciona fecha y hora";
        const options = this.state.time && !timeOptions.includes(this.state.time) ? [...timeOptions, this.state.time].sort() : timeOptions;
        if (!this.state.isOpen) {
            return <section className="dtp-root dtp-root-compact" aria-label="Selector de fecha y hora"><input ref={this.compactInput} className={hasValue ? "dtp-compact-input dtp-compact-value" : "dtp-compact-input dtp-compact-placeholder"} type="text" readOnly value={hasValue ? summary : "Selecciona fecha"} onClick={this.openPicker} onFocus={this.openPicker} disabled={disabled} aria-label="Abrir selector de fecha y hora" /><button type="button" className="dtp-calendar-button" onClick={this.openPicker} disabled={disabled} aria-label="Abrir selector de fecha y hora"><span className="dtp-calendar-icon" aria-hidden="true" /></button></section>;
        }
        const pickerPanel = (
            <section className="dtp-root dtp-root-expanded" style={{ ...this.state.overlayPosition, zIndex: Math.max(1, Math.min(this.props.zIndex, 2147483647)) }} aria-label="Selector de fecha y hora">
                <div className="dtp-header"><div><span className="dtp-kicker">FECHA Y HORA</span><div className="dtp-summary">{summary}</div></div><div className="dtp-header-actions"><div className={`dtp-status ${hasValue ? "is-complete" : ""}`}>{hasValue ? "Listo" : "En selección"}</div><button type="button" className="dtp-close" onClick={this.togglePicker} aria-label="Contraer selector">×</button></div></div>
                <div className="dtp-calendar">
                    <div className="dtp-monthbar"><button type="button" className="dtp-nav" onClick={() => this.moveMonth(-1)} disabled={disabled} aria-label="Mes anterior">‹</button><strong>{months[this.state.visibleMonth.getMonth()]} <span>{this.state.visibleMonth.getFullYear()}</span></strong><button type="button" className="dtp-nav" onClick={() => this.moveMonth(1)} disabled={disabled} aria-label="Mes siguiente">›</button></div>
                    <div className="dtp-weekdays">{weekdays.map((day) => <span key={day}>{day}</span>)}</div>
                    <div className="dtp-grid">{createCalendarDays(this.state.visibleMonth).map(({ date: dayDate, day, isCurrentMonth, key }) => <button key={key} type="button" className={`dtp-day ${isCurrentMonth ? "" : "is-muted"} ${sameDate(dayDate, current?.date ?? null) ? "is-selected" : ""} ${sameDate(dayDate, today) ? "is-today" : ""}`} onClick={() => this.selectDate(dayDate)} disabled={disabled}>{day}</button>)}</div>
                </div>
                <div className="dtp-fields">
                    <label className="dtp-field"><span>Fecha y hora</span><div><input type="date" value={dateTime.slice(0, 10)} onChange={(event) => this.updateDateInput(event.target.value)} disabled={disabled} aria-label="Fecha seleccionada" /><span className="dtp-time-picker"><span className="dtp-clock-icon" aria-hidden="true" /><select value={this.state.time} onChange={(event) => this.updateTime(event.target.value)} disabled={disabled} aria-label="Hora seleccionada">{options.map((time) => <option key={time} value={time}>{formatTimeValue(time, timeFormat)}</option>)}</select></span></div></label>
                </div>
                <div className="dtp-footer"><span className="dtp-dot" /> {hasValue ? "Fecha y hora seleccionadas" : "Haz clic en una fecha para seleccionarla"}{hasValue ? <button type="button" className="dtp-clear" onClick={this.clearDateTime} disabled={disabled}>Limpiar</button> : null}</div>
            </section>
        );
        return ReactDOM.createPortal(pickerPanel, document.body);
    }
}
