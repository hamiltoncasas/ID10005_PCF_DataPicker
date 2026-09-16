/**
 * Fecha: 2026-09-12
 * Descripcion: Adaptador PCF del selector de rango con fecha y hora.
 */
import { IInputs, IOutputs } from "./generated/ManifestTypes";
import { DateTimeRangePickerView, IDateTimeRangePickerProps } from "./DateTimeRangePickerView";
import * as React from "react";

export class DateTimeRangePicker implements ComponentFramework.ReactControl<IInputs, IOutputs> {
    private notifyOutputChanged: () => void;
    private startDateTime = "";
    private endDateTime = "";

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
        const inputStart = context.parameters.initialStartDateTime?.raw ?? "";
        const inputEnd = context.parameters.initialEndDateTime?.raw ?? "";

        if (inputStart === "" && inputEnd === "") {
            this.startDateTime = "";
            this.endDateTime = "";
        } else if (this.startDateTime !== inputStart || this.endDateTime !== inputEnd) {
            this.startDateTime = inputStart;
            this.endDateTime = inputEnd;
        }

        const props: IDateTimeRangePickerProps = {
            startDateTime: this.startDateTime,
            endDateTime: this.endDateTime,
            dateFormat: String(context.parameters.format?.raw ?? "YYYY-MM-DD"),
            timeFormat: String(context.parameters.timeFormat?.raw ?? "24"),
            zIndex: context.parameters.zIndex.raw ?? 2147483647,
            disabled: context.mode.isControlDisabled,
            onRangeChange: (startDateTime, endDateTime) => {
                this.startDateTime = startDateTime;
                this.endDateTime = endDateTime;
                this.notifyOutputChanged();
            },
        };
        return React.createElement(
            DateTimeRangePickerView, props
        );
    }

    /**
     * It is called by the framework prior to a control receiving new data.
     * @returns an object based on nomenclature defined in manifest, expecting object[s] for property marked as "bound" or "output"
     */
    public getOutputs(): IOutputs {
        return { startDateTime: this.startDateTime, endDateTime: this.endDateTime };
    }

    /**
     * Called when the control is to be removed from the DOM tree. Controls should use this call for cleanup.
     * i.e. cancelling any pending remote calls, removing listeners, etc.
     */
    public destroy(): void {
        // Add code to cleanup control if necessary
    }
}
