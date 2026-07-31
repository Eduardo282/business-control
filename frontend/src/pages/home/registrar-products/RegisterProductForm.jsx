import React from "react";
import { ChevronDown, Plus } from "@icons";
import Input from "../../../components/ui/Input";

export default function RegisterProductForm({
  activeFormMode,
  currentMaxUsers,
  formLabels,
  handleCreate,
  handlePriceChange,
  handlePriceStep,
  handleUsersChange,
  handleUsersStep,
  isFormHighlighted,
  isServiceMode,
  newProduct,
  openCategoriesModal,
  openSourceModal,
  productTypeLabel,
  selectedCategory,
  setNewProduct,
}) {
  return (
    <form onSubmit={handleCreate} className="mb-6 animate-fade-in">
      <div
        className={`p-6 rounded-xl glass-panel shadow-xl border transition-all duration-500 ease-out ${
          isFormHighlighted
            ? "ring-4 ring-[#2277B4]/60 dark:ring-blue-400/50 shadow-[0_0_25px_rgba(34,119,180,0.4)] dark:shadow-[0_0_25px_rgba(96,165,250,0.4)] border-[#2277B4] dark:border-blue-400 bg-blue-50/40 dark:bg-blue-900/30 scale-[1.01]"
            : "border-zinc-200 dark:border-dark-700 scale-100"
        }`}
      >
        <button
          type="button"
          onClick={openCategoriesModal}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[#2277B4]/25 dark:border-blue-500/30 bg-[#2277B4]/5 dark:bg-blue-500/10 text-[#2277B4] dark:text-blue-300 text-sm font-semibold hover:bg-[#2277B4]/10 dark:hover:bg-blue-500/20 transition-colors mb-4 focus:outline-none focus:ring-2 focus:ring-[#2277B4]/30 dark:focus:ring-blue-400/40"
        >
          <Plus size={16} /> Gestionar categorías
        </button>

        <div className="mb-6">
          <div className="relative">
            <div
              className="w-full pl-4 pr-10 py-3 rounded-xl bg-white dark:bg-dark-900 text-[#2277B4] dark:text-blue-400 border border-zinc-200 dark:border-dark-700 outline-none transition-all cursor-pointer hover:bg-zinc-50 dark:hover:bg-dark-800 flex justify-between items-center"
              onClick={openSourceModal}
            >
              <span className="truncate pr-3">
                {newProduct.name
                  ? `${newProduct.name} (${productTypeLabel})`
                  : "-- Seleccionar o agregar productos o servicios --"}
              </span>
              <ChevronDown
                size={16}
                className="text-light-text-secondary dark:text-zinc-400"
              />
            </div>
          </div>
          <div className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
            {selectedCategory
              ? ``
              : "Primero selecciona o registra una categoría para abrir el selector."}
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              id="register-product-name-input"
              label={formLabels.nameLabel}
              placeholder={
                isServiceMode
                  ? "Ej. Renovación anual"
                  : activeFormMode === "CONTPAQI"
                  ? "Ej. CONTPAQi Contabilidad 2024"
                  : "Ej. Contabilidad 2024"
              }
              value={newProduct.name}
              onChange={(event) =>
                setNewProduct({ ...newProduct, name: event.target.value })
              }
              required
            />

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-light-text-secondary dark:text-zinc-400 ml-1 uppercase tracking-wider transition-colors">
                CATEGORÍA
              </label>
              <input
                placeholder="Selecciona una categoría en Gestionar categorías"
                value={newProduct.category}
                readOnly
                disabled={!selectedCategory}
                className="w-full rounded-xl px-4 py-3 text-sm bg-white dark:bg-dark-900 text-light-text-primary dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:ring-2 focus:ring-[#153465]/30 dark:focus:ring-blue-400/30 focus:border-[#153465] dark:focus:border-blue-400 focus:outline-none border border-zinc-300 dark:border-dark-700 disabled:bg-zinc-100 dark:disabled:bg-dark-800 disabled:text-zinc-500 dark:disabled:text-zinc-500 disabled:border-zinc-200 dark:disabled:border-dark-700 disabled:cursor-not-allowed transition-colors"
                required
              />
            </div>
          </div>

          <div
            className={`grid ${
              isServiceMode ? "grid-cols-1" : "grid-cols-2"
            } gap-4`}
          >
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-light-text-secondary dark:text-zinc-400 ml-1 uppercase tracking-wider transition-colors">
                PRECIO (MXN)
              </label>
              <div className="relative">
                <input
                  id="register-price-input"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={newProduct.price}
                  onChange={(event) => handlePriceChange(event.target.value)}
                  className="w-full rounded-xl pl-4 pr-16 py-3 text-sm bg-white dark:bg-dark-900 text-light-text-primary dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:ring-2 focus:ring-[#153465]/30 dark:focus:ring-blue-400/30 focus:border-[#153465] dark:focus:border-blue-400 focus:outline-none border border-zinc-300 dark:border-dark-700 dark:[color-scheme:dark] transition-colors"
                  required
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex overflow-hidden rounded-md border border-[#b8cce6] dark:border-dark-700 shadow-sm dark:shadow-black/20 bg-[#e8f2ff] dark:bg-dark-800">
                  <button
                    type="button"
                    onClick={() => handlePriceStep(-1)}
                    className="size-4 text-xs font-bold text-[#2277B4] dark:text-blue-300 hover:bg-[#dcecff] dark:hover:bg-zinc-700 focus:bg-blue-100 dark:focus:bg-zinc-700 focus:outline-none transition-colors leading-none"
                  >
                    -
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePriceStep(1)}
                    className="size-4 text-xs font-bold text-[#2277B4] dark:text-blue-300 hover:bg-[#dcecff] dark:hover:bg-zinc-700 focus:bg-blue-100 dark:focus:bg-zinc-700 focus:outline-none border-l border-[#b8cce6] dark:border-dark-700 transition-colors leading-none"
                  >
                    +
                  </button>
                </div>
              </div>
              {Number(newProduct.price) > 0 && (
                <div className="text-[10px] text-black dark:text-zinc-400 mt-1 font-mono text-right">
                  + IVA: ${(parseFloat(newProduct.price) * 0.16).toFixed(2)}
                </div>
              )}
            </div>

            {!isServiceMode && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-light-text-secondary dark:text-zinc-400 ml-1 uppercase tracking-wider transition-colors">
                  {`USUARIOS (MÁXIMA CAPACIDAD. ${currentMaxUsers})`}
                </label>
                <div className="relative">
                  <input
                    id="register-users-input"
                    type="number"
                    min="1"
                    max={currentMaxUsers.toString()}
                    step="1"
                    placeholder="1"
                    value={newProduct.users_count}
                    onChange={(event) => handleUsersChange(event.target.value)}
                    className="w-full rounded-xl pl-4 pr-16 py-3 text-sm bg-white dark:bg-dark-900 text-light-text-primary dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:ring-2 focus:ring-[#153465]/30 dark:focus:ring-blue-400/30 focus:border-[#153465] dark:focus:border-blue-400 focus:outline-none border border-zinc-300 dark:border-dark-700 dark:[color-scheme:dark] transition-colors"
                    required
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex overflow-hidden rounded-md border border-[#b8cce6] dark:border-dark-700 shadow-sm dark:shadow-black/20 bg-[#e8f2ff] dark:bg-dark-800">
                    <button
                      type="button"
                      onClick={() => handleUsersStep(-1)}
                      className="size-4 text-xs font-bold text-[#2277B4] dark:text-blue-300 hover:bg-[#dcecff] dark:hover:bg-zinc-700 focus:bg-blue-100 dark:focus:bg-zinc-700 focus:outline-none transition-colors leading-none"
                    >
                      -
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUsersStep(1)}
                      className="size-4 text-xs font-bold text-[#2277B4] dark:text-blue-300 hover:bg-[#dcecff] dark:hover:bg-zinc-700 focus:bg-blue-100 dark:focus:bg-zinc-700 focus:outline-none border-l border-[#b8cce6] dark:border-dark-700 transition-colors leading-none"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-light-text-secondary dark:text-zinc-400">
              Descripción
            </label>
            <textarea
              className="w-full bg-white dark:bg-dark-900 border border-light-border dark:border-dark-700 rounded-lg p-3 text-sm text-light-text-primary dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 outline-none focus:ring-1 focus:ring-[#125280] dark:focus:ring-blue-400/40 focus:border-[#125280] dark:focus:border-blue-400 min-h-[100px] transition-colors [scrollbar-width:thin] [scrollbar-color:#d4d4d8_transparent] dark:[scrollbar-color:#52525b_transparent]"
              placeholder="Detalles técnicos…"
              value={newProduct.description}
              onChange={(event) =>
                setNewProduct({
                  ...newProduct,
                  description: event.target.value,
                })
              }
            />
          </div>
        </div>

        <div className="flex justify-end mt-6 pt-4">
          <button
            type="submit"
            className="px-8 py-2 justify-center bg-[#2277B4] dark:bg-blue-700 hover:bg-[#125280] dark:hover:bg-blue-600 text-white dark:text-white rounded-xl shadow-lg shadow-[#2277B450] dark:shadow-black/30 focus:outline-none focus:ring-2 focus:ring-[#2277B4]/30 dark:focus:ring-blue-400/40 transition-colors"
          >
            {formLabels.button}
          </button>
        </div>
      </div>
    </form>
  );
}
