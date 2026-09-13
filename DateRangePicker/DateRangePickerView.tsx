/**
 * Fecha: 2026-09-12
 * Descripcion: Vista React del calendario, con navegacion mensual,
 * seleccion visual del rango y estados de inicio, fin y fechas intermedias.
 */
import * as React from "react";

export interface IDateRangePickerProps {
    startDate: string;
    endDate: string;
    disabled: boolean;
    onRangeChange: (startDate: string, endDate: string) => void;
}

interface ICalendarDay { date: Date; day: number; isCurrentMonth: boolean; key: string; }

const weekdays = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const months = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

function toDate(value: string): Date | null {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
    const [year, month, day] = value.split("-").map(Number);
    return new Date(year, month - 1, day);
}

function formatDate(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function sameDate(first: Date | null, second: Date | null): boolean {
    return !!first && !!second && formatDate(first) === formatDate(second);
}

function createCalendarDays(month: Date): ICalendarDay[] {
    const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
    const mondayOffset = (firstDay.getDay() + 6) % 7;
    const firstCell = new Date(month.getFullYear(), month.getMonth(), 1 - mondayOffset);
    return Array.from({ length: 42 }, (_, index) => {
        const date = new Date(firstCell.getFullYear(), firstCell.getMonth(), firstCell.getDate() + index);
        return { date, day: date.getDate(), isCurrentMonth: date.getMonth() === month.getMonth(), key: formatDate(date) };
    });
}

export class DateRangePickerView extends React.Component<IDateRangePickerProps, { visibleMonth: Date }> {
    public constructor(props: IDateRangePickerProps) {
        super(props);
        this.state = { visibleMonth: toDate(props.startDate) ?? new Date() };
    }

    private selectDate = (date: Date): void => {
        const start = toDate(this.props.startDate);
        const end = toDate(this.props.endDate);
        if (!start || (start && end)) this.props.onRangeChange(formatDate(date), "");
        else if (date < start) this.props.onRangeChange(formatDate(date), formatDate(start));
        else this.props.onRangeChange(formatDate(start), formatDate(date));
    };

    private moveMonth = (offset: number): void => {
        this.setState(({ visibleMonth }) => ({ visibleMonth: new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + offset, 1) }));
    };

    public render(): React.ReactNode {
        const { startDate, endDate, disabled } = this.props;
        const start = toDate(startDate);
        const end = toDate(endDate);
        const hasRange = !!start && !!end;
        const summary = startDate && endDate ? `${startDate}  →  ${endDate}` : startDate ? `${startDate}  →  Selecciona una fecha final` : "Selecciona una fecha de inicio";
        return (
            <section className="drp-root" aria-label="Selector de rango de fechas">
                <div className="drp-header"><div><span className="drp-kicker">RANGO DE FECHAS</span><div className="drp-summary">{summary}</div></div><div className={`drp-status ${hasRange ? "is-complete" : ""}`}>{hasRange ? "Listo" : "En selección"}</div></div>
                <div className="drp-calendar">
                    <div className="drp-monthbar"><button type="button" className="drp-nav" onClick={() => this.moveMonth(-1)} disabled={disabled} aria-label="Mes anterior">‹</button><strong>{months[this.state.visibleMonth.getMonth()]} <span>{this.state.visibleMonth.getFullYear()}</span></strong><button type="button" className="drp-nav" onClick={() => this.moveMonth(1)} disabled={disabled} aria-label="Mes siguiente">›</button></div>
                    <div className="drp-weekdays">{weekdays.map((day) => <span key={day}>{day}</span>)}</div>
                    <div className="drp-grid">{createCalendarDays(this.state.visibleMonth).map(({ date, day, isCurrentMonth, key }) => { const isStart = sameDate(date, start); const isEnd = sameDate(date, end); const isBetween = !!start && !!end && date > start && date < end; return <button key={key} type="button" className={`drp-day ${isCurrentMonth ? "" : "is-muted"} ${isBetween ? "is-between" : ""} ${isStart ? "is-start" : ""} ${isEnd ? "is-end" : ""}`} onClick={() => this.selectDate(date)} disabled={disabled}>{day}</button>; })}</div>
                </div>
                <div className="drp-footer"><span className="drp-dot" /> {hasRange ? "Rango seleccionado" : "Haz clic en dos fechas para completar el rango"}</div>
            </section>
        );
    }
}