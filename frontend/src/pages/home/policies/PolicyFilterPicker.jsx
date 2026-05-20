import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { normalizeSearchText } from "../../../utils/formatters";
import { Search, X } from "@icons";

function getPolicyStatusLabel(status) {
  const normalized = String(status || "")
    .trim()
    .toUpperCase();

  if (normalized === "ACTIVE") return "ACTIVO";
  if (normalized === "EXPIRING_SOON") return "Por Vencer";
  if (normalized === "CANCELLED") return "Inactivo";
  return "Vencido";
}

export default function PolicyFilterPicker({
  isOpen,
  policies,
  activeField,
  filters,
  onClose,
  onApply,
}) {
  const [search, setSearch] = useState("");

  const options = useMemo(() => {
    if (!activeField) return [];

    const uniqueValues = new Map();

    policies.forEach((p) => {
      let rawValue = null;
      if (activeField === "folio") {
        rawValue = p.license_key;
      } else if (activeField === "status") {
        rawValue = getPolicyStatusLabel(p.status);
      }

      const value = String(rawValue || "").trim();
      if (!value) return;

      const normalized = normalizeSearchText(value);
      if (!normalized || uniqueValues.has(normalized)) return;

      uniqueValues.set(normalized, value);
    });

    return Array.from(uniqueValues.values()).sort((a, b) =>
      a.localeCompare(b, "es", { sensitivity: "base" })
    );
  }, [policies, activeField]);

  const visibleOptions = useMemo(() => {
    const s = normalizeSearchText(search);
    if (!s) return options;

    return options.filter((value) =>
      normalizeSearchText(value).includes(s)
    );
  }, [search, options]);

  if (!isOpen || !activeField) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] bg-black/45 flex items-center justify-center p-4"
      onClick={onClose}>
      <div
        className="bg-white dark:bg-dark-900 border border-zinc-200 dark:border-dark-700 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-zinc-100 dark:border-dark-800 bg-[#1a2b4c] dark:bg-dark-800 flex items-center justify-between">
          <div>
            <h3 className="text-white font-semibold text-base uppercase">
              FILTRAR POR {activeField === "status" ? "Estado" : activeField}
            </h3>
            <p className="text-[11px] text-zinc-300 dark:text-zinc-400 mt-1">
              Selecciona o busca un valor
            </p>
          </div>
          <button
            onClick={onClose}
            className="size-8 rounded-lg text-white hover:bg-white/10 flex items-center justify-center">
            <X size={16} />
          </button>
        </div>

        <div className="p-4 space-y-3">
          <div className="flex items-center gap-2 bg-zinc-50 dark:bg-dark-800 border border-zinc-200 dark:border-dark-700 rounded-lg px-3 py-2">
            <Search size={15} className="text-zinc-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar valor…"
              className="w-full bg-transparent text-sm text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 focus:outline-none"
            />
          </div>

          <div className="h-72 overflow-y-auto rounded-lg border border-zinc-100 dark:border-dark-700 divide-y divide-zinc-100 dark:divide-dark-700">
            {visibleOptions.length > 0 ?
              visibleOptions.map((value) => {
                const isSelected =
                  normalizeSearchText(filters[activeField]) === normalizeSearchText(value);

                return (
                  <button
                    key={`${activeField}_${value}`}
                    onClick={() => {
                      onApply(value);
                      setSearch("");
                    }}
                    className={`w-full px-3 py-2 text-left text-sm transition-colors ${
                      isSelected ?
                        "bg-[#2277B4]/10 dark:bg-blue-500/10 text-[#125280] dark:text-blue-400 font-semibold"
                      : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-dark-800"
                    }`}>
                    {value}
                  </button>
                );
              })
            : <div className="px-3 py-4 text-sm text-zinc-500 dark:text-zinc-400 text-center">
                No hay valores para mostrar.
              </div>
            }
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
