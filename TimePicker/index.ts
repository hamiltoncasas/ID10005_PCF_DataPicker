/**
 * Fecha: 2026-11-10
 * Descripcion: Conecta las propiedades del manifiesto con la vista del selector
 * de hora y publica las salidas selectedTime, hour, minute y second.
 */
import * as React from "react";
import { IInputs, IOutputs } from "./generated/ManifestTypes";
import { ITimePickerProps, TimePickerView, parseTimeOfDay, toTechnical } from "./TimePickerView";

export class TimePicker implements ComponentFramework.ReactControl<IInputs, IOutputs> {
    private notifyOutputChanged: () => void;
    private selectedTime = "";
    private lastDefaultTime = "";
    private lastResetKey = false;

    public init(context: ComponentFramework.Context<IInputs>, notifyOutputChanged: () => void, state: ComponentFramework.Dictionary): void {
        this.notifyOutputChanged = notifyOutputChanged;
    }

    public updateView(context: ComponentFramework.Context<IInputs>): React.ReactElement {
        const parameters = context.parameters;
        const defaultTime = parameters.defaultTime?.raw ?? "";
        const resetKey = parameters.resetKey?.raw ?? false;
        const showSeconds = parameters.showSeconds?.raw ?? false;
        if (resetKey !== this.lastResetKey) {
            this.selectedTime = "";
            this.lastDefaultTime = defaultTime;
            this.lastResetKey = resetKey;
        } else if (defaultTime !== this.lastDefaultTime) {
            this.selectedTime = this.normalizeTime(defaultTime, showSeconds);
            this.lastDefaultTime = defaultTime;
        }
        const props: ITimePickerProps = {
            selectedTime: this.selectedTime,
            format: parameters.format?.raw ?? "",
            disabled: context.mode.isControlDisabled,
            startHour: parameters.startHour?.raw ?? 0,
            endHour: parameters.endHour?.raw ?? 23,
            minuteInterval: parameters.minuteInterval?.raw ?? 1,
            showSeconds,
            use24HourFormat: parameters.use24HourFormat?.raw ?? true,
            borderColor: parameters.borderColor?.raw ?? undefined,
            borderThickness: parameters.borderThickness?.raw ?? undefined,
            focusedBorderColor: parameters.focusedBorderColor?.raw ?? undefined,
            color: parameters.color?.raw ?? undefined,
            fill: parameters.fill?.raw ?? undefined,
            font: parameters.font?.raw ?? undefined,
            fontWeight: parameters.fontWeight?.raw ?? undefined,
            size: parameters.size?.raw ?? undefined,
            onTimeChange: (time: string): void => {
                this.selectedTime = time;
                this.notifyOutputChanged();
            },
        };
        return React.createElement(TimePickerView, props);
    }

    public getOutputs(): IOutputs {
        const parts = parseTimeOfDay(this.selectedTime);
        return {
            selectedTime: this.selectedTime,
            hour: parts?.hour ?? 0,
            minute: parts?.minute ?? 0,
            second: parts?.second ?? 0,
        };
    }

    /** Limpieza del control: la vista React no deja recursos que liberar. */
    public destroy(): void {
        // No hay recursos externos ni temporizadores que cancelar.
    }

    /** Normaliza la hora precargada; sin Mostrar segundos se publica con :00. */
    private normalizeTime(value: string, showSeconds: boolean): string {
        const parts = parseTimeOfDay(value);
        if (!parts) return "";
        return toTechnical(showSeconds ? parts : { ...parts, second: 0 });
    }
}
