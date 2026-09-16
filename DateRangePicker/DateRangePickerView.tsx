/**
 * Fecha: 2026-09-12
 * Descripcion: Vista React del calendario, con navegacion mensual,
 * seleccion visual del rango y estados de inicio, fin y fechas intermedias.
 */
import * as React from "react";
import * as ReactDOM from "react-dom";

export interface IDateRangePickerProps {
    startDate: string;
    endDate: string;
    dateFormat: string;
    zIndex: number;
    disabled: boolean;
    onRangeChange: (startDate: string, endDate: string) => void;
}

type DateFormat = "YYYY-MM-DD" | "YYYY/MM/DD" | "YYYY.MM.DD" | "YYYYMMDD" | "DD/MM/YYYY" | "MM/DD/YYYY" | "DD-MM-YYYY" | "MM-DD-YYYY" | "DD.MM.YYYY" | "MM.DD.YYYY" | "DDMMYYYY" | "MMDDYYYY";

const supportedDateFormats: DateFormat[] = ["YYYY-MM-DD", "YYYY/MM/DD", "YYYY.MM.DD", "YYYYMMDD", "DD/MM/YYYY", "MM/DD/YYYY", "DD-MM-YYYY", "MM-DD-YYYY", "DD.MM.YYYY", "MM.DD.YYYY", "DDMMYYYY", "MMDDYYYY"];

interface ICalendarDay { date: Date; day: number; isCurrentMonth: boolean; key: string; }

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

export class DateRangePickerView extends React.Component<IDateRangePickerProps, { visibleMonth: Date; isOpen: boolean; overlayPosition: { top: number; left: number; width: number } }> {
    private compactInput = React.createRef<HTMLInputElement>();
    public constructor(props: IDateRangePickerProps) {
        super(props);
        this.state = { visibleMonth: toDate(props.startDate, normalizeDateFormat(props.dateFormat)) ?? new Date(), isOpen: false, overlayPosition: { top: 0, left: 0, width: 320 } };
    }

    private selectDate = (date: Date): void => {
        const dateFormat = normalizeDateFormat(this.props.dateFormat);
        const start = toDate(this.props.startDate, dateFormat);
        const end = toDate(this.props.endDate, dateFormat);
        if (!start || (start && end)) this.props.onRangeChange(formatDate(date, dateFormat), "");
        else if (date < start) {
            this.props.onRangeChange(formatDate(date, dateFormat), formatDate(start, dateFormat));
            this.setState({ isOpen: false });
        } else {
            this.props.onRangeChange(formatDate(start, dateFormat), formatDate(date, dateFormat));
            this.setState({ isOpen: false });
        }
    };

    private togglePicker = (): void => {
        this.setState(({ isOpen }) => ({ isOpen: !isOpen }));
    };

    private openPicker = (): void => {
        const inputElement = this.compactInput.current;
        if (!this.props.disabled && inputElement) {
            const bounds = inputElement.getBoundingClientRect();
            this.setState({ isOpen: true, overlayPosition: { top: bounds.bottom + 6, left: bounds.left, width: Math.max(bounds.width, 320) } });
        }
    };

    private moveMonth = (offset: number): void => {
        this.setState(({ visibleMonth }) => ({ visibleMonth: new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + offset, 1) }));
    };

    public render(): React.ReactNode {
        const { startDate, endDate, disabled } = this.props;
        const dateFormat = normalizeDateFormat(this.props.dateFormat);
        const start = toDate(startDate, dateFormat);
        const end = toDate(endDate, dateFormat);
        const hasRange = !!start && !!end;
        const summary = startDate && endDate ? `${startDate}  →  ${endDate}` : startDate ? `${startDate}  →  Selecciona una fecha final` : "Selecciona una fecha de inicio";
        if (!this.state.isOpen) {
            return <section className="drp-root drp-root-compact" aria-label="Selector de rango de fechas"><input ref={this.compactInput} className={hasRange ? "drp-compact-input drp-compact-value" : "drp-compact-input drp-compact-placeholder"} type="text" readOnly value={hasRange ? summary : "Selecciona fecha"} onClick={this.openPicker} onFocus={this.openPicker} disabled={disabled} aria-label="Abrir selector de rango" /><button type="button" className="drp-calendar-button" onClick={this.openPicker} disabled={disabled} aria-label="Abrir selector de rango"><span className="drp-calendar-icon" aria-hidden="true" /></button></section>;
        }
        const pickerPanel = (
            <section className="drp-root drp-root-expanded" style={{ ...this.state.overlayPosition, zIndex: Math.max(1, Math.min(this.props.zIndex, 2147483647)) }} aria-label="Selector de rango de fechas">
                <div className="drp-header"><div><span className="drp-kicker">RANGO DE FECHAS</span><div className="drp-summary">{summary}</div></div><div className="drp-header-actions"><div className={`drp-status ${hasRange ? "is-complete" : ""}`}>{hasRange ? "Listo" : "En selección"}</div><button type="button" className="drp-close" onClick={this.togglePicker} aria-label="Contraer selector">×</button></div></div>
                <div className="drp-calendar">
                    <div className="drp-monthbar"><button type="button" className="drp-nav" onClick={() => this.moveMonth(-1)} disabled={disabled} aria-label="Mes anterior">‹</button><strong>{months[this.state.visibleMonth.getMonth()]} <span>{this.state.visibleMonth.getFullYear()}</span></strong><button type="button" className="drp-nav" onClick={() => this.moveMonth(1)} disabled={disabled} aria-label="Mes siguiente">›</button></div>
                    <div className="drp-weekdays">{weekdays.map((day) => <span key={day}>{day}</span>)}</div>
                    <div className="drp-grid">{createCalendarDays(this.state.visibleMonth).map(({ date, day, isCurrentMonth, key }) => { const isStart = sameDate(date, start); const isEnd = sameDate(date, end); const isBetween = !!start && !!end && date > start && date < end; return <button key={key} type="button" className={`drp-day ${isCurrentMonth ? "" : "is-muted"} ${isBetween ? "is-between" : ""} ${isStart ? "is-start" : ""} ${isEnd ? "is-end" : ""}`} onClick={() => this.selectDate(date)} disabled={disabled}>{day}</button>; })}</div>
                </div>
                <div className="drp-footer"><span className="drp-dot" /> {hasRange ? "Rango seleccionado" : "Haz clic en dos fechas para completar el rango"}</div>
            </section>
        );
        return ReactDOM.createPortal(pickerPanel, document.body);
    }
}