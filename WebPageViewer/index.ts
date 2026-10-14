/**
 * Fecha: 2026-10-13
 * Descripcion: Adaptador PCF del visor de paginas web. Resuelve la direccion,
 * encadena la propiedad de recarga y publica la direccion mostrada y el estado
 * de carga de la pagina.
 */
import { IInputs, IOutputs } from "./generated/ManifestTypes";
import { IWebPageViewerProps, WebPageViewerView, resolveSourceUrl } from "./WebPageViewerView";
import * as React from "react";

/** Milisegundos que se espera la pagina antes de mostrar la ayuda. */
const DEFAULT_LOAD_TIMEOUT_MS = 12000;
const DEFAULT_TITLE = "Visor de pagina web";
const DEFAULT_LOADING_TEXT = "Cargando la pagina...";
const DEFAULT_HINT_TEXT = "La pagina no aparecio. Es posible que el sitio no permita mostrarse dentro de la aplicacion: abre el visor en una pestana nueva para verla completa.";
const DEFAULT_EMPTY_TEXT = "No se ha indicado ninguna pagina. Escribe la direccion en la propiedad Url.";
const DEFAULT_OPEN_TEXT = "Abrir en pestana nueva";
const DEFAULT_RELOAD_TEXT = "Recargar";

/** Texto configurado o el valor predeterminado cuando llega vacio. */
function textValue(value: string | null | undefined, fallback: string): string {
    const text = (value ?? "").trim();
    return text === "" ? fallback : text;
}

export class WebPageViewer implements ComponentFramework.ReactControl<IInputs, IOutputs> {
    private notifyOutputChanged: () => void;
    private context: ComponentFramework.Context<IInputs>;
    private sourceUrl = "";
    private reloadToken = 0;
    private isLoading = false;
    private hasError = false;
    private hintText = DEFAULT_HINT_TEXT;
    private lastSourceUrl = "";
    private lastReloadKey = false;

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
        this.context = context;
        const configuredUrl = String(context.parameters.url?.raw ?? "");
        const baseUrl = String(context.parameters.baseUrl?.raw ?? "");
        const resolvedUrl = resolveSourceUrl(configuredUrl, baseUrl);
        const reloadKey = context.parameters.reloadKey?.raw ?? false;
        this.hintText = textValue(context.parameters.hintText?.raw, DEFAULT_HINT_TEXT);

        // Cada direccion nueva y cada cambio de la propiedad de recarga generan
        // un token distinto: la vista lo usa como clave del iframe.
        if (resolvedUrl !== this.lastSourceUrl) {
            this.lastSourceUrl = resolvedUrl;
            this.sourceUrl = resolvedUrl;
            this.reloadToken += 1;
            this.isLoading = resolvedUrl !== "";
            this.hasError = false;
        }
        if (reloadKey !== this.lastReloadKey) {
            this.lastReloadKey = reloadKey;
            this.reloadToken += 1;
            this.isLoading = this.sourceUrl !== "";
            this.hasError = false;
        }

        const props: IWebPageViewerProps = {
            sourceUrl: this.sourceUrl,
            reloadToken: this.reloadToken,
            title: textValue(context.parameters.accessibleLabel?.raw, DEFAULT_TITLE),
            showToolbar: context.parameters.showToolbar?.raw ?? true,
            allowFullScreen: context.parameters.allowFullScreen?.raw ?? false,
            sandbox: String(context.parameters.sandbox?.raw ?? ""),
            allowFeatures: String(context.parameters.allowFeatures?.raw ?? ""),
            loadingMode: String(context.parameters.loadingMode?.raw ?? ""),
            loadingText: textValue(context.parameters.loadingText?.raw, DEFAULT_LOADING_TEXT),
            hintText: this.hintText,
            emptyText: textValue(context.parameters.emptyText?.raw, DEFAULT_EMPTY_TEXT),
            openButtonText: textValue(context.parameters.openButtonText?.raw, DEFAULT_OPEN_TEXT),
            reloadButtonText: textValue(context.parameters.reloadButtonText?.raw, DEFAULT_RELOAD_TEXT),
            loadTimeoutMs: context.parameters.loadTimeoutMs?.raw ?? DEFAULT_LOAD_TIMEOUT_MS,
            disabled: context.mode.isControlDisabled,
            borderColor: context.parameters.borderColor?.raw ?? undefined,
            borderStyle: context.parameters.borderStyle?.raw ?? undefined,
            borderThickness: context.parameters.borderThickness?.raw ?? undefined,
            fill: context.parameters.fill?.raw ?? undefined,
            onLoaded: () => {
                if (!this.isLoading && !this.hasError) return;
                this.isLoading = false;
                this.hasError = false;
                this.notifyOutputChanged();
            },
            onLoadTimeout: () => {
                this.isLoading = false;
                this.hasError = true;
                this.notifyOutputChanged();
            },
            onOpenExternal: (target: string) => {
                if (!target) return;
                try {
                    this.context.navigation.openUrl(target);
                } catch {
                    // El host puede no permitir abrir direcciones externas.
                }
            },
        };
        return React.createElement(
            WebPageViewerView, props
        );
    }

    /**
     * It is called by the framework prior to a control receiving new data.
     * @returns an object based on nomenclature defined in manifest, expecting object[s] for property marked as "bound" or "output"
     */
    public getOutputs(): IOutputs {
        return {
            currentUrl: this.sourceUrl,
            isLoading: this.isLoading,
            hasError: this.hasError,
            errorMessage: this.hasError ? this.hintText : "",
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
