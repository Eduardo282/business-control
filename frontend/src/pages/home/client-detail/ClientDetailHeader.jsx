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
      <div className="bg-white dark:bg-dark-800 p-6 rounded-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border border-zinc-200 dark:border-dark-700 shadow-sm dark:shadow-black/20">
        <div>
          <div className="flex items-baseline gap-3">
            <h1 className="text-3xl font-semibold text-[#1a2b4c] dark:text-zinc-100 tracking-tight">
              {clientBusinessName.toUpperCase()}
            </h1>
            <span className="px-2 py-0.5 rounded text-xs font-mono bg-zinc-100 text-zinc-700 border border-zinc-200 dark:bg-blue-500/10 dark:text-blue-300 dark:border-blue-500/20">
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
          className="inline-flex items-center gap-1.5 text-sm font-medium text-black dark:text-zinc-300 hover:text-light-text-primary dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-dark-700 px-2 py-1 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:focus:ring-blue-400/40"
        >
          <ArrowLeft size={16} />
          Volver
        </Link>
      </div>

      {error && (
        <div className="text-sm text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-500/10 p-3 rounded-xl border border-red-200 dark:border-red-500/20">
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
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? "bg-white dark:bg-dark-900 text-black dark:text-zinc-100 border-[#CBD5E1] dark:border-dark-700 shadow-sm"
                : "text-zinc-400 dark:text-zinc-500 border-transparent dark:border-transparent hover:text-black dark:hover:text-zinc-200 hover:border-zinc-200 dark:hover:border-dark-700 hover:bg-white/70 dark:hover:bg-dark-900/50"
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
