import React from "react";
import { createPortal } from "react-dom";
import { X } from "@icons";
import { PortalDashboardServicesList } from "./PortalDashboardServicesList";

export default function PortalDashboardView({ controller }) {
  const {
    activeFolioGroup,
    currentServices,
    deletingServiceId,
    filteredServices,
    handleDeleteService,
    handleSelectGroupService,
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
  } = controller;

  return (
    <div className="space-y-10">
      <PortalDashboardServicesList
        currentServices={currentServices}
        deletingServiceId={deletingServiceId}
        filteredServices={filteredServices}
        handleDeleteService={handleDeleteService}
        jumpInput={jumpInput}
        page={page}
        pulling={pulling}
        searchTerm={searchTerm}
        setActiveFolioGroup={setActiveFolioGroup}
        setJumpInput={setJumpInput}
        setPage={setPage}
        setSearchTerm={setSearchTerm}
        setSpinKey={setSpinKey}
        setStatusFilter={setStatusFilter}
        spinKey={spinKey}
        statusFilter={statusFilter}
        totalPages={totalPages}
      />

      {activeFolioGroup &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/45 dark:bg-black/70 p-4"
            onClick={() => setActiveFolioGroup(null)}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="service-folio-selection-title"
              className="w-full max-w-md overflow-hidden rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 shadow-2xl dark:shadow-black/50"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-700 bg-[#1a2b4c] dark:bg-zinc-950 px-5 py-4">
                <div className="min-w-0">
                  <h3
                    id="service-folio-selection-title"
                    className="truncate text-base font-semibold text-white"
                  >
                    Folios de {activeFolioGroup.name}
                  </h3>
                  <p className="mt-1 text-[11px] text-zinc-300 dark:text-zinc-400">
                    Selecciona el folio que deseas visualizar
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveFolioGroup(null)}
                  aria-label="Cerrar selector de folios"
                  className="flex size-8 items-center justify-center rounded-lg text-white dark:text-zinc-100 transition-colors hover:bg-white/10 dark:hover:bg-white/10"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="max-h-80 divide-y divide-zinc-100 dark:divide-zinc-800 overflow-y-auto p-3">
                {(() => {
                  let displayItems = activeFolioGroup.items;
                  if (activeFolioGroup.filterMode === "SAME_FOLIO") {
                    displayItems = displayItems.filter(svc => svc.product?.folio === activeFolioGroup.filterValue);
                  } else if (activeFolioGroup.filterMode === "UNIQUE_FOLIOS") {
                    const seen = new Set();
                    displayItems = displayItems.filter(svc => {
                      const f = svc.product?.folio || "";
                      if (seen.has(f)) return false;
                      seen.add(f);
                      return true;
                    });
                  }

                  return displayItems.map((svc) => {
                    const isSelected = String(svc.id) === String(activeFolioGroup.selectedId);
                    return (
                      <button
                        key={svc.id}
                        type="button"
                        onClick={() => handleSelectGroupService(activeFolioGroup.key, svc)}
                        className={`flex w-full items-center justify-between rounded-lg px-3 py-3 text-left transition-colors ${
                          isSelected
                            ? "bg-blue-50 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300 ring-1 ring-inset ring-blue-200 dark:ring-blue-500/30"
                            : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                        }`}
                      >
                        <div className="flex flex-col">
                          <span className="font-mono text-sm font-bold tracking-wider">
                            {svc.product?.folio || "Sin folio"}
                          </span>
                          <span className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                            {new Date(svc.start_date).toLocaleDateString()} — {new Date(svc.expiration_date).toLocaleDateString()}
                          </span>
                        </div>
                        {isSelected && (
                          <span className="text-[11px] font-semibold uppercase">
                            Actual
                          </span>
                        )}
                      </button>
                    );
                  });
                })()}
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
