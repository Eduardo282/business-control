import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Building2,
  ClipboardList,
  MapPin,
} from "@icons";
import { hasValue } from "./utils";

export default function ClientDetailHeader({
  client,
  error,
  activeTab,
  setActiveTab,
}) {
  const clientBusinessName = String(client.business_name || "Cliente");
  const clientIdShort = String(client.id ?? "").slice(0, 8);

  return (
    <>
      <div className="glass-panel glass-mirror p-6 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border border-white/25 dark:border-white/10 bg-white/35 dark:bg-dark-900/60 backdrop-blur-xl shadow-glass-sm dark:shadow-glass-mirror">
        <div>
          <div className="flex items-baseline gap-3">
            <h1 className="text-3xl font-semibold text-[#1a2b4c] dark:text-zinc-100 tracking-tight">
              {clientBusinessName.toUpperCase()}
            </h1>
            <span className="px-2.5 py-0.5 rounded-lg text-xs font-mono bg-white/60 text-zinc-700 border border-white/40 dark:bg-blue-500/10 dark:text-blue-300 dark:border-blue-500/20 backdrop-blur-md">
              ID: {clientIdShort || "N/A"}
            </span>
          </div>
          <div className="flex flex-wrap gap-4 mt-2 text-sm text-light-text-secondary dark:text-zinc-400">
            <span className="flex items-center gap-1">
              <ClipboardList
                size={16}
                className="text-black dark:text-zinc-400"
              />{" "}
              {client.rfc || "Sin RFC"}
            </span>
            {hasValue(client.address) && (
              <span className="flex items-center gap-1">
                <MapPin
                  size={16}
                  className="text-black dark:text-zinc-400"
                />{" "}
                {client.address}
              </span>
            )}
          </div>
        </div>

        <Link
          to="/clientes"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-zinc-800 dark:text-zinc-200 hover:text-light-text-primary dark:hover:text-zinc-100 bg-white/60 hover:bg-white/90 dark:bg-dark-900/60 dark:hover:bg-dark-700 px-3 py-1.5 rounded-xl border border-white/30 dark:border-white/10 transition-all backdrop-blur-md shadow-glass-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:focus:ring-blue-400/40"
        >
          <ArrowLeft size={16} />
          Volver
        </Link>
      </div>

      {error && (
        <div className="text-sm text-red-700 dark:text-red-300 bg-red-50/80 dark:bg-red-500/10 p-3 rounded-xl border border-red-200/80 dark:border-red-500/20 backdrop-blur-md">
          {error}
        </div>
      )}

      <div className="flex gap-2 pb-1 mb-6 overflow-x-auto custom-scrollbar [scrollbar-width:thin] [scrollbar-color:#d4d4d8_transparent] dark:[scrollbar-color:#52525b_transparent]">
        {[
          {
            id: "general",
            label: "General",
            icon: <Building2 size={18} />,
          },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl border transition-all whitespace-nowrap backdrop-blur-md shadow-glass-sm ${
              activeTab === tab.id
                ? "bg-white/80 dark:bg-dark-900/80 text-[#1a2b4c] dark:text-blue-300 border-white/50 dark:border-white/15"
                : "bg-white/40 dark:bg-dark-900/40 text-zinc-600 dark:text-zinc-400 border-white/20 dark:border-white/10 hover:bg-white/60 dark:hover:bg-dark-900/60 hover:text-zinc-900 dark:hover:text-zinc-200"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>
    </>
  );
}
