import React, { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { XCircle } from "@icons";
import { getQuoteDisplayStatus } from "../../../utils/quoteStatus";
import { QUOTE_HISTORY_STATUS_OPTIONS } from "./quoteHistoryConstants";

export function StatusCell({ row }) {
  const currentStatus = getQuoteDisplayStatus(row.original);

  const currentOption = QUOTE_HISTORY_STATUS_OPTIONS.find(
    (option) => option.value === currentStatus,
  );

  return (
    <div className="text-right flex justify-end">
      <div
        className={`text-[10px] uppercase font-bold tracking-wider px-4 py-1 rounded border text-center min-w-[110px] ${currentOption?.color}`}
      >
        {currentOption?.label}
      </div>
    </div>
  );
}

export function RejectQuoteButton({ quote, onReject }) {
  const triggerRef = useRef(null);
  const [tooltipPosition, setTooltipPosition] = useState(null);
  const isRejected = quote.status === "RECHAZADA";
  const tooltipId = `reject-quote-tooltip-${quote.id}`;

  const showTooltip = () => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;

    setTooltipPosition({
      top: rect.top - 10,
      left: rect.left + rect.width / 2,
    });
  };

  const hideTooltip = () => setTooltipPosition(null);

  return (
    <span
      ref={triggerRef}
      className="inline-flex"
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocusCapture={showTooltip}
      onBlurCapture={hideTooltip}
    >
      <button
        type="button"
        onClick={() => {
          if (!isRejected) onReject(quote.id, "RECHAZADA");
        }}
        aria-disabled={isRejected}
        aria-label={
          isRejected ? "Cotización ya rechazada" : "Rechazar cotización"
        }
        aria-describedby={tooltipPosition ? tooltipId : undefined}
        className={`size-8 inline-flex items-center justify-center rounded-lg border transition-all ${
          isRejected
            ? "cursor-not-allowed border-zinc-200 bg-zinc-100 text-zinc-400 dark:border-zinc-600 dark:bg-dark-700 dark:text-zinc-500"
            : "border-red-200 bg-red-50 text-red-600 shadow-sm hover:border-red-300 hover:bg-red-100 hover:text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400 dark:hover:border-red-400/50 dark:hover:bg-red-500/20 dark:hover:text-red-300"
        }`}
      >
        <XCircle size={15} />
      </button>

      {tooltipPosition &&
        createPortal(
          <div
            id={tooltipId}
            role="tooltip"
            style={{
              top: tooltipPosition.top,
              left: tooltipPosition.left,
            }}
            className="pointer-events-none fixed z-[10000] w-52 -translate-x-1/2 -translate-y-full rounded-xl bg-zinc-900 px-3 py-2.5 text-left text-white shadow-xl dark:bg-zinc-100 dark:text-zinc-900"
          >
            <div className="text-xs font-bold">
              {isRejected
                ? "Cotización rechazada"
                : "Rechazar cotización"}
            </div>
            <div className="mt-1 text-[11px] leading-4 text-zinc-300 dark:text-zinc-600">
              {isRejected
                ? ""
                : "Al hacer clic, la cotización sera Rechazada."}
            </div>
            <span className="absolute left-1/2 top-full size-2 -translate-x-1/2 -translate-y-1/2 rotate-45 bg-zinc-900 dark:bg-zinc-100" />
          </div>,
          document.body,
        )}
    </span>
  );
}
