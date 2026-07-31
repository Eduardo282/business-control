import React from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Filter,
  Inbox,
  Package,
  Search,
  X,
} from "@icons";
import { ServiceReel } from "./PortalDashboardReel";

export function PortalDashboardServicesList({
  currentServices,
  deletingServiceId,
  filteredServices,
  handleDeleteService,
  jumpInput,
  page,
  pulling,
  searchTerm,
  setActiveFolioGroup,
  setJumpInput,
  setPage,
  setSearchTerm,
  setSpinKey,
  setStatusFilter,
  spinKey,
  statusFilter,
  totalPages,
}) {
  return (
    <section>
      <div className="flex flex-col gap-3 mb-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3">
          <h2 className="text-2xl font-semibold text-zinc-800 dark:text-zinc-100 flex items-center gap-2">
            <Package className="text-black dark:text-zinc-100" size={24} /> Mis Servicios y
            Polizas
          </h2>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={16} className="text-zinc-400 dark:text-zinc-500" />
              </div>
              <input
                type="text"
                placeholder="Nombre, licencia, fecha…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-8 py-2 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:focus:ring-emerald-400/30 focus:border-emerald-600 dark:focus:border-emerald-400 transition-colors bg-white dark:bg-zinc-900 w-56"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="absolute inset-y-0 right-2 flex items-center text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-200"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="flex items-center gap-1 border border-zinc-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-900 px-1 py-1 shadow-sm dark:shadow-black/20">
              <Filter size={14} className="text-zinc-400 dark:text-zinc-500 ml-1" />
              {[
                { value: "ALL", label: "Todos" },
                { value: "ACTIVE", label: "Activo" },
                { value: "EXPIRING_SOON", label: "Por Vencer" },
                { value: "EXPIRED", label: "Vencido" },
                { value: "CANCELLED", label: "Cancelado" },
              ].map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setStatusFilter(value)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                    statusFilter === value ?
                      value === "ACTIVE" ? "bg-emerald-600 text-white dark:bg-emerald-400 dark:text-emerald-950"
                      : value === "EXPIRING_SOON" ? "bg-amber-400 text-amber-950 dark:bg-amber-300 dark:text-amber-950"
                      : value === "EXPIRED" ? "bg-zinc-500 text-white dark:bg-zinc-400 dark:text-zinc-950"
                      : value === "CANCELLED" ? "bg-zinc-700 text-white dark:bg-zinc-300 dark:text-zinc-950"
                      : "bg-blue-900 text-white dark:bg-blue-400 dark:text-blue-950"
                    : "text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {(searchTerm || statusFilter !== "ALL") && (
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                {filteredServices.length} resultado
                {filteredServices.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>
      </div>

      {filteredServices.length === 0 ? (
        <div className="bg-zinc-50 dark:bg-zinc-900/70 p-12 text-center rounded-2xl border-2 border-dashed border-zinc-200 dark:border-zinc-700">
          <div className="flex justify-center mb-4">
            <Inbox size={48} className="text-zinc-300 dark:text-zinc-600" />
          </div>
          <p className="text-zinc-500 dark:text-zinc-400">
            {searchTerm || statusFilter !== "ALL" ?
              "No se encontraron servicios que coincidan con los filtros."
            : "No tienes servicios activos actualmente."}
          </p>
        </div>
      ) : (
        <>
          <style>{`
            .casino-wrapper {
                perspective: 2500px;
                position: relative;
                width: 100%;
                display: flex;
                justify-content: center;
                margin: 2rem 0;
            }
            .machine-body {
                padding: 40px 20px;
                border-radius: 40px;
                display: flex;
                gap: 30px;
                position: relative;
                transform-style: preserve-3d;
                flex-wrap: wrap;
                justify-content: center;
            }
            .reel-window {
                width: 280px;
                height: 400px;
                background: #fff;
                border-radius: 15px;
                position: relative;
                overflow: hidden;
            }
            .dark .reel-window {
                background: #18181b;
            }
            .reel-drum {
                width: 100%;
                height: 400px;
                position: absolute;
                top: 0; 
                transform-style: preserve-3d;
                transition: transform 0.8s cubic-bezier(0.45, 0.05, 0.55, 0.95);
                will-change: transform;
            }
            .symbol-face {
                position: absolute;
                width: 100%;
                height: 400px;
                backface-visibility: hidden;
                background: white;
                box-sizing: border-box;
            }
            .dark .symbol-face {
                background: #18181b;
            }
          `}</style>

          <div className="casino-wrapper">
            <div className="machine-body">
              {[0, 1, 2].map((idx) => {
                const service = currentServices[idx];
                return (
                  <ServiceReel
                    key={idx}
                    index={idx}
                    service={service}
                    spinCount={spinKey}
                    isDeleting={deletingServiceId === service?.id}
                    onDelete={handleDeleteService}
                    onOpenFolio={(filterMode, filterValue) =>
                      setActiveFolioGroup({
                        name: service.product?.name,
                        key: service._groupKey,
                        items: service._groupItems,
                        selectedId: service.id,
                        filterMode,
                        filterValue,
                      })
                    }
                  />
                );
              })}
            </div>
          </div>

          {totalPages > 1 && (
            <div className="flex flex-col items-center mt-6 gap-3">
              <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium tracking-wide">
                Pág. {page + 1} / {totalPages} — Total{" "}
                {filteredServices.length} servicios
              </p>

              <div className="flex items-center gap-1 rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm px-3 py-2 shadow-sm dark:shadow-black/20">
                <button
                  type="button"
                  disabled={pulling || page === 0}
                  onClick={() => {
                    if (pulling || page === 0) return;
                    setPage(0);
                    setSpinKey((k) => k + 1);
                  }}
                  title="Primera página"
                  className="size-8 flex items-center justify-center rounded-lg text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:text-zinc-400 dark:disabled:text-zinc-600 disabled:opacity-100 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:focus:ring-blue-400/30 transition-colors"
                >
                  <ChevronsLeft size={16} />
                </button>

                <button
                  type="button"
                  disabled={pulling || page === 0}
                  onClick={() => {
                    if (pulling || page === 0) return;
                    setPage((p) => p - 1);
                    setSpinKey((k) => k + 1);
                  }}
                  title="Página anterior"
                  className="size-8 flex items-center justify-center rounded-lg text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:text-zinc-400 dark:disabled:text-zinc-600 disabled:opacity-100 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:focus:ring-blue-400/30 transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>

                <div className="flex items-center gap-1.5 px-2">
                  <span className="text-xs text-zinc-700 dark:text-zinc-300">Ir a</span>
                  <input
                    type="number"
                    min={1}
                    max={totalPages}
                    value={jumpInput}
                    onChange={(e) => setJumpInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        const target = parseInt(jumpInput, 10) - 1;
                        if (
                          !isNaN(target) &&
                          target >= 0 &&
                          target < totalPages &&
                          !pulling
                        ) {
                          setPage(target);
                          setSpinKey((k) => k + 1);
                        }
                        setJumpInput("");
                      }
                    }}
                    placeholder={page + 1}
                    className="w-14 text-center text-sm font-medium text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 border border-zinc-300 dark:border-zinc-700 rounded-lg py-1 px-1 focus:outline-none focus:ring-2 focus:ring-blue-400/30 dark:focus:ring-blue-400/30 focus:border-blue-500 dark:focus:border-blue-400 bg-white dark:bg-zinc-950"
                  />
                  <span className="text-xs text-zinc-700 dark:text-zinc-300">/ {totalPages}</span>
                </div>

                <button
                  type="button"
                  disabled={pulling || page >= totalPages - 1}
                  onClick={() => {
                    if (pulling || page >= totalPages - 1) return;
                    setPage((p) => p + 1);
                    setSpinKey((k) => k + 1);
                  }}
                  title="Página siguiente"
                  className="size-8 flex items-center justify-center rounded-lg text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:text-zinc-400 dark:disabled:text-zinc-600 disabled:opacity-100 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:focus:ring-blue-400/30 transition-colors"
                >
                  <ChevronRight size={16} />
                </button>

                <button
                  type="button"
                  disabled={pulling || page >= totalPages - 1}
                  onClick={() => {
                    if (pulling || page >= totalPages - 1) return;
                    setPage(totalPages - 1);
                    setSpinKey((k) => k + 1);
                  }}
                  title="Última página"
                  className="size-8 flex items-center justify-center rounded-lg text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:text-zinc-400 dark:disabled:text-zinc-600 disabled:opacity-100 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:focus:ring-blue-400/30 transition-colors"
                >
                  <ChevronsRight size={16} />
                </button>
              </div>

              {pulling && (
                <p className="text-xs text-zinc-500 dark:text-zinc-400 animate-pulse">
                  Cargando…
                </p>
              )}
            </div>
          )}
        </>
      )}
    </section>
  );
}
