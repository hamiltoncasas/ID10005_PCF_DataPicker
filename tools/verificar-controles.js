/*
 * Fecha: 2026-09-16
 * Descripcion: Arnes de verificacion de la logica de los controles.
 * Comprueba el parseo y formato de fechas, el filtro tipo contiene, la
 * normalizacion de acentos y el comportamiento de seleccion sin abrir un navegador.
 *
 * Uso (desde la raiz del repositorio):
 *   npx tsc DatePicker/DatePickerView.tsx DateTimePicker/DateTimePickerView.tsx SearchableComboBox/SearchableComboBoxView.tsx --outDir obj/checks --module commonjs --target es2019 --jsx react --esModuleInterop --lib ES2020,DOM --strict --skipLibCheck
 *   node tools/verificar-controles.js
 *
 * Salida esperada: "54 de 54 verificaciones correctas" y codigo de salida 0.
 */
const path = require("path");

const checksDir = path.join(__dirname, "..", "obj", "checks");
const { DatePickerView } = require(path.join(checksDir, "DatePicker", "DatePickerView"));
const { DateTimePickerView } = require(path.join(checksDir, "DateTimePicker", "DateTimePickerView"));
const { SearchableComboBoxView, normalizeForSearch } = require(path.join(checksDir, "SearchableComboBox", "SearchableComboBoxView"));

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

console.log(`\n${total - failures} de ${total} verificaciones correctas`);
if (failures > 0) process.exitCode = 1;
