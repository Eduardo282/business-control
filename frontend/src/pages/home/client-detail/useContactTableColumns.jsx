import { useMemo } from "react";
import { ChevronDown, ChevronRight, Edit2, Key, Trash2 } from "@icons";
import { CONTACT_FIELD_LABELS } from "./clientDetailConstants";
import { hasValue } from "./utils";

export function useContactTableColumns({
  contactPrimaryColumns,
  contactDetailColumns,
  expandedContactRows,
  setExpandedContactRows,
  setManagingPortalContact,
  startEditContact,
  handleDeleteContact,
}) {
  const contactsColumns = useMemo(() => {
    const dynamicDataColumns = contactPrimaryColumns.map((column) => ({
      accessorKey: column.name,
      header: column.label,
      cell: ({ row, getValue }) => {
        const rawValue = getValue();
        const value = hasValue(rawValue) ? String(rawValue) : "—";

        if (column.name === "full_name") {
          return (
            <div className="flex items-center gap-3">
              <div>
                <span
                  className={`font-medium ${
                    row.original.is_active === false ||
                    row.original.is_active === 0
                      ? "text-zinc-400 dark:text-zinc-500 line-through"
                      : "text-zinc-800 dark:text-zinc-100"
                  }`}
                >
                  {value}
                </span>
                {row.original.is_active === false ||
                row.original.is_active === 0 ? (
                  <span className="ml-2 text-[10px] uppercase font-bold text-zinc-400 dark:text-zinc-500 bg-zinc-100 dark:bg-dark-800 px-1.5 py-0.5 rounded border border-zinc-300 dark:border-dark-700">
                    Deshabilitado
                  </span>
                ) : row.original.has_portal_access ? (
                  <span className="ml-2 text-[8px] uppercase font-bold text-emerald-700 dark:text-emerald-400 px-1.5 py-0.5 rounded">
                    CON PORTAL
                  </span>
                ) : (
                  <span className="ml-2 text-[8px] uppercase font-bold text-orange-500 dark:text-orange-400 px-1.5 py-0.5 rounded">
                    SIN PORTAL
                  </span>
                )}
              </div>
            </div>
          );
        }

        return (
          <span className="text-zinc-600 dark:text-zinc-300 break-words">
            {value}
          </span>
        );
      },
    }));

    return [
      {
        id: "expander",
        header: () => <span className="sr-only">Más detalles</span>,
        cell: ({ row }) => {
          const detailCount = contactDetailColumns.filter((column) =>
            hasValue(row.original?.[column.name]),
          ).length;
          if (!detailCount) return null;

          const contactId = row.original.id;
          const isOpen = !!expandedContactRows[contactId];

          return (
            <button
              onClick={() =>
                setExpandedContactRows((currentRows) => ({
                  ...currentRows,
                  [contactId]: !currentRows[contactId],
                }))
              }
              className="size-7 inline-flex items-center justify-center rounded-lg bg-transparent dark:bg-transparent hover:bg-zinc-100 dark:hover:bg-dark-700 transition-colors text-zinc-500 dark:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:focus:ring-blue-400/40"
              title={isOpen ? "Ocultar más detalles" : "Ver más detalles"}
            >
              {isOpen ? (
                <ChevronDown size={16} />
              ) : (
                <ChevronRight size={16} />
              )}
            </button>
          );
        },
        enableSorting: false,
      },
      ...dynamicDataColumns,
      {
        id: "actions",
        header: "Acciones",
        cell: ({ row }) => {
          const isDisabled =
            row.original.is_active === false ||
            row.original.is_active === 0;
          if (isDisabled) {
            return (
              <div className="flex items-center gap-2 opacity-30 pointer-events-none select-none">
                <button className="px-4 py-1.5 text-sm font-semibold text-zinc-400 dark:text-zinc-600 bg-zinc-100 dark:bg-dark-800 rounded-xl border border-zinc-200 dark:border-dark-700 shadow-sm dark:shadow-black/20 flex items-center gap-1.5">
                  <Key size={14} /> Acceso
                </button>
                <button className="size-8 flex items-center justify-center rounded-lg text-[#92400E] dark:text-amber-600">
                  <Edit2 size={16} />
                </button>
                <button className="size-8 flex items-center justify-center rounded-lg text-red-800 dark:text-red-600">
                  <Trash2 size={16} />
                </button>
              </div>
            );
          }

          return (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setManagingPortalContact(row.original)}
                className={`px-4 py-1.5 text-sm font-semibold rounded-xl border shadow-sm
                           transition-colors duration-150 flex items-center gap-1.5
                           ${
                             row.original.has_portal_access
                               ? "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20 dark:hover:bg-emerald-500/20"
                               : "bg-red-50 text-red-800 border-red-200 hover:bg-red-100 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20 dark:hover:bg-red-500/20"
                           }`}
              >
                <Key size={14} className="opacity-90" /> Acceso
              </button>
              <button
                onClick={() => startEditContact(row.original)}
                className="size-8 flex items-center justify-center rounded-lg text-[#92400E] dark:text-amber-400 transition-all hover:bg-amber-50 dark:hover:bg-amber-500/10 hover:scale-90 focus:outline-none focus:ring-2 focus:ring-amber-500/30 dark:focus:ring-amber-400/40"
                title="Editar"
              >
                <Edit2 size={16} />
              </button>
              <button
                onClick={() => handleDeleteContact(row.original.id)}
                className="size-8 flex items-center justify-center rounded-lg text-red-800 dark:text-red-400 transition-all hover:bg-red-50 dark:hover:bg-red-500/10 hover:scale-90 focus:outline-none focus:ring-2 focus:ring-red-500/30 dark:focus:ring-red-400/40"
                title="Deshabilitar"
              >
                <Trash2 size={16} />
              </button>
            </div>
          );
        },
      },
    ];
  }, [
    contactPrimaryColumns,
    contactDetailColumns,
    expandedContactRows,
    setExpandedContactRows,
    setManagingPortalContact,
    startEditContact,
    handleDeleteContact,
  ]);

  const disabledContactsColumns = useMemo(
    () => [
      {
        accessorKey: "full_name",
        header: CONTACT_FIELD_LABELS.full_name,
        enableSorting: false,
        cell: ({ getValue }) => {
          const value = getValue();
          return (
            <span className="text-zinc-400 dark:text-zinc-600 line-through text-xs">
              {hasValue(value) ? String(value) : "—"}
            </span>
          );
        },
      },
      {
        accessorKey: "position_title",
        header: CONTACT_FIELD_LABELS.position_title,
        enableSorting: false,
        cell: ({ getValue }) => {
          const value = getValue();
          return (
            <span className="text-zinc-400 dark:text-zinc-600 text-xs">
              {hasValue(value) ? String(value) : "—"}
            </span>
          );
        },
      },
      {
        accessorKey: "email",
        header: CONTACT_FIELD_LABELS.email,
        enableSorting: false,
        cell: ({ getValue }) => {
          const value = getValue();
          return (
            <span className="text-zinc-400 dark:text-zinc-600 text-xs">
              {hasValue(value) ? String(value) : "—"}
            </span>
          );
        },
      },
      {
        accessorKey: "phone",
        header: CONTACT_FIELD_LABELS.phone,
        enableSorting: false,
        cell: ({ getValue }) => {
          const value = getValue();
          return (
            <span className="text-zinc-400 dark:text-zinc-600 text-xs">
              {hasValue(value) ? String(value) : "—"}
            </span>
          );
        },
      },
    ],
    [],
  );

  return { contactsColumns, disabledContactsColumns };
}
