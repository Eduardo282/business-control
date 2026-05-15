import { useEffect, useMemo, useState, useContext, Fragment } from "react";
import { createPortal } from "react-dom";
import { axiosClient } from "../../actionsAPI/axiosClient";
import {
  createContactProductApi,
  deleteContactProductApi,
  listContactsByClientApi,
  updateContactProductDatesApi,
} from "../../actionsAPI/contacts.api";
import { listClientsApi } from "../../actionsAPI/clients.api";
import { AuthContext } from "../../context/AuthContext";
import Swal from "sweetalert2";

const PAGE_SIZE = 10;

function inferPolicyType(product) {
  if (product?.product_type === "POLICY") return "POLICY";
  if (product?.product_type === "SERVICE") return "SERVICE";

  const source = `${product?.name || ""} ${product?.category || ""}`
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  return source.includes("poliza") ? "POLICY" : "SERVICE";
}

function getPolicyStatusLabel(status) {
  const normalized = String(status || "")
    .trim()
    .toUpperCase();

  if (normalized === "ACTIVE") return "ACTIVO";
  if (normalized === "EXPIRING_SOON") return "Por Vencer";
  if (normalized === "CANCELLED") return "Inactivo";
  return "Vencido";
}

function getPolicyStatusClass(status) {
  const normalized = String(status || "")
    .trim()
    .toUpperCase();

  if (normalized === "ACTIVE") {
    return "text-emerald-700 dark:text-emerald-400";
  }
  if (normalized === "EXPIRING_SOON") {
    return "text-amber-600 dark:text-amber-400";
  }
  if (normalized === "CANCELLED") {
    return "text-zinc-600 dark:text-zinc-400";
  }
  return "text-red-600 dark:text-red-400";
}

function LicenseTable({ licenseKeys = [] }) {
  const [page, setPage] = useState(0);
  const totalPages = Math.ceil(licenseKeys.length / PAGE_SIZE);
  const slice = licenseKeys.slice(
    page * PAGE_SIZE,
    page * PAGE_SIZE + PAGE_SIZE,
  );

  return (
    <div className="mt-2">
      {/* Mini tabla */}
      <table className="w-full text-xs border border-zinc-200 rounded-lg overflow-hidden">
        <thead>
          <tr className="bg-zinc-100 text-zinc-500 uppercase tracking-wider">
            <th className="px-3 py-2 text-left w-12">#</th>
            <th className="px-3 py-2 text-left">Folio</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100 bg-white">
          {slice.map((lk, i) => (
            <tr key={i} className="hover:bg-zinc-50">
              <td className="px-3 py-1.5 text-zinc-400 font-mono">
                {page * PAGE_SIZE + i + 1}
              </td>
              <td className="px-3 py-1.5 font-mono text-zinc-700">{lk}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-2">
          <span className="text-[11px] text-zinc-400">
            Página {page + 1} de {totalPages} &middot; {licenseKeys.length}{" "}
            folios
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(0)}
              disabled={page === 0}
              className="px-2 py-1 text-[11px] rounded border text-black border-zinc-200 disabled:opacity-40 hover:bg-zinc-100">
              &laquo;
            </button>
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-2 py-1 text-[11px] rounded border text-black border-zinc-200 disabled:opacity-40 hover:bg-zinc-100">
              Anterior
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page === totalPages - 1}
              className="px-2 py-1 text-[11px] rounded border text-black border-zinc-200 disabled:opacity-40 hover:bg-zinc-100">
              Siguiente
            </button>
            <button
              onClick={() => setPage(totalPages - 1)}
              disabled={page === totalPages - 1}
              className="px-2 py-1 text-[11px] rounded border text-black border-zinc-200 disabled:opacity-40 hover:bg-zinc-100">
              &raquo;
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
import {
  FileSpreadsheet,
  FileText,
  Trash2,
  Search,
  ChevronUp,
  ChevronDown,
  ChevronRight,
  Lightbulb,
  SlidersHorizontal,
  UserPlus,
  X,
} from "@icons";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
} from "@tanstack/react-table";

function formatPolicyDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("es-MX");
}

function toInputDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function listAllPoliciesApi() {
  return axiosClient
    .post("", {
      query: `
      query {
        policies {
          id
          license_key
          start_date
          expiration_date
          status
          product {
            id
            name
            category
          }
          client {
            id
            business_name
          }
          contact {
            id
            full_name
            email
          }
        }
      }
    `,
    })
    .then((res) => {
      if (res.data.errors) throw new Error(res.data.errors[0].message);
      return res.data.data.policies;
    });
}

export default function Policies() {
  const { user } = useContext(AuthContext);
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilterPickerField, setActiveFilterPickerField] = useState(null);
  const [filterPickerSearch, setFilterPickerSearch] = useState("");
  const [filters, setFilters] = useState({
    product: "",
    client: "",
    vigencia: "",
    status: "",
  });
  const [sorting, setSorting] = useState([]);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: PAGE_SIZE,
  });
  const [expanded, setExpanded] = useState({});
  const [editingRow, setEditingRow] = useState(null); // { id, start_date, expiration_date, status }
  const [savingEdit, setSavingEdit] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assignTarget, setAssignTarget] = useState(null);
  const [assignClients, setAssignClients] = useState([]);
  const [assignContacts, setAssignContacts] = useState([]);
  const [assignLoadingClients, setAssignLoadingClients] = useState(false);
  const [assignLoadingContacts, setAssignLoadingContacts] = useState(false);
  const [assignSaving, setAssignSaving] = useState(false);
  const [assignForm, setAssignForm] = useState({
    client_id: "",
    contact_id: "",
    license_key: "",
    start_date: "",
    expiration_date: "",
    status: "ACTIVE",
  });

  const clearFilters = () => {
    setQ("");
    setFilters({
      product: "",
      client: "",
      vigencia: "",
      status: "",
    });
    setActiveFilterPickerField(null);
    setFilterPickerSearch("");
  };

  const activeFilterCount =
    Object.values(filters).filter((v) => v.trim() !== "").length +
    (q.trim() ? 1 : 0);

  const normalizeSearchText = (value) => {
    return (value || "")
      .toString()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
  };

  const openFilterPicker = (fieldName) => {
    setActiveFilterPickerField(fieldName);
    setFilterPickerSearch("");
  };

  const closeFilterPicker = () => {
    setActiveFilterPickerField(null);
    setFilterPickerSearch("");
  };

  const applyFilterValue = (value) => {
    if (!activeFilterPickerField) return;

    setFilters((prev) => ({
      ...prev,
      [activeFilterPickerField]: value,
    }));
    closeFilterPicker();
  };

  useEffect(() => {
    if (!showFilters) {
      setActiveFilterPickerField(null);
      setFilterPickerSearch("");
    }
  }, [showFilters]);

  const filterPickerOptions = useMemo(() => {
    if (!activeFilterPickerField) return [];

    // We get unique values from policies based on the selected field
    const uniqueValues = new Map();

    policies.forEach((p) => {
      let rawValue = null;
      if (activeFilterPickerField === "folio") {
        rawValue = p.license_key;
      } else if (activeFilterPickerField === "status") {
        rawValue = getPolicyStatusLabel(p.status);
      }

      const value = String(rawValue || "").trim();
      if (!value) return;

      const normalized = normalizeSearchText(value);
      if (!normalized || uniqueValues.has(normalized)) return;

      uniqueValues.set(normalized, value);
    });

    return Array.from(uniqueValues.values()).sort((a, b) =>
      a.localeCompare(b, "es", { sensitivity: "base" }),
    );
  }, [policies, activeFilterPickerField]);

  const visibleFilterPickerOptions = useMemo(() => {
    const s = normalizeSearchText(filterPickerSearch);
    if (!s) return filterPickerOptions;

    return filterPickerOptions.filter((value) =>
      normalizeSearchText(value).includes(s),
    );
  }, [filterPickerSearch, filterPickerOptions]);

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!assignModalOpen) return;
    let canceled = false;

    setAssignLoadingClients(true);
    listClientsApi()
      .then((res) => {
        if (canceled) return;
        setAssignClients(res || []);
      })
      .catch((e) => {
        if (canceled) return;
        Swal.fire("Error", e.message || "Error cargando clientes", "error");
      })
      .finally(() => {
        if (!canceled) setAssignLoadingClients(false);
      });

    return () => {
      canceled = true;
    };
  }, [assignModalOpen]);

  useEffect(() => {
    if (!assignModalOpen) return;
    if (!assignForm.client_id) {
      setAssignContacts([]);
      return;
    }

    let canceled = false;
    setAssignLoadingContacts(true);
    listContactsByClientApi(assignForm.client_id)
      .then((res) => {
        if (canceled) return;
        setAssignContacts(res || []);
      })
      .catch((e) => {
        if (canceled) return;
        Swal.fire("Error", e.message || "Error cargando contactos", "error");
      })
      .finally(() => {
        if (!canceled) setAssignLoadingContacts(false);
      });

    return () => {
      canceled = true;
    };
  }, [assignModalOpen, assignForm.client_id]);

  const load = async () => {
    setLoading(true);
    try {
      const data = await listAllPoliciesApi();
      setPolicies(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const openAssignModal = (group) => {
    if (!group?.product?.id) {
      Swal.fire("Error", "No hay producto para asignar.", "error");
      return;
    }

    const clientId = group.client?.id ? String(group.client.id) : "";
    const startDate = toInputDate(group.start_date) ||
      new Date().toISOString().slice(0, 10);
    const expDate = toInputDate(group.expiration_date);

    setAssignTarget(group);
    setAssignContacts([]);
    setAssignForm({
      client_id: clientId,
      contact_id: "",
      license_key: "",
      start_date: startDate,
      expiration_date: expDate,
      status: group.status || "ACTIVE",
    });
    setAssignModalOpen(true);
  };

  const closeAssignModal = () => {
    setAssignModalOpen(false);
    setAssignTarget(null);
    setAssignContacts([]);
    setAssignForm({
      client_id: "",
      contact_id: "",
      license_key: "",
      start_date: "",
      expiration_date: "",
      status: "ACTIVE",
    });
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!assignTarget?.product?.id) return;
    if (!assignForm.contact_id || !assignForm.start_date || !assignForm.expiration_date) {
      Swal.fire("Faltan datos", "Completa los campos obligatorios.", "info");
      return;
    }

    setAssignSaving(true);
    try {
      await createContactProductApi({
        contact_id: assignForm.contact_id,
        product_id: assignTarget.product.id,
        license_key: assignForm.license_key?.trim() || null,
        start_date: assignForm.start_date,
        expiration_date: assignForm.expiration_date,
        status: assignForm.status || "ACTIVE",
      });
      await load();
      closeAssignModal();
      Swal.fire({
        title: "Asignado",
        text: "El servicio/póliza se asignó correctamente.",
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (e) {
      Swal.fire("Error", e.message || "Error al asignar", "error");
    } finally {
      setAssignSaving(false);
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "¿Eliminar póliza?",
      text: "Esta acción no se puede deshacer.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });
    if (!result.isConfirmed) return;
    try {
      await deleteContactProductApi(id);
      setPolicies((prev) => prev.filter((p) => p.id !== id));
      Swal.fire({
        title: "¡Eliminada!",
        text: "La póliza ha sido eliminada.",
        icon: "success",
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (e) {
      Swal.fire("Error", e.message || "Error eliminando la póliza", "error");
    }
  };

  const handleDeleteGroup = async (group) => {
    const count = group?.count || 0;
    if (!count) return;

    const result = await Swal.fire({
      title: count === 1 ? "¿Eliminar póliza?" : `¿Eliminar ${count} pólizas?`,
      text: "Esta acción eliminará todas las licencias del grupo y no se puede deshacer.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: count === 1 ? "Sí, eliminar" : `Sí, eliminar ${count}`,
      cancelButtonText: "Cancelar",
    });
    if (!result.isConfirmed) return;

    const ids = group.policyIds || [];
    try {
      for (const id of ids) {
        await deleteContactProductApi(id);
      }
      setPolicies((prev) => prev.filter((p) => !ids.includes(p.id)));
      Swal.fire({
        title: "¡Eliminadas!",
        text: `${count} póliza(s) eliminadas correctamente.`,
        icon: "success",
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (e) {
      Swal.fire("Error", e.message || "Error eliminando pólizas", "error");
    }
  };

  const startEditRow = (group) => {
    const sd = group.start_date ? new Date(group.start_date).toISOString().slice(0,10) : "";
    const ed = group.expiration_date ? new Date(group.expiration_date).toISOString().slice(0,10) : "";
    setEditingRow({
      id: group.id,
      policyIds: group.policyIds || [],
      start_date: sd,
      expiration_date: ed,
      status: group.status || "ACTIVE",
    });
  };

  const cancelEditRow = () => setEditingRow(null);

  const saveEditRow = async () => {
    if (!editingRow) return;
    setSavingEdit(true);
    try {
      const isStandalone = String(editingRow.id).startsWith("product-");
      if (isStandalone) {
        Swal.fire({
          title: "No editable",
          text: "Este servicio/póliza aún no ha sido asignado a un contacto. Asígnelo primero.",
          icon: "info",
          confirmButtonColor: "#2277B4",
        });
        setSavingEdit(false);
        return;
      }

      // Update each contact_product in the group
      for (const cpId of editingRow.policyIds) {
        await updateContactProductDatesApi(cpId, {
          start_date: editingRow.start_date || null,
          expiration_date: editingRow.expiration_date || null,
          status: editingRow.status,
        });
      }

      await load();
      setEditingRow(null);
      Swal.fire({
        title: "¡Actualizado!",
        text: "Vigencia y estado actualizados.",
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (e) {
      Swal.fire("Error", e.message || "Error al actualizar", "error");
    } finally {
      setSavingEdit(false);
    }
  };

  const groupedPolicies = useMemo(() => {
    const makeKey = (p) => {
      const productName = p.product?.name || "";
      const clientName = p.client?.business_name || "";
      const contactEmail = p.contact?.email || "";
      const start = p.start_date || "";
      const end = p.expiration_date || "";
      const status = p.status || "";
      return [productName, clientName, contactEmail, start, end, status].join(
        "||",
      );
    };

    const map = new Map();

    for (const p of policies) {
      const key = makeKey(p);
      const existing = map.get(key);
      if (!existing) {
        map.set(key, {
          id: key,
          product: p.product,
          client: p.client,
          contact: p.contact,
          start_date: p.start_date,
          expiration_date: p.expiration_date,
          status: p.status,
          count: 1,
          licenseKeys: p.license_key ? [p.license_key] : [],
          policyIds: [p.id],
        });
      } else {
        existing.count += 1;
        existing.policyIds.push(p.id);
        if (p.license_key) existing.licenseKeys.push(p.license_key);
      }
    }

    return Array.from(map.values());
  }, [policies]);

  const filteredGroups = useMemo(() => {
    const s = normalizeSearchText(q);
    const hasFieldFilters = Object.values(filters).some((v) => v.trim() !== "");
    if (!s && !hasFieldFilters) return groupedPolicies;

    return groupedPolicies.filter((g) => {
      const productName = g.product?.name || "";
      const productCategory = g.product?.category || "";
      const clientName = g.client?.business_name || "";
      const policyType =
        inferPolicyType(g.product) === "POLICY" ? "poliza" : "servicio";

      const statusRaw = g.status || "";
      const statusLabel = getPolicyStatusLabel(statusRaw).toLowerCase();

      const locale = "es";
      const startDate =
        g.start_date ? new Date(g.start_date).toLocaleDateString(locale) : "";
      const expDate =
        g.expiration_date ?
          new Date(g.expiration_date).toLocaleDateString(locale)
        : "";

      const matchQ =
        !s ||
        normalizeSearchText(
          [
            productName,
            productCategory,
            clientName,
            policyType,
            statusLabel,
            startDate,
            expDate,
          ].join(" "),
        ).includes(s);

      const matchFilters =
        !hasFieldFilters ||
        ((!filters.product ||
          normalizeSearchText(productName + " " + productCategory).includes(
            normalizeSearchText(filters.product),
          )) &&
          (!filters.client ||
            normalizeSearchText(clientName).includes(
              normalizeSearchText(filters.client),
            )) &&
          (!filters.vigencia ||
            normalizeSearchText(startDate + " " + expDate).includes(
              normalizeSearchText(filters.vigencia),
            )) &&
          (!filters.status ||
            normalizeSearchText(statusLabel) ===
              normalizeSearchText(filters.status)));

      return matchQ && matchFilters;
    });
  }, [groupedPolicies, q, filters]);

  const exportableGroups = useMemo(() => {
    return filteredGroups.map((group) => ({
      servicioPoliza: group.product?.name || "—",
      tipo: inferPolicyType(group.product) === "POLICY" ? "Póliza" : "Servicio",
      cliente: group.client?.business_name || "Sin cliente",
      inicio: formatPolicyDate(group.start_date),
      vence: formatPolicyDate(group.expiration_date),
      estado: getPolicyStatusLabel(group.status),
    }));
  }, [filteredGroups]);

  useEffect(() => {
    setPagination((prev) => ({
      ...prev,
      pageIndex: 0,
    }));
  }, [q, filters]);

  useEffect(() => {
    const maxPageIndex = Math.max(
      0,
      Math.ceil(filteredGroups.length / pagination.pageSize) - 1,
    );

    if (pagination.pageIndex > maxPageIndex) {
      setPagination((prev) => ({
        ...prev,
        pageIndex: maxPageIndex,
      }));
    }
  }, [filteredGroups.length, pagination.pageIndex, pagination.pageSize]);

  const handleExportPDF = async () => {
    if (!exportableGroups.length) {
      Swal.fire({
        title: "Sin datos",
        text: "No hay registros para exportar.",
        icon: "info",
        confirmButtonColor: "#2277B4",
      });
      return;
    }

    try {
      const [{ default: jsPDF }, autoTableModule] = await Promise.all([
        import("jspdf"),
        import("jspdf-autotable"),
      ]);
      const autoTable = autoTableModule.default || autoTableModule.autoTable;

      const doc = new jsPDF({ orientation: "landscape" });
      doc.setFontSize(16);
      doc.setTextColor(26, 43, 76);
      doc.text("Servicios y pólizas", 14, 16);
      doc.setFontSize(10);
      doc.setTextColor(90, 90, 90);
      doc.text(`Exportado: ${new Date().toLocaleString("es-MX")}`, 14, 23);

      autoTable(doc, {
        startY: 28,
        head: [
          [
            "SERVICIO/PÓLIZA",
            "TIPO",
            "CLIENTE",
            "INICIO",
            "VENCE",
            "ESTADO",
          ],
        ],
        body: exportableGroups.map((row) => [
          row.servicioPoliza,
          row.tipo,
          row.cliente,
          row.inicio,
          row.vence,
          row.estado,
        ]),
        theme: "grid",
        headStyles: { fillColor: [34, 119, 180] },
        styles: { fontSize: 8, cellPadding: 2.5 },
        columnStyles: {
          0: { cellWidth: 45 },
          1: { cellWidth: 20 },
          2: { cellWidth: 45 },
        },
      });

      doc.save(
        `Servicios_Polizas_${new Date().toISOString().slice(0, 10)}.pdf`,
      );
    } catch (e) {
      Swal.fire({
        title: "Error",
        text: e.message || "No se pudo generar el PDF.",
        icon: "error",
        confirmButtonColor: "#2277B4",
      });
    }
  };

  const handleExportExcel = async () => {
    if (!exportableGroups.length) {
      Swal.fire({
        title: "Sin datos",
        text: "No hay registros para exportar.",
        icon: "info",
        confirmButtonColor: "#2277B4",
      });
      return;
    }

    try {
      const XLSX = await import("xlsx");
      const rows = exportableGroups.map((row) => ({
        "Servicio/Póliza": row.servicioPoliza,
        Tipo: row.tipo,
        Cliente: row.cliente,
        Inicio: row.inicio,
        Vence: row.vence,
        Estado: row.estado,
      }));

      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "ServiciosPolizas");
      XLSX.writeFile(
        wb,
        `Servicios_Polizas_${new Date().toISOString().slice(0, 10)}.xlsx`,
      );
    } catch (e) {
      Swal.fire({
        title: "Error",
        text: e.message || "No se pudo generar el Excel.",
        icon: "error",
        confirmButtonColor: "#2277B4",
      });
    }
  };

  const columns = useMemo(
    () => [
      {
        id: "expander",
        header: "",
        enableSorting: false,
        cell: ({ row }) => {
          const g = row.original;
          const isOpen = !!expanded[g.id];
          return (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setExpanded((prev) => ({ ...prev, [g.id]: !prev[g.id] }));
              }}
              className="size-7 inline-flex items-center justify-center rounded-lg hover:bg-zinc-100 transition-colors text-zinc-500"
              title={isOpen ? "Ocultar detalles" : "Ver detalles"}>
              {isOpen ?
                <ChevronDown size={16} />
              : <ChevronRight size={16} />}
            </button>
          );
        },
      },
      {
        id: "product",
        header: "Servicios y pólizas ",
        accessorFn: (row) => row.product?.name,
        cell: ({ row }) => {
          const g = row.original;
          const policyType = inferPolicyType(g.product);
          const typeLabel = policyType === "POLICY" ? "Póliza" : "Servicio";
          const typeClasses =
            policyType === "POLICY" ? "text-blue-700 border-blue-200 bg-blue-50 dark:bg-blue-500/10 dark:border-blue-500/20 dark:text-blue-400" : "text-emerald-700 border-emerald-200 bg-emerald-50 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400";
          return (
            <div>
              <div className="flex items-center gap-2">
                <div className="font-bold text-zinc-800 dark:text-zinc-100 hover:text-[#2277B4] dark:hover:text-blue-400">
                  {g.product?.name || "—"}
                </div>
                <span
                  className={`text-[10px] uppercase font-bold tracking-wide px-2 py-0.5 rounded border ${typeClasses}`}>
                  {typeLabel}
                </span>
              </div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                {g.product?.category || ""}
              </div>
              {g.count > 1 && (
                <div className="text-[10px] text-zinc-400 mt-1">
                  {g.count} pólizas
                </div>
              )}
            </div>
          );
        },
      },
      {
        id: "client",
        header: "Cliente",
        accessorFn: (row) => row.client?.business_name,
        cell: ({ row }) => (
          <div className="font-medium text-zinc-500 dark:text-zinc-300">
            {row.original.client?.business_name || "Sin Cliente"}
          </div>
        ),
      },
      {
        id: "validity",
        header: "Vigencia",
        accessorFn: (row) => row.expiration_date,
        cell: ({ row }) => {
          const g = row.original;
          const isEditing = editingRow?.id === g.id;
          if (isEditing) {
            return (
              <div className="flex flex-col gap-1" onClick={e => e.stopPropagation()}>
                <label className="text-[10px] text-zinc-400 uppercase">Inicio</label>
                <input
                  type="date"
                  value={editingRow.start_date}
                  onChange={(e) => setEditingRow(prev => ({ ...prev, start_date: e.target.value }))}
                  className="px-2 py-1 text-xs border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#2277B4] w-36"
                />
                <label className="text-[10px] text-zinc-400 uppercase">Vence</label>
                <input
                  type="date"
                  value={editingRow.expiration_date}
                  onChange={(e) => setEditingRow(prev => ({ ...prev, expiration_date: e.target.value }))}
                  className="px-2 py-1 text-xs border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#2277B4] w-36"
                />
              </div>
            );
          }
          return (
            <div className="text-zinc-700 dark:text-zinc-300">
              <div>
                Inicia:{" "}
                {g.start_date ? new Date(g.start_date).toLocaleDateString() : "—"}
              </div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Vence:{" "}
                {g.expiration_date ? new Date(g.expiration_date).toLocaleDateString() : "—"}
              </div>
            </div>
          );
        },
      },
      {
        id: "status",
        header: "Estado",
        accessorFn: (row) => row.status,
        cell: ({ row }) => {
          const g = row.original;
          const isEditing = editingRow?.id === g.id;
          if (isEditing) {
            return (
              <div onClick={e => e.stopPropagation()}>
                <select
                  value={editingRow.status}
                  onChange={(e) => setEditingRow(prev => ({ ...prev, status: e.target.value }))}
                  className="px-2 py-1 text-xs border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#2277B4]"
                >
                  <option value="ACTIVE">Activo</option>
                  <option value="CANCELLED">Inactivo</option>
                </select>
              </div>
            );
          }
          const status = g.status;
          const label = getPolicyStatusLabel(status);
          const cls = getPolicyStatusClass(status);
          return (
            <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${cls}`}>
              {label}
            </span>
          );
        },
      },
      {
        id: "actions",
        header: "Acciones",
        enableSorting: false,
        cell: ({ row }) => {
          const g = row.original;
          if (user?.role?.name !== "ADMIN") return null;
          const isEditing = editingRow?.id === g.id;
          const isStandalone = String(g.id).startsWith("product-");

          return (
            <div className="flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
              {isEditing ? (
                <>
                  <button
                    onClick={saveEditRow}
                    disabled={savingEdit}
                    className="px-2 py-1 text-[11px] font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {savingEdit ? "..." : "Guardar"}
                  </button>
                  <button
                    onClick={cancelEditRow}
                    className="px-2 py-1 text-[11px] font-semibold text-zinc-600 hover:bg-zinc-100 rounded-lg transition-colors"
                  >
                    Cancelar
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => openAssignModal(g)}
                    className="size-8 inline-flex items-center justify-center rounded-lg text-emerald-700 hover:bg-emerald-50 transition-colors"
                    title="Asignar a contacto"
                  >
                    <UserPlus size={16} />
                  </button>
                  {!isStandalone && (
                    <button
                      onClick={() => startEditRow(g)}
                      className="size-8 inline-flex items-center justify-center rounded-lg text-[#2277B4] hover:bg-blue-50 transition-colors"
                      title="Editar vigencia/estado"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                    </button>
                  )}
                  <button
                    onClick={() => {
                      g.count === 1 ?
                        handleDelete(g.policyIds?.[0])
                      : handleDeleteGroup(g);
                    }}
                    className="size-8 inline-flex items-center justify-center rounded-lg text-red-800 hover:bg-red-50 transition-colors"
                    title={
                      g.count === 1 ?
                        "Eliminar Póliza"
                      : `Eliminar ${g.count} pólizas`
                    }>
                    <Trash2 size={16} />
                  </button>
                </>
              )}
            </div>
          );
        },
      },
    ],
    [user?.role?.name, expanded, editingRow, savingEdit],
  );

  const table = useReactTable({
    data: filteredGroups,
    columns,
    state: { sorting, pagination },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="bg-white p-6 rounded-md border border-zinc-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-semibold text-zinc-800 tracking-tight">
            Historial de servicios y pólizas
          </h1>
          <p className="text-sm text-zinc-500 mt-1 max-w-lg">
            Historial de servicios y pólizas.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Búsqueda global */}
          <div className="flex gap-1 bg-white p-1 rounded-lg border border-zinc-200">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar póliza o servicio…"
              className="bg-transparent border-none text-sm text-zinc-800 placeholder:text-zinc-400 px-3 w-40 md:w-52 focus:outline-none"
            />
            <div className="px-3 py-1.5 text-zinc-400">
              <Search size={16} />
            </div>
          </div>

          <button
            onClick={handleExportPDF}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold border border-red-200 bg-white text-red-700 hover:bg-red-50 transition-colors whitespace-nowrap"
            title="Exportar a PDF">
            <FileText size={14} /> Exportar a PDF
          </button>

          <button
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold border border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50 transition-colors whitespace-nowrap"
            title="Exportar a Excel">
            <FileSpreadsheet size={14} /> Exportar a Excel
          </button>

          {/* Botón filtros */}
          <button
            onClick={() => setShowFilters((v) => !v)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold border transition-colors ${
              showFilters || activeFilterCount > 0 ?
                "bg-[#2277B4] text-white border-[#2277B4]"
              : "bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50"
            }`}>
            <SlidersHorizontal size={15} />
            Filtros
            {activeFilterCount > 0 && (
              <span className="ml-1 bg-white text-[#2277B4] rounded-full text-xs font-bold size-5 flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Limpiar filtros */}
          {activeFilterCount > 0 && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 px-2 py-2 rounded-lg text-xs text-red-500 hover:bg-red-50 transition-colors">
              <X size={14} /> Limpiar
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      <div className="glass-panel rounded-md overflow-hidden">
        {activeFilterPickerField &&
          showFilters &&
          createPortal(
            <div
              className="fixed inset-0 z-[9999] bg-black/45 flex items-center justify-center p-4"
              onClick={closeFilterPicker}>
              <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
                onClick={(e) => e.stopPropagation()}>
                <div className="px-5 py-4 border-b border-zinc-100 bg-[#1a2b4c] flex items-center justify-between">
                  <div>
                    <h3 className="text-white font-semibold text-base uppercase">
                      FILTRAR POR{activeFilterPickerField}
                    </h3>
                    <p className="text-[11px] text-zinc-300 mt-1">
                      Selecciona o busca un valor
                    </p>
                  </div>
                  <button
                    onClick={closeFilterPicker}
                    className="size-8 rounded-lg text-white hover:bg-white/10 flex items-center justify-center">
                    <X size={16} />
                  </button>
                </div>

                <div className="p-4 space-y-3">
                  <div className="flex items-center gap-2 bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2">
                    <Search size={15} className="text-zinc-500" />
                    <input
                      value={filterPickerSearch}
                      onChange={(e) => setFilterPickerSearch(e.target.value)}
                      placeholder="Buscar valor…"
                      className="w-full bg-transparent text-sm text-zinc-800 placeholder:text-zinc-400 focus:outline-none"
                    />
                  </div>

                  <div className="h-72 overflow-y-auto rounded-lg border border-zinc-100 divide-y divide-zinc-100">
                    {visibleFilterPickerOptions.length > 0 ?
                      visibleFilterPickerOptions.map((value) => {
                        const isSelected =
                          normalizeSearchText(
                            filters[activeFilterPickerField],
                          ) === normalizeSearchText(value);

                        return (
                          <button
                            key={`${activeFilterPickerField}_${value}`}
                            onClick={() => applyFilterValue(value)}
                            className={`w-full px-3 py-2 text-left text-sm transition-colors ${
                              isSelected ?
                                "bg-[#2277B4]/10 text-[#125280] font-semibold"
                              : "text-zinc-700 hover:bg-zinc-50"
                            }`}>
                            {value}
                          </button>
                        );
                      })
                    : <div className="px-3 py-4 text-sm text-zinc-500 text-center">
                        No hay valores para mostrar.
                      </div>
                    }
                  </div>
                </div>
              </div>
            </div>,
            document.body,
          )}

        {assignModalOpen &&
          createPortal(
            <div
              className="fixed inset-0 z-[9999] bg-black/45 flex items-center justify-center p-4"
              onClick={closeAssignModal}>
              <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden"
                onClick={(e) => e.stopPropagation()}>
                <div className="px-6 py-4 border-b border-zinc-100 bg-[#1a2b4c] flex items-center justify-between">
                  <div>
                    <h3 className="text-white font-semibold text-base uppercase">
                      Asignar servicio/póliza
                    </h3>
                    <p className="text-[11px] text-zinc-300 mt-1">
                      {assignTarget?.product?.name || "Producto"}
                    </p>
                  </div>
                  <button
                    onClick={closeAssignModal}
                    className="size-8 rounded-lg text-white hover:bg-white/10 flex items-center justify-center">
                    <X size={16} />
                  </button>
                </div>

                <form onSubmit={handleAssignSubmit} className="p-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-zinc-500 mb-1 block">
                        Servicio/Póliza
                      </label>
                      <input
                        type="text"
                        value={assignTarget?.product?.name || ""}
                        disabled
                        className="w-full px-3 py-2 rounded-lg border border-zinc-200 bg-zinc-50 text-sm text-zinc-700"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-zinc-500 mb-1 block">
                        Cliente
                      </label>
                      {assignTarget?.client?.id ? (
                        <input
                          type="text"
                          value={assignTarget?.client?.business_name || ""}
                          disabled
                          className="w-full px-3 py-2 rounded-lg border border-zinc-200 bg-zinc-50 text-sm text-zinc-700"
                        />
                      ) : (
                        <select
                          value={assignForm.client_id}
                          onChange={(e) =>
                            setAssignForm((prev) => ({
                              ...prev,
                              client_id: e.target.value,
                              contact_id: "",
                            }))
                          }
                          className="w-full px-3 py-2 rounded-lg border border-zinc-300 bg-white text-sm focus:ring-2 focus:ring-[#2277B4]/30 focus:border-[#2277B4] outline-none"
                        >
                          <option value="">
                            {assignLoadingClients ? "Cargando..." : "Seleccionar..."}
                          </option>
                          {assignClients.map((client) => (
                            <option key={client.id} value={client.id}>
                              {client.business_name}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>

                    <div>
                      <label className="text-xs text-zinc-500 mb-1 block">
                        Contacto *
                      </label>
                      <select
                        value={assignForm.contact_id}
                        onChange={(e) =>
                          setAssignForm((prev) => ({
                            ...prev,
                            contact_id: e.target.value,
                          }))
                        }
                        disabled={!assignForm.client_id || assignLoadingContacts}
                        className="w-full px-3 py-2 rounded-lg border border-zinc-300 bg-white text-sm focus:ring-2 focus:ring-[#2277B4]/30 focus:border-[#2277B4] outline-none disabled:bg-zinc-100"
                        required>
                        <option value="">
                          {assignLoadingContacts ?
                            "Cargando contactos..."
                          : assignForm.client_id ?
                            "Seleccionar..."
                          : "Selecciona un cliente"}
                        </option>
                        {assignContacts.map((contact) => (
                          <option key={contact.id} value={contact.id}>
                            {contact.full_name}
                          </option>
                        ))}
                      </select>
                      {!assignLoadingContacts &&
                        assignForm.client_id &&
                        assignContacts.length === 0 && (
                          <p className="text-[11px] text-zinc-400 mt-1">
                            No hay contactos para este cliente.
                          </p>
                        )}
                    </div>

                    <div>
                      <label className="text-xs text-zinc-500 mb-1 block">
                        Licencia / Folio
                      </label>
                      <input
                        type="text"
                        value={assignForm.license_key}
                        onChange={(e) =>
                          setAssignForm((prev) => ({
                            ...prev,
                            license_key: e.target.value,
                          }))
                        }
                        placeholder="Opcional"
                        className="w-full px-3 py-2 rounded-lg border border-zinc-300 bg-white text-sm focus:ring-2 focus:ring-[#2277B4]/30 focus:border-[#2277B4] outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-zinc-500 mb-1 block">
                        Inicio *
                      </label>
                      <input
                        type="date"
                        value={assignForm.start_date}
                        onChange={(e) =>
                          setAssignForm((prev) => ({
                            ...prev,
                            start_date: e.target.value,
                          }))
                        }
                        required
                        className="w-full px-3 py-2 rounded-lg border border-zinc-300 bg-white text-sm focus:ring-2 focus:ring-[#2277B4]/30 focus:border-[#2277B4] outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-zinc-500 mb-1 block">
                        Vence *
                      </label>
                      <input
                        type="date"
                        value={assignForm.expiration_date}
                        onChange={(e) =>
                          setAssignForm((prev) => ({
                            ...prev,
                            expiration_date: e.target.value,
                          }))
                        }
                        required
                        className="w-full px-3 py-2 rounded-lg border border-zinc-300 bg-white text-sm focus:ring-2 focus:ring-[#2277B4]/30 focus:border-[#2277B4] outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-zinc-500 mb-1 block">
                        Estado
                      </label>
                      <select
                        value={assignForm.status}
                        onChange={(e) =>
                          setAssignForm((prev) => ({
                            ...prev,
                            status: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 rounded-lg border border-zinc-300 bg-white text-sm focus:ring-2 focus:ring-[#2277B4]/30 focus:border-[#2277B4] outline-none"
                      >
                        <option value="ACTIVE">Activo</option>
                        <option value="CANCELLED">Inactivo</option>
                        <option value="EXPIRED">Vencido</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={closeAssignModal}
                      className="px-4 py-2 rounded-lg text-sm font-semibold text-zinc-600 hover:bg-zinc-100 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={assignSaving}
                      className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors disabled:opacity-60"
                    >
                      {assignSaving ? "Asignando..." : "Asignar"}
                    </button>
                  </div>
                </form>
              </div>
            </div>,
            document.body,
          )}

        {/* Hint para expandir y Filtros */}
        <div className="px-4 py-2 bg-blue-50 border-b border-blue-100 text-xs text-[#2277B4] flex items-center justify-between min-h-[44px]">
          <div className="flex items-center gap-1 shrink-0">
            <Lightbulb size={14} className="inline" /> Clic en{" "}
            <ChevronRight size={12} className="inline" /> o en la fila para más
            detalles
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-zinc-400 whitespace-nowrap">
              Pág. {table.getState().pagination.pageIndex + 1} de{" "}
              {Math.max(1, table.getPageCount())}
            </span>
            {showFilters &&
              [
                { id: "status", label: "Estado" },
              ].map((button) => {
                const selectedValue = String(filters[button.id] || "");
                return (
                  <button
                    key={button.id}
                    onClick={() => openFilterPicker(button.id)}
                    className={`inline-flex items-center gap-2 px-3 py-1 rounded-md text-[11px] border transition-colors whitespace-nowrap ${
                      selectedValue ?
                        "bg-[#2277B4] text-white border-[#2277B4]"
                      : "bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-100"
                    }`}>
                    <span className="uppercase font-bold tracking-wide">
                      {button.label}
                    </span>
                  </button>
                );
              })}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-zinc-50 dark:bg-dark-800 text-xs uppercase text-[#2277B4] dark:text-blue-400">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header, idx) => (
                    <th
                      key={header.id}
                      className={`p-4 ${idx === 0 ? "rounded-tl-lg" : ""} ${
                        idx === headerGroup.headers.length - 1 ?
                          "rounded-tr-lg"
                        : ""
                      }`}
                      onClick={header.column.getToggleSortingHandler()}
                      style={{
                        cursor:
                          header.column.getCanSort() ? "pointer" : "default",
                      }}>
                      <div className="flex items-center gap-1">
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                        {header.column.getIsSorted() === "asc" && (
                          <ChevronUp size={14} />
                        )}
                        {header.column.getIsSorted() === "desc" && (
                          <ChevronDown size={14} />
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-dark-700 text-sm">
              {loading ?
                <tr>
                  <td
                    colSpan={columns.length}
                    className="p-8 text-center text-zinc-500">
                    Cargando pólizas...
                  </td>
                </tr>
              : table.getRowModel().rows.length === 0 ?
                <tr>
                  <td
                    colSpan={columns.length}
                    className="p-8 text-center text-zinc-500">
                    No se encontraron pólizas.
                  </td>
                </tr>
              : table.getRowModel().rows.map((row) => (
                  <Fragment key={row.id}>
                    <tr
                      key={row.id}
                      className="hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors cursor-pointer"
                      onClick={() =>
                        setExpanded((prev) => ({
                          ...prev,
                          [row.original.id]: !prev[row.original.id],
                        }))
                      }>
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="p-4 align-top">
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </td>
                      ))}
                    </tr>

                    {!!expanded[row.original.id] && (
                      <tr key={`${row.id}__expanded`} className="bg-zinc-50/40 dark:bg-dark-800/80">
                        <td colSpan={columns.length} className="px-6 py-4">
                          <div className="ml-8">
                            <div className="text-[11px] text-zinc-500 font-semibold uppercase tracking-wider mb-2">
                              Folios ({row.original.count})
                            </div>
                            <LicenseTable
                              licenseKeys={row.original.licenseKeys || []}
                            />
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))
              }
            </tbody>
          </table>
        </div>

        {!loading && filteredGroups.length > 0 && (
          <div className="px-4 py-3 border-t border-zinc-100 dark:border-dark-700 bg-white dark:bg-dark-900 flex items-center justify-between gap-3">
            <label className="text-sm text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
              Mostrar
              <select
                value={table.getState().pagination.pageSize}
                onChange={(e) =>
                  setPagination((prev) => ({
                    ...prev,
                    pageIndex: 0,
                    pageSize: Number(e.target.value),
                  }))
                }
                className="px-2 py-1 rounded-md border border-zinc-200 dark:border-dark-700 text-sm text-zinc-700 dark:text-zinc-100 bg-zinc-50 dark:bg-dark-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20">
                {[10, 25, 50, 100].map((size) => (
                  <option key={size} value={size} className="dark:bg-dark-900 dark:text-zinc-100">
                    {size}
                  </option>
                ))}
              </select>
              por página
            </label>

            <div className="flex items-center gap-1">
              <button
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
                className="px-2 py-1 text-sm font-medium text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-white/5 rounded-lg hover:bg-zinc-200 dark:hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                ««
              </button>
              <button
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="px-3 py-1 text-sm font-medium text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-white/5 rounded-lg hover:bg-zinc-200 dark:hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                Anterior
              </button>
              <button
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="px-3 py-1 text-sm font-medium text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-white/5 rounded-lg hover:bg-zinc-200 dark:hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                Siguiente
              </button>
              <button
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
                className="px-2 py-1 text-sm font-medium text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-white/5 rounded-lg hover:bg-zinc-200 dark:hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                »»
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
