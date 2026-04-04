import { useState, useEffect, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import {
  Package,
  Inbox,
  FileText,
  Clock,
  Search,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  Filter,
  X,
} from "@icons";
import { listPortalQuotesApi } from "../../actionsAPI/portal.api";

export default function PortalDashboard() {
  const { contact } = useOutletContext();
  const services = contact?.active_services || [];
  const [quotes, setQuotes] = useState([]);
  const [loadingQuotes, setLoadingQuotes] = useState(false);
  const [page, setPage] = useState(0);
  const [pulling, setPulling] = useState(false);
  const [spinKey, setSpinKey] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [jumpInput, setJumpInput] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Formato de fecha legible para búsqueda por texto
  const fmtDate = (d) => {
    if (!d) return "";
    try {
      return new Date(d).toLocaleDateString("es-MX");
    } catch {
      return "";
    }
  };

  const filteredServices = useMemo(() => {
    return services.filter((service) => {
      // Filtro por estado
      if (statusFilter !== "ALL" && service.status !== statusFilter)
        return false;

      // Filtro por texto
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return (
        service.product?.name?.toLowerCase().includes(term) ||
        service.product?.description?.toLowerCase().includes(term) ||
        service.license_key?.toLowerCase().includes(term) ||
        service.status?.toLowerCase().includes(term) ||
        fmtDate(service.start_date).includes(term) ||
        fmtDate(service.expiration_date).includes(term)
      );
    });
  }, [services, searchTerm, statusFilter]);

  const PAGE_SIZE = 3;
  const totalPages = Math.ceil(filteredServices.length / PAGE_SIZE);
  const currentServices = filteredServices.slice(
    page * PAGE_SIZE,
    page * PAGE_SIZE + PAGE_SIZE,
  );

  useEffect(() => {
    setPage(0);
  }, [searchTerm, statusFilter]);

  useEffect(() => {
    async function fetchQuotes() {
      setLoadingQuotes(true);
      try {
        const data = await listPortalQuotesApi();
        setQuotes(data);
      } catch (e) {
        console.error("Error fetching quotes", e);
      } finally {
        setLoadingQuotes(false);
      }
    }
    fetchQuotes();
  }, []);

  return (
    <div className="space-y-10">
      {/* Sección de Servicios */}
      <section>
        <div className="flex flex-col gap-3 mb-6">
          {/* Fila superior: título */}
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Package className="text-black" size={24} /> Mis Servicios y
              Licencias
            </h2>

            {/* Filtros */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Búsqueda de texto */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search size={16} className="text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Nombre, licencia, fecha..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-8 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors bg-white w-56"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute inset-y-0 right-2 flex items-center text-gray-400 hover:text-gray-600">
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Filtro por estado */}
              <div className="flex items-center gap-1 border border-gray-200 rounded-xl bg-white px-1 py-1">
                <Filter size={14} className="text-gray-400 ml-1" />
                {[
                  { value: "ALL", label: "Todos" },
                  { value: "ACTIVE", label: "Activo" },
                  { value: "EXPIRING_SOON", label: "Por Vencer" },
                  { value: "EXPIRED", label: "Vencido" },
                ].map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => setStatusFilter(value)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                      statusFilter === value ?
                        value === "ACTIVE" ? "bg-emerald-500 text-white"
                        : value === "EXPIRING_SOON" ? "bg-orange-400 text-white"
                        : value === "EXPIRED" ? "bg-gray-400 text-white"
                        : "bg-blue-900 text-white"
                      : "text-gray-500 hover:bg-gray-100"
                    }`}>
                    {label}
                  </button>
                ))}
              </div>

              {/* Badge de resultados */}
              {(searchTerm || statusFilter !== "ALL") && (
                <span className="text-xs text-gray-400">
                  {filteredServices.length} resultado
                  {filteredServices.length !== 1 ? "s" : ""}
                </span>
              )}
            </div>
          </div>
        </div>

        {filteredServices.length === 0 ?
          <div className="bg-gray-50 p-12 text-center rounded-2xl border-2 border-dashed border-gray-200">
            <div className="flex justify-center mb-4">
              <Inbox size={48} className="text-gray-300" />
            </div>
            <p className="text-gray-500">
              {searchTerm || statusFilter !== "ALL" ?
                "No se encontraron servicios que coincidan con los filtros."
              : "No tienes servicios activos actualmente."}
            </p>
          </div>
        : <>
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
                  /* Permite que los elementos se posicionen en linea en PC */
                  flex-wrap: wrap;
                  justify-content: center;
              }
              .reel-window {
                  width: 280px;
                  height: 300px;
                  background: #fff;
                  border-radius: 15px;
                  position: relative;
                  overflow: hidden;
              }
              .reel-drum {
                  width: 100%;
                  height: 300px;
                  position: absolute;
                  top: 0; 
                  transform-style: preserve-3d;
                  transition: transform 0.8s cubic-bezier(0.45, 0.05, 0.55, 0.95);
                  will-change: transform;
              }
              .symbol-face {
                  position: absolute;
                  width: 100%;
                  height: 300px;
                  backface-visibility: hidden;
                  background: white;
                  box-sizing: border-box;
              }
            `}</style>

            <div className="casino-wrapper">
              <div className="machine-body">
                {/* 3 Rodillos */}
                {[0, 1, 2].map((idx) => {
                  const service = currentServices[idx]; // The service destined for this reel
                  return (
                    <ServiceReel
                      key={idx}
                      index={idx}
                      service={service}
                      spinCount={spinKey}
                    />
                  );
                })}
              </div>
            </div>

            {/* Controles de paginación */}
            {totalPages > 1 && (
              <div className="flex flex-col items-center mt-6 gap-3">
                <p className="text-xs text-gray-400 font-medium tracking-wide">
                  Página {page + 1} / {totalPages} — Total{" "}
                  {filteredServices.length} servicios
                </p>

                {/* Barra de controles */}
                <div className="flex items-center gap-1 backdrop-blur-smrounded-2xl px-3 py-2 shadow-sm">
                  {/* Primera página */}
                  <button
                    disabled={pulling || page === 0}
                    onClick={() => {
                      if (pulling || page === 0) return;
                      setPulling(true);
                      setTimeout(() => {
                        setPage(0);
                        setSpinKey((k) => k + 1);
                      }, 50);
                      setTimeout(() => setPulling(false), 1000);
                    }}
                    title="Primera página"
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-black hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                    <ChevronsLeft size={16} />
                  </button>

                  {/* Página anterior */}
                  <button
                    disabled={pulling || page === 0}
                    onClick={() => {
                      if (pulling || page === 0) return;
                      setPulling(true);
                      setTimeout(() => {
                        setPage((p) => p - 1);
                        setSpinKey((k) => k + 1);
                      }, 50);
                      setTimeout(() => setPulling(false), 1000);
                    }}
                    title="Página anterior"
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-black hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                    <ChevronLeft size={16} />
                  </button>

                  {/* Input de salto de página */}
                  <div className="flex items-center gap-1.5 px-2">
                    <span className="text-xs text-black">Ir a</span>
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
                            setPulling(true);
                            setTimeout(() => {
                              setPage(target);
                              setSpinKey((k) => k + 1);
                            }, 50);
                            setTimeout(() => setPulling(false), 1000);
                          }
                          setJumpInput("");
                        }
                      }}
                      placeholder={page + 1}
                      className="w-14 text-center text-sm font-medium border border-gray-300 rounded-lg py-1 px-1 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 bg-white"
                    />
                    <span className="text-xs text-black">/ {totalPages}</span>
                  </div>

                  {/* Página siguiente */}
                  <button
                    disabled={pulling || page >= totalPages - 1}
                    onClick={() => {
                      if (pulling || page >= totalPages - 1) return;
                      setPulling(true);
                      setTimeout(() => {
                        setPage((p) => p + 1);
                        setSpinKey((k) => k + 1);
                      }, 50);
                      setTimeout(() => setPulling(false), 1000);
                    }}
                    title="Página siguiente"
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-black hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                    <ChevronRight size={16} />
                  </button>

                  {/* Última página */}
                  <button
                    disabled={pulling || page >= totalPages - 1}
                    onClick={() => {
                      if (pulling || page >= totalPages - 1) return;
                      setPulling(true);
                      setTimeout(() => {
                        setPage(totalPages - 1);
                        setSpinKey((k) => k + 1);
                      }, 50);
                      setTimeout(() => setPulling(false), 1000);
                    }}
                    title="Última página"
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-black hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                    <ChevronsRight size={16} />
                  </button>
                </div>

                {pulling && (
                  <p className="text-xs text-gray-400 animate-pulse">
                    Cargando...
                  </p>
                )}
              </div>
            )}
          </>
        }
      </section>
    </div>
  );
}

function QuoteStatusBadge({ status }) {
  const styles = {
    PENDING: "bg-orange-50 text-orange-600 border-orange-200",
    SENT: "bg-blue-50 text-blue-600 border-blue-200",
    ACCEPTED: "bg-emerald-50 text-emerald-600 border-emerald-200",
    REJECTED: "bg-red-50 text-red-600 border-red-200",
  };
  const labels = {
    PENDING: "Pendiente",
    SENT: "Enviada",
    ACCEPTED: "Aceptada",
    REJECTED: "Rechazada",
  };
  return (
    <span
      className={`px-2 py-1 rounded-md text-xs font-bold border ${styles[status] || "bg-gray-100 text-gray-500"}`}>
      {labels[status] || status}
    </span>
  );
}

function ValidityGraph({ startDate, expirationDate }) {
  const start = new Date(startDate).getTime();
  const end = new Date(expirationDate).getTime();
  // Validar fechas
  if (isNaN(start) || isNaN(end)) return null;

  const now = new Date().getTime();

  const totalDuration = end - start;
  const elapsed = now - start;

  // Evitar división por cero
  let remainingPercentage = 0;
  if (totalDuration > 0) {
    remainingPercentage = 100 - (elapsed / totalDuration) * 100;
  } else {
    // Si start y end son iguales o raros, manejamos casos borde
    remainingPercentage = now > end ? 0 : 100;
  }

  // Clamping
  if (remainingPercentage < 0) remainingPercentage = 0;
  if (remainingPercentage > 100) remainingPercentage = 100;

  const diffTime = end - now;
  const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  const isExpiringSoon = daysRemaining <= 20;
  const isExpired = daysRemaining <= 0;

  let colorClass = "bg-emerald-500";
  if (isExpiringSoon && !isExpired) colorClass = "bg-red-500";
  if (isExpired) colorClass = "bg-gray-300";

  let textColor = "text-emerald-600";
  if (isExpiringSoon && !isExpired) textColor = "text-red-600";
  if (isExpired) textColor = "text-gray-500";

  return (
    <div className="mt-4 mb-2 bg-gray-50 p-3 rounded-xl border border-gray-100">
      <div className="flex justify-between items-end mb-2">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1">
          <Clock size={12} /> Vigencia
        </span>
        <span className={`text-xs font-bold ${textColor}`}>
          {isExpired ? "Vencido" : `${daysRemaining} días restantes`}
        </span>
      </div>
      <div className="h-2.5 w-full bg-gray-200 rounded-full overflow-hidden shadow-inner">
        <div
          className={`h-full ${colorClass} transition-all duration-1000 ease-out`}
          style={{ width: `${remainingPercentage}%` }}
        />
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    ACTIVE: "bg-emerald-50 text-emerald-600 border-emerald-200",
    EXPIRING_SOON: "bg-red-50 text-red-600 border-red-200", // Changed to red per instructions "red if expiring"
    EXPIRED: "bg-gray-100 text-gray-500 border-gray-200",
  };

  const labels = {
    ACTIVE: "Activo",
    EXPIRING_SOON: "Por Vencer",
    EXPIRED: "Vencido",
  };

  return (
    <span
      className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wide border ${
        styles[status] || "bg-gray-50 text-gray-500 border-gray-200"
      }`}>
      {labels[status] || status}
    </span>
  );
}

function getTimeColor(status) {
  if (status === "EXPIRED") return "text-gray-400 line-through";
  if (status === "EXPIRING_SOON") return "text-red-600";
  return "text-emerald-600";
}

function ServiceReel({ service, spinCount, index }) {
  const [rotation, setRotation] = useState(0);
  const [faces, setFaces] = useState(Array(12).fill(null));

  // Actualiza la cara objetivo antes de rotar
  useEffect(() => {
    // Cada spin = 90 grados = 3 caras (porque son 12 caras en 360, 30deg/cara)
    const targetFace = (spinCount * 3) % 12;
    setFaces((prev) => {
      const next = [...prev];
      next[targetFace] = service;
      return next;
    });
  }, [spinCount, service]);

  // Aplica la rotación con un ligero retardo escalonado por cilindro
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
    <div className="reel-window">
      <div className="shading-overlay" />
      <div
        className="reel-drum"
        style={{ transform: `rotateX(-${rotation}deg)` }}>
        {faces.map((item, fIdx) => (
          <div
            key={fIdx}
            className="symbol-face"
            style={{ transform: `rotateX(${fIdx * 30}deg) translateZ(525px)` }}>
            {item ?
              <div className="p-5 flex flex-col h-[280px] bg-white border-l-4 border-[#1a2b4c] overflow-hidden shadow-sm mx-2 my-2.5 rounded-xl">
                <div className="flex justify-between items-start mb-1 gap-2">
                  <h3
                    className="font-bold text-gray-800 line-clamp-2 md:text-sm lg:text-base leading-tight"
                    title={item.product?.name}>
                    {item.product?.name || "Servicio"}
                  </h3>
                  <StatusBadge status={item.status} />
                </div>

                <ValidityGraph
                  startDate={item.start_date}
                  expirationDate={item.expiration_date}
                />

                <p className="text-xs text-gray-500 my-2 leading-relaxed line-clamp-2 flex-1">
                  {item.product?.description}
                </p>

                <div className="space-y-2 mt-auto">
                  {item.license_key && (
                    <div className="bg-gray-50 p-2 rounded border border-gray-200">
                      <span className="block text-[8px] text-emerald-600 font-bold uppercase tracking-wider mb-0.5">
                        Licencia
                      </span>
                      <code className="text-gray-800 font-mono select-all text-[10px] break-all block">
                        {item.license_key}
                      </code>
                    </div>
                  )}

                  <div className="border-t border-gray-100 pt-2 space-y-0.5">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-gray-400">Inicio:</span>
                      <span className="text-gray-600">
                        {new Date(item.start_date).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-[11px] items-center">
                      <span className="text-gray-400">Vence:</span>
                      <span
                        className={`font-mono font-semibold z-10 ${getTimeColor(
                          item.status,
                        )}`}>
                        {new Date(item.expiration_date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            : <div className="flex flex-col items-center justify-center bg-white border-2 border-dashed border-gray-200 h-[280px] mx-2 my-2.5 rounded-xl">
              </div>
            }
          </div>
        ))}
      </div>
    </div>
  );
}
