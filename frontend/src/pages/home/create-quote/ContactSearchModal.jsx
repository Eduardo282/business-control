import { useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { Search, UserCircle, X } from "@icons";

function normalizeText(text) {
  return String(text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export default function ContactSearchModal({
  contacts,
  isOpen,
  onClose,
  onSelect,
  selectedContactId,
}) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const s = normalizeText(search);
    if (!s) return contacts;

    return contacts.filter((c) => {
      const searchable = normalizeText(
        [c.full_name, c.email, c.phone, c.celular].join(" "),
      );
      return searchable.includes(s);
    });
  }, [contacts, search]);

  if (!isOpen) return null;

  const handleSelect = (contact) => {
    onSelect(contact ? String(contact.id) : "");
    setSearch("");
    onClose();
  };

  const handleClose = () => {
    setSearch("");
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-dark-900 border border-zinc-200 dark:border-dark-700 rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-100 dark:border-white/10 flex items-center justify-between bg-[#1a2b4c]">
          <div>
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              Seleccionar Contacto
            </h2>
            <p className="text-sm text-zinc-300 mt-1">
              Asigna un contacto a esta cotización
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="size-8 flex items-center justify-center rounded-lg text-white hover:bg-white/20 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-zinc-100 dark:border-dark-700">
          <div className="relative">
            <Search
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500"
              size={18}
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre, email o teléfono…"
              className="w-full pl-4 pr-10 py-3 rounded-xl border border-zinc-200 dark:border-dark-700 bg-zinc-50 dark:bg-dark-800 text-zinc-700 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:bg-white dark:focus:bg-dark-900 focus:border-[#2277B4] dark:focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-[#2277B4]/30 dark:focus:ring-blue-500/30 transition-all"
              autoFocus
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-9 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-red-500 transition-colors focus:outline-none"
                title="Limpiar búsqueda"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {/* Sin asignar option */}
          <div
            onClick={() => handleSelect(null)}
            className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center gap-3 group ${
              !selectedContactId
                ? "border-[#2277B4] bg-blue-50/50 dark:border-blue-500 dark:bg-blue-500/10"
                : "border-zinc-100 dark:border-dark-700 bg-white dark:bg-dark-900 hover:border-[#2277B4]/50 dark:hover:border-blue-500/50 hover:bg-blue-50/30 dark:hover:bg-blue-500/10"
            }`}
          >
            <div className="size-9 rounded-full bg-zinc-100 dark:bg-dark-800 flex items-center justify-center text-zinc-400 dark:text-zinc-500">
              <X size={16} />
            </div>
            <span className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
              Sin asignar
            </span>
          </div>

          {filtered.length > 0 ? (
            filtered.map((contact) => {
              const isSelected = String(contact.id) === String(selectedContactId);

              return (
                <div
                  key={contact.id}
                  onClick={() => handleSelect(contact)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center gap-3 group ${
                    isSelected
                      ? "border-[#2277B4] bg-blue-50/50 dark:border-blue-500 dark:bg-blue-500/10"
                      : "border-zinc-100 dark:border-dark-700 bg-white dark:bg-dark-900 hover:border-[#2277B4]/50 dark:hover:border-blue-500/50 hover:bg-blue-50/30 dark:hover:bg-blue-500/10"
                  }`}
                >
                  <div className="size-9 rounded-full bg-[#2277B4]/10 dark:bg-blue-500/20 flex items-center justify-center text-[#2277B4] dark:text-blue-400 shrink-0">
                    <UserCircle size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm text-zinc-800 dark:text-zinc-100 group-hover:text-[#2277B4] dark:group-hover:text-blue-300 transition-colors truncate">
                      {contact.full_name}
                    </div>
                    <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 flex items-center gap-3 flex-wrap">
                      {contact.email && <span>{contact.email}</span>}
                      {(contact.phone || contact.celular) && (
                        <span>{contact.phone || contact.celular}</span>
                      )}
                    </div>
                  </div>
                  {isSelected && (
                    <span className="text-xs font-bold text-[#2277B4] dark:text-blue-400 shrink-0">
                      Seleccionado
                    </span>
                  )}
                </div>
              );
            })
          ) : search.trim() ? (
            <div className="text-center py-10 text-zinc-400 dark:text-zinc-500">
              <UserCircle size={40} className="mx-auto mb-3 opacity-20" />
              No se encontraron contactos con &quot;{search}&quot;
            </div>
          ) : null}
        </div>
      </div>
    </div>,
    document.body,
  );
}
