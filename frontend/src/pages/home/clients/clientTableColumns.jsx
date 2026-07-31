import { Link } from "react-router-dom";
import {
  ChevronDown,
  ChevronRight,
  Edit2,
  Plus,
  Trash2,
} from "@icons";

function ClientValueCell({ columnName, rawValue }) {
  const value =
    rawValue === null || rawValue === undefined || rawValue === ""
      ? "—"
      : String(rawValue);

  if (columnName === "business_name") {
    const businessName =
      value !== "—"
        ? `${value.charAt(0).toUpperCase()}${value.slice(1)}`
        : value;
    const firstCharacter =
      businessName !== "—" ? businessName.charAt(0) : "•";

    return (
      <div className="flex items-start gap-3 min-w-0">
        <div className="size-9 rounded-full shrink-0 flex items-center justify-center border border-zinc-200 dark:border-dark-700 bg-zinc-100 dark:bg-dark-700 text-zinc-900 dark:text-zinc-100 font-bold text-sm shadow-sm dark:shadow-black/20">
          {firstCharacter}
        </div>
        <span
          className="font-medium text-zinc-800 dark:text-zinc-100 leading-snug min-w-0"
          style={{
            whiteSpace: "normal",
            overflowWrap: "anywhere",
            wordBreak: "break-word",
          }}
        >
          {businessName}
        </span>
      </div>
    );
  }

  return (
    <span
      className="block w-full text-zinc-600 dark:text-zinc-300 text-sm leading-snug"
      style={{
        whiteSpace: "normal",
        overflowWrap: "anywhere",
        wordBreak: "break-word",
      }}
    >
      {value}
    </span>
  );
}

export function createClientTableColumns({
  primaryTableColumns,
  userRole,
  getRowDetailColumns,
  expandedRows,
  onToggleExpanded,
  onCreate,
  onEdit,
  onRemove,
}) {
  const dynamicDataColumns = primaryTableColumns.map((column) => ({
    accessorKey: column.name,
    header: column.label,
    size: column.name === "business_name" ? 240 : 180,
    cell: ({ getValue }) => (
      <ClientValueCell
        columnName={column.name}
        rawValue={getValue()}
      />
    ),
  }));

  return [
    {
      id: "expander",
      header: () => (
        <button onClick={onCreate} title="Registrar nuevo cliente">
          <span className="inline-flex items-center gap-1 text-black dark:text-zinc-100 no-underline text-sm font-bold">
            <Plus size={18} strokeWidth={3} />
            <span>Nuevo</span>
          </span>
        </button>
      ),
      cell: ({ row }) => {
        const detailCount = getRowDetailColumns(row.original).length;
        if (!detailCount) return null;

        const clientId = row.original.id;
        const isOpen = !!expandedRows[clientId];

        return (
          <button
            onClick={() => onToggleExpanded(clientId)}
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
      size: 90,
    },
    ...dynamicDataColumns,
    {
      id: "actions",
      header: "Acciones",
      size: 180,
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <Link to={`/clientes/${row.original.id}`}>
            <button
              className="px-4 py-1.5 text-sm font-semibold text-[#2277B4] dark:text-blue-300 bg-white dark:bg-dark-800 rounded-xl
                         border border-[#CBD5E1] dark:border-dark-700 hover:bg-[#F8FAFC] dark:hover:bg-dark-700 hover:border-[#B8C6D8] dark:hover:border-zinc-600
                         shadow-sm dark:shadow-black/20 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-[#2277B4]/30 dark:focus:ring-blue-400/40"
            >
              Gestionar
            </button>
          </Link>
          {(userRole === "ADMIN" || userRole === "VENTAS") && (
            <>
              <button
                onClick={() => onEdit(row.original)}
                className="size-8 flex items-center justify-center rounded-lg text-amber-800 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-500/10 hover:scale-90 transition-all focus:outline-none focus:ring-2 focus:ring-amber-500/30 dark:focus:ring-amber-400/40"
                title="Editar"
              >
                <Edit2 size={16} />
              </button>
              <button
                onClick={() => onRemove(row.original.id)}
                className="size-8 flex items-center justify-center rounded-lg text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:scale-90 transition-all focus:outline-none focus:ring-2 focus:ring-red-500/30 dark:focus:ring-red-400/40"
                title="Eliminar"
              >
                <Trash2 size={16} />
              </button>
            </>
          )}
        </div>
      ),
    },
  ];
}
