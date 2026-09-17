/**
 * Fecha: 2026-09-16
 * Descripcion: Vista React del selector de fecha simple, con navegacion mensual
 * y seleccion unica sobre el mismo diseno del selector de rango.
 */
import * as React from "react";
import * as ReactDOM from "react-dom";

export interface IDatePickerProps {
    date: string;
    dateFormat: string;
    zIndex: number;
    disabled: boolean;
    onDateChange: (date: string) => void;
}

type DateFormat = "YYYY-MM-DD" | "YYYY/MM/DD" | "YYYY.MM.DD" | "YYYYMMDD" | "DD/MM/YYYY" | "MM/DD/YYYY" | "DD-MM-YYYY" | "MM-DD-YYYY" | "DD.MM.YYYY" | "MM.DD.YYYY" | "DDMMYYYY" | "MMDDYYYY";

const supportedDateFormats: DateFormat[] = ["YYYY-MM-DD", "YYYY/MM/DD", "YYYY.MM.DD", "YYYYMMDD", "DD/MM/YYYY", "MM/DD/YYYY", "DD-MM-YYYY", "MM-DD-YYYY", "DD.MM.YYYY", "MM.DD.YYYY", "DDMMYYYY", "MMDDYYYY"];

interface ICalendarDay { date: Date; day: number; isCurrentMonth: boolean; key: string; }

interface IDatePickerState {
    visibleMonth: Date;
    isOpen: boolean;
    overlayPosition: { top: number; left: number; width: number };
}

const weekdays = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const months = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

function normalizeDateFormat(value: string): DateFormat {
    const normalizedFormat = value.trim().toUpperCase();
    const matchingFormat = supportedDateFormats.find((dateFormat) => dateFormat === normalizedFormat);
    if (matchingFormat) return matchingFormat;
    return "YYYY-MM-DD";
}

function toDate(value: string, dateFormat: DateFormat): Date | null {
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

function createCalendarDays(month: Date): ICalendarDay[] {
    const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
    const mondayOffset = (firstDay.getDay() + 6) % 7;
    const firstCell = new Date(month.getFullYear(), month.getMonth(), 1 - mondayOffset);
    return Array.from({ length: 42 }, (_, index) => {
        const date = new Date(firstCell.getFullYear(), firstCell.getMonth(), firstCell.getDate() + index);
        return { date, day: date.getDate(), isCurrentMonth: date.getMonth() === month.getMonth(), key: formatDate(date, "YYYY-MM-DD") };
    });
}

export class DatePickerView extends React.Component<IDatePickerProps, IDatePickerState> {
    private compactInput = React.createRef<HTMLInputElement>();

    public constructor(props: IDatePickerProps) {
        super(props);
        const selected = toDate(props.date, normalizeDateFormat(props.dateFormat));
        this.state = { visibleMonth: selected ?? new Date(), isOpen: false, overlayPosition: { top: 0, left: 0, width: 320 } };
    }

    private selectDate = (date: Date): void => {
        this.props.onDateChange(formatDate(date, normalizeDateFormat(this.props.dateFormat)));
        this.setState({ isOpen: false });
    };

    private clearDate = (): void => {
        this.props.onDateChange("");
        this.setState({ isOpen: false });
    };

    private togglePicker = (): void => {
        this.setState(({ isOpen }) => ({ isOpen: !isOpen }));
    };

    private openPicker = (): void => {
        const inputElement = this.compactInput.current;
        if (!this.props.disabled && inputElement) {
            const bounds = inputElement.getBoundingClientRect();
            const selected = toDate(this.props.date, normalizeDateFormat(this.props.dateFormat));
            this.setState(({ visibleMonth }) => ({ isOpen: true, visibleMonth: selected ?? visibleMonth, overlayPosition: { top: bounds.bottom + 6, left: bounds.left, width: Math.max(bounds.width, 320) } }));
        }
    };

    private moveMonth = (offset: number): void => {
        this.setState(({ visibleMonth }) => ({ visibleMonth: new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + offset, 1) }));
    };

    public render(): React.ReactNode {
        const { date, disabled } = this.props;
        const dateFormat = normalizeDateFormat(this.props.dateFormat);
        const selected = toDate(date, dateFormat);
        const hasDate = !!selected;
        const today = new Date();
        const summary = hasDate ? date : "Selecciona una fecha";
        if (!this.state.isOpen) {
            return <section className="dp-root dp-root-compact" aria-label="Selector de fecha"><input ref={this.compactInput} className={hasDate ? "dp-compact-input dp-compact-value" : "dp-compact-input dp-compact-placeholder"} type="text" readOnly value={hasDate ? summary : "Selecciona fecha"} onClick={this.openPicker} onFocus={this.openPicker} disabled={disabled} aria-label="Abrir selector de fecha" /><button type="button" className="dp-calendar-button" onClick={this.openPicker} disabled={disabled} aria-label="Abrir selector de fecha"><span className="dp-calendar-icon" aria-hidden="true" /></button></section>;
        }
        const pickerPanel = (
            <section className="dp-root dp-root-expanded" style={{ ...this.state.overlayPosition, zIndex: Math.max(1, Math.min(this.props.zIndex, 2147483647)) }} aria-label="Selector de fecha">
                <div className="dp-header"><div><span className="dp-kicker">FECHA</span><div className="dp-summary">{summary}</div></div><div className="dp-header-actions"><div className={`dp-status ${hasDate ? "is-complete" : ""}`}>{hasDate ? "Listo" : "En selección"}</div><button type="button" className="dp-close" onClick={this.togglePicker} aria-label="Contraer selector">×</button></div></div>
                <div className="dp-calendar">
                    <div className="dp-monthbar"><button type="button" className="dp-nav" onClick={() => this.moveMonth(-1)} disabled={disabled} aria-label="Mes anterior">‹</button><strong>{months[this.state.visibleMonth.getMonth()]} <span>{this.state.visibleMonth.getFullYear()}</span></strong><button type="button" className="dp-nav" onClick={() => this.moveMonth(1)} disabled={disabled} aria-label="Mes siguiente">›</button></div>
                    <div className="dp-weekdays">{weekdays.map((day) => <span key={day}>{day}</span>)}</div>
                    <div className="dp-grid">{createCalendarDays(this.state.visibleMonth).map(({ date: dayDate, day, isCurrentMonth, key }) => <button key={key} type="button" className={`dp-day ${isCurrentMonth ? "" : "is-muted"} ${sameDate(dayDate, selected) ? "is-selected" : ""} ${sameDate(dayDate, today) ? "is-today" : ""}`} onClick={() => this.selectDate(dayDate)} disabled={disabled}>{day}</button>)}</div>
                </div>
                <div className="dp-footer"><span className="dp-dot" /> {hasDate ? "Fecha seleccionada" : "Haz clic en una fecha para seleccionarla"}{hasDate ? <button type="button" className="dp-clear" onClick={this.clearDate} disabled={disabled}>Limpiar</button> : null}</div>
            </section>
        );
        return ReactDOM.createPortal(pickerPanel, document.body);
    }
}
