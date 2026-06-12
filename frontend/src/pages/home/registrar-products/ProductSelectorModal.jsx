import React from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, Plus, Package } from "@icons";

export default function ProductSelectorModal({
  isOpen,
  onClose,
  onBack,
  title,
  type,
  products = [],
  selectedCategory,
  onSelectProduct,
  onNewProductClick,
  productLogoMap = {},
  Icon = Package,
}) {
  if (!isOpen) return null;

  const getButtonText = () => {
    if (type === "SERVICE") return "Nuevo servicio";
    if (type === "POLICY") return "Nueva póliza";
    return "Nuevo producto";
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-500/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-dark-800 rounded-3xl w-full max-w-2xl shadow-2xl animate-fade-in flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-[#24395f] bg-[#1a2b4c] flex items-center gap-3">
          <button
            onClick={onBack}
            className="text-white/80 hover:text-white transition-colors p-2 bg-white/10 hover:bg-white/20 rounded-full"
          >
            <ArrowLeft size={20} />
          </button>
          <h2 className="font-semibold text-white text-xl flex items-center gap-2">
            <Icon className="text-blue-300" size={24} /> {title}
          </h2>
          <button
            type="button"
            onClick={onNewProductClick}
            className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2277B4] hover:bg-[#125280] text-white text-xs font-semibold transition-colors"
          >
            <Plus size={14} /> {getButtonText()}
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-8 bg-[#f8fafc] dark:bg-dark-800 flex-1">
          <div className="space-y-3">
            {products.length === 0 ? (
              <div className="rounded-xl border border-dashed border-zinc-300 dark:border-dark-700 bg-white dark:bg-dark-900 p-5 text-sm text-zinc-500 dark:text-zinc-400 text-center">
                No hay opciones disponibles para la categoría{" "}
                <strong>{selectedCategory || "--"}</strong>. <br /> Usa el botón{" "}
                <strong>{getButtonText()}</strong>.
              </div>
            ) : (
              products.map((item) => {
                const ItemLogo = productLogoMap[item.name] || Icon;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onSelectProduct(item)}
                    className="w-full rounded-2xl border border-blue-200 bg-white p-5 text-left transition-all group hover:border-blue-300 hover:shadow-md dark:border-blue-900/60 dark:bg-dark-900 dark:hover:border-blue-700 dark:hover:bg-dark-800"
                  >
                    <div className="flex justify-between items-start gap-4 mb-1.5">
                      <div className="flex items-start gap-3 min-w-0">
                        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-blue-200 bg-blue-50 text-blue-500 transition-colors group-hover:border-blue-300 group-hover:bg-blue-100 dark:border-blue-900/60 dark:bg-blue-950/30 dark:text-blue-400 dark:group-hover:bg-blue-900/40">
                          <ItemLogo size={13} />
                        </span>
                        <div className="min-w-0">
                          <div className="truncate text-lg font-bold text-blue-600 dark:text-blue-400">
                            {item.name}
                          </div>
                          {item.folio && (
                            <div className="mt-0.5 text-[11px] font-mono font-bold text-[#2277B4] dark:text-blue-400 tracking-wider">
                              Folio: {item.folio}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {item.isCustom && (
                          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                            Nuevo
                          </span>
                        )}
                        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-500/70 bg-blue-50/50 px-2 py-0.5 rounded-md border border-blue-100/50">
                          {item.category}
                        </span>
                      </div>
                    </div>

                    {item.description && (
                      <div className="text-sm text-zinc-500 leading-relaxed line-clamp-2">
                        {item.description}
                      </div>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
