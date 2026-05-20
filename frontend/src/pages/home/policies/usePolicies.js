import { useEffect, useMemo, useState } from "react";
import { axiosClient } from "../../../actionsAPI/axiosClient";
import { deleteContactProductApi } from "../../../actionsAPI/contacts.api";
import { notificationService } from "../../../services/notificationService";
import { exportRowsToExcel } from "../../../utils/excelExport";
import { normalizeSearchText } from "../../../utils/formatters";
import { usePolicyAssignment } from "./hooks/usePolicyAssignment.js";
import { usePolicyDates } from "./hooks/usePolicyDates.js";

const PAGE_SIZE = 5;

export function inferPolicyType(product) {
  if (product?.product_type === "POLICY") return "POLICY";
  if (product?.product_type === "SERVICE") return "SERVICE";

  const source = `${product?.name || ""} ${product?.category || ""}`
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  return source.includes("poliza") ? "POLICY" : "SERVICE";
}

export function getPolicyStatusLabel(status) {
  const normalized = String(status || "")
    .trim()
    .toUpperCase();

  if (normalized === "ACTIVE") return "ACTIVO";
  if (normalized === "EXPIRING_SOON") return "Por Vencer";
  if (normalized === "CANCELLED") return "Inactivo";
  return "Vencido";
}

export function getPolicyStatusClass(status) {
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

export function formatPolicyDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("es-MX");
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
            product_type
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

export function usePolicies() {
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilterPickerField, setActiveFilterPickerField] = useState(null);
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

  const [viewingFoliosGroup, setViewingFoliosGroup] = useState(null);
  const [selectedFoliosByGroup, setSelectedFoliosByGroup] = useState({});

  // 1. Assignment Hook
  const {
    assignModalOpen,
    setAssignModalOpen,
    assignTarget,
    setAssignTarget,
    assignFormInitial,
    setAssignFormInitial,
    openAssignModal,
    closeAssignModal,
  } = usePolicyAssignment();

  // 2. Dates Hook
  const {
    editingRow,
    setEditingRow,
    startEditRow,
  } = usePolicyDates(selectedFoliosByGroup);

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

  useEffect(() => {
    load();
  }, []);

  const clearFilters = () => {
    setQ("");
    setFilters({
      product: "",
      client: "",
      vigencia: "",
      status: "",
    });
    setActiveFilterPickerField(null);
  };

  const activeFilterCount =
    Object.values(filters).filter((v) => v.trim() !== "").length +
    (q.trim() ? 1 : 0);

  const openFilterPicker = (fieldName) => {
    setActiveFilterPickerField(fieldName);
  };

  const closeFilterPicker = () => {
    setActiveFilterPickerField(null);
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
    }
  }, [showFilters]);

  const handleDelete = async (id, groupId) => {
    const confirmed = await notificationService.confirm({
      title: "¿Eliminar póliza?",
      text: "Esta acción no se puede deshacer.",
      confirmButtonText: "Sí, eliminar",
    });
    if (!confirmed) return;

    try {
      await deleteContactProductApi(id);
      setPolicies((prev) => prev.filter((p) => p.id !== id));
      if (groupId) {
        setSelectedFoliosByGroup((prev) => {
          const next = { ...prev };
          if (String(next[groupId]) === String(id)) {
            delete next[groupId];
          }
          return next;
        });
      }
      notificationService.toast({ title: "La póliza ha sido eliminada.", icon: "success" });
    } catch (e) {
      notificationService.error("Error", e.message || "Error eliminando la póliza");
    }
  };

  const handleDeleteGroup = async (group) => {
    const count = group?.count || 0;
    if (!count) return;

    const confirmed = await notificationService.confirm({
      title: count === 1 ? "¿Eliminar póliza?" : `¿Eliminar ${count} pólizas?`,
      text: "Esta acción eliminará todas las licencias del grupo y no se puede deshacer.",
      confirmButtonText: count === 1 ? "Sí, eliminar" : `Sí, eliminar ${count}`,
    });
    if (!confirmed) return;

    const ids = group.policyIds || [];
    try {
      for (const id of ids) {
        await deleteContactProductApi(id);
      }
      setPolicies((prev) => prev.filter((p) => !ids.includes(p.id)));
      notificationService.toast({ title: `${count} póliza(s) eliminadas correctamente.`, icon: "success" });
    } catch (e) {
      notificationService.error("Error", e.message || "Error eliminando pólizas");
    }
  };

  const groupedPolicies = useMemo(() => {
    const makeKey = (p) => {
      const productName = p.product?.name || "";
      const clientName = p.client?.business_name || "";
      const contactEmail = p.contact?.email || "";
      return [productName, clientName, contactEmail].join("||");
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
          items: [p],
        });
      } else {
        existing.count += 1;
        existing.policyIds.push(p.id);
        if (p.license_key) existing.licenseKeys.push(p.license_key);
        existing.items.push(p);
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

      const folios = (g.licenseKeys || []).join(" ");
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
            folios
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
      notificationService.info("Sin datos", "No hay registros para exportar.");
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
      notificationService.error("Error", e.message || "No se pudo generar el PDF.");
    }
  };

  const handleExportExcel = async () => {
    if (!exportableGroups.length) {
      notificationService.info("Sin datos", "No hay registros para exportar.");
      return;
    }

    try {
      const rows = exportableGroups.map((row) => ({
        "Servicio/Póliza": row.servicioPoliza,
        Tipo: row.tipo,
        Cliente: row.cliente,
        Inicio: row.inicio,
        Vence: row.vence,
        Estado: row.estado,
      }));

      await exportRowsToExcel({
        rows,
        sheetName: "ServiciosPolizas",
        fileName: `Servicios_Polizas_${new Date().toISOString().slice(0, 10)}.xlsx`,
      });
    } catch (e) {
      notificationService.error("Error", e.message || "No se pudo generar el Excel.");
    }
  };

  return {
    policies,
    loading,
    error,
    q,
    setQ,
    showFilters,
    setShowFilters,
    activeFilterPickerField,
    filters,
    sorting,
    setSorting,
    pagination,
    setPagination,
    editingRow,
    setEditingRow,
    viewingFoliosGroup,
    setViewingFoliosGroup,
    selectedFoliosByGroup,
    setSelectedFoliosByGroup,
    assignModalOpen,
    assignTarget,
    assignFormInitial,
    load,
    clearFilters,
    activeFilterCount,
    openFilterPicker,
    closeFilterPicker,
    applyFilterValue,
    openAssignModal,
    closeAssignModal,
    handleDelete,
    handleDeleteGroup,
    startEditRow,
    filteredGroups,
    handleExportPDF,
    handleExportExcel,
  };
}
