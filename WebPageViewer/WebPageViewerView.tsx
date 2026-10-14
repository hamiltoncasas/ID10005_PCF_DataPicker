/**
 * Fecha: 2026-10-13
 * Descripcion: Vista React del visor de paginas web. Muestra la direccion
 * indicada dentro de un iframe, con barra de acciones opcional, aviso de carga
 * y ayuda cuando el sitio no permite mostrarse dentro de la aplicacion.
 */
import * as React from "react";

/** Propiedades visuales configurables del visor. */
export interface IViewerVisualProps {
    borderColor?: string;
    borderStyle?: string;
    borderThickness?: number;
    fill?: string;
}

/** Estilos del control; admite variables CSS propias ademas de las de React. */
export type ViewerStyles = React.CSSProperties & Record<string, string | number | undefined>;

/** Estilos listos para aplicar en cada parte del visor. */
export interface IViewerVisualStyles {
    box: ViewerStyles;
    toolbar: ViewerStyles;
    body: ViewerStyles;
}

export interface IWebPageViewerProps extends IViewerVisualProps {
    /** Direccion ya resuelta que se muestra en el iframe (vacia = sin pagina). */
    sourceUrl: string;
    /** Cambia cuando la aplicacion pide otra direccion o una recarga. */
    reloadToken: number;
    /** Etiqueta accesible de la region y del iframe. */
    title: string;
    /** Muestra la barra superior con la direccion y los botones. */
    showToolbar: boolean;
    /** Permite que la pagina entre en pantalla completa. */
    allowFullScreen: boolean;
    /** Valor del atributo sandbox; vacio = sin restricciones adicionales. */
    sandbox: string;
    /** Valor del atributo allow (permisos de caracteristicas del navegador). */
    allowFeatures: string;
    /** eager (predeterminado) o lazy. */
    loadingMode: string;
    /** Texto del aviso mientras carga la pagina. */
    loadingText: string;
    /** Ayuda que se muestra cuando la pagina no aparece a tiempo. */
    hintText: string;
    /** Texto que se muestra cuando no hay direccion configurada. */
    emptyText: string;
    /** Texto del boton que abre la pagina fuera de la aplicacion. */
    openButtonText: string;
    /** Texto del boton que vuelve a cargar la pagina. */
    reloadButtonText: string;
    /** Milisegundos antes de mostrar la ayuda; 0 desactiva el aviso. */
    loadTimeoutMs: number;
    /** Control deshabilitado desde la aplicacion. */
    disabled: boolean;
    /** Avisa cuando la pagina termino de cargar. */
    onLoaded: () => void;
    /** Avisa cuando la pagina no aparecio dentro del tiempo configurado. */
    onLoadTimeout: () => void;
    /** Abre la direccion fuera de la aplicacion (pestana nueva). */
    onOpenExternal: (url: string) => void;
}

/** Estado visible del iframe. */
type ViewerStatus = "loading" | "ready" | "timeout";

interface IWebPageViewerState {
    status: ViewerStatus;
    /** Recargas pedidas dentro del control (boton Recargar). */
    localReload: number;
}

/** Colores nombrados de Power Apps aceptados por las propiedades de color. */
const POWER_APPS_COLORS: Record<string, string> = {
    black: "#000000", blue: "#0b6cff", gray: "#808080", green: "#107c10", grey: "#808080", orange: "#f7630c",
    purple: "#886ce4", red: "#e81123", transparent: "transparent", white: "#ffffff", yellow: "#ffd800",
};

/** Estilos de borde admitidos por la propiedad de estilo del borde. */
const borderStyles = ["solid", "dashed", "dotted", "double", "none"];

/** Color CSS del valor configurado; acepta #hex, rgb(), nombres CSS y Color.X. */
function cssColor(value: string | undefined): string | undefined {
    const text = (value ?? "").trim();
    if (!text) return undefined;
    const named = /^Color\.([A-Za-z]+)$/.exec(text);
    if (named) return POWER_APPS_COLORS[named[1].toLowerCase()] ?? text;
    return text;
}

/** Estilo de borde CSS del valor configurado (BorderStyle.Solid, Dashed, ...). */
function cssBorderStyle(value: string | undefined): string | undefined {
    const text = (value ?? "").trim().toLowerCase().replace(/^borderstyle\./, "");
    return borderStyles.includes(text) ? text : undefined;
}

/** Estilos configurables del visor a partir de las propiedades visuales. */
export function viewerStyles(props: IViewerVisualProps): IViewerVisualStyles {
    const fill = cssColor(props.fill);
    const borderColor = cssColor(props.borderColor);
    const borderStyle = cssBorderStyle(props.borderStyle);
    const box: ViewerStyles = {};
    if (fill) box.background = fill;
    if (borderColor) box.borderColor = borderColor;
    if (borderStyle) box.borderStyle = borderStyle;
    if (props.borderThickness !== undefined && props.borderThickness >= 0) box.borderWidth = props.borderThickness;
    const toolbar: ViewerStyles = {};
    if (fill) toolbar.background = fill;
    const body: ViewerStyles = {};
    if (fill) body.background = fill;
    return { box, toolbar, body };
}

/** Esquema que se usa cuando la direccion o la URL base no indican ninguno. */
const DEFAULT_SCHEME = "https:";

/** Esquema de la URL base; https: cuando no se puede reconocer. */
function baseScheme(url: string): string {
    const match = /^([A-Za-z][A-Za-z0-9+.-]*:)/.exec(url.trim());
    return match ? match[1] : DEFAULT_SCHEME;
}

/** URL base con esquema: agrega https:// cuando la base no lo indica. */
function normalizeBaseUrl(baseUrl: string): string {
    const base = (baseUrl ?? "").trim();
    if (!base) return "";
    if (base.startsWith("//")) return `${DEFAULT_SCHEME}//${base.slice(2)}`;
    if (/^[A-Za-z][A-Za-z0-9+.-]*:\/\//.test(base)) return base;
    return `${DEFAULT_SCHEME}//${base}`;
}

/** Origen (esquema, host y puerto) de la URL base. */
function baseOrigin(url: string): string {
    const match = /^[A-Za-z][A-Za-z0-9+.-]*:\/\/[^/?#]*/.exec(url.trim());
    return match ? match[0] : url.trim();
}

/**
 * Direccion final del iframe: si la propiedad Url es una ruta relativa se
 * completa con la URL base (que se normaliza a https cuando no trae esquema);
 * si la Url ya trae esquema (https:, mailto:, ...) se usa tal cual, y si
 * empieza por // o / se completa solo con el origen de la base.
 */
export function resolveSourceUrl(url: string, baseUrl: string): string {
    const target = (url ?? "").trim();
    if (!target) return "";
    const base = normalizeBaseUrl(baseUrl);
    if (!base) return target;
    if (/^[A-Za-z][A-Za-z0-9+.-]*:/.test(target)) return target;
    if (target.startsWith("//")) return `${baseScheme(base)}${target}`;
    if (target.startsWith("/")) return `${baseOrigin(base)}${target}`;
    return `${base.endsWith("/") ? base : `${base}/`}${target}`;
}

/** Clave que identifica la pagina que debe verse en el iframe. */
function externalFrameKey(props: IWebPageViewerProps): string {
    return `${props.reloadToken}::${props.sourceUrl}`;
}

export class WebPageViewerView extends React.Component<IWebPageViewerProps, IWebPageViewerState> {
    private timer: number | undefined;

    public constructor(props: IWebPageViewerProps) {
        super(props);
        this.state = { status: "loading", localReload: 0 };
    }

    public componentDidMount(): void {
        this.startTimer();
    }

    public componentDidUpdate(prevProps: IWebPageViewerProps): void {
        if (externalFrameKey(prevProps) !== externalFrameKey(this.props)) {
            this.beginLoad();
        }
    }

    public componentWillUnmount(): void {
        this.stopTimer();
    }

    /** Inicia la cuenta atras del aviso; 0 desactiva el aviso. */
    private startTimer(): void {
        this.stopTimer();
        const timeout = this.props.loadTimeoutMs;
        if (!this.props.sourceUrl || !(timeout > 0)) return;
        this.timer = window.setTimeout(this.handleTimeout, timeout);
    }

    private stopTimer(): void {
        if (this.timer !== undefined) {
            window.clearTimeout(this.timer);
            this.timer = undefined;
        }
    }

    /** Vuelve al estado de carga; lo usan una direccion nueva y el boton Recargar. */
    private beginLoad(): void {
        this.stopTimer();
        if (this.state.status !== "loading") this.setState({ status: "loading" });
        this.startTimer();
    }

    private handleTimeout = (): void => {
        this.timer = undefined;
        if (this.state.status === "loading") {
            this.setState({ status: "timeout" });
            this.props.onLoadTimeout();
        }
    };

    private handleFrameLoad = (): void => {
        this.stopTimer();
        if (this.state.status !== "ready") this.setState({ status: "ready" });
        this.props.onLoaded();
    };

    private handleReload = (): void => {
        this.beginLoad();
        this.setState({ localReload: this.state.localReload + 1 });
    };

    private handleOpenExternal = (): void => {
        if (this.props.sourceUrl) this.props.onOpenExternal(this.props.sourceUrl);
    };

    public render(): React.ReactElement {
        const styles = viewerStyles(this.props);
        const hasUrl = this.props.sourceUrl !== "";
        const loading = this.props.loadingMode.trim().toLowerCase() === "lazy" ? "lazy" : "eager";
        const className = this.props.disabled ? "wpv-root is-disabled" : "wpv-root";
        return (
            <section className={className} style={styles.box} aria-label={this.props.title}>
                {this.props.showToolbar ? this.renderToolbar(hasUrl, styles) : null}
                <div className="wpv-body" style={styles.body}>
                    {hasUrl ? (
                        <iframe
                            key={`${externalFrameKey(this.props)}::${this.state.localReload}`}
                            className={this.props.disabled ? "wpv-frame is-disabled" : "wpv-frame"}
                            src={this.props.sourceUrl}
                            title={this.props.title}
                            allow={this.props.allowFeatures || undefined}
                            allowFullScreen={this.props.allowFullScreen}
                            loading={loading}
                            sandbox={this.props.sandbox || undefined}
                            onLoad={this.handleFrameLoad}
                        />
                    ) : null}
                    {!hasUrl ? this.renderEmpty() : null}
                    {hasUrl && this.state.status === "loading" ? this.renderLoading() : null}
                    {hasUrl && this.state.status === "timeout" ? this.renderHint() : null}
                </div>
            </section>
        );
    }

    /** Barra superior con la direccion y los botones de recargar y abrir fuera. */
    private renderToolbar(hasUrl: boolean, styles: IViewerVisualStyles): React.ReactElement {
        const canUse = hasUrl && !this.props.disabled;
        return (
            <div className="wpv-toolbar" style={styles.toolbar}>
                <span className="wpv-dot" aria-hidden="true" />
                <span className="wpv-url" title={this.props.sourceUrl}>{hasUrl ? this.props.sourceUrl : this.props.emptyText}</span>
                <div className="wpv-actions">
                    <button type="button" className="wpv-button" onClick={this.handleReload} disabled={!canUse} aria-label={this.props.reloadButtonText} title={this.props.reloadButtonText}><span className="wpv-button-icon" aria-hidden="true">&#8635;</span>{this.props.reloadButtonText}</button>
                    <button type="button" className="wpv-button" onClick={this.handleOpenExternal} disabled={!canUse} aria-label={this.props.openButtonText} title={this.props.openButtonText}><span className="wpv-button-icon" aria-hidden="true">&#8599;</span>{this.props.openButtonText}</button>
                </div>
            </div>
        );
    }

    /** Mensaje cuando no hay ninguna direccion configurada. */
    private renderEmpty(): React.ReactElement {
        return (
            <div className="wpv-overlay">
                <p className="wpv-message">{this.props.emptyText}</p>
            </div>
        );
    }

    /** Aviso de carga mientras el iframe termina de traer la pagina. */
    private renderLoading(): React.ReactElement {
        return (
            <div className="wpv-overlay">
                <span className="wpv-spinner" aria-hidden="true" />
                <p className="wpv-message">{this.props.loadingText}</p>
            </div>
        );
    }

    /** Ayuda cuando la pagina no aparece, con salida directa a una pestana nueva. */
    private renderHint(): React.ReactElement {
        return (
            <div className="wpv-overlay wpv-overlay-hint">
                <div className="wpv-hint">
                    <span className="wpv-kicker">AVISO</span>
                    <p className="wpv-message">{this.props.hintText}</p>
                    <button type="button" className="wpv-button" onClick={this.handleOpenExternal} disabled={this.props.disabled}>{this.props.openButtonText}</button>
                </div>
            </div>
        );
    }
}
