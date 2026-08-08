import { ArrowLeft, Search, ShoppingBag, X } from "@icons";
import Card from "../../../components/ui/Card";
import Input from "../../../components/ui/Input";

export default function QuoteEntryToolbar({
  items,
  resetItemsData,
  navigate,
  prodSearch,
  setProdSearch,
  setShowProductModal,
  tableFilter,
  setTableFilter,
}) {
  return (
    <Card className="!overflow-visible z-30">
      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg text-black dark:text-zinc-100 mb-1">
            <ShoppingBag size={24} />
          </div>
          <div>
            <h3 className="font-semibold text-lg text-light-text-primary dark:text-zinc-100">
              Agregar Productos o Servicios
            </h3>
          </div>
        </div>
        <div className="flex items-center gap-4 text-right">
          {items.length > 0 && (
            <button
              type="button"
              onClick={resetItemsData}
              className="inline-flex items-center gap-1 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
            >
              <X size={13} /> Restablecer
            </button>
          )}
          <button
            onClick={() => navigate("/cotizaciones/historial")}
            className="inline-flex items-center gap-1.5 whitespace-nowrap px-4 py-2 rounded-xl text-sm font-semibold text-black dark:text-zinc-100 hover:text-zinc-700 dark:hover:text-zinc-300 border border-transparent transition-all"
          >
            <ArrowLeft size={16} /> Regresar a historial
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-3 items-end p-4 rounded-xl border border-zinc-200 bg-zinc-50/70 dark:border-white/10 dark:bg-white/[0.03]">
        <div className="flex-1 w-full relative z-10">
          <label className="text-xs font-semibold text-light-text-secondary dark:text-zinc-400 mb-1.5 block">
            Producto
          </label>
          <div className="relative">
            <Input
              value={prodSearch}
              onFocus={() => setShowProductModal(true)}
              onChange={(event) => {
                setProdSearch(event.target.value);
                setShowProductModal(true);
              }}
              placeholder="Buscar folio, producto o servicio…"
              className="glass-input bg-light-bg dark:!bg-black/30 text-light-text-primary dark:text-white border-light-border dark:border-white/10"
              style={{ paddingRight: "4rem" }}
            />
            {prodSearch && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setProdSearch("");
                }}
                className="absolute right-8 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-red-500 transition-colors focus:outline-none"
                title="Limpiar búsqueda"
              >
                <X size={14} />
              </button>
            )}
            <Search
              size={14}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-light-text-secondary dark:text-zinc-400"
            />
          </div>
        </div>

        <div className="flex-1 w-full relative">
          <label className="text-xs font-semibold text-light-text-secondary dark:text-zinc-400 mb-1.5 block">
            Filtrar en la tabla
          </label>
          <div className="relative">
            {!tableFilter && (
              <Search
                size={13}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-light-text-secondary dark:text-zinc-400"
              />
            )}
            <input
              type="text"
              placeholder="Filtrar productos agregados…"
              value={tableFilter}
              onChange={(event) => setTableFilter(event.target.value)}
              className="pl-3 pr-8 py-2.5 text-sm rounded-xl border border-light-border dark:border-white/10 bg-white dark:bg-black/30 focus:outline-none focus:ring-1 focus:ring-[#2277B4] w-full text-black dark:text-white transition-colors"
            />
            {tableFilter && (
              <button
                type="button"
                onClick={() => setTableFilter("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-red-500 transition-colors focus:outline-none"
                title="Limpiar búsqueda"
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
