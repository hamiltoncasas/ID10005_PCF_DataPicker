/**
 * Fecha: 2026-09-12
 * Descripcion: Vista de seleccion de fecha y hora para ambos extremos del rango.
 */
import * as React from "react";
import * as ReactDOM from "react-dom";

export interface IDateTimeRangePickerProps {
    startDateTime: string;
    endDateTime: string;
    dateFormat: string;
    timeFormat: string;
    zIndex: number;
    disabled: boolean;
    onRangeChange: (startDateTime: string, endDateTime: string) => void;
}

interface ICalendarDay { date: Date; day: number; isCurrentMonth: boolean; key: string; }

const weekdays = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const months = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

function parseDate(value: string): Date | null {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
    const [year, month, day] = value.split("-").map(Number);
    const parsedDate = new Date(year, month - 1, day);
    return parsedDate.getFullYear() === year && parsedDate.getMonth() === month - 1 && parsedDate.getDate() === day ? parsedDate : null;
}

function formatCalendarDate(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
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

function formatDateTime(value: string, dateFormat: string, timeFormat: string): string {
    if (!value) return "Sin seleccionar";
    const date = new Date(`${value}:00`);
    if (Number.isNaN(date.getTime())) return value;
    const year = String(date.getFullYear());
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const normalizedDateFormat = dateFormat.toUpperCase();
    const dateValue = normalizedDateFormat === "DD/MM/YYYY" ? `${day}/${month}/${year}` : normalizedDateFormat === "MM/DD/YYYY" ? `${month}/${day}/${year}` : normalizedDateFormat === "YYYY/MM/DD" ? `${year}/${month}/${day}` : normalizedDateFormat === "YYYY.MM.DD" ? `${year}.${month}.${day}` : normalizedDateFormat === "YYYYMMDD" ? `${year}${month}${day}` : normalizedDateFormat === "DD-MM-YYYY" ? `${day}-${month}-${year}` : normalizedDateFormat === "MM-DD-YYYY" ? `${month}-${day}-${year}` : normalizedDateFormat === "DD.MM.YYYY" ? `${day}.${month}.${year}` : normalizedDateFormat === "MM.DD.YYYY" ? `${month}.${day}.${year}` : normalizedDateFormat === "DDMMYYYY" ? `${day}${month}${year}` : normalizedDateFormat === "MMDDYYYY" ? `${month}${day}${year}` : `${year}-${month}-${day}`;
    const timeValue = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: timeFormat === "24:00:00" || timeFormat === "12:00:00" ? "2-digit" : undefined, hour12: timeFormat.startsWith("12") });
    return `${dateValue} · ${timeValue}`;
}

function formatTimeOption(value: string, timeFormat: string): string {
    if (!timeFormat.startsWith("12")) return value;
    const [hours, minutes] = value.split(":").map(Number);
    const time = new Date(2026, 0, 1, hours, minutes);
    return time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true });
}

const timeOptions = Array.from({ length: 96 }, (_, index) => {
    const hours = String(Math.floor(index / 4)).padStart(2, "0");
    const minutes = String((index % 4) * 15).padStart(2, "0");
    return `${hours}:${minutes}`;
});

export class DateTimeRangePickerView extends React.Component<IDateTimeRangePickerProps, { visibleMonth: Date; isOpen: boolean; overlayPosition: { top: number; left: number; width: number } }> {
    private compactInput = React.createRef<HTMLInputElement>();
    public constructor(props: IDateTimeRangePickerProps) {
        super(props);
        this.state = { visibleMonth: parseDate(props.startDateTime.slice(0, 10)) ?? new Date(), isOpen: false, overlayPosition: { top: 0, left: 0, width: 360 } };
    }

    private updateStartDateTime = (value: string, shouldCollapse = false): void => {
        this.props.onRangeChange(value, this.props.endDateTime);
        if (shouldCollapse && value && this.props.endDateTime) this.setState({ isOpen: false });
    };

    private updateEndDateTime = (value: string, shouldCollapse = false): void => {
        this.props.onRangeChange(this.props.startDateTime, value);
        if (shouldCollapse && value && this.props.startDateTime) this.setState({ isOpen: false });
    };

    private selectDate = (date: Date): void => {
        const selectedDate = formatCalendarDate(date);
        const startDate = parseDate(this.props.startDateTime.slice(0, 10));
        const endDate = parseDate(this.props.endDateTime.slice(0, 10));
        const startTime = this.props.startDateTime.slice(11, 16) || "00:00";
        const endTime = this.props.endDateTime.slice(11, 16) || "00:00";
        if (!startDate || endDate) {
            this.props.onRangeChange(`${selectedDate}T${startTime}`, "");
        } else if (date < startDate) {
            this.props.onRangeChange(`${selectedDate}T${startTime}`, `${this.props.startDateTime.slice(0, 10)}T${startTime}`);
        } else {
            this.props.onRangeChange(this.props.startDateTime, `${selectedDate}T${endTime}`);
        }
    };

    private togglePicker = (): void => {
        this.setState(({ isOpen }) => ({ isOpen: !isOpen }));
    };

    private openPicker = (): void => {
        const inputElement = this.compactInput.current;
        if (!this.props.disabled && inputElement) {
            const bounds = inputElement.getBoundingClientRect();
            this.setState({ isOpen: true, overlayPosition: { top: bounds.bottom + 6, left: bounds.left, width: Math.max(bounds.width, 360) } });
        }
    };

    private moveMonth = (offset: number): void => {
        this.setState(({ visibleMonth }) => ({ visibleMonth: new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + offset, 1) }));
    };

    public render(): React.ReactNode {
        const { startDateTime, endDateTime, dateFormat, timeFormat, disabled } = this.props;
        const startDate = parseDate(startDateTime.slice(0, 10));
        const endDate = parseDate(endDateTime.slice(0, 10));
        const hasRange = !!startDate && !!endDate;
        const summary = startDateTime && endDateTime ? `${formatDateTime(startDateTime, dateFormat, timeFormat)}  →  ${formatDateTime(endDateTime, dateFormat, timeFormat)}` : startDateTime ? `${formatDateTime(startDateTime, dateFormat, timeFormat)}  →  Selecciona una fecha final` : "Selecciona una fecha de inicio";
        if (!this.state.isOpen) {
            return <section className="dtrp-root dtrp-root-compact" aria-label="Selector de rango de fecha y hora"><input ref={this.compactInput} className={hasRange ? "dtrp-compact-input dtrp-compact-value" : "dtrp-compact-input dtrp-compact-placeholder"} type="text" readOnly value={hasRange ? summary : "Selecciona fecha"} onClick={this.openPicker} onFocus={this.openPicker} disabled={disabled} aria-label="Abrir selector de fecha y hora" /><button type="button" className="dtrp-calendar-button" onClick={this.openPicker} disabled={disabled} aria-label="Abrir selector de fecha y hora"><span className="dtrp-calendar-icon" aria-hidden="true" /></button></section>;
        }
        const pickerPanel = (
            <section className="dtrp-root dtrp-root-expanded" style={{ ...this.state.overlayPosition, zIndex: Math.max(1, Math.min(this.props.zIndex, 2147483647)) }} aria-label="Selector de rango de fecha y hora">
                <div className="dtrp-header"><div><span className="dtrp-kicker">RANGO DE FECHA Y HORA</span><div className="dtrp-summary">{summary}</div></div><div className="dtrp-header-actions"><div className={`dtrp-status ${hasRange ? "is-complete" : ""}`}>{hasRange ? "Listo" : "En selección"}</div><button type="button" className="dtrp-close" onClick={this.togglePicker} aria-label="Contraer selector">×</button></div></div>
                <div className="dtrp-calendar"><div className="dtrp-monthbar"><button type="button" className="dtrp-nav" onClick={() => this.moveMonth(-1)} disabled={disabled} aria-label="Mes anterior">‹</button><strong>{months[this.state.visibleMonth.getMonth()]} <span>{this.state.visibleMonth.getFullYear()}</span></strong><button type="button" className="dtrp-nav" onClick={() => this.moveMonth(1)} disabled={disabled} aria-label="Mes siguiente">›</button></div><div className="dtrp-weekdays">{weekdays.map((day) => <span key={day}>{day}</span>)}</div><div className="dtrp-grid">{createCalendarDays(this.state.visibleMonth).map(({ date, day, isCurrentMonth, key }) => { const isStart = sameDate(date, startDate); const isEnd = sameDate(date, endDate); const isBetween = !!startDate && !!endDate && date > startDate && date < endDate; return <button key={key} type="button" className={`dtrp-day ${isCurrentMonth ? "" : "is-muted"} ${isBetween ? "is-between" : ""} ${isStart ? "is-start" : ""} ${isEnd ? "is-end" : ""}`} onClick={() => this.selectDate(date)} disabled={disabled}>{day}</button>; })}</div></div>
                <div className="dtrp-fields">
                    <label className="dtrp-field"><span>Inicio</span><div><input type="date" value={startDateTime.slice(0, 10)} onChange={(event) => this.updateStartDateTime(`${event.target.value}T${startDateTime.slice(11, 16) || "00:00"}`)} disabled={disabled} /><span className="dtrp-time-picker"><span className="dtrp-clock-icon" aria-hidden="true" /><select value={startDateTime.slice(11, 16)} onChange={(event) => this.updateStartDateTime(`${startDateTime.slice(0, 10)}T${event.target.value}`, true)} disabled={disabled} aria-label="Hora de inicio">{timeOptions.map((time) => <option key={time} value={time}>{formatTimeOption(time, timeFormat)}</option>)}</select></span></div></label>
                    <label className="dtrp-field"><span>Fin</span><div><input type="date" value={endDateTime.slice(0, 10)} onChange={(event) => this.updateEndDateTime(`${event.target.value}T${endDateTime.slice(11, 16) || "00:00"}`)} disabled={disabled} /><span className="dtrp-time-picker"><span className="dtrp-clock-icon" aria-hidden="true" /><select value={endDateTime.slice(11, 16)} onChange={(event) => this.updateEndDateTime(`${endDateTime.slice(0, 10)}T${event.target.value}`, true)} disabled={disabled} aria-label="Hora de fin">{timeOptions.map((time) => <option key={time} value={time}>{formatTimeOption(time, timeFormat)}</option>)}</select></span></div></label>
                </div>
                <div className="dtrp-footer"><span className="dtrp-dot" /> {hasRange ? "Rango seleccionado" : "Haz clic en dos fechas para completar el rango"}</div>
            </section>
        );
        return ReactDOM.createPortal(pickerPanel, document.body);
    }
}