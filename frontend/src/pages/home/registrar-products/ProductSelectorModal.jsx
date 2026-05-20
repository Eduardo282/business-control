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

  const getBorderColor = () => {
    if (type === "SERVICE") return "border-[#B58DE0]/45 dark:border-dark-600 hover:bg-[#B58DE0]/5";
    if (type === "POLICY") return "border-purple-200 dark:border-dark-700 hover:bg-purple-50";
    if (type === "PRODUCT") return "border-emerald-200 dark:border-dark-700 hover:bg-emerald-50";
    return "border-zinc-200 dark:border-zinc-700 hover:border-blue-300 hover:shadow-md";
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
                const ItemLogo = productLogoMap[item.name] || Package;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onSelectProduct(item)}
                    className={`w-full text-left p-5 rounded-2xl border bg-white dark:bg-dark-900 dark:hover:bg-dark-800 transition-all group ${getBorderColor()}`}
                  >
                    <div className="flex justify-between items-start gap-4 mb-1.5">
                      <div className="flex items-start gap-3 min-w-0">
                        {type === "CONTPAQI" && (
                          <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-zinc-200 dark:border-dark-700 bg-zinc-50 dark:bg-dark-800 text-zinc-400 group-hover:border-blue-200 dark:group-hover:bg-dark-700 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
                            <ItemLogo size={13} />
                          </span>
                        )}
                        <div className="font-bold text-lg text-[#1e293b] dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 min-w-0 truncate">
                          {item.name}
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
