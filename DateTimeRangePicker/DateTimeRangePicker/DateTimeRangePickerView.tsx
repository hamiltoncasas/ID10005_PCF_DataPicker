/**
 * Fecha: 2026-09-12
 * Descripcion: Vista de seleccion de fecha y hora para ambos extremos del rango.
 */
import * as React from "react";

export interface IDateTimeRangePickerProps {
    startDateTime: string;
    endDateTime: string;
    dateFormat: string;
    timeFormat: string;
    disabled: boolean;
    onRangeChange: (startDateTime: string, endDateTime: string) => void;
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

export class DateTimeRangePickerView extends React.Component<IDateTimeRangePickerProps, { isOpen: boolean }> {
    public constructor(props: IDateTimeRangePickerProps) {
        super(props);
        this.state = { isOpen: false };
    }

    private updateStartDateTime = (value: string, shouldCollapse = false): void => {
        this.props.onRangeChange(value, this.props.endDateTime);
        if (shouldCollapse && value && this.props.endDateTime) this.setState({ isOpen: false });
    };

    private updateEndDateTime = (value: string, shouldCollapse = false): void => {
        this.props.onRangeChange(this.props.startDateTime, value);
        if (shouldCollapse && value && this.props.startDateTime) this.setState({ isOpen: false });
    };

    private togglePicker = (): void => {
        this.setState(({ isOpen }) => ({ isOpen: !isOpen }));
    };

    private openPicker = (): void => {
        if (!this.props.disabled) this.setState({ isOpen: true });
    };

    public render(): React.ReactNode {
        const { startDateTime, endDateTime, dateFormat, timeFormat, disabled } = this.props;
        const hasRange = !!startDateTime && !!endDateTime;
        const summary = hasRange ? `${formatDateTime(startDateTime, dateFormat, timeFormat)} → ${formatDateTime(endDateTime, dateFormat, timeFormat)}` : "Selecciona fecha y hora";
        if (!this.state.isOpen) {
            return <section className="dtrp-root dtrp-root-compact" aria-label="Selector de rango de fecha y hora"><span className="dtrp-calendar-icon">◷</span><input className={hasRange ? "dtrp-compact-input dtrp-compact-value" : "dtrp-compact-input dtrp-compact-placeholder"} type="text" readOnly value={summary} onClick={this.openPicker} onFocus={this.openPicker} disabled={disabled} aria-label="Abrir selector de fecha y hora" /><span className="dtrp-chevron">⌄</span></section>;
        }
        return (
            <section className="dtrp-root" aria-label="Selector de rango de fecha y hora">
                <header className="dtrp-header">
                    <div><span className="dtrp-kicker">RANGO DE FECHA Y HORA</span><h2>Define tu ventana</h2></div>
                    <div className="dtrp-header-actions"><span className={`dtrp-status ${hasRange ? "is-complete" : ""}`}>{hasRange ? "Listo" : "Pendiente"}</span><button type="button" className="dtrp-close" onClick={this.togglePicker} aria-label="Contraer selector">×</button></div>
                </header>
                <div className="dtrp-fields">
                    <label className="dtrp-field"><span>Inicio</span><div><input type="date" value={startDateTime.slice(0, 10)} onChange={(event) => this.updateStartDateTime(`${event.target.value}T${startDateTime.slice(11, 16) || "00:00"}`)} disabled={disabled} /><input type="time" value={startDateTime.slice(11, 16)} onChange={(event) => this.updateStartDateTime(`${startDateTime.slice(0, 10)}T${event.target.value}`, true)} disabled={disabled} /></div></label>
                    <label className="dtrp-field"><span>Fin</span><div><input type="date" value={endDateTime.slice(0, 10)} onChange={(event) => this.updateEndDateTime(`${event.target.value}T${endDateTime.slice(11, 16) || "00:00"}`)} disabled={disabled} /><input type="time" value={endDateTime.slice(11, 16)} onChange={(event) => this.updateEndDateTime(`${endDateTime.slice(0, 10)}T${event.target.value}`, true)} disabled={disabled} /></div></label>
                </div>
                <div className="dtrp-summary"><div><small>INICIO</small><strong>{formatDateTime(startDateTime, dateFormat, timeFormat)}</strong></div><div><small>FIN</small><strong>{formatDateTime(endDateTime, dateFormat, timeFormat)}</strong></div></div>
            </section>
        );
    }
}