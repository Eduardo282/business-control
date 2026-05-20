import { hasValue, normalizeExcelHeader } from "./utils";
import {
  exportRowsToExcel,
  exportTemplateToExcel,
} from "../../../utils/excelExport";

export const CONTACT_TEMPLATE_COLUMNS = [
  "NOMBRE COMPLETO",
  "CORREO ELECTRONICO",
  "PUESTO",
  "TELEFONO",
];

const CONTACT_COLUMN_MAP = {
  nombre: "full_name",
  "nombre completo": "full_name",
  full_name: "full_name",
  "full name": "full_name",
  contacto: "full_name",
  correo: "email",
  email: "email",
  "correo electronico": "email",
  "correo principal": "email",
  telefono: "phone",
  tel: "phone",
  phone: "phone",
  celular: "phone",
  puesto: "position_title",
  position_title: "position_title",
  cargo: "position_title",
  posicion: "position_title",
};

export async function parseContactWorkbook(fileBuffer) {
  const XLSX = await import("xlsx");
  const wb = XLSX.read(fileBuffer, { type: "array" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws, {
    header: 1,
    defval: "",
    blankrows: false,
  });

  if (!rows.length) {
    return {
      contacts: [],
      errors: ["El archivo está vacío o no contiene encabezados."],
    };
  }

  const [headerRow = [], ...sheetRows] = rows;
  const normalizedHeaders = headerRow.map((header) =>
    normalizeExcelHeader(header),
  );
  const mappedFields = normalizedHeaders.map(
    (header) => CONTACT_COLUMN_MAP[header] || null,
  );

  if (!mappedFields.some(Boolean)) {
    return {
      contacts: [],
      errors: [
        "No se reconocieron columnas válidas. Usa la plantilla 'Descargar plantilla'.",
      ],
    };
  }

  const missingTemplateHeaders = CONTACT_TEMPLATE_COLUMNS.filter(
    (header) => !normalizedHeaders.includes(normalizeExcelHeader(header)),
  );

  const mapped = [];
  sheetRows.forEach((row, idx) => {
    const cells = Array.isArray(row) ? row : [];
    const isEmptyRow = cells.every((cell) => String(cell ?? "").trim() === "");
    if (isEmptyRow) return;

    const mappedRow = {};
    cells.forEach((value, columnIndex) => {
      const field = mappedFields[columnIndex];
      if (!field) return;

      const parsedValue = String(value ?? "").trim();
      if (parsedValue === "") return;

      mappedRow[field] = parsedValue;
    });

    mappedRow._row = idx + 2;
    mapped.push(mappedRow);
  });

  if (!mapped.length) {
    return {
      contacts: [],
      errors: ["El archivo no contiene filas con datos para importar."],
    };
  }

  const errors = [];
  if (missingTemplateHeaders.length) {
    errors.push(
      `Faltan columnas de la plantilla: ${missingTemplateHeaders.join(", ")}.`,
    );
  }

  mapped.forEach((row) => {
    if (!row.full_name) {
      errors.push(`Fila ${row._row}: Falta "Nombre" (obligatorio).`);
    }
  });

  const contacts = mapped.filter((row) => row.full_name);
  if (!contacts.length) {
    errors.push("No hay filas válidas para importar.");
  }

  return { contacts, errors };
}

export function buildContactExportContext(contactColumnsFromView, contactsTable) {
  const usedLabels = new Set();
  const exportColumns = contactColumnsFromView
    .filter((column) => column.name !== "is_active")
    .map((column) => {
      const baseLabel = String(column.label || column.name || "").trim();
      const fallbackLabel = String(column.name || "").trim();
      let base = baseLabel || fallbackLabel || "Columna";

      if (column.name === "has_portal_access") {
        base = "Acceso al Portal";
      }

      let label = base;
      const normalized = base.toLowerCase();
      if (usedLabels.has(normalized)) {
        label = `${base} (${fallbackLabel || normalized})`;
      }

      usedLabels.add(normalized);
      return { name: column.name, label };
    });

  const exportRows = contactsTable
    .getSortedRowModel()
    .rows.map((row) => row.original);

  return { exportColumns, exportRows };
}

export function resolveContactExportValue(row, columnName) {
  if (columnName === "has_portal_access") {
    return row?.has_portal_access ? "Sí" : "No";
  }

  if (columnName === "is_active") {
    const isActive = row?.is_active !== false && row?.is_active !== 0;
    return isActive ? "Sí" : "No";
  }

  const rawValue = row?.[columnName];
  return hasValue(rawValue) ? rawValue : "";
}

export async function exportContactsToPdf({ exportColumns, exportRows }) {
  const [{ default: jsPDF }, autoTableModule] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);

  const autoTable = autoTableModule.default || autoTableModule.autoTable;
  const doc = new jsPDF({ orientation: "landscape" });

  doc.setFontSize(16);
  doc.setTextColor(26, 43, 76);
  doc.text("Contactos", 14, 16);
  doc.setFontSize(10);
  doc.setTextColor(90, 90, 90);
  doc.text(`Exportado: ${new Date().toLocaleString("es-MX")}`, 14, 23);

  autoTable(doc, {
    startY: 28,
    head: [exportColumns.map((column) => column.label.toUpperCase())],
    body: exportRows.map((row) =>
      exportColumns.map((column) => {
        const value = resolveContactExportValue(row, column.name);
        return hasValue(value) ? String(value) : "—";
      }),
    ),
    theme: "grid",
    headStyles: { fillColor: [34, 119, 180] },
    styles: { fontSize: 8, cellPadding: 2.5 },
  });

  doc.save(`Contactos_${new Date().toISOString().slice(0, 10)}.pdf`);
}

export async function exportContactsToExcel({ exportColumns, exportRows }) {
  const rows = exportRows.map((row) => {
    const nextRow = {};

    exportColumns.forEach((column) => {
      const value = resolveContactExportValue(row, column.name);
      nextRow[column.label] = hasValue(value) ? value : "";
    });

    return nextRow;
  });

  await exportRowsToExcel({
    rows,
    sheetName: "Contactos",
    fileName: `Contactos_${new Date().toISOString().slice(0, 10)}.xlsx`,
  });
}

export async function downloadContactsTemplate() {
  await exportTemplateToExcel({
    columns: CONTACT_TEMPLATE_COLUMNS,
    sheetName: "Plantilla Contactos",
    fileName: "Plantilla_Contactos.xlsx",
    widths: [34, 34, 26, 20],
  });
}
