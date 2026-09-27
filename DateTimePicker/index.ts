/**
 * Fecha: 2026-09-16
 * Descripcion: Adaptador PCF del selector de fecha y hora simple. Conecta el
 * ciclo de vida de Power Apps con la vista React del calendario y la hora.
 */
import { IInputs, IOutputs } from "./generated/ManifestTypes";
import { DateTimePickerView, IDateTimePickerProps } from "./DateTimePickerView";
import * as React from "react";

export class DateTimePicker implements ComponentFramework.ReactControl<IInputs, IOutputs> {
    private notifyOutputChanged: () => void;
    private dateTime = "";
    private lastInputDateTime = "";
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
        const configuredInitial = context.parameters.initialDateTime?.raw ?? "";
        const inputDateTime = inputDefault.trim() ? inputDefault : configuredInitial;
        const resetKey = context.parameters.resetKey?.raw ?? false;

        if (resetKey !== this.lastResetKey) {
            this.dateTime = "";
            this.lastInputDateTime = inputDateTime;
            this.lastResetKey = resetKey;
        } else if (inputDateTime !== this.lastInputDateTime) {
            this.dateTime = inputDateTime;
            this.lastInputDateTime = inputDateTime;
        }

        const props: IDateTimePickerProps = {
            dateTime: this.dateTime,
            dateFormat: String(context.parameters.format?.raw ?? "YYYY-MM-DD"),
            timeFormat: String(context.parameters.timeFormat?.raw ?? "24"),
            zIndex: context.parameters.zIndex.raw ?? 2147483647,
            disabled: context.mode.isControlDisabled,
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
            onDateTimeChange: (dateTime) => {
                this.dateTime = dateTime;
                this.notifyOutputChanged();
            },
        };
        return React.createElement(
            DateTimePickerView, props
        );
    }

    /**
     * It is called by the framework prior to a control receiving new data.
     * @returns an object based on nomenclature defined in manifest, expecting object[s] for property marked as "bound" or "output"
     */
    public getOutputs(): IOutputs {
        return {
            dateTime: this.dateTime,
            date: this.dateTime ? this.dateTime.slice(0, 10) : "",
            time: this.dateTime ? this.dateTime.slice(11, 16) : "",
            selectedDate: this.dateTime,
        };
    }

    /**
     * Called when the control is to be removed from the DOM tree. Controls should use this call for cleanup.
     * i.e. cancelling any pending remote calls, removing listeners, etc.
     */
    public destroy(): void {
        // Add code to cleanup control if necessary
    }
}
