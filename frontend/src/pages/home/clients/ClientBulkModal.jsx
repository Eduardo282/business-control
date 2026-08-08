import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { X, Upload, CheckCircle2, AlertCircle, Lightbulb } from "@icons";
import Swal from "sweetalert2";
import {
  importClientsFromDriveApi,
  importClientsFromLocalApi,
} from "../../../actionsAPI/clients.api";
import { loadXlsx } from "../../../utils/dynamicImports";

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
  const DRIVE_URL_KEY = "bc_client_drive_url";
  const [driveUrl, setDriveUrl] = useState(
    () => localStorage.getItem(DRIVE_URL_KEY) || "",
  );
  const [driveImporting, setDriveImporting] = useState(false);
  const [fileToUpload, setFileToUpload] = useState(null);
  const bulkFileRef = useRef(null);
  const [previewPage, setPreviewPage] = useState(1);
  const previewPageSize = 50;

  if (!isOpen) return null;

  const persistDriveUrl = (val) => {
    setDriveUrl(val);
    if (val) {
      localStorage.setItem(DRIVE_URL_KEY, val);
    } else {
      localStorage.removeItem(DRIVE_URL_KEY);
    }
  };

  const clearDriveUrl = () => {
    setDriveUrl("");
    localStorage.removeItem(DRIVE_URL_KEY);
  };

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
    setFileToUpload(file);
    setPreviewPage(1);

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const XLSX = await loadXlsx();
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
          (header) => {
            if (COLUMN_MAP[header]) return COLUMN_MAP[header];
            return String(header || "")
              .normalize("NFD")
              .replace(/[\u0300-\u036f]/g, "")
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, "_")
              .replace(/^_+|_+$/g, "");
          }
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
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("Error al leer archivo local:", err);
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
    if (!fileToUpload) {
      setBulkErrors(["No hay archivo cargado."]);
      return;
    }
    setBulkUploading(true);
    setBulkResult(null);
    try {
      const getBase64 = (f) => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result.split(",")[1]);
        reader.onerror = reject;
        reader.readAsDataURL(f);
      });
      const base64 = await getBase64(fileToUpload);
      
      const report = await importClientsFromLocalApi(base64);
      const totalCreated = report.importedCount || 0;

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
        message: "Debes ingresar la URL del archivo de Google Drive.",
      });
      fireBulkModalAlert({
        title: "Falta la URL",
        text: "Debes ingresar la URL del archivo de Google Drive.",
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
    <div className="fixed inset-0 bg-black/40 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-2xl dark:shadow-black/50 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-transparent dark:border-dark-700">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-100 dark:border-dark-700 bg-[#1a2b4c] dark:bg-blue-950 flex items-center justify-between">
          <h3 className="text-white dark:text-white text-lg font-semibold flex items-center gap-2">
            Carga de Clientes
          </h3>
          <button onClick={onClose} className="text-white dark:text-white hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-white/40 dark:focus:ring-white/40 rounded">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-5 [scrollbar-width:thin] [scrollbar-color:#d4d4d8_transparent] dark:[scrollbar-color:#52525b_transparent]">
          {bulkResult?.success && bulkResult?.details?.ignoredHeaders?.length > 0 && (
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 rounded-xl p-4 text-xs text-amber-800 dark:text-amber-200">
              <p className="font-semibold mb-1">Columnas ignoradas del Excel</p>
              <p>{bulkResult.details.ignoredHeaders.join(", ")}</p>
            </div>
          )}

          {bulkResult?.success && bulkResult?.details?.createdColumns?.length > 0 && (
            <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 rounded-xl p-4 text-xs text-emerald-800 dark:text-emerald-200">
              <p className="font-semibold mb-1">Columnas nuevas creadas en MySQL</p>
              <p>
                {bulkResult.details.createdColumns
                  .map((item) => `${item.header} -> ${item.columnName}`)
                  .join(", ")}
              </p>
            </div>
          )}

          {bulkResult?.success && bulkResult?.details?.backfillReports?.length > 0 && (
            <div className="bg-cyan-50 dark:bg-cyan-950/30 border border-cyan-200 dark:border-cyan-900/60 rounded-xl p-4 text-xs text-cyan-800 dark:text-cyan-200">
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
          <div className="bg-[#2277B412] dark:bg-blue-500/10 border border-blue-200 dark:border-blue-800/60 rounded-xl p-4">
            <p className="text-sm font-semibold text-[#2277B4] dark:text-blue-300 mb-2 flex items-center gap-1">
              <Lightbulb size={15} /> Ayuda
            </p>
            <ul className="text-xs text-[#2277B4] dark:text-blue-300 space-y-1 mb-3 list-disc pl-5">
              <li>Los clientes se asignarán automáticamente.</li>
              <li>También puedes pegar la URL del archivo de Google Drive.</li>
            </ul>
          </div>

          {/* Importar desde Google Drive */}
          <div className="border border-zinc-200 dark:border-dark-700 bg-white dark:bg-dark-900 rounded-xl p-4 space-y-3">
            <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
              Importar desde Google Drive
            </p>
            <div className="relative">
              <input
                type="url"
                value={driveUrl}
                onChange={(e) => persistDriveUrl(e.target.value)}
                placeholder="https://drive.google.com/file/d/.../view"
                className="w-full px-3 py-2.5 pr-8 text-sm rounded-lg border border-zinc-300 dark:border-dark-700 bg-white dark:bg-dark-800 text-zinc-800 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#2277B4]/30 dark:focus:ring-blue-400/30 focus:border-[#2277B4] dark:focus:border-blue-400 transition-colors"
              />
              {driveUrl && (
                <button
                  type="button"
                  onClick={clearDriveUrl}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-red-500 transition-colors"
                  title="Borrar URL"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              )}
            </div>
            <button
              onClick={executeDriveImport}
              disabled={driveImporting}
              className="px-4 py-2 bg-[#1a2b4c] dark:bg-blue-900 text-white dark:text-blue-50 text-sm font-semibold rounded-lg hover:bg-[#16233f] dark:hover:bg-blue-800 transition-colors disabled:opacity-50 disabled:bg-zinc-300 disabled:text-zinc-500 dark:disabled:bg-dark-700 dark:disabled:text-zinc-500 disabled:hover:bg-zinc-300 dark:disabled:hover:bg-dark-700 flex items-center gap-2"
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
              className="w-full py-8 border-2 border-dashed border-zinc-300 dark:border-dark-700 bg-white dark:bg-dark-900 rounded-xl flex flex-col items-center gap-2 text-zinc-500 dark:text-zinc-400 hover:border-[#2277B4] dark:hover:border-blue-400 hover:text-[#2277B4] dark:hover:text-blue-300 hover:bg-blue-50/40 dark:hover:bg-blue-500/10 transition-colors cursor-pointer"
            >
              <Upload size={28} />
              <span className="text-sm font-semibold">
                Haz clic para seleccionar el archivo Excel
              </span>
              <span className="text-[11px] text-zinc-400 dark:text-zinc-500">
                O usa la plantilla para descargar
              </span>
            </button>
          </div>

          {/* Errores de validación */}
          {bulkErrors.length > 0 && (
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 rounded-xl p-4">
              <p className="text-sm font-semibold text-amber-800 dark:text-amber-200 mb-2 flex items-center gap-1">
                <AlertCircle size={15} /> Advertencias
              </p>
              <ul className="text-xs text-amber-700 dark:text-amber-300 space-y-1 max-h-32 overflow-y-auto [scrollbar-width:thin] [scrollbar-color:#d4d4d8_transparent] dark:[scrollbar-color:#52525b_transparent]">
                {bulkErrors.map((err, i) => (
                  <li key={i}>• {err}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Vista previa */}
          {bulkData.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                Vista previa ({bulkData.length} clientes listos para importar)
              </p>
              <div className="border border-zinc-200 dark:border-dark-700 rounded-xl overflow-hidden max-h-64 overflow-y-auto [scrollbar-width:thin] [scrollbar-color:#d4d4d8_transparent] dark:[scrollbar-color:#52525b_transparent]">
                <table className="w-full text-xs">
                  <thead className="bg-zinc-50 dark:bg-dark-900 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold text-zinc-600 dark:text-zinc-300">#</th>
                      <th className="px-3 py-2 text-left font-semibold text-zinc-600 dark:text-zinc-300">Razón Social</th>
                      <th className="px-3 py-2 text-left font-semibold text-zinc-600 dark:text-zinc-300">RFC</th>
                      <th className="px-3 py-2 text-left font-semibold text-zinc-600 dark:text-zinc-300">Correo</th>
                      <th className="px-3 py-2 text-left font-semibold text-zinc-600 dark:text-zinc-300">Celular</th>
                      <th className="px-3 py-2 text-left font-semibold text-zinc-600 dark:text-zinc-300">Ciudad</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-dark-700">
                    {bulkData.slice((previewPage - 1) * previewPageSize, previewPage * previewPageSize).map((r, i) => (
                      <tr key={(previewPage - 1) * previewPageSize + i} className="hover:bg-zinc-50 dark:hover:bg-dark-700/60">
                        <td className="px-3 py-2 text-zinc-400 dark:text-zinc-500">{(previewPage - 1) * previewPageSize + i + 1}</td>
                        <td className="px-3 py-2 font-medium text-zinc-800 dark:text-zinc-100">{r.business_name}</td>
                        <td className="px-3 py-2 text-zinc-600 dark:text-zinc-300">{r.rfc || "—"}</td>
                        <td className="px-3 py-2 text-zinc-600 dark:text-zinc-300">{r.email1 || "—"}</td>
                        <td className="px-3 py-2 text-zinc-600 dark:text-zinc-300">{r.celular || "—"}</td>
                        <td className="px-3 py-2 text-zinc-600 dark:text-zinc-300">{r.ciudad || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {bulkData.length > previewPageSize && (
                <div className="flex items-center justify-between mt-3 px-1 text-xs">
                  <span className="text-zinc-500 dark:text-zinc-400">
                    Mostrando {(previewPage - 1) * previewPageSize + 1} a {Math.min(previewPage * previewPageSize, bulkData.length)} de {bulkData.length}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPreviewPage(p => Math.max(1, p - 1))}
                      disabled={previewPage === 1}
                      className="px-3 py-1.5 rounded bg-zinc-100 dark:bg-dark-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-dark-600 disabled:opacity-50 transition-colors"
                    >
                      Anterior
                    </button>
                    <span className="text-zinc-600 dark:text-zinc-400 font-medium">
                      {previewPage} de {Math.ceil(bulkData.length / previewPageSize)}
                    </span>
                    <button
                      onClick={() => setPreviewPage(p => Math.min(Math.ceil(bulkData.length / previewPageSize), p + 1))}
                      disabled={previewPage === Math.ceil(bulkData.length / previewPageSize)}
                      className="px-3 py-1.5 rounded bg-zinc-100 dark:bg-dark-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-dark-600 disabled:opacity-50 transition-colors"
                    >
                      Siguiente
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-zinc-100 dark:border-dark-700 bg-white dark:bg-dark-800 flex items-center justify-end gap-3">
          {bulkData.length > 0 && (
            <button
              onClick={executeBulkUpload}
              disabled={bulkUploading}
              className="px-6 py-2.5 bg-[#2277B4] dark:bg-blue-700 text-white dark:text-white font-bold rounded-xl hover:bg-[#125280] dark:hover:bg-blue-600 transition-colors shadow-lg shadow-[#12528050] dark:shadow-black/30 disabled:opacity-50 disabled:bg-zinc-300 disabled:text-zinc-500 dark:disabled:bg-dark-700 dark:disabled:text-zinc-500 disabled:hover:bg-zinc-300 dark:disabled:hover:bg-dark-700 flex items-center gap-2"
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
            className="px-5 py-2.5 text-zinc-600 dark:text-zinc-300 font-semibold rounded-xl hover:bg-zinc-100 dark:hover:bg-dark-700 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
