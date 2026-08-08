import { Building2, Search, X } from "@icons";
import Card from "../../../components/ui/Card";
import Input from "../../../components/ui/Input";

export default function QuoteClientPanel({
  fixedClientId,
  selectedClient,
  clientSearch,
  setClientSearch,
  setSelectedClient,
  selectedContactId,
  setSelectedContactId,
  setShowClientModal,
  resetClientData,
  items,
  loading,
  ensureQuoteFolio,
  setShowPreviewModal,
}) {
  return (
    <div className="lg:col-span-1 space-y-6">
      {!fixedClientId && (
        <Card className="border-2 border-zinc-200 dark:border-dark-700 shadow-sm !overflow-visible z-30">
          <div className="flex justify-between items-center gap-2">
            <div className="flex justify-center items-center">
              <div className="p-2 rounded-lg text-black dark:text-zinc-100">
                <Building2 size={24} />
              </div>
              <h3 className="font-semibold text-lg text-light-text-primary dark:text-zinc-100">
                Datos del Cliente
              </h3>
            </div>
            {(selectedClient || clientSearch.trim()) && (
              <button
                type="button"
                onClick={resetClientData}
                className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
              >
                <X size={13} /> Restablecer
              </button>
            )}
          </div>

          <div className="relative z-20">
            <div
              className={`w-full relative rounded-xl border ${
                selectedClient ? " " : (
                  "bg-white border-zinc-200 hover:border-[#2277B4] dark:bg-dark-900 dark:border-dark-700 dark:hover:border-blue-500"
                )
              }`}
            >
              {selectedClient ?
                ""
              : <div className="relative">
                  <Input
                    value={clientSearch}
                    onFocus={() => setShowClientModal(true)}
                    onChange={(event) => {
                      setClientSearch(event.target.value);
                      setSelectedClient(null);
                      setShowClientModal(true);
                    }}
                    placeholder="Escribe para buscar un cliente…"
                    className="w-full border-none shadow-none focus:ring-0 text-zinc-700 dark:text-zinc-200 bg-transparent"
                    style={{ paddingRight: "2.25rem" }}
                  />
                  <Search
                    size={14}
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-light-text-secondary dark:text-zinc-400"
                  />
                </div>
              }
            </div>
          </div>

          {selectedClient && (
            <>
              <div className="mt-4 p-3 rounded-xl border border-emerald-100 bg-emerald-50/60 dark:border-emerald-500/20 dark:bg-emerald-500/10 animate-fade-in">
                <div className="text-xs text-emerald-700 dark:text-emerald-300 font-bold uppercase mb-1">
                  Cliente Seleccionado
                </div>
                <div className="text-sm text-light-text-primary dark:text-zinc-100 font-medium">
                  {selectedClient.business_name}
                </div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  {selectedClient.rfc}
                </div>
              </div>

              {selectedClient.contacts?.length > 0 && (
                <div className="mt-4 relative animate-fade-in">
                  <label className="text-xs font-semibold text-light-text-secondary dark:text-zinc-400 mb-1.5 block">
                    Contacto para cotización
                  </label>
                  <select
                    value={selectedContactId}
                    onChange={(event) =>
                      setSelectedContactId(event.target.value)
                    }
                    className="w-full p-3 rounded-xl bg-white dark:bg-dark-900 border border-light-border dark:border-dark-700 focus:border-[#1a2b4c] dark:focus:border-[#2277B4] focus:ring-1 focus:ring-[#1a2b4c] dark:focus:ring-[#2277B4] text-light-text-primary dark:text-zinc-100 text-sm outline-none transition-all"
                  >
                    <option value="">-- Sin asignar --</option>
                    {selectedClient.contacts.map((contact) => (
                      <option
                        key={contact.id}
                        value={contact.id}
                        className="dark:bg-dark-900 dark:text-zinc-100"
                      >
                        {contact.full_name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </>
          )}
        </Card>
      )}

      {fixedClientId && selectedClient && (
        <Card className="border-2 border-zinc-200 dark:border-dark-700 shadow-sm !overflow-visible z-30">
          <div className="flex justify-between items-center gap-2">
            <div className="flex justify-center items-center">
              <div className="p-2 rounded-lg text-black dark:text-zinc-100">
                <Building2 size={24} />
              </div>
              <h3 className="font-semibold text-lg text-light-text-primary dark:text-zinc-100">
                Datos del Cliente
              </h3>
            </div>
          </div>

          <div className="mt-4 p-3 rounded-xl border border-emerald-100 bg-emerald-50/60 dark:border-emerald-500/20 dark:bg-emerald-500/10 animate-fade-in">
            <div className="text-xs text-emerald-700 dark:text-emerald-300 font-bold uppercase mb-1">
              Cliente Vinculado
            </div>
            <div className="text-sm text-light-text-primary dark:text-zinc-100 font-medium">
              {selectedClient.business_name}
            </div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              {selectedClient.rfc || "Sin RFC"}
            </div>
          </div>

          {selectedClient.contacts?.length > 0 ?
            <div className="mt-4 relative animate-fade-in">
              <label className="text-xs font-semibold text-light-text-secondary dark:text-zinc-400 mb-1.5 block">
                Contacto para cotización
              </label>
              <select
                value={selectedContactId}
                onChange={(event) => setSelectedContactId(event.target.value)}
                className="w-full p-3 rounded-xl bg-white dark:bg-dark-900 border border-light-border dark:border-dark-700 focus:border-[#1a2b4c] dark:focus:border-[#2277B4] focus:ring-1 focus:ring-[#1a2b4c] dark:focus:ring-[#2277B4] text-light-text-primary dark:text-zinc-100 text-sm outline-none transition-all"
              >
                <option value="">-- Sin asignar --</option>
                {selectedClient.contacts.map((contact) => (
                  <option
                    key={contact.id}
                    value={contact.id}
                    className="dark:bg-dark-900 dark:text-zinc-100"
                  >
                    {contact.full_name}
                  </option>
                ))}
              </select>
            </div>
          : <div className="mt-4 p-3 rounded-xl border border-amber-200 dark:border-amber-700/50 bg-amber-50 dark:bg-amber-900/20 text-amber-900 dark:text-amber-200 text-sm">
              Este cliente no tiene contactos registrados. Agrégalo desde
              Gestionar cliente y vuelve a esta cotización.
            </div>
          }
        </Card>
      )}

      <Card
        className={`sticky top-24${!selectedClient || items.length === 0 ? "opacity-40 pointer-events-none select-none grayscale" : "transition-all duration-150"}`}
      >
        <button
          onClick={() => {
            ensureQuoteFolio();
            setShowPreviewModal(true);
          }}
          disabled={loading || !selectedClient || items.length === 0}
          className="w-full justify-center py-4 bg-[#2277B4] hover:bg-[#125280] shadow-lg shadow-[#12528050] text-white rounded-xl font-bold text-lg disabled:cursor-not-allowed disabled:bg-blue-300 disabled:shadow-none dark:disabled:bg-blue-950/70 dark:disabled:text-blue-300"
        >
          {loading ? "Procesando…" : "Ver Vista Previa"}
        </button>
      </Card>
    </div>
  );
}
