import React, { useEffect, useState } from "react";
import { Clock, ChevronDown, Trash2 } from "@icons";
import { fmtDate, getProductTypeLabel } from "./portalDashboardHelpers";

export function getDaysRemaining(expirationDate) {
  if (!expirationDate) return null;
  const end = new Date(expirationDate).getTime();
  if (Number.isNaN(end)) return null;
  const now = new Date().getTime();
  return Math.ceil((end - now) / (1000 * 60 * 60 * 24));
}

export function getProductType(service) {
  const raw = String(service?.product?.product_type || "").trim().toUpperCase();
  if (raw === "POLICY" || raw === "SERVICE") return raw;

  const source = `${service?.product?.name || ""} ${service?.product?.category || ""}`
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  if (source.includes("poliza")) return "POLICY";
  return "SERVICE";
}

export function TypeBadge({ service }) {
  const isPolicy = getProductType(service) === "POLICY";

  return (
    <span
      className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wide border ${
        isPolicy ?
          "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-500/15 dark:text-violet-300 dark:border-violet-500/30"
        : "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/15 dark:text-blue-300 dark:border-blue-500/30"
      }`}
    >
      {isPolicy ? "Póliza" : "Servicio"}
    </span>
  );
}

export function formatRemainingLabel(daysRemaining) {
  if (typeof daysRemaining !== "number" || Number.isNaN(daysRemaining)) {
    return "—";
  }
  if (daysRemaining <= 0) return "Vencido";

  const years = Math.floor(daysRemaining / 365);
  const daysAfterYears = daysRemaining % 365;
  const months = Math.floor(daysAfterYears / 30);
  const days = daysAfterYears % 30;

  const parts = [];
  if (years) parts.push(`${years} año${years === 1 ? "" : "s"}`);
  if (months && parts.length < 2) {
    parts.push(`${months} mes${months === 1 ? "" : "es"}`);
  }

  if (!years && !months) {
    parts.push(`${days} día${days === 1 ? "" : "s"}`);
  } else if (days && parts.length < 2) {
    parts.push(`${days} día${days === 1 ? "" : "s"}`);
  }

  return `${parts.join(" ")} restantes`;
}

export function ValidityGraph({ startDate, expirationDate }) {
  const start = new Date(startDate).getTime();
  const end = new Date(expirationDate).getTime();
  if (isNaN(start) || isNaN(end)) return null;

  const daysRemaining = getDaysRemaining(expirationDate);
  const isExpired = typeof daysRemaining === "number" && daysRemaining <= 0;
  const isExpiringSoon =
    typeof daysRemaining === "number" && daysRemaining <= 5;
  const isCritical =
    typeof daysRemaining === "number" && daysRemaining > 0 && daysRemaining <= 2;

  let remainingPercentage = 100;
  if (isExpired) {
    remainingPercentage = 0;
  } else if (isExpiringSoon && typeof daysRemaining === "number") {
    remainingPercentage = (daysRemaining / 5) * 100;
  }

  if (remainingPercentage < 0) remainingPercentage = 0;
  if (remainingPercentage > 100) remainingPercentage = 100;

  let colorClass = "bg-emerald-500 dark:bg-emerald-400";
  if (isExpiringSoon && !isExpired) {
    colorClass = isCritical ? "bg-red-500 dark:bg-red-400" : "bg-amber-400 dark:bg-amber-300";
  }
  if (isExpired) colorClass = "bg-red-600 dark:bg-red-500";

  let textColor = "text-emerald-700 dark:text-emerald-400";
  if (isExpiringSoon && !isExpired) {
    textColor = isCritical ? "text-red-700 dark:text-red-400" : "text-amber-700 dark:text-amber-300";
  }
  if (isExpired) textColor = "text-red-700 dark:text-red-400";

  return (
    <div className="mt-4 mb-2 bg-zinc-50 dark:bg-zinc-950/70 p-3 rounded-xl border border-zinc-100 dark:border-zinc-800">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between mb-2">
        <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide flex items-center gap-1">
          <Clock size={12} /> Vigencia
        </span>
        <span
          className={`text-[11px] font-bold ${textColor} sm:text-xs sm:text-right leading-tight break-words sm:max-w-[160px]`}
        >
          {formatRemainingLabel(daysRemaining)}
        </span>
      </div>
      <div className="h-2.5 w-full bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden shadow-inner">
        <div
          className={`h-full ${colorClass} transition-all duration-300 ease-out`}
          style={{ width: `${remainingPercentage}%` }}
        />
      </div>
    </div>
  );
}

export function StatusBadge({ status, daysRemaining }) {
  const isCritical =
    status === "EXPIRING_SOON" &&
    typeof daysRemaining === "number" &&
    daysRemaining > 0 &&
    daysRemaining <= 2;
  const styles = {
    ACTIVE: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30",
    EXPIRING_SOON: isCritical ?
      "bg-red-50 text-red-700 border-red-200 dark:bg-red-500/15 dark:text-red-300 dark:border-red-500/30"
    : "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30",
    EXPIRED: "bg-red-50 text-red-700 border-red-200 dark:bg-red-500/15 dark:text-red-300 dark:border-red-500/30",
    CANCELLED: "bg-zinc-200 text-zinc-700 border-zinc-300 dark:bg-zinc-700 dark:text-zinc-300 dark:border-zinc-600",
  };

  const labels = {
    ACTIVE: "Activo",
    EXPIRING_SOON: "Por Vencer",
    EXPIRED: "Vencido",
    CANCELLED: "Cancelado",
  };

  return (
    <span
      className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wide border ${
        styles[status] || "bg-zinc-50 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700"
      }`}
    >
      {labels[status] || status}
    </span>
  );
}

export function getTimeColor(status, daysRemaining) {
  if (status === "CANCELLED") return "text-zinc-500 dark:text-zinc-400";
  if (status === "EXPIRED") return "text-red-700 dark:text-red-400 line-through";
  if (status === "EXPIRING_SOON") {
    if (typeof daysRemaining === "number" && daysRemaining <= 2) {
      return "text-red-700 dark:text-red-400";
    }
    return "text-amber-700 dark:text-amber-300";
  }
  return "text-emerald-700 dark:text-emerald-400";
}

export function ServiceReel({ service, spinCount, index, isDeleting, onDelete, onOpenFolio }) {
  const [rotation, setRotation] = useState(0);
  const [faces, setFaces] = useState(Array(12).fill(null));

  useEffect(() => {
    const targetFace = (spinCount * 3) % 12;
    setFaces((prev) => {
      const next = [...prev];
      next[targetFace] = service;
      return next;
    });
  }, [spinCount, service]);

  useEffect(() => {
    const t = setTimeout(
      () => {
        setRotation(spinCount * 90);
      },
      50 + index * 180,
    );
    return () => clearTimeout(t);
  }, [spinCount, index]);

  return (
    <div className="reel-window border border-zinc-200 dark:border-zinc-800 shadow-sm dark:shadow-black/30">
      <div className="shading-overlay" />
      <div
        className="reel-drum"
        style={{ transform: `rotateX(-${rotation}deg)` }}
      >
        {faces.map((item, fIdx) => (
          <div
            key={fIdx}
            className="symbol-face"
            style={{ transform: `rotateX(${fIdx * 30}deg) translateZ(746px)` }}
          >
            {item ? (() => {
              const daysRemaining = getDaysRemaining(item.expiration_date);
              return (
                <div
                  className={`relative p-5 flex flex-col h-[380px] bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 overflow-hidden shadow-sm dark:shadow-black/30 mx-2 my-2.5 rounded-xl text-zinc-800 dark:text-zinc-100 ${
                    item.status === "CANCELLED" ?
                      "opacity-50 grayscale"
                    : ""
                  }`}
                >
                  {item._uniqueFoliosCount > 1 && (
                    <button
                      type="button"
                      onClick={() => onOpenFolio("UNIQUE_FOLIOS")}
                      className="absolute top-0 right-0 bg-blue-600 dark:bg-blue-400 hover:bg-blue-700 dark:hover:bg-blue-300 text-white dark:text-blue-950 text-[10px] font-bold pl-2 pr-1.5 py-1 rounded-bl-xl rounded-tr-xl flex items-center justify-center shadow-sm transition-colors cursor-pointer z-10"
                      aria-label="Ver folios"
                    >
                      x{item._uniqueFoliosCount} <ChevronDown size={12} className="ml-0.5" />
                    </button>
                  )}
                  <div className="flex justify-between items-start mb-1 gap-2 mt-1">
                    <div className="flex flex-col flex-1">
                      <h3
                        className="font-semibold text-zinc-800 dark:text-zinc-100 line-clamp-2 md:text-sm lg:text-base leading-tight"
                        title={item.product?.name}
                      >
                        {item.product?.name || "Servicio"}
                      </h3>
                      <div className="flex items-center gap-1 mt-1">
                        {item.product?.folio && (
                          <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono tracking-wider uppercase">
                            {item.product.folio}
                          </span>
                        )}
                        {(() => {
                          const sameFolioCount = item._groupItems ? item._groupItems.filter(i => i.product?.folio === item.product?.folio).length : 1;
                          if (sameFolioCount > 1) {
                            return (
                              <button
                                type="button"
                                onClick={() => onOpenFolio("SAME_FOLIO", item.product?.folio)}
                                className="inline-flex items-center gap-0.5 text-[9px] font-bold bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-500/30 px-1.5 py-0.5 rounded transition-colors cursor-pointer ml-1"
                                aria-label="Ver instancias"
                              >
                                x{sameFolioCount} <ChevronDown size={10} />
                              </button>
                            );
                          }
                          return null;
                        })()}
                      </div>
                    </div>
                  </div>

                  <ValidityGraph
                    startDate={item.start_date}
                    expirationDate={item.expiration_date}
                  />

                  <p className="text-xs text-zinc-500 dark:text-zinc-400 my-2 leading-relaxed line-clamp-2 flex-1">
                    {item.product?.description}
                  </p>

                  <div className="space-y-2 mt-auto">
                    <div className="flex items-center gap-2 mb-2">
                      <StatusBadge status={item.status} daysRemaining={daysRemaining} />
                      <TypeBadge service={item} />
                    </div>

                    {item.license_key && (
                      <div className="bg-zinc-50 dark:bg-zinc-950/70 p-2 rounded border border-zinc-200 dark:border-zinc-700">
                        <span className="block text-[8px] text-emerald-700 dark:text-emerald-400 font-bold uppercase tracking-wider mb-0.5">
                          Licencia
                        </span>
                        <code className="text-zinc-800 dark:text-zinc-200 font-mono select-all text-[10px] break-all block">
                          {item.license_key}
                        </code>
                      </div>
                    )}

                    <div className="border-t border-zinc-100 dark:border-zinc-800 pt-2 space-y-0.5">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-zinc-500 dark:text-zinc-400">Inicio:</span>
                        <span className="text-zinc-600 dark:text-zinc-300">
                          {new Date(item.start_date).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex justify-between text-[11px] items-center">
                        <span className="text-zinc-500 dark:text-zinc-400">Vence:</span>
                        <span
                          className={`font-mono font-semibold z-10 ${getTimeColor(
                            item.status,
                            daysRemaining
                          )}`}
                        >
                          {new Date(item.expiration_date).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onDelete?.(item.id)}
                      disabled={isDeleting}
                      className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/15 px-3 py-2 text-xs font-semibold text-red-700 dark:text-red-300 transition-colors hover:bg-red-100 dark:hover:bg-red-500/25 disabled:bg-red-50/60 dark:disabled:bg-red-950/30 disabled:text-red-400 dark:disabled:text-red-500 disabled:cursor-not-allowed disabled:opacity-100"
                      title={isDeleting ? "Eliminando…" : "Eliminar"}
                    >
                      <Trash2 size={13} className={isDeleting ? "animate-pulse" : ""} />
                      {isDeleting ? "Eliminando…" : "Eliminar"}
                    </button>
                  </div>
                </div>
              );
            })() : (
              <div className="flex flex-col items-center justify-center bg-white dark:bg-zinc-900 border-2 border-dashed border-zinc-200 dark:border-zinc-700 h-[380px] mx-2 my-2.5 rounded-xl" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
