import { createPortal } from "react-dom";
import { Building2, Search, X } from "@icons";

export default function ClientSearchModal({
  isOpen,
  clientSearch,
  isClientSearching,
  clientResults,
  visibleClientResults,
  onClose,
  onSearchChange,
  onSelectClient,
}) {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl h-[85vh] overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-zinc-100 dark:border-white/10 flex items-center justify-between bg-[#1a2b4c]">
          <div>
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              Buscar Cliente
            </h2>
            <p className="text-sm text-zinc-300 mt-1">
              Selecciona el cliente para la cotización
            </p>
          </div>
          <button
            onClick={onClose}
            className="size-8 flex items-center justify-center rounded-lg text-white hover:bg-white/20 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 flex-1 overflow-y-auto">
          <div className="mb-4 relative">
            <Search
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400"
              size={18}
            />
            <input
              type="text"
              value={clientSearch}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Escribe el nombre del cliente o RFC…"
              className="w-full pl-4 pr-10 py-3 rounded-xl border border-zinc-200 bg-zinc-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2277B4]/50 transition-all text-zinc-700"
              autoFocus
            />
          </div>

          <div className="space-y-2 mt-4">
            {isClientSearching ?
              <div className="text-center py-10 text-zinc-400">
                <Search
                  size={40}
                  className="mx-auto mb-3 opacity-20 animate-spin"
                />
                Buscando clientes...
              </div>
            : visibleClientResults.length > 0 ?
              <>
                {visibleClientResults.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => onSelectClient(c)}
                    className="p-4 rounded-xl border border-zinc-100 hover:border-[#2277B4]/50 hover:bg-blue-50/30 cursor-pointer transition-all flex justify-between items-center group">
                    <div>
                      <div className="font-bold text-zinc-800 group-hover:text-[#2277B4] transition-colors">
                        {c.business_name}
                      </div>
                      <div className="text-xs text-zinc-500 mt-1 flex items-center gap-3">
                        <span className="bg-zinc-100 px-2 py-0.5 rounded text-zinc-600 font-mono">
                          RFC: {c.rfc || "N/A"}
                        </span>
                        <span>ID: {String(c.id).substring(0, 8)}</span>
                      </div>
                    </div>
                    <button className="px-4 py-1.5 text-sm font-semibold rounded-lg bg-zinc-100 text-zinc-600 group-hover:bg-[#2277B4] group-hover:text-white transition-all">
                      Seleccionar
                    </button>
                  </div>
                ))}

                {clientResults.length > visibleClientResults.length && (
                  <div className="mt-2 px-3 py-2 rounded-lg bg-blue-50 text-xs text-[#125280]">
                    {visibleClientResults.length} de {clientResults.length}
                    {" "}
                    resultados. Sigue escribiendo para acotar la búsqueda.
                  </div>
                )}
              </>
            : clientSearch.trim().length > 0 ?
              <div className="text-center py-10 text-zinc-400">
                <Building2 size={40} className="mx-auto mb-3 opacity-20" />
                No se encontraron clientes con "{clientSearch}"
              </div>
            : <div className="text-center py-10 text-zinc-400">
                <Search size={40} className="mx-auto mb-3 opacity-20" />
                No hay clientes disponibles
              </div>
            }
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
