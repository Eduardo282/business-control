import React, { useState, useRef } from "react";
import { createPortal } from "react-dom";
import { X, Upload, CheckCircle2, AlertCircle, Lightbulb } from "@icons";
import Swal from "sweetalert2";
import {
  bulkCreateClientsApi,
  importClientsFromDriveApi,
} from "../../../actionsAPI/clients.api";

const CLIENT_TEMPLATE_COLUMNS = [
  "RAZÓN SOCIAL",
  "RFC",
  "CORREO PRINCIPAL",
  "CELULAR",
  "CIUDAD",
  "TELÉFONO",
  "CORREO SECUNDARIO",
  "CÓDIGO POSTAL",
];

const COLUMN_MAP = {
  "razon social": "business_name",
  business_name: "business_name",
  "business name": "business_name",
  empresa: "business_name",
  nombre: "business_name",
  rfc: "rfc",
  "correo principal": "email1",
  email1: "email1",
  correo: "email1",
  email: "email1",
  "correo secundario": "email2",
  "email secundario": "email2",
  email2: "email2",
  celular: "celular",
  movil: "celular",
  telefono: "telefono",
  tel: "telefono",
  "codigo postal": "codigo_postal",
  codigo_postal: "codigo_postal",
  cp: "codigo_postal",
  ciudad: "ciudad",
  city: "ciudad",
};

function normalizeExcelHeader(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export default function ClientBulkModal({ isOpen, onClose, onSuccess }) {
  const [bulkData, setBulkData] = useState([]);
  const [bulkErrors, setBulkErrors] = useState([]);
  const [bulkUploading, setBulkUploading] = useState(false);
  const [bulkResult, setBulkResult] = useState(null);
  const [driveUrl, setDriveUrl] = useState("");
  const [driveImporting, setDriveImporting] = useState(false);
  const bulkFileRef = useRef(null);

  if (!isOpen) return null;

  const fireBulkModalAlert = (options) =>
    Swal.fire({
      ...options,
      didOpen: () => {
        const container = Swal.getContainer();
        if (container) {
          container.style.zIndex = "11000";
        }
        if (typeof options.didOpen === "function") {
          options.didOpen();
        }
      },
    });

  const handleBulkFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBulkResult(null);
    setBulkErrors([]);

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const XLSX = await import("xlsx");
        const wb = XLSX.read(evt.target.result, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws, {
          header: 1,
          defval: "",
          blankrows: false,
        });

        if (!rows.length) {
          setBulkData([]);
          setBulkErrors(["El archivo está vacío o no contiene encabezados."]);
          return;
        }

        const [headerRow = [], ...sheetRows] = rows;
        const normalizedHeaders = headerRow.map((header) =>
          normalizeExcelHeader(header)
        );
        const mappedFields = normalizedHeaders.map(
          (header) => COLUMN_MAP[header] || null
        );

        if (!mappedFields.some(Boolean)) {
          setBulkData([]);
          setBulkErrors([
            "No se reconocieron columnas válidas. Usa la plantilla de clientes.",
          ]);
          return;
        }

        // Mapear columnas
        const mapped = [];
        const errors = [];
        sheetRows.forEach((row, idx) => {
          const cells = Array.isArray(row) ? row : [];
          const isEmptyRow = cells.every(
            (cell) => String(cell ?? "").trim() === ""
          );
          if (isEmptyRow) return;

          const mapped_row = {};
          cells.forEach((value, columnIndex) => {
            const field = mappedFields[columnIndex];
            if (!field) return;

            const parsedValue = String(value ?? "").trim();
            if (parsedValue !== "") {
              mapped_row[field] = parsedValue;
            }
          });

          mapped_row._row = idx + 2; // fila Excel
          mapped.push(mapped_row);
        });

        if (!mapped.length) {
          setBulkData([]);
          setBulkErrors([
            "El archivo no contiene filas con datos para importar.",
          ]);
          return;
        }

        // Validar campos obligatorios
        mapped.forEach((row) => {
          if (!row.business_name) {
            errors.push(`Fila ${row._row}: Falta el campo Razón Social (Obligatorio)`);
          }
        });

        setBulkData(mapped);
        setBulkErrors(errors);
      } catch {
        setBulkData([]);
        setBulkErrors([
          "No se pudo leer el archivo. Verifica que sea un Excel válido (.xlsx / .xls).",
        ]);
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = "";
  };

  const executeBulkUpload = async () => {
    setBulkUploading(true);
    setBulkResult(null);
    try {
      const inputs = bulkData.map(({ _row, ...rest }) => ({
        business_name: rest.business_name,
        rfc: rest.rfc || null,
        email1: rest.email1 || null,
        email2: rest.email2 || null,
        celular: rest.celular || null,
        telefono: rest.telefono || null,
        codigo_postal: rest.codigo_postal || null,
        ciudad: rest.ciudad || null,
      }));

      const CHUNK = 200;
      let totalCreated = 0;
      for (let i = 0; i < inputs.length; i += CHUNK) {
        const chunk = inputs.slice(i, i + CHUNK);
        const created = await bulkCreateClientsApi(chunk);
        totalCreated += created.length;
      }

      setBulkResult({ success: true, count: totalCreated });
      onSuccess({ type: "excel", count: totalCreated });
      setBulkData([]);
      onClose();

      await fireBulkModalAlert({
        title: "Importación completada",
        text: `Se importaron ${totalCreated} clientes exitosamente.`,
        icon: "success",
        confirmButtonColor: "#2277B4",
        timer: 2000,
        timerProgressBar: true,
        showConfirmButton: false,
        allowOutsideClick: false,
      });
    } catch (err) {
      setBulkResult({
        success: false,
        message: err.message || "Error en la carga masiva.",
      });
      fireBulkModalAlert({
        title: "Error",
        text: err.message || "Error en la carga masiva.",
        icon: "error",
        confirmButtonColor: "#d33",
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true,
      });
    } finally {
      setBulkUploading(false);
    }
  };

  const executeDriveImport = async () => {
    const url = driveUrl.trim();
    if (!url) {
      setBulkResult({
        success: false,
        message: "Debes ingresar la URL del archivo en Google Drive.",
      });
      fireBulkModalAlert({
        title: "Falta la URL",
        text: "Debes ingresar la URL del archivo en Google Drive.",
        icon: "warning",
        confirmButtonColor: "#2277B4",
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true,
      });
      return;
    }

    setDriveImporting(true);
    setBulkResult(null);
    try {
      const report = await importClientsFromDriveApi(url);
      setBulkResult({
        success: true,
        count: report.importedCount,
        skippedCount: report.skippedCount,
        details: report,
      });

      onSuccess({ type: "drive", report });
      onClose();

      await fireBulkModalAlert({
        title: "Importación completada",
        text:
          report.skippedCount > 0
            ? `Se importaron ${report.importedCount} clientes. Se omitieron ${report.skippedCount} filas.`
            : `Se importaron ${report.importedCount} clientes exitosamente.`,
        icon: "success",
        confirmButtonColor: "#2277B4",
        timer: 2000,
        timerProgressBar: true,
        showConfirmButton: false,
        allowOutsideClick: false,
      });
    } catch (err) {
      setBulkResult({
        success: false,
        message: err.message || "Error importando archivo desde Drive.",
      });
      fireBulkModalAlert({
        title: "Error",
        text: err.message || "Error importando archivo desde Drive.",
        icon: "error",
        confirmButtonColor: "#d33",
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true,
      });
    } finally {
      setDriveImporting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-100 bg-[#1a2b4c] flex items-center justify-between">
          <h3 className="text-white text-lg font-semibold flex items-center gap-2">
            Carga de Clientes
          </h3>
          <button onClick={onClose} className="text-white hover:opacity-80">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {bulkResult?.success && bulkResult?.details?.ignoredHeaders?.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-800">
              <p className="font-semibold mb-1">Columnas ignoradas del Excel</p>
              <p>{bulkResult.details.ignoredHeaders.join(", ")}</p>
            </div>
          )}

          {bulkResult?.success && bulkResult?.details?.createdColumns?.length > 0 && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-xs text-emerald-800">
              <p className="font-semibold mb-1">Columnas nuevas creadas en MySQL</p>
              <p>
                {bulkResult.details.createdColumns
                  .map((item) => `${item.header} -> ${item.columnName}`)
                  .join(", ")}
              </p>
            </div>
          )}

          {bulkResult?.success && bulkResult?.details?.backfillReports?.length > 0 && (
            <div className="bg-cyan-50 border border-cyan-200 rounded-xl p-4 text-xs text-cyan-800">
              <p className="font-semibold mb-1">Autocompletado histórico aplicado</p>
              <p>
                {bulkResult.details.backfillReports
                  .map(
                    (item) =>
                      `${item.columnName} <- ${item.sourceColumn} (${item.affectedRows})`
                  )
                  .join(", ")}
              </p>
            </div>
          )}

          {/* Help/Ayuda */}
          <div className="bg-[#2277B412] border border-blue-200 rounded-xl p-4">
            <p className="text-sm font-semibold text-[#2277B4] mb-2 flex items-center gap-1">
              <Lightbulb size={15} /> Ayuda
            </p>
            <ul className="text-xs text-[#2277B4] space-y-1 mb-3 list-disc pl-5">
              <li>Los clientes se asignarán automáticamente.</li>
              <li>También puedes pegar la URL del archivo de Google Drive.</li>
            </ul>
          </div>

          {/* Importar desde Google Drive */}
          <div className="border border-zinc-200 rounded-xl p-4 space-y-3">
            <p className="text-sm font-semibold text-zinc-700">
              Importar desde Google Drive
            </p>
            <input
              type="url"
              value={driveUrl}
              onChange={(e) => setDriveUrl(e.target.value)}
              placeholder="https://drive.google.com/file/d/.../view"
              className="w-full px-3 py-2.5 text-sm rounded-lg border border-zinc-300 bg-white text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#2277B4]/30 focus:border-[#2277B4]"
            />
            <button
              onClick={executeDriveImport}
              disabled={driveImporting}
              className="px-4 py-2 bg-[#1a2b4c] text-white text-sm font-semibold rounded-lg hover:bg-[#16233f] transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {driveImporting ? (
                <>
                  <span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Importando…
                </>
              ) : (
                "Importar"
              )}
            </button>
          </div>

          {/* Subir archivo local */}
          <div>
            <input
              ref={bulkFileRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleBulkFile}
              className="hidden"
            />
            <button
              onClick={() => bulkFileRef.current?.click()}
              className="w-full py-8 border-2 border-dashed border-zinc-300 rounded-xl flex flex-col items-center gap-2 text-zinc-500 hover:border-[#2277B4] hover:text-[#2277B4] transition-colors cursor-pointer"
            >
              <Upload size={28} />
              <span className="text-sm font-semibold">
                Haz clic para seleccionar el archivo Excel
              </span>
              <span className="text-[11px] text-zinc-400">
                O usa la plantilla descargada
              </span>
            </button>
          </div>

          {/* Errores de validación */}
          {bulkErrors.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <p className="text-sm font-semibold text-amber-800 mb-2 flex items-center gap-1">
                <AlertCircle size={15} /> Advertencias
              </p>
              <ul className="text-xs text-amber-700 space-y-1 max-h-32 overflow-y-auto">
                {bulkErrors.map((err, i) => (
                  <li key={i}>• {err}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Vista previa */}
          {bulkData.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-zinc-700 mb-2">
                Vista previa ({bulkData.length} clientes listos para importar)
              </p>
              <div className="border border-zinc-200 rounded-xl overflow-hidden max-h-64 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="bg-zinc-50 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold text-zinc-600">#</th>
                      <th className="px-3 py-2 text-left font-semibold text-zinc-600">Razón Social</th>
                      <th className="px-3 py-2 text-left font-semibold text-zinc-600">RFC</th>
                      <th className="px-3 py-2 text-left font-semibold text-zinc-600">Correo</th>
                      <th className="px-3 py-2 text-left font-semibold text-zinc-600">Celular</th>
                      <th className="px-3 py-2 text-left font-semibold text-zinc-600">Ciudad</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {bulkData.map((r, i) => (
                      <tr key={i} className="hover:bg-zinc-50">
                        <td className="px-3 py-2 text-zinc-400">{i + 1}</td>
                        <td className="px-3 py-2 font-medium text-zinc-800">{r.business_name}</td>
                        <td className="px-3 py-2 text-zinc-600">{r.rfc || "—"}</td>
                        <td className="px-3 py-2 text-zinc-600">{r.email1 || "—"}</td>
                        <td className="px-3 py-2 text-zinc-600">{r.celular || "—"}</td>
                        <td className="px-3 py-2 text-zinc-600">{r.ciudad || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-zinc-100 flex items-center justify-end gap-3">
          {bulkData.length > 0 && (
            <button
              onClick={executeBulkUpload}
              disabled={bulkUploading}
              className="px-6 py-2.5 bg-[#2277B4] text-white font-bold rounded-xl hover:bg-[#125280] transition-colors shadow-lg shadow-[#12528050] disabled:opacity-50 flex items-center gap-2"
            >
              {bulkUploading ? (
                <>
                  <span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Importando…
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  Importar {bulkData.length} Clientes
                </>
              )}
            </button>
          )}
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-zinc-600 font-semibold rounded-xl hover:bg-zinc-100 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
