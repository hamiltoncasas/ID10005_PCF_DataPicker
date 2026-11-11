/*
 * Fecha: 2026-11-10
 * Descripcion: Arnes de verificacion de la logica de los controles.
 * Comprueba el parseo y formato de fechas, el filtro tipo contiene, la
 * normalizacion de acentos, el comportamiento del selector de hora y las
 * propiedades del selector de fecha y hora nativo (modo de presentacion,
 * prioridad de la fecha inicial, tamano, relleno, colores y eventos), todo
 * sin abrir un navegador.
 *
 * Uso (desde la raiz del repositorio):
 *   npx tsc DatePicker/DatePickerView.tsx DateTimePicker/DateTimePickerView.tsx SearchableComboBox/SearchableComboBoxView.tsx TimePicker/TimePickerView.tsx --outDir obj/checks --module commonjs --target es2019 --jsx react --esModuleInterop --lib ES2020,DOM --strict --skipLibCheck
 *   node tools/verificar-controles.js
 *
 * Salida esperada: "112 de 112 verificaciones correctas" y codigo de salida 0.
 */
const path = require("path");

const checksDir = path.join(__dirname, "..", "obj", "checks");
const { DatePickerView, monthLabels, visualStyles, weekdayLabels } = require(path.join(checksDir, "DatePicker", "DatePickerView"));
const { DateTimePickerView, resolveDisplayMode, resolveInitialDateTime, visualStyles: dateTimeStyles, cssPixels } = require(path.join(checksDir, "DateTimePicker", "DateTimePickerView"));
const { SearchableComboBoxView, normalizeForSearch } = require(path.join(checksDir, "SearchableComboBox", "SearchableComboBoxView"));
const timePicker = require(path.join(checksDir, "TimePicker", "TimePickerView"));

let failures = 0;
let total = 0;

function check(name, actual, expected) {
    total += 1;
    const ok = JSON.stringify(actual) === JSON.stringify(expected);
    if (!ok) {
        failures += 1;
        console.log("FAIL " + name + " -> " + JSON.stringify(actual) + " esperado " + JSON.stringify(expected));
    } else {
        console.log("ok   " + name);
    }
}

function ymd(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

/* Emula el setState de React para poder verificar metodos que dependen del estado. */
function mount(view) {
    view.setState = (partial) => {
        const next = typeof partial === "function" ? partial(view.state) : partial;
        view.state = Object.assign({}, view.state, next);
    };
    return view;
}

function highlightSample(label, query) {
    const needle = normalizeForSearch(query.trim());
    const index = normalizeForSearch(label).indexOf(needle);
    return [label.slice(0, index), label.slice(index, index + needle.length)];
}

const samples = {
    "YYYY-MM-DD": ["2026-09-12", "2026-09-15"],
    "YYYY/MM/DD": ["2026/09/12", "2026/09/15"],
    "YYYY.MM.DD": ["2026.09.12", "2026.09.15"],
    "YYYYMMDD": ["20260912", "20260915"],
    "DD/MM/YYYY": ["12/09/2026", "15/09/2026"],
    "MM/DD/YYYY": ["09/12/2026", "09/15/2026"],
    "DD-MM-YYYY": ["12-09-2026", "15-09-2026"],
    "MM-DD-YYYY": ["09-12-2026", "09-15-2026"],
    "DD.MM.YYYY": ["12.09.2026", "15.09.2026"],
    "MM.DD.YYYY": ["09.12.2026", "09.15.2026"],
    "DDMMYYYY": ["12092026", "15092026"],
    "MMDDYYYY": ["09122026", "09152026"],
};

let datePickerChanges = [];
Object.keys(samples).forEach((format) => {
    const [initial, expectedSelection] = samples[format];
    const view = mount(new DatePickerView({ date: initial, dateFormat: format, zIndex: 1, disabled: false, onDateChange: (value) => datePickerChanges.push(value) }));
    check(`DatePicker parse ${format}`, ymd(view.state.visibleMonth), "2026-09-12");
    view.selectDate(new Date(2026, 8, 15));
    check(`DatePicker salida ${format}`, datePickerChanges.pop(), expectedSelection);
});

const emptyView = mount(new DatePickerView({ date: "", dateFormat: "YYYY-MM-DD", zIndex: 1, disabled: false, onDateChange: () => undefined }));
check("DatePicker sin valor usa el mes actual", ymd(emptyView.state.visibleMonth), ymd(new Date()));
const invalidView = mount(new DatePickerView({ date: "32/13/2026", dateFormat: "DD/MM/YYYY", zIndex: 1, disabled: false, onDateChange: () => undefined }));
check("DatePicker valor invalido no rompe", typeof invalidView.state.visibleMonth.getFullYear(), "number");

let dateTimeChanges = [];
const dateTimeView = mount(new DateTimePickerView({ dateTime: "2026-09-16T08:30", dateFormat: "YYYY-MM-DD", timeFormat: "24", zIndex: 1, disabled: false, onDateTimeChange: (value) => dateTimeChanges.push(value) }));
check("DateTimePicker hora inicial", dateTimeView.state.time, "08:30");
dateTimeView.updateTime("10:45");
check("DateTimePicker cambia hora", dateTimeChanges.pop(), "2026-09-16T10:45");
check("DateTimePicker conserva la hora elegida", dateTimeView.state.time, "10:45");
dateTimeView.updateDateInput("2026-09-20");
check("DateTimePicker cambia fecha", dateTimeChanges.pop(), "2026-09-20T10:45");
dateTimeView.selectDate(new Date(2026, 8, 25));
check("DateTimePicker selecciona dia", dateTimeChanges.pop(), "2026-09-25T10:45");
check("DateTimePicker cierra al elegir dia", dateTimeView.state.isOpen, false);

const emptyDateTime = mount(new DateTimePickerView({ dateTime: "", dateFormat: "YYYY-MM-DD", timeFormat: "24", zIndex: 1, disabled: false, onDateTimeChange: (value) => dateTimeChanges.push(value) }));
check("DateTimePicker hora por defecto alineada a 15 minutos", /^\d{2}:(00|15|30|45)$/.test(emptyDateTime.state.time), true);
emptyDateTime.updateTime("07:15");
check("DateTimePicker sin fecha no publica valor", dateTimeChanges.length, 0);
emptyDateTime.selectDate(new Date(2026, 8, 16));
check("DateTimePicker sin fecha publica al elegir dia", dateTimeChanges.pop(), "2026-09-16T07:15");
emptyDateTime.updateDateInput("");
check("DateTimePicker fecha vacia limpia valor", dateTimeChanges.pop(), "");

const invalidDateTime = mount(new DateTimePickerView({ dateTime: "no-es-fecha", dateFormat: "YYYY-MM-DD", timeFormat: "24", zIndex: 1, disabled: false, onDateTimeChange: (value) => dateTimeChanges.push(value) }));
check("DateTimePicker valor invalido no rompe", typeof invalidDateTime.state.time, "string");
invalidDateTime.selectDate(new Date(2026, 8, 16));
check("DateTimePicker valor invalido permite elegir", dateTimeChanges.pop(), "2026-09-16T" + invalidDateTime.state.time);

/* Propiedades del selector nativo: modo de presentacion, valor inicial, disposicion y colores. */
check("DateTimePicker DisplayMode nativo", ["Edit", "View", "DisplayMode.View", "Disabled", "Vista", "Deshabilitado", "otro", ""].map(resolveDisplayMode), ["edit", "view", "view", "disabled", "view", "disabled", "edit", "edit"]);
check("DateTimePicker prioridad de la fecha inicial", [
    resolveInitialDateTime("2026-09-16T08:30", "2026-10-01T09:00", "2026-11-10T07:15"),
    resolveInitialDateTime("2026-09-16T08:30", "2026-10-01T09:00", ""),
    resolveInitialDateTime("2026-09-16T08:30", "  ", ""),
    resolveInitialDateTime("", "", ""),
], ["2026-11-10T07:15", "2026-10-01T09:00", "2026-09-16T08:30", ""]);
check("DateTimePicker pixeles de las propiedades de disposicion", [cssPixels(0), cssPixels(12), cssPixels(-4), cssPixels(undefined), cssPixels(Number.NaN)], [0, 12, null, null, null]);

const layoutStyles = dateTimeStyles({ height: 40, width: 320, layoutMinHeight: 36, layoutMinWidth: 240, paddingTop: 4, paddingRight: 6, paddingBottom: 2, paddingLeft: 8, x: 10, y: undefined, focusedBorderColor: "Color.Blue", focusedBorderThickness: 3 });
check("DateTimePicker tamano, relleno y desplazamiento", layoutStyles.box, { height: 40, width: 320, minHeight: 36, minWidth: 240, paddingTop: 4, paddingRight: 6, paddingBottom: 2, paddingLeft: 8, transform: "translate(10px, 0px)", "--dtp-focus-border": "#0b6cff", "--dtp-focus-width": "3px" });
check("DateTimePicker fondo de la cabecera del calendario", dateTimeStyles({ calendarHeaderFill: "#f3eadc" }).calendarHeader, { background: "#f3eadc", padding: 4, margin: "-4px -4px 10px", borderRadius: 10 });

const disabledStyles = dateTimeStyles({ fill: "#ffffff", color: "#111111", borderColor: "#222222", iconBackground: "#333333", disabledFill: "#eeeeee", disabledColor: "#999999", disabledBorderColor: "#cccccc" }, true);
check("DateTimePicker colores deshabilitados", [disabledStyles.box.background, disabledStyles.box.borderColor, disabledStyles.input.color, disabledStyles.icon.background], ["#eeeeee", "#cccccc", "#999999", "#eeeeee"]);
const enabledStyles = dateTimeStyles({ fill: "#ffffff", color: "#111111", borderColor: "#222222", disabledFill: "#eeeeee", disabledColor: "#999999" });
check("DateTimePicker colores normales sin deshabilitar", [enabledStyles.box.background, enabledStyles.box.borderColor, enabledStyles.input.color], ["#ffffff", "#222222", "#111111"]);

const editModeView = mount(new DateTimePickerView({ dateTime: "2026-09-16T08:30", dateFormat: "YYYY-MM-DD", timeFormat: "24", zIndex: 1, disabled: false, displayMode: "Edit", onDateTimeChange: () => undefined }));
check("DateTimePicker Edit permite editar", [editModeView.isBlocked(), editModeView.usesDisabledPalette()], [false, false]);
const viewModeView = mount(new DateTimePickerView({ dateTime: "2026-09-16T08:30", dateFormat: "YYYY-MM-DD", timeFormat: "24", zIndex: 1, disabled: false, displayMode: "View", onDateTimeChange: () => undefined }));
check("DateTimePicker View bloquea la edicion sin paleta gris", [viewModeView.isBlocked(), viewModeView.usesDisabledPalette()], [true, false]);
const disabledModeView = mount(new DateTimePickerView({ dateTime: "2026-09-16T08:30", dateFormat: "YYYY-MM-DD", timeFormat: "24", zIndex: 1, disabled: false, displayMode: "Disabled", onDateTimeChange: () => undefined }));
check("DateTimePicker Disabled bloquea con paleta gris", [disabledModeView.isBlocked(), disabledModeView.usesDisabledPalette()], [true, true]);

let selectEvents = 0;
const openView = mount(new DateTimePickerView({ dateTime: "2026-09-16T08:30", dateFormat: "YYYY-MM-DD", timeFormat: "24", zIndex: 1, disabled: false, onDateTimeChange: () => undefined, onSelect: () => { selectEvents += 1; } }));
openView.compactInput = { current: { getBoundingClientRect: () => ({ bottom: 40, left: 12, width: 300 }) } };
openView.openPicker();
check("DateTimePicker abre el panel y avisa OnSelect", [openView.state.isOpen, selectEvents], [true, 1]);
let blockedEvents = 0;
const viewOpenView = mount(new DateTimePickerView({ dateTime: "2026-09-16T08:30", dateFormat: "YYYY-MM-DD", timeFormat: "24", zIndex: 1, disabled: false, displayMode: "View", onDateTimeChange: () => undefined, onSelect: () => { blockedEvents += 1; } }));
viewOpenView.compactInput = { current: { getBoundingClientRect: () => ({ bottom: 40, left: 12, width: 300 }) } };
viewOpenView.openPicker();
check("DateTimePicker View no abre el panel ni avisa OnSelect", [viewOpenView.state.isOpen, blockedEvents], [false, 0]);

check("normalizeForSearch acentos y mayusculas", normalizeForSearch("  CÓDIGO Ándrés_Ü "), "  codigo andres_u ");

const options = [
    { key: "1", value: "BOG", label: "Bogotá Norte", description: "Zona 1", searchText: normalizeForSearch("BOG Bogotá Norte Zona 1") },
    { key: "2", value: "MED", label: "Medellín Centro", description: "Zona 2", searchText: normalizeForSearch("MED Medellín Centro Zona 2") },
    { key: "3", value: "CAL", label: "Cali Sur", description: "Zona 3", searchText: normalizeForSearch("CAL Cali Sur Zona 3") },
];

let comboChanges = [];
const combo = mount(new SearchableComboBoxView({ options, selectedValues: [], selectMultiple: false, isSearchable: true, noSelectionText: "---", placeholderText: "Buscar...", zIndex: 1, disabled: false, onChange: (values) => comboChanges.push(values) }));
combo.state.searchText = "ota";
check("combobox contiene en medio del texto sin acentos", combo.getFilteredOptions().map((option) => option.value), ["BOG"]);
combo.state.searchText = "ZONA 2";
check("combobox contiene en otro campo", combo.getFilteredOptions().map((option) => option.value), ["MED"]);
combo.state.searchText = "zzz";
check("combobox sin coincidencias", combo.getFilteredOptions().length, 0);
combo.state.searchText = "";
check("combobox sin texto devuelve todo", combo.getFilteredOptions().length, 3);
combo.toggleOption("CAL");
check("combobox seleccion unica publica el valor", comboChanges.pop(), ["CAL"]);
check("combobox isSelected", combo.isSelected("CAL"), false);
check("combobox resaltado con texto parcial", highlightSample("Cali Sur", "sur"), ["Cali ", "Sur"]);

const comboMulti = mount(new SearchableComboBoxView({ options, selectedValues: ["MED"], selectMultiple: true, isSearchable: true, noSelectionText: "---", placeholderText: "Buscar...", zIndex: 1, disabled: false, onChange: (values) => comboChanges.push(values) }));
comboMulti.toggleOption("CAL");
check("combobox seleccion multiple agrega", comboChanges.pop(), ["MED", "CAL"]);
check("combobox isSelected multi", comboMulti.isSelected("MED"), true);
comboMulti.removeTag("MED");
check("combobox quita etiqueta", comboChanges.pop(), []);
comboMulti.state.searchText = "";
comboMulti.moveActive(1);
check("combobox activo avanza", comboMulti.state.activeIndex, 0);
comboMulti.moveActive(-1);
check("combobox activo cicla al final", comboMulti.state.activeIndex, 2);
comboMulti.moveActive(1);
check("combobox activo vuelve al inicio", comboMulti.state.activeIndex, 0);

const comboEmpty = mount(new SearchableComboBoxView({ options: [], selectedValues: [], selectMultiple: false, isSearchable: true, noSelectionText: "---", placeholderText: "Buscar...", zIndex: 1, disabled: false, onChange: (values) => comboChanges.push(values) }));
comboEmpty.state.searchText = "x";
check("combobox sin registros", comboEmpty.getFilteredOptions().length, 0);
comboEmpty.moveActive(1);
check("combobox sin registros no activa", comboEmpty.state.activeIndex, -1);

/* Propiedades nuevas: zona horaria, idioma y estilos del selector nativo. */
const zonedSample = "2026-09-16T23:30:00-05:00";
let zonedChanges = [];
const utcView = mount(new DatePickerView({ date: zonedSample, dateFormat: "YYYY-MM-DD", dateTimeZone: "Utc", zIndex: 1, disabled: false, onDateChange: (value) => zonedChanges.push(value) }));
check("DatePicker Utc convierte el dia", ymd(utcView.state.visibleMonth), "2026-09-17");
utcView.selectDate(new Date(2026, 8, 17));
check("DatePicker Utc publica el instante UTC", zonedChanges.pop(), "2026-09-17T00:00:00Z");

const localZoneView = mount(new DatePickerView({ date: zonedSample, dateFormat: "YYYY-MM-DD", dateTimeZone: "Local", zIndex: 1, disabled: false, onDateChange: (value) => zonedChanges.push(value) }));
check("DatePicker Local lee las componentes escritas", ymd(localZoneView.state.visibleMonth), "2026-09-16");
localZoneView.selectDate(new Date(2026, 8, 16));
check("DatePicker Local usa el formato configurado", zonedChanges.pop(), "2026-09-16");

const utcDateTimeView = mount(new DateTimePickerView({ dateTime: zonedSample, dateFormat: "YYYY-MM-DD", timeFormat: "24", dateTimeZone: "Utc", zIndex: 1, disabled: false, onDateTimeChange: (value) => dateTimeChanges.push(value) }));
check("DateTimePicker Utc convierte la hora", utcDateTimeView.state.time, "04:30");
utcDateTimeView.selectDate(new Date(2026, 8, 17));
check("DateTimePicker Utc publica el instante UTC", dateTimeChanges.pop(), "2026-09-17T04:30Z");

check("etiquetas de dias sin idioma", weekdayLabels(1), ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]);
check("etiquetas de dias en ingles", weekdayLabels(1, "en-US"), ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]);
check("nombres de meses en ingles", monthLabels("en-US")[8], "September");
check("idioma invalido usa los nombres predeterminados", monthLabels("idioma-inexistente")[0], "enero");

const styles = visualStyles({ fill: "#101010", color: "#ff0000", font: "Arial", size: 15, fontWeight: "Bold", italic: true, strikethrough: true, underline: true, borderColor: "Color.Red", borderStyle: "BorderStyle.Dashed", borderThickness: 2, iconBackground: "#123456", iconFill: "Color.White", chevronBackground: "#abcdef", chevronFill: "Color.Blue" });
check("estilo de la caja de texto", styles.box, { background: "#101010", borderColor: "#e81123", borderStyle: "dashed", borderWidth: 2 });
check("estilo del texto", styles.input, { background: "#101010", color: "#ff0000", fontFamily: "Arial", fontSize: 15, fontWeight: 700, fontStyle: "italic", textDecoration: "underline line-through" });
check("estilo del boton del icono", styles.icon, { background: "#123456" });
check("estilo del dibujo del icono", styles.iconGlyph, { borderColor: "#ffffff", "--pcf-icon-fill": "#ffffff" });
check("estilo de las flechas del calendario", styles.chevron, { background: "#abcdef", color: "#0b6cff" });
const emptyStyles = visualStyles({});
check("sin propiedades visuales el diseno no cambia", [emptyStyles.box, emptyStyles.input, emptyStyles.icon, emptyStyles.iconGlyph, emptyStyles.chevron], [{}, {}, {}, {}, {}]);

/* Selector de hora: parseo, formato, rangos y publicacion de la hora tecnica. */
const timeSamples = ["08:30", "8:30", "08:30:45", "8:30 p. m.", "12:00 AM", "12:00 PM", "2026-11-10T08:30:00-05:00"];
check("TimePicker parsea horas habituales", timeSamples.map((value) => timePicker.parseTimeOfDay(value)), [
    { hour: 8, minute: 30, second: 0 }, { hour: 8, minute: 30, second: 0 }, { hour: 8, minute: 30, second: 45 },
    { hour: 20, minute: 30, second: 0 }, { hour: 0, minute: 0, second: 0 }, { hour: 12, minute: 0, second: 0 },
    { hour: 8, minute: 30, second: 0 },
]);
check("TimePicker rechaza valores invalidos", ["", "25:00", "12:60", "abc", "13:00 PM", "2026-11-10"].map((value) => timePicker.parseTimeOfDay(value)), [null, null, null, null, null, null]);
check("TimePicker publica HH:mm:ss", timePicker.toTechnical({ hour: 0, minute: 5, second: 9 }), "00:05:09");

check("TimePicker formato 24 horas", timePicker.formatTime({ hour: 13, minute: 5, second: 9 }, "", true, true), "13:05:09");
check("TimePicker formato 12 horas por defecto", timePicker.formatTime({ hour: 13, minute: 5, second: 9 }, "", false, false), "01:05 PM");
check("TimePicker formato 12 horas con segundos", timePicker.formatTime({ hour: 13, minute: 5, second: 9 }, "", false, true), "01:05:09 PM");
check("TimePicker patron personalizado", [timePicker.formatTime({ hour: 13, minute: 5, second: 9 }, "HH:mm:ss", true, false), timePicker.formatTime({ hour: 13, minute: 5, second: 9 }, "h:mm A", true, false), timePicker.formatTime({ hour: 13, minute: 5, second: 9 }, "hh:mm a", true, false)], ["13:05:09", "1:05 PM", "01:05 pm"]);
check("TimePicker patron sin tokens usa el formato automatico", timePicker.formatTime({ hour: 8, minute: 5, second: 9 }, "sin tokens", true, false), "08:05");
check("TimePicker respeta el texto literal del patron", timePicker.formatTime({ hour: 13, minute: 5, second: 9 }, "Hora HH:mm", true, false), "Hora 13:05");

check("TimePicker rango normal", [timePicker.isHourInRange(10, 8, 17), timePicker.isHourInRange(18, 8, 17)], [true, false]);
check("TimePicker rango que cruza la medianoche", [timePicker.isHourInRange(23, 22, 6), timePicker.isHourInRange(12, 22, 6)], [true, false]);
check("TimePicker rango de una sola hora", [timePicker.isHourInRange(8, 8, 8), timePicker.isHourInRange(9, 8, 8)], [true, false]);
check("TimePicker horas del rango", timePicker.buildHourOptions(22, 2), [0, 1, 2, 22, 23]);
check("TimePicker conserva una hora fuera del rango", timePicker.buildHourOptions(8, 17, 4), [4, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17]);
check("TimePicker minutos por intervalo", timePicker.buildMinuteOptions(15), [0, 15, 30, 45]);
check("TimePicker conserva un minuto fuera del intervalo", timePicker.buildMinuteOptions(15, 7), [0, 7, 15, 30, 45]);
check("TimePicker intervalo fuera de rango se normaliza", [timePicker.normalizeInterval(0), timePicker.normalizeInterval(120), timePicker.normalizeInterval(undefined)], [1, 60, 1]);
check("TimePicker equivalencias 12 y 24 horas", [timePicker.to12Hour(0), timePicker.to12Hour(13), timePicker.to24Hour(12, false), timePicker.to24Hour(12, true)], [12, 1, 0, 12]);
check("TimePicker alinea al intervalo", timePicker.alignToInterval({ hour: 10, minute: 47, second: 33 }, 15), { hour: 10, minute: 45, second: 0 });
check("TimePicker rango vacio usa todo el dia", timePicker.normalizeHourRange(undefined, undefined), { start: 0, end: 23 });

let timeChanges = [];
const timeView = mount(new timePicker.TimePickerView({ selectedTime: "08:30", format: "", disabled: false, startHour: 8, endHour: 17, minuteInterval: 15, showSeconds: false, use24HourFormat: true, onTimeChange: (value) => timeChanges.push(value) }));
check("TimePicker inicia en la hora seleccionada", [timeView.state.hour, timeView.state.minute, timeView.state.second], [8, 30, 0]);
timeView.changeMinute("45");
check("TimePicker cambia el minuto", timeChanges.pop(), "08:45:00");
timeView.changeHour("9");
check("TimePicker cambia la hora", timeChanges.pop(), "09:45:00");
timeView.changeSecond("30");
check("TimePicker sin segundos publica :00", timeChanges.pop(), "09:45:00");
timeView.changeHour("18");
check("TimePicker ignora una hora fuera del rango", timeChanges.length, 0);
timeView.clearTime();
check("TimePicker limpia la seleccion", timeChanges.pop(), "");

const secondsView = mount(new timePicker.TimePickerView({ selectedTime: "", format: "", disabled: false, minuteInterval: 5, showSeconds: true, use24HourFormat: true, onTimeChange: (value) => timeChanges.push(value) }));
secondsView.state.hour = 9;
secondsView.state.minute = 30;
secondsView.changeSecond("30");
check("TimePicker con segundos publica el segundo", timeChanges.pop(), "09:30:30");

const clock12View = mount(new timePicker.TimePickerView({ selectedTime: "13:00", format: "", disabled: false, minuteInterval: 1, showSeconds: false, use24HourFormat: false, onTimeChange: (value) => timeChanges.push(value) }));
clock12View.changeDisplayHour("1");
check("TimePicker 12 horas conserva PM", timeChanges.pop(), "13:00:00");
clock12View.changeMeridiem("AM");
check("TimePicker 12 horas cambia a AM", timeChanges.pop(), "01:00:00");

const timeStyles = timePicker.visualStyles({ borderColor: "Color.Red", borderThickness: 0, focusedBorderColor: "#123456", color: "#ff0000", fill: "#101010", font: "Arial", fontWeight: "Semibold", size: 14 });
check("TimePicker estilos del campo", [timeStyles.box, timeStyles.input], [{ "--tp-border-color": "#e81123", "--tp-border-width": "0px", "--tp-focus-color": "#123456", "--tp-fill": "#101010", "--tp-font": "'Arial', 'Segoe UI', sans-serif" }, { color: "#ff0000", fontFamily: "'Arial', 'Segoe UI', sans-serif", fontSize: 14, fontWeight: 600 }]);

console.log(`\n${total - failures} de ${total} verificaciones correctas`);
if (failures > 0) process.exitCode = 1;
