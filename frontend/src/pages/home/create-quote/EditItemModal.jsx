import { createPortal } from "react-dom";
import { X } from "@icons";

export default function EditItemModal({
  editingItemDraft,
  editingItemTotals,
  formatCurrency,
  onClose,
  onApply,
  onChangeField,
}) {
  if (!editingItemDraft) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-100 bg-[#1a2b4c] flex items-center justify-between">
          <div>
            <h3 className="text-white font-semibold text-base uppercase">
              Editar producto
            </h3>
            <p className="text-[11px] text-zinc-300 mt-1">
              Ajusta cantidad, precio unitario o descuento.
            </p>
          </div>
          <button
            onClick={onClose}
            className="size-8 rounded-lg text-white hover:bg-white/10 flex items-center justify-center transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 block mb-1.5">
              Producto
            </label>
            <div className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50 text-sm text-zinc-700">
              {editingItemDraft.name}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 block mb-1.5">
                Cant.
              </label>
              <input
                type="number"
                min="1"
                step="1"
                value={editingItemDraft.quantity}
                onChange={(e) => onChangeField("quantity", e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-zinc-200 bg-white text-sm text-zinc-800 focus:outline-none focus:ring-1 focus:ring-[#2277B4]"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 block mb-1.5">
                Precio
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={editingItemDraft.price}
                onChange={(e) => onChangeField("price", e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-zinc-200 bg-white text-sm text-zinc-800 focus:outline-none focus:ring-1 focus:ring-[#2277B4]"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 block mb-1.5">
                Desc. %
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={editingItemDraft.discount}
                onChange={(e) => onChangeField("discount", e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-zinc-200 bg-white text-sm text-zinc-800 focus:outline-none focus:ring-1 focus:ring-[#2277B4]"
              />
            </div>
          </div>

          <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-3 space-y-1">
            <div className="flex items-center justify-between text-xs text-zinc-600">
              <span>Importe</span>
              <span className="font-mono font-semibold text-zinc-800">
                ${formatCurrency(editingItemTotals?.subtotal || 0)}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-zinc-600">
              <span>Total + IVA</span>
              <span className="font-mono font-bold text-[#1B4733]">
                ${formatCurrency(editingItemTotals?.total || 0)}
              </span>
            </div>
          </div>
        </div>

        <div className="px-5 py-4 border-t border-zinc-100 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-zinc-600 hover:bg-zinc-100 transition-colors">
            Cancelar
          </button>
          <button
            onClick={onApply}
            className="px-4 py-2 rounded-xl bg-[#2277B4] hover:bg-[#125280] text-white font-semibold transition-colors">
            Guardar cambios
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
