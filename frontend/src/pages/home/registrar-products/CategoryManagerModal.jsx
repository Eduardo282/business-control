import React from "react";
import { createPortal } from "react-dom";
import { X, Plus } from "@icons";

const CATEGORY_CHIPS_PAGE_SIZE = 12;

export default function CategoryManagerModal({
  isOpen,
  onClose,
  newCategoryName,
  setNewCategoryName,
  handleAddCategory,
  availableCategories,
  normalizeServicePolicyCategory,
  selectedCategory,
  applyCategorySelection,
  categoryPage,
  setCategoryPage,
}) {
  if (!isOpen) return null;

  const totalCategoryPages = Math.max(
    1,
    Math.ceil(availableCategories.length / CATEGORY_CHIPS_PAGE_SIZE)
  );
  const safeCategoryPage = Math.min(categoryPage, totalCategoryPages);

  const start = (safeCategoryPage - 1) * CATEGORY_CHIPS_PAGE_SIZE;
  const visibleCategories = availableCategories.slice(
    start,
    start + CATEGORY_CHIPS_PAGE_SIZE
  );

  const isDuplicate =
    !!normalizeServicePolicyCategory(newCategoryName) &&
    availableCategories.some(
      (c) =>
        normalizeServicePolicyCategory(c) ===
        normalizeServicePolicyCategory(newCategoryName)
    );

  return createPortal(
    <div className="fixed inset-0 z-[105] flex items-center justify-center p-4 bg-zinc-500/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-dark-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-fade-in relative">
        <div className="p-4 rounded-t-2xl border-b border-[#24395f] bg-[#1a2b4c] flex items-center justify-between">
          <h2 className="font-semibold text-white text-lg">Categorías</h2>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition-colors p-1"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex gap-2">
            <input
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Ej. Contabilidad"
              className="flex-1 rounded-xl px-4 py-3 text-sm bg-white dark:bg-dark-900 text-light-text-primary dark:text-zinc-100 focus:ring-2 focus:ring-[#153465] focus:outline-none border border-zinc-300 dark:border-dark-700 transition-colors"
            />
            <button
              type="button"
              onClick={handleAddCategory}
              disabled={
                !normalizeServicePolicyCategory(newCategoryName) || isDuplicate
              }
              className="px-4 py-2 rounded-lg bg-[#2277B4] text-white text-sm font-semibold hover:bg-[#125280] transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#2277B4]"
            >
              Agregar
            </button>
          </div>
          <div className="h-5 overflow-hidden" aria-live="polite">
            {isDuplicate && (
              <p className="text-xs font-medium text-red-500">
                Ya existe una categoría con ese nombre.
              </p>
            )}
          </div>

          <div>
            <h3 className="text-xs font-semibold text-zinc-400 uppercase mb-3">
              Categorías
            </h3>
            {availableCategories.length === 0 ? (
              <p className="text-sm text-zinc-500">
                Aún no hay categorías registradas.
              </p>
            ) : (
              <div className="min-h-[190px] flex flex-col">
                <div className="flex flex-wrap content-start gap-2 h-[138px] overflow-hidden pr-1">
                  {visibleCategories.map((category) => {
                    const isSelected =
                      normalizeServicePolicyCategory(category) ===
                      normalizeServicePolicyCategory(selectedCategory);

                    return (
                      <button
                        key={category}
                        type="button"
                        onClick={() => {
                          applyCategorySelection(category);
                          onClose();
                        }}
                        className={`px-3 py-1.5 rounded-full border text-xs font-semibold transition-colors ${
                          isSelected
                            ? "border-[#2277B4] bg-[#2277B4]/10 text-[#2277B4] dark:text-blue-400"
                            : "border-zinc-200 dark:border-dark-700 bg-white dark:bg-dark-900 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-dark-800"
                        }`}
                      >
                        {category}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs text-zinc-500">
                    Página {safeCategoryPage} de {totalCategoryPages}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setCategoryPage((prev) => Math.max(1, prev - 1))}
                      disabled={safeCategoryPage === 1}
                      className="px-3 py-1.5 rounded-md border border-zinc-200 dark:border-dark-700 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-dark-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Anterior
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setCategoryPage((prev) =>
                          Math.min(totalCategoryPages, prev + 1)
                        )
                      }
                      disabled={safeCategoryPage === totalCategoryPages}
                      className="px-3 py-1.5 rounded-md border border-zinc-200 dark:border-dark-700 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-dark-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Siguiente
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
