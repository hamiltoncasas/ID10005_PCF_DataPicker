/**
 * Fecha: 2026-09-12
 * Descripcion: Adaptador PCF que conecta el ciclo de vida de Power Apps con
 * la vista React del selector de rango y publica sus fechas seleccionadas.
 */
import { IInputs, IOutputs } from "./generated/ManifestTypes";
import { DateRangePickerView, IDateRangePickerProps } from "./DateRangePickerView";
import * as React from "react";

export class DateRangePicker implements ComponentFramework.ReactControl<IInputs, IOutputs> {
    private notifyOutputChanged: () => void;
    private startDate = "";
    private endDate = "";
    private lastInputStart = "";
    private lastInputEnd = "";
    private lastResetKey = false;

    /**
     * Empty constructor.
     */
    constructor() {
        // Empty
    }

    /**
     * Used to initialize the control instance. Controls can kick off remote server calls and other initialization actions here.
     * Data-set values are not initialized here, use updateView.
     * @param context The entire property bag available to control via Context Object; It contains values as set up by the customizer mapped to property names defined in the manifest, as well as utility functions.
     * @param notifyOutputChanged A callback method to alert the framework that the control has new outputs ready to be retrieved asynchronously.
     * @param state A piece of data that persists in one session for a single user. Can be set at any point in a controls life cycle by calling 'setControlState' in the Mode interface.
     */
    public init(
        context: ComponentFramework.Context<IInputs>,
        notifyOutputChanged: () => void,
        state: ComponentFramework.Dictionary
    ): void {
        this.notifyOutputChanged = notifyOutputChanged;
    }

    /**
     * Called when any value in the property bag has changed. This includes field values, data-sets, global values such as container height and width, offline status, control metadata values such as label, visible, etc.
     * @param context The entire property bag available to control via Context Object; It contains values as set up by the customizer mapped to names defined in the manifest, as well as utility functions
     * @returns ReactElement root react element for the control
     */
    public updateView(context: ComponentFramework.Context<IInputs>): React.ReactElement {
        const inputDefault = context.parameters.defaultDate?.raw ?? "";
        const configuredInitial = context.parameters.initialStartDate?.raw ?? "";
        const inputStart = inputDefault.trim() ? inputDefault : configuredInitial;
        const inputEnd = context.parameters.initialEndDate?.raw ?? "";
        const dateFormat = String(context.parameters.format.raw ?? "YYYY-MM-DD");
        const zIndex = context.parameters.zIndex.raw ?? 2147483647;
        const resetKey = context.parameters.resetKey?.raw ?? false;

        if (resetKey !== this.lastResetKey) {
            this.startDate = "";
            this.endDate = "";
            this.lastInputStart = inputStart;
            this.lastInputEnd = inputEnd;
            this.lastResetKey = resetKey;
        } else if (inputStart !== this.lastInputStart || inputEnd !== this.lastInputEnd) {
            this.startDate = inputStart;
            this.endDate = inputEnd;
            this.lastInputStart = inputStart;
            this.lastInputEnd = inputEnd;
        }

        const props: IDateRangePickerProps = {
            startDate: this.startDate,
            endDate: this.endDate,
            dateFormat,
            zIndex,
            accessibleLabel: context.parameters.accessibleLabel?.raw ?? undefined,
            placeholderText: context.parameters.placeholderText?.raw ?? undefined,
            isEditable: context.parameters.isEditable?.raw ?? false,
            startYear: context.parameters.startYear?.raw ?? 0,
            endYear: context.parameters.endYear?.raw ?? 0,
            startOfWeek: context.parameters.startOfWeek?.raw ?? undefined,
            minDate: context.parameters.minDate?.raw ?? undefined,
            maxDate: context.parameters.maxDate?.raw ?? undefined,
            dateTimeZone: context.parameters.dateTimeZone?.raw ?? undefined,
            language: context.parameters.language?.raw ?? undefined,
            chevronBackground: context.parameters.chevronBackground?.raw ?? undefined,
            chevronFill: context.parameters.chevronFill?.raw ?? undefined,
            iconBackground: context.parameters.iconBackground?.raw ?? undefined,
            iconFill: context.parameters.iconFill?.raw ?? undefined,
            borderColor: context.parameters.borderColor?.raw ?? undefined,
            borderStyle: context.parameters.borderStyle?.raw ?? undefined,
            borderThickness: context.parameters.borderThickness?.raw ?? undefined,
            color: context.parameters.color?.raw ?? undefined,
            fill: context.parameters.fill?.raw ?? undefined,
            font: context.parameters.font?.raw ?? undefined,
            size: context.parameters.size?.raw ?? undefined,
            fontWeight: context.parameters.fontWeight?.raw ?? undefined,
            italic: context.parameters.italic?.raw ?? false,
            strikethrough: context.parameters.strikethrough?.raw ?? false,
            underline: context.parameters.underline?.raw ?? false,
            onRangeChange: (startDate, endDate) => {
                this.startDate = startDate;
                this.endDate = endDate;
                this.notifyOutputChanged();
            },
            disabled: context.mode.isControlDisabled,
        };
        return React.createElement(
            DateRangePickerView, props
        );
    }

    /**
     * It is called by the framework prior to a control receiving new data.
     * @returns an object based on nomenclature defined in manifest, expecting object[s] for property marked as "bound" or "output"
     */
    public getOutputs(): IOutputs {
        return { startDate: this.startDate, endDate: this.endDate, selectedDate: this.startDate };
    }

    /**
     * Called when the control is to be removed from the DOM tree. Controls should use this call for cleanup.
     * i.e. cancelling any pending remote calls, removing listeners, etc.
     */
    public destroy(): void {
        // Add code to cleanup control if necessary
    }
}
