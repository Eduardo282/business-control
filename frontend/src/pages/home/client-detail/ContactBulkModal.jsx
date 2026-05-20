import React from "react";
import { createPortal } from "react-dom";
import { FileSpreadsheet, Lightbulb, Upload, AlertCircle, CheckCircle2 } from "@icons";

export default function ContactBulkModal({
  isOpen,
  onClose,
  clientBusinessName,
  bulkContactDriveUrl,
  setBulkContactDriveUrl,
  executeBulkContactDriveImport,
  bulkContactDriveImporting,
  bulkContactResult,
  bulkContactFileRef,
  handleBulkContactFile,
  executeBulkContactUpload,
  bulkContactUploading,
  bulkContactErrors = [],
  bulkContactData = [],
}) {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-fade-in">
      <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-100 dark:border-dark-700 bg-[#1a2b4c] flex items-center justify-between">
          <h3 className="text-white text-lg font-semibold flex items-center gap-2">
            <FileSpreadsheet size={20} />
            Carga de Contactos
          </h3>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {/* Instrucciones */}
          <div className="bg-[#2277B412] border border-blue-200 dark:border-blue-500/20 rounded-xl p-4">
            <p className="text-sm font-semibold text-[#2277B4] dark:text-blue-400 mb-2 flex items-center gap-1">
              <Lightbulb size={15} /> Ayuda
            </p>
            <ul className="text-xs text-[#2277B4] dark:text-blue-400 space-y-1 mb-3 list-disc pl-5">
              <li>
                Los contactos se asignarán automáticamente a:{" "}
                <b>{clientBusinessName}</b>
              </li>
              <li>
                También puedes pegar la URL del archivo de Google Drive.
              </li>
            </ul>
          </div>

          {/* Importar desde Drive */}
          <div className="space-y-2 rounded-xl border border-zinc-200 dark:border-dark-700 p-4 bg-white dark:bg-dark-900">
            <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 tracking-wide">
              Importar desde Google Drive
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="url"
                value={bulkContactDriveUrl}
                onChange={(e) => setBulkContactDriveUrl(e.target.value)}
                placeholder="Pega la URL del archivo de Drive…"
                className="flex-1 px-3 py-2 rounded-lg border border-zinc-300 dark:border-dark-700 text-sm text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-[#2277B4]/30 focus:border-[#2277B4] bg-white dark:bg-dark-800"
              />
              <button
                onClick={executeBulkContactDriveImport}
                disabled={bulkContactDriveImporting}
                className="px-4 py-2 rounded-lg bg-[#2277B4] text-white text-sm font-semibold hover:bg-[#125280] transition-colors disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {bulkContactDriveImporting ? "Importando…" : "Importar"}
              </button>
            </div>
          </div>

          {bulkContactResult?.success &&
            bulkContactResult?.details?.ignoredHeaders?.length > 0 && (
              <div className="bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/20 rounded-xl p-4 text-xs text-amber-800 dark:text-amber-400">
                <p className="font-semibold mb-1">
                  Columnas ignoradas del Excel
                </p>
                <p>
                  {bulkContactResult.details.ignoredHeaders.join(", ")}
                </p>
              </div>
            )}

          {bulkContactResult?.success &&
            bulkContactResult?.details?.createdColumns?.length > 0 && (
              <div className="bg-emerald-50 dark:bg-emerald-500/5 border border-emerald-200 dark:border-emerald-500/20 rounded-xl p-4 text-xs text-emerald-800 dark:text-emerald-400">
                <p className="font-semibold mb-1">
                  Columnas nuevas creadas en contactos
                </p>
                <p>
                  {bulkContactResult.details.createdColumns
                    .map((item) => `${item.header} -> ${item.columnName}`)
                    .join(", ")}
                </p>
              </div>
            )}

          {/* Subir archivo */}
          <div>
            <input
              ref={bulkContactFileRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleBulkContactFile}
              className="hidden"
            />
            <button
              onClick={() => bulkContactFileRef.current?.click()}
              className="w-full py-8 border-2 border-dashed border-zinc-300 dark:border-dark-700 rounded-xl flex flex-col items-center gap-2 text-zinc-500 hover:border-[#2277B4] hover:text-[#2277B4] transition-colors cursor-pointer"
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

          {/* Errores */}
          {bulkContactErrors.length > 0 && (
            <div className="bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/20 rounded-xl p-4">
              <p className="text-sm font-semibold text-amber-800 dark:text-amber-400 mb-2 flex items-center gap-1">
                <AlertCircle size={15} /> Advertencias
              </p>
              <ul className="text-xs text-amber-700 dark:text-amber-400 space-y-1 max-h-32 overflow-y-auto">
                {bulkContactErrors.map((err, i) => (
                  <li key={i}>• {err}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Vista previa */}
          {bulkContactData.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                Vista previa ({bulkContactData.length} contactos listos
                para importar)
              </p>
              <div className="border border-zinc-200 dark:border-dark-700 rounded-xl overflow-hidden max-h-64 overflow-y-auto bg-white dark:bg-dark-900">
                <table className="w-full text-xs">
                  <thead className="bg-zinc-50 dark:bg-dark-800 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold text-zinc-600 dark:text-zinc-400">
                        #
                      </th>
                      <th className="px-3 py-2 text-left font-semibold text-zinc-600 dark:text-zinc-400">
                        Nombre
                      </th>
                      <th className="px-3 py-2 text-left font-semibold text-zinc-600 dark:text-zinc-400">
                        Correo
                      </th>
                      <th className="px-3 py-2 text-left font-semibold text-zinc-600 dark:text-zinc-400">
                        Teléfono
                      </th>
                      <th className="px-3 py-2 text-left font-semibold text-zinc-600 dark:text-zinc-400">
                        Puesto
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-dark-700">
                    {bulkContactData.map((r, i) => (
                      <tr key={i} className="hover:bg-zinc-50 dark:hover:bg-dark-800">
                        <td className="px-3 py-2 text-zinc-400">
                          {i + 1}
                        </td>
                        <td className="px-3 py-2 font-medium text-zinc-800 dark:text-zinc-200">
                          {r.full_name}
                        </td>
                        <td className="px-3 py-2 text-zinc-600 dark:text-zinc-400">
                          {r.email || "—"}
                        </td>
                        <td className="px-3 py-2 text-zinc-600 dark:text-zinc-400">
                          {r.phone || "—"}
                        </td>
                        <td className="px-3 py-2 text-zinc-600 dark:text-zinc-400">
                          {r.position_title || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-zinc-100 dark:border-dark-700 flex items-center justify-end gap-3">
          {bulkContactData.length > 0 && (
            <button
              onClick={executeBulkContactUpload}
              disabled={bulkContactUploading}
              className="px-6 py-2.5 bg-[#2277B4] text-white font-bold rounded-xl hover:bg-[#125280] transition-colors shadow-lg shadow-[#2277B450] disabled:opacity-50 flex items-center gap-2"
            >
              {bulkContactUploading ? (
                <>
                  <span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Importando…
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  Importar {bulkContactData.length} Contactos
                </>
              )}
            </button>
          )}
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-zinc-600 dark:text-zinc-400 font-semibold rounded-xl hover:bg-zinc-100 dark:hover:bg-dark-700 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
