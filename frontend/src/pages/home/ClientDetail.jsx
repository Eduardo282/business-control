import {
  Fragment,
  useEffect,
  useState,
  useMemo,
} from "react";
import { createPortal } from "react-dom";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
} from "@tanstack/react-table";
import { useAuth } from "../../hooks/useAuth";
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import {
  getClientApi,
  updateClientDynamicApi,
  deleteClientApi,
  listClientsDynamicApi,
} from "../../actionsAPI/clients.api";
import {
  createContactApi,
  updateContactDynamicApi,
  deleteContactApi,
  listContactsDynamicByClientApi,
} from "../../actionsAPI/contacts.api";
import { listProductsApi } from "../../actionsAPI/products.api";
import { logger } from "../../services/logger";
import {
  ClipboardList,
  MapPin,
  Building2,
  Edit2,
  UserPlus,
  ChevronUp,
  ChevronDown,
  ChevronRight,
  Users,
  FileText,
  Trash2,
  X,
  Search,
  Key,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Lightbulb,
  SlidersHorizontal,
  Filter,
  ArrowLeft,
} from "@icons";
import { useContactBulkImport } from "./client-detail/useContactBulkImport";
import { useContactExport } from "./client-detail/useContactExport";
import {
  ClientProductsTab,
  ManagePortalModal,
} from "./client-detail/ClientDetailSections";
import {
  hasValue,
  normalizeSearchText,
} from "./client-detail/utils";
import { notificationService } from "../../services/notificationService";

// Modularized components
import ClientEditModal from "./client-detail/ClientEditModal";
import ContactEditModal from "./client-detail/ContactEditModal";
import ContactBulkModal from "./client-detail/ContactBulkModal";
import ContactFilterPicker from "./client-detail/ContactFilterPicker";

const EXCEL_VIEW_STORAGE_KEY = "clients_excel_view_config";
const CONTACTS_EXCEL_VIEW_STORAGE_KEY = "contacts_excel_view_config";
const CONTACT_QUICK_FILTER_FIELDS = [
  {
    id: "position_title",
    aliases: ["position_title", "puesto", "cargo", "posicion"],
    buttonLabel: "PUESTO",
    modalLabel: "Puesto",
  },
];
const CONTACT_HIDDEN_FIELDS = new Set([
  "id",
  "client_id",
  "created_at",
  "updated_at",
  "portal_password_hash",
]);
const CONTACT_READONLY_FIELDS = new Set([
  "id",
  "client_id",
  "created_at",
  "updated_at",
  "portal_password_hash",
  "has_portal_access",
  "is_active",
]);
const CONTACT_DEFAULT_MAIN_COLUMNS = ["full_name", "email"];
const CONTACT_FIXED_MAIN_COLUMNS_COUNT = 2;
const CONTACT_FIELD_LABELS = {
  full_name: "Nombre completo",
  email: "Correo electrónico",
  phone: "Teléfono",
  position_title: "Puesto",
  has_portal_access: "Acceso al portal",
  is_active: "Activo",
};
const CONTACT_FALLBACK_COLUMNS = [
  { name: "full_name", label: CONTACT_FIELD_LABELS.full_name, type: "varchar" },
  { name: "email", label: CONTACT_FIELD_LABELS.email, type: "varchar" },
  { name: "phone", label: CONTACT_FIELD_LABELS.phone, type: "varchar" },
  {
    name: "position_title",
    label: CONTACT_FIELD_LABELS.position_title,
    type: "varchar",
  },
  {
    name: "has_portal_access",
    label: CONTACT_FIELD_LABELS.has_portal_access,
    type: "tinyint",
  },
  { name: "is_active", label: CONTACT_FIELD_LABELS.is_active, type: "tinyint" },
];
const CLIENT_DETAIL_HIDDEN_FIELDS = new Set([
  "id",
  "created_at",
  "updated_at",
  "created_by_user_id",
  "address",
  "direccion",
  "has_client_portal_access",
  "is_active",
  "portal_password_hash",
]);
const CLIENT_DETAIL_FULL_WIDTH_FIELDS = new Set([
  "business_name",
  "email2",
  "address",
  "direccion",
]);

function isClientFieldFullWidth(fieldName) {
  const key = String(fieldName || "").toLowerCase();
  return (
    CLIENT_DETAIL_FULL_WIDTH_FIELDS.has(key) ||
    key.includes("address") ||
    key.includes("direccion")
  );
}

function getClientFieldInputType(fieldName) {
  const key = String(fieldName || "").toLowerCase();
  if (key.includes("email") || key.includes("correo")) return "email";
  if (key.includes("tel") || key.includes("phone") || key.includes("celular")) {
    return "tel";
  }
  return "text";
}

function isClientFieldReadOnly(fieldName) {
  return String(fieldName || "").toLowerCase() === "rfc";
}

function tokenizeFieldTerms(value) {
  return Array.from(
    new Set(
      normalizeSearchText(value)
        .split(" ")
        .map((token) => token.replace(/[0-9]+/g, ""))
        .filter((token) => token.length > 1),
    ),
  );
}

function scoreColumnAffinity(detailColumn, primaryColumn) {
  const detailTokens = tokenizeFieldTerms(
    `${detailColumn?.name || ""} ${detailColumn?.label || ""}`,
  );
  if (!detailTokens.length) return 0;

  const primaryTokens = new Set(
    tokenizeFieldTerms(
      `${primaryColumn?.name || ""} ${primaryColumn?.label || ""}`,
    ),
  );

  return detailTokens.reduce(
    (score, token) => (primaryTokens.has(token) ? score + 1 : score),
    0,
  );
}

function resolveDetailHostColumn(
  detailColumn,
  primaryColumns = [],
  detailColumnsByPrimary = {},
) {
  if (!primaryColumns.length) return null;

  let bestColumn = primaryColumns[0];
  let bestScore = -1;
  let bestLoad = Number.POSITIVE_INFINITY;

  primaryColumns.forEach((primaryColumn) => {
    const score = scoreColumnAffinity(detailColumn, primaryColumn);
    const load = (detailColumnsByPrimary[primaryColumn.name] || []).length;

    if (score > bestScore || (score === bestScore && load < bestLoad)) {
      bestColumn = primaryColumn;
      bestScore = score;
      bestLoad = load;
    }
  });

  return bestColumn?.name || primaryColumns[0]?.name || null;
}

function getContactFieldInputType(fieldName) {
  const key = String(fieldName || "").toLowerCase();
  if (key.includes("email") || key.includes("correo")) return "email";
  if (key.includes("tel") || key.includes("phone") || key.includes("cel")) {
    return "tel";
  }
  return "text";
}

export default function ClientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [client, setClient] = useState(null);
  const [clientDynamicColumns, setClientDynamicColumns] = useState([]);
  const [excelViewColumns, setExcelViewColumns] = useState(null);
  const [columnLabelOverrides, setColumnLabelOverrides] = useState({});
  const [contactRows, setContactRows] = useState([]);
  const [contactDynamicColumns, setContactDynamicColumns] = useState([]);
  const [contactExcelViewColumns, setContactExcelViewColumns] = useState(null);
  const [contactColumnLabelOverrides, setContactColumnLabelOverrides] =
    useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Formulario de edición de cliente
  const [isEditingClient, setIsEditingClient] = useState(false);
  const [clientForm, setClientForm] = useState({
    business_name: "",
    rfc: "",
    email1: "",
    email2: "",
    celular: "",
    telefono: "",
    codigo_postal: "",
    ciudad: "",
  });

  // Formulario de nuevo contacto
  const [newContact, setNewContact] = useState({
    full_name: "",
    email: "",
    phone: "",
    position_title: "",
  });

  const [contactSearch, setContactSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [showContactFilters, setShowContactFilters] = useState(false);
  const [contactFilters, setContactFilters] = useState({
    position_title: "",
  });
  const [activeContactFilterPickerField, setActiveContactFilterPickerField] =
    useState(null);
  const [contactFilterPickerSearch, setContactFilterPickerSearch] =
    useState("");

  // Estado de edición de contacto
  const [editingContactId, setEditingContactId] = useState(null);
  const [contactForm, setContactForm] = useState({});

  // Productos
  const [productsList, setProductsList] = useState([]);

  // Modal de gestión de portal
  const [managingPortalContact, setManagingPortalContact] = useState(null);
  const [activeTab, setActiveTab] = useState("general");
  const [contactsSorting, setContactsSorting] = useState([]);
  const [expandedContactRows, setExpandedContactRows] = useState({});
  const [showDisabled, setShowDisabled] = useState(false);

  const load = async () => {
    setError("");
    setLoading(true);
    try {
      const [c, dynamicData, contactsDynamicData] = await Promise.all([
        getClientApi(id),
        listClientsDynamicApi().catch(() => null),
        listContactsDynamicByClientApi(id).catch(() => null),
      ]);

      const dynamicColumns = dynamicData?.columns || [];
      const dynamicRows = dynamicData?.rows || [];
      const dynamicClientRow = dynamicRows.find(
        (row) => String(row?.id) === String(c?.id ?? id),
      );

      const mergedClient =
        dynamicClientRow ?
          {
            ...c,
            ...dynamicClientRow,
            id: c?.id ?? dynamicClientRow?.id,
          }
        : c;

      const graphQlContacts = Array.isArray(c?.contacts) ? c.contacts : [];
      const dynamicContactRows =
        Array.isArray(contactsDynamicData?.rows) ?
          contactsDynamicData.rows
        : [];
      const dynamicContactColumns =
        Array.isArray(contactsDynamicData?.columns) ?
          contactsDynamicData.columns
        : [];
      const fallbackRows =
        dynamicContactRows.length ? dynamicContactRows : graphQlContacts;
      const graphQlContactsById = new Map(
        graphQlContacts.map((contact) => [String(contact.id), contact]),
      );
      const mergedContactRows = fallbackRows.map((row) => ({
        ...(graphQlContactsById.get(String(row?.id)) || {}),
        ...row,
      }));
      const nextContactColumns =
        dynamicContactColumns.length ?
          dynamicContactColumns
        : CONTACT_FALLBACK_COLUMNS;

      setClient(mergedClient);
      setClientDynamicColumns(dynamicColumns);
      setContactRows(mergedContactRows);
      setContactDynamicColumns(nextContactColumns);
      const dynamicFormValues = dynamicColumns
        .filter((column) => !CLIENT_DETAIL_HIDDEN_FIELDS.has(column?.name))
        .reduce((acc, column) => {
          const rawValue = mergedClient?.[column.name];
          acc[column.name] =
            rawValue === null || rawValue === undefined ? "" : String(rawValue);
          return acc;
        }, {});

      if (Object.keys(dynamicFormValues).length) {
        setClientForm(dynamicFormValues);
      } else {
        setClientForm({
          business_name: mergedClient.business_name,
          rfc: mergedClient.rfc || "",
          email1: mergedClient.email1 || "",
          email2: mergedClient.email2 || "",
          celular: mergedClient.celular || "",
          telefono: mergedClient.telefono || "",
          codigo_postal: mergedClient.codigo_postal || "",
          ciudad: mergedClient.ciudad || "",
        });
      }
      listProductsApi(id)
        .then((all) => {
          setProductsList(all.filter((p) => p.client_id == id));
        })
        .catch((error) => logger.error("Error loading client products", error));
    } catch (e) {
      setError(e.message || "Error cargando cliente");
    } finally {
      setLoading(false);
    }
  };

  const {
    showBulkContactModal,
    setShowBulkContactModal,
    bulkContactData,
    bulkContactErrors,
    bulkContactUploading,
    bulkContactDriveImporting,
    bulkContactDriveUrl,
    setBulkContactDriveUrl,
    bulkContactResult,
    bulkContactFileRef,
    openBulkContactModal,
    handleBulkContactFile,
    executeBulkContactUpload,
    executeBulkContactDriveImport,
  } = useContactBulkImport({
    clientId: id,
    onImported: load,
    contactsExcelViewStorageKey: CONTACTS_EXCEL_VIEW_STORAGE_KEY,
    onDriveMapping: ({ columnLabelOverrides, excelViewColumns }) => {
      setContactColumnLabelOverrides(columnLabelOverrides);
      setContactExcelViewColumns(excelViewColumns);
    },
  });

  useEffect(() => {
    load();
  }, [id]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(EXCEL_VIEW_STORAGE_KEY);
      if (!saved) return;

      const parsed = JSON.parse(saved);
      if (parsed?.columnLabelOverrides) {
        setColumnLabelOverrides(parsed.columnLabelOverrides);
      }
      if (Array.isArray(parsed?.excelViewColumns)) {
        setExcelViewColumns(parsed.excelViewColumns);
      }
    } catch {
      localStorage.removeItem(EXCEL_VIEW_STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(CONTACTS_EXCEL_VIEW_STORAGE_KEY);
      if (!saved) return;

      const parsed = JSON.parse(saved);
      if (parsed?.columnLabelOverrides) {
        setContactColumnLabelOverrides(parsed.columnLabelOverrides);
      }
      if (Array.isArray(parsed?.excelViewColumns)) {
        setContactExcelViewColumns(parsed.excelViewColumns);
      }
    } catch {
      localStorage.removeItem(CONTACTS_EXCEL_VIEW_STORAGE_KEY);
    }
  }, []);

  const clientGeneralColumns = useMemo(() => {
    const availableColumns = clientDynamicColumns.filter(
      (column) => column?.name && !CLIENT_DETAIL_HIDDEN_FIELDS.has(column.name),
    );

    if (Array.isArray(excelViewColumns) && excelViewColumns.length) {
      const columnsByName = new Map(
        availableColumns.map((column) => [column.name, column]),
      );
      const excelSubset = excelViewColumns
        .map((columnName) => columnsByName.get(columnName))
        .filter(Boolean);

      if (excelSubset.length) return excelSubset;
    }

    return availableColumns;
  }, [clientDynamicColumns, excelViewColumns]);

  const clientGeneralFields = useMemo(() => {
    if (!client) return [];

    const fields = clientGeneralColumns.map((column) => {
      const rawValue = client[column.name];
      const value =
        (
          rawValue === null ||
          rawValue === undefined ||
          String(rawValue).trim() === ""
        ) ?
          "—"
        : String(rawValue);

      return {
        name: column.name,
        label: columnLabelOverrides[column.name] || column.label,
        value,
      };
    });

    if (fields.length) return fields;

    return [
      {
        name: "business_name",
        label: "Razón Social",
        value: client.business_name || "—",
      },
      { name: "rfc", label: "RFC", value: client.rfc || "—" },
      {
        name: "email1",
        label: "Correo Principal",
        value: client.email1 || "—",
      },
      {
        name: "email2",
        label: "Correo Secundario",
        value: client.email2 || "—",
      },
      { name: "celular", label: "Celular", value: client.celular || "—" },
      {
        name: "telefono",
        label: "Teléfono",
        value: client.telefono || "—",
      },
      {
        name: "codigo_postal",
        label: "Código Postal",
        value: client.codigo_postal || "—",
      },
      { name: "ciudad", label: "Ciudad", value: client.ciudad || "—" },
    ];
  }, [client, clientGeneralColumns, columnLabelOverrides]);

  const orphanClientGeneralFieldName = useMemo(() => {
    const compactFields = clientGeneralFields.filter(
      (field) =>
        field?.name &&
        field.name !== "business_name" &&
        !isClientFieldFullWidth(field.name),
    );

    if (compactFields.length % 2 === 0) return null;
    return compactFields[compactFields.length - 1]?.name || null;
  }, [clientGeneralFields]);

  const contactColumnsFromView = useMemo(() => {
    const availableColumns = contactDynamicColumns.filter(
      (column) => column?.name && !CONTACT_HIDDEN_FIELDS.has(column.name),
    );

    let orderedColumns = availableColumns;
    if (
      Array.isArray(contactExcelViewColumns) &&
      contactExcelViewColumns.length
    ) {
      const columnsByName = new Map(
        availableColumns.map((column) => [column.name, column]),
      );
      const excelSubset = contactExcelViewColumns
        .map((columnName) => columnsByName.get(columnName))
        .filter(Boolean);
      if (excelSubset.length) {
        const excelSet = new Set(excelSubset.map((column) => column.name));
        const remaining = availableColumns.filter(
          (column) => !excelSet.has(column.name),
        );
        orderedColumns = [...excelSubset, ...remaining];
      }
    }

    return orderedColumns.map((column) => ({
      ...column,
      label:
        CONTACT_FIELD_LABELS[column.name] ||
        contactColumnLabelOverrides[column.name] ||
        column.label,
    }));
  }, [
    contactDynamicColumns,
    contactExcelViewColumns,
    contactColumnLabelOverrides,
  ]);

  const contactPrimaryColumns = useMemo(() => {
    const columnsByName = new Map(
      contactColumnsFromView.map((column) => [column.name, column]),
    );

    let orderedColumns = CONTACT_DEFAULT_MAIN_COLUMNS.map((columnName) =>
      columnsByName.get(columnName),
    ).filter(Boolean);

    if (orderedColumns.length < CONTACT_FIXED_MAIN_COLUMNS_COUNT) {
      const selected = new Set(orderedColumns.map((column) => column.name));
      const needed = CONTACT_FIXED_MAIN_COLUMNS_COUNT - orderedColumns.length;
      const fallback = contactColumnsFromView
        .filter((column) => !selected.has(column.name))
        .slice(0, needed);
      orderedColumns = [...orderedColumns, ...fallback];
    }

    return orderedColumns.slice(0, CONTACT_FIXED_MAIN_COLUMNS_COUNT);
  }, [contactColumnsFromView]);

  const contactDetailColumns = useMemo(() => {
    const primarySet = new Set(
      contactPrimaryColumns.map((column) => column.name),
    );
    return contactColumnsFromView.filter(
      (column) =>
        !primarySet.has(column.name) &&
        column.name !== "has_portal_access" &&
        column.name !== "is_active",
    );
  }, [contactColumnsFromView, contactPrimaryColumns]);

  const contactEditableColumns = useMemo(
    () =>
      contactColumnsFromView.filter(
        (column) => !CONTACT_READONLY_FIELDS.has(column.name),
      ),
    [contactColumnsFromView],
  );

  const contactQuickFilterButtons = useMemo(() => {
    const availableColumns = new Set(
      contactColumnsFromView.map((column) => column.name),
    );
    const columnsByName = new Map(
      contactColumnsFromView.map((column) => [column.name, column]),
    );

    return CONTACT_QUICK_FILTER_FIELDS.map((config) => {
      const resolvedFieldName =
        config.aliases?.find((name) => availableColumns.has(name)) || config.id;
      const column = columnsByName.get(resolvedFieldName);

      return {
        ...config,
        fieldName: resolvedFieldName,
        modalLabel: column?.label || config.modalLabel,
      };
    });
  }, [contactColumnsFromView]);

  const openEditClientModal = () => {
    if (!client) return;

    const dynamicFormValues = clientGeneralFields.reduce((acc, field) => {
      const rawValue = client[field.name];
      acc[field.name] =
        rawValue === null || rawValue === undefined ? "" : String(rawValue);
      return acc;
    }, {});

    if (Object.keys(dynamicFormValues).length) {
      setClientForm(dynamicFormValues);
    }

    setIsEditingClient(true);
  };

  const handleUpdateClient = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...clientForm };

      if (Object.prototype.hasOwnProperty.call(payload, "rfc")) {
        payload.rfc = client?.rfc ?? payload.rfc;
      }

      await updateClientDynamicApi(id, payload);
      setIsEditingClient(false);
      await load();
      notificationService.success("¡Cliente actualizado!", "Los datos del cliente se guardaron correctamente.");
    } catch (e) {
      notificationService.error("Error al actualizar", e.message);
    }
  };

  const handleDeleteClient = async () => {
    const contactCount = contactRows.length || 0;
    const text =
      contactCount > 0 ?
        `Este cliente tiene ${contactCount} contacto(s) asociado(s). Se eliminará "${client.business_name}" y todos sus datos.`
      : `Se eliminará el cliente "${client.business_name}".`;

    const confirm = await notificationService.confirm({
      title: "¿Estás seguro?",
      text,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });

    if (!confirm) return;

    try {
      await deleteClientApi(id);
      notificationService.toast({ title: "Cliente eliminado correctamente", icon: "success" });
      navigate("/clientes");
    } catch (e) {
      notificationService.error("Error", e.message);
    }
  };

  const addContact = async (e) => {
    e.preventDefault();
    try {
      await createContactApi({ ...newContact, client_id: id });
      setNewContact({
        full_name: "",
        email: "",
        phone: "",
        position_title: "",
      });
      load();
      notificationService.toast({ title: "Contacto agregado", icon: "success" });
    } catch (e) {
      notificationService.error("Error", e.message);
    }
  };

  const startEditContact = (c) => {
    const editableFields =
      contactEditableColumns.length ?
        contactEditableColumns
      : CONTACT_FALLBACK_COLUMNS.filter(
          (column) => !CONTACT_READONLY_FIELDS.has(column.name),
        );

    const formValues = editableFields.reduce((acc, column) => {
      const rawValue = c?.[column.name];
      acc[column.name] =
        rawValue === null || rawValue === undefined ? "" : String(rawValue);
      return acc;
    }, {});

    setEditingContactId(c.id);
    setContactForm(formValues);
  };

  const handleUpdateContact = async () => {
    try {
      await updateContactDynamicApi(editingContactId, contactForm);
      setEditingContactId(null);
      load();
      notificationService.success("¡Contacto actualizado!", "Los cambios se aplicaron correctamente.");
    } catch (e) {
      notificationService.error("Error", e.message);
    }
  };

  const handleDeleteContact = async (contactId) => {
    const confirm = await notificationService.confirm({
      title: "¿Deshabilitar contacto?",
      text: "El contacto dejará de ser accesible.",
      confirmButtonText: "Sí, deshabilitar",
      cancelButtonText: "Cancelar",
    });
    if (!confirm) return;
    try {
      await deleteContactApi(contactId);
      load();
      notificationService.toast({ title: "Contacto deshabilitado", icon: "success" });
    } catch (e) {
      notificationService.error("Error", e.message);
    }
  };

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
                  className={`font-medium ${row.original.is_active === false || row.original.is_active === 0 ? "text-zinc-400 dark:text-zinc-500 line-through" : "text-zinc-800 dark:text-zinc-100"}`}>
                  {value}
                </span>
                {(
                  row.original.is_active === false ||
                  row.original.is_active === 0
                ) ?
                  <span className="ml-2 text-[10px] uppercase font-bold text-zinc-400 dark:text-zinc-500 bg-zinc-100 dark:bg-dark-800 px-1.5 py-0.5 rounded border border-zinc-300 dark:border-dark-700">
                    Deshabilitado
                  </span>
                : row.original.has_portal_access ?
                  <span className="ml-2 text-[8px] uppercase font-bold text-emerald-700 dark:text-emerald-400 px-1.5 py-0.5 rounded">
                    CON PORTAL
                  </span>
                : <span className="ml-2 text-[8px] uppercase font-bold text-orange-500 dark:text-orange-400 px-1.5 py-0.5 rounded">
                    SIN PORTAL
                  </span>
                }
              </div>
            </div>
          );
        }

        return <span className="text-zinc-600 dark:text-zinc-300 break-words">{value}</span>;
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
                setExpandedContactRows((prev) => ({
                  ...prev,
                  [contactId]: !prev[contactId],
                }))
              }
              className="size-7 inline-flex items-center justify-center rounded-lg hover:bg-zinc-100 dark:hover:bg-dark-700 transition-colors text-zinc-500"
              title={isOpen ? "Ocultar más detalles" : "Ver más detalles"}>
              {isOpen ?
                <ChevronDown size={16} />
              : <ChevronRight size={16} />}
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
            row.original.is_active === false || row.original.is_active === 0;
          if (isDisabled) {
            return (
              <div className="flex items-center gap-2 opacity-30 pointer-events-none select-none">
                <button className="px-4 py-1.5 text-sm font-semibold text-zinc-400 bg-zinc-100 dark:bg-dark-800 rounded-xl border border-zinc-200 dark:border-dark-700 shadow-sm flex items-center gap-1.5">
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
                             row.original.has_portal_access ?
                               "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20 dark:hover:bg-emerald-500/20"
                             : "bg-red-50 text-red-800 border-red-200 hover:bg-red-100 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20 dark:hover:bg-red-500/20"
                           }`}>
                <Key size={14} className="opacity-90" /> Acceso
              </button>
              <button
                onClick={() => startEditContact(row.original)}
                className="size-8 flex items-center justify-center rounded-lg text-[#92400E] dark:text-amber-500 transition-colors hover:scale-75"
                title="Editar">
                <Edit2 size={16} />
              </button>
              <button
                onClick={() => handleDeleteContact(row.original.id)}
                className="size-8 flex items-center justify-center rounded-lg text-red-800 dark:text-red-400 transition-colors hover:scale-75"
                title="Deshabilitar">
                <Trash2 size={16} />
              </button>
            </div>
          );
        },
      },
    ];
  }, [
    expandedContactRows,
    handleDeleteContact,
    startEditContact,
    contactPrimaryColumns,
    contactDetailColumns,
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
            <span className="text-zinc-400 line-through text-xs">
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
            <span className="text-zinc-400 text-xs">
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
            <span className="text-zinc-400 text-xs">
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
            <span className="text-zinc-400 text-xs">
              {hasValue(value) ? String(value) : "—"}
            </span>
          );
        },
      },
    ],
    [],
  );

  const activeContactFilterPickerConfig = useMemo(
    () =>
      contactQuickFilterButtons.find(
        (button) => button.fieldName === activeContactFilterPickerField,
      ) || null,
    [contactQuickFilterButtons, activeContactFilterPickerField],
  );

  const contactFilterPickerOptions = useMemo(() => {
    if (!activeContactFilterPickerField) return [];

    const uniqueValues = new Map();
    contactRows.forEach((contact) => {
      if (contact.is_active === false || contact.is_active === 0) return;

      const rawValue = contact?.[activeContactFilterPickerField];
      if (rawValue === null || rawValue === undefined) return;

      const value = String(rawValue).trim();
      if (!value) return;

      const normalized = normalizeSearchText(value);
      if (!normalized || uniqueValues.has(normalized)) return;

      uniqueValues.set(normalized, value);
    });

    return Array.from(uniqueValues.values()).sort((a, b) =>
      a.localeCompare(b, "es", { sensitivity: "base" }),
    );
  }, [contactRows, activeContactFilterPickerField]);

  const visibleContactFilterPickerOptions = useMemo(() => {
    const normalizedPickerSearch = normalizeSearchText(
      contactFilterPickerSearch,
    );
    if (!normalizedPickerSearch) return contactFilterPickerOptions;

    return contactFilterPickerOptions.filter((value) =>
      normalizeSearchText(value).includes(normalizedPickerSearch),
    );
  }, [contactFilterPickerSearch, contactFilterPickerOptions]);

  useEffect(() => {
    if (!showContactFilters) {
      setActiveContactFilterPickerField(null);
      setContactFilterPickerSearch("");
    }
  }, [showContactFilters]);

  const filteredContacts = useMemo(() => {
    if (!contactRows.length) return [];
    const normalizedQuery = normalizeSearchText(contactSearch);
    const activeFilters = Object.entries(contactFilters).filter(
      ([, value]) => String(value || "").trim() !== "",
    );
    const searchableColumns =
      contactColumnsFromView.length ?
        contactColumnsFromView
      : CONTACT_FALLBACK_COLUMNS;

    return contactRows.filter((c) => {
      if (c.is_active === false || c.is_active === 0) return false;

      const matchQ =
        !normalizedQuery ||
        searchableColumns.some((column) =>
          normalizeSearchText(c?.[column.name]).includes(normalizedQuery),
        );

      const matchFilters = activeFilters.every(
        ([key, value]) =>
          normalizeSearchText(c?.[key]) === normalizeSearchText(value),
      );

      return matchQ && matchFilters;
    });
  }, [contactRows, contactSearch, contactFilters, contactColumnsFromView]);

  const activeContactFilterCount =
    Object.values(contactFilters).filter((v) => v.trim() !== "").length +
    (contactSearch.trim() ? 1 : 0);

  const clearContactFilters = () => {
    setContactSearch("");
    setContactFilters({
      position_title: "",
    });
    setActiveContactFilterPickerField(null);
    setContactFilterPickerSearch("");
  };

  const openContactFilterPicker = (fieldName) => {
    setActiveContactFilterPickerField(fieldName);
    setContactFilterPickerSearch("");
  };

  const closeContactFilterPicker = () => {
    setActiveContactFilterPickerField(null);
    setContactFilterPickerSearch("");
  };

  const applyContactFilterValue = (value) => {
    if (!activeContactFilterPickerField) return;

    setContactFilters((prev) => ({
      ...prev,
      [activeContactFilterPickerField]: value,
    }));
    closeContactFilterPicker();
  };

  const disabledContacts = useMemo(() => {
    return contactRows.filter(
      (c) => c.is_active === false || c.is_active === 0,
    );
  }, [contactRows]);

  const disabledContactsTable = useReactTable({
    data: disabledContacts,
    columns: disabledContactsColumns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: { pageSize: 3 },
    },
  });

  const visibleDisabledContactRows = disabledContactsTable.getRowModel().rows;
  const shouldEnableDisabledContactsTableScroll = disabledContacts.length > 3;

  const contactsTable = useReactTable({
    data: filteredContacts,
    columns: contactsColumns,
    state: { sorting: contactsSorting },
    onSortingChange: setContactsSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: { pageSize: 10 },
    },
  });

  const visibleContactRows = contactsTable.getRowModel().rows;
  const contactsPageSize = contactsTable.getState().pagination.pageSize;
  const shouldEnableContactTableScroll = contactsPageSize >= 25;

  const {
    handleExportContactsPDF,
    handleExportContactsExcel,
    handleDownloadContactsTemplate,
  } = useContactExport({ contactColumnsFromView, contactsTable });

  if (loading)
    return (
      <div className="flex h-64 items-center justify-center text-primary-400 font-medium">
        Cargando información...
      </div>
    );
  if (!client)
    return (
      <div className="p-8 text-center text-red-400 bg-red-500/10 rounded-xl border border-red-500/20">
        Cliente no encontrado
      </div>
    );

  const clientBusinessName = String(client.business_name || "Cliente");
  const clientIdShort = String(client.id ?? "").slice(0, 8);

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      {/* Modal edición de cliente */}
      <ClientEditModal
        isOpen={isEditingClient}
        onClose={() => setIsEditingClient(false)}
        clientBusinessName={clientBusinessName}
        clientGeneralFields={clientGeneralFields}
        clientForm={clientForm}
        setClientForm={setClientForm}
        handleUpdateClient={handleUpdateClient}
        isClientFieldFullWidth={isClientFieldFullWidth}
        getClientFieldInputType={getClientFieldInputType}
        isClientFieldReadOnly={isClientFieldReadOnly}
      />

      {managingPortalContact && (
        <ManagePortalModal
          contact={managingPortalContact}
          onClose={(refresh) => {
            setManagingPortalContact(null);
            if (refresh) load();
          }}
          productsList={productsList}
        />
      )}

      {/* Header */}
      <div className="bg-white dark:bg-dark-800 p-6 rounded-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-baseline gap-3">
            <h1 className="text-3xl font-semibold text-[#1a2b4c] dark:text-zinc-100 tracking-tight">
              {clientBusinessName.toUpperCase()}
            </h1>
            <span className="px-2 py-0.5 rounded text-xs font-mono bg-white/10 text-zinc-400 border border-white/5">
              ID: {clientIdShort || "N/A"}
            </span>
          </div>
          <div className="flex flex-wrap gap-4 mt-2 text-sm text-light-text-secondary dark:text-zinc-400">
            <span className="flex items-center gap-1">
              <ClipboardList size={16} className="text-black dark:text-zinc-400" />{" "}
              {client.rfc || "Sin RFC"}
            </span>
            {hasValue(client.address) && (
              <span className="flex items-center gap-1">
                <MapPin size={16} className="text-black dark:text-zinc-400" /> {client.address}
              </span>
            )}
          </div>
        </div>

        <Link
          to="/clientes"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-black dark:text-zinc-300 hover:text-light-text-primary px-1 py-1 rounded-lg transition-colors"
        >
          <ArrowLeft size={16} />
          Volver
        </Link>
      </div>

      {error && (
        <div className="text-sm text-red-400 bg-red-500/10 p-3 rounded-xl border border-red-500/20">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 pb-1 mb-6 overflow-x-auto custom-scrollbar">
        {[
          { id: "general", label: "General", icon: <Building2 size={18} /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border transition-colors whitespace-nowrap ${
              activeTab === tab.id ?
                "bg-white dark:bg-dark-900 text-black dark:text-zinc-100 border-[#CBD5E1] dark:border-dark-700 shadow-sm"
              : "text-zinc-400 border-transparent hover:text-black hover:border-zinc-200 dark:hover:border-dark-700 hover:bg-white/70 dark:hover:bg-dark-900/50"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "general" && (
        <div className="grid lg:grid-cols-3 gap-6 animate-fade-in">
          {/* Columna izquierda (Información y Agregar Contacto) */}
          <div className="space-y-6">
            <Card>
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-semibold text-[#1a2b4c] dark:text-zinc-100 flex items-center gap-2">
                  <Building2 size={20} className="text-black dark:text-zinc-300" /> Datos generales
                  de {client.business_name}
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={openEditClientModal}
                    className="p-1.5 rounded-lg text-[#92400E] dark:text-amber-500 transition hover:scale-75"
                    title="Editar"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={handleDeleteClient}
                    className="p-1.5 rounded-lg text-red-800 dark:text-red-500 transition hover:scale-75"
                    title="Eliminar cliente"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                {clientGeneralFields.map((field) => {
                  const isFullWidthField =
                    field.name === "business_name" ||
                    isClientFieldFullWidth(field.name) ||
                    field.name === orphanClientGeneralFieldName;

                  return (
                    <div
                      key={field.name}
                      className={`${isFullWidthField ? "md:col-span-2" : ""} h-full p-3.5 rounded-xl border border-zinc-200/80 dark:border-dark-700 shadow-sm`}
                    >
                      <span className="text-xs font-semibold text-[#2277B4] dark:text-blue-400 uppercase block mb-1.5 tracking-wide">
                        {field.label}
                      </span>
                      <div className="w-full overflow-visible">
                        <div className="relative group/email inline-block max-w-full">
                          <div className="text-light-text-primary dark:text-zinc-100 truncate leading-relaxed">
                            {field.value}
                          </div>

                          {field.name === "email1" && field.value && field.value !== "—" && (
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5 pointer-events-none opacity-0 group-hover/email:opacity-100 scale-95 translate-y-4 group-hover/email:-translate-y-6 group-hover/email:scale-100 transition-all duration-300 ease-out bg-gradient-to-br from-blue-200/50 to-blue-200/50 backdrop-blur-md text-black text-[11px] font-medium py-2 px-3.5 rounded-xl shadow-[0_10px_25px_rgba(0,0,0,0.25)] whitespace-nowrap z-50 normal-case tracking-normal flex items-center gap-2">    
                              <span>{field.value}</span>
                              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-blue-200/50 dark:border-t-blue-200/50"></div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            <Card>
              <h3 className="font-semibold text-light-text-primary dark:text-zinc-100 mb-4 flex items-center gap-2">
                <UserPlus size={20} className="text-black dark:text-zinc-300" /> Asignar Contacto
                a: {client.business_name}
              </h3>
              <form onSubmit={addContact} className="space-y-3">
                <Input
                  label="Nombre completo *"
                  value={newContact.full_name}
                  onChange={(e) =>
                    setNewContact({ ...newContact, full_name: e.target.value })
                  }
                  placeholder="Ej. Juan Pérez"
                  required
                />
                <Input
                  label="Correo electrónico *"
                  value={newContact.email}
                  onChange={(e) =>
                    setNewContact({ ...newContact, email: e.target.value })
                  }
                  placeholder="ejemplo@correo.com"
                  required
                />
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Puesto"
                    value={newContact.position_title}
                    onChange={(e) =>
                      setNewContact({
                        ...newContact,
                        position_title: e.target.value,
                      })
                    }
                    placeholder="Ej. Gerente"
                  />
                  <Input
                    label="Teléfono"
                    value={newContact.phone}
                    onChange={(e) =>
                      setNewContact({ ...newContact, phone: e.target.value })
                    }
                    placeholder="A 10 dígitos"
                  />
                </div>
                <button className="w-full px-4 py-2 text-sm text-white rounded-xl bg-[#2277B4] hover:bg-[#125280] cursor-pointer transition-all duration-150 backdrop-blur-sm active:scale-95 active:translate-y-px shadow-lg shadow-[#2277B450] font-bold">
                  Agregar Contacto
                </button>
              </form>
            </Card>
          </div>

          {/* Columna derecha (Lista de contactos) */}
          <div className="lg:col-span-2">
            <Card className="h-full">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-lg text-light-text-primary dark:text-zinc-100">
                    Contactos registrados de: {client.business_name}
                  </h3>
                  <p className="text-xs text-light-text-secondary dark:text-zinc-400">
                    {filteredContacts.length} de{" "}
                    {
                      contactRows.filter(
                        (c) => c.is_active !== false && c.is_active !== 0,
                      ).length
                    }{" "}
                    registros
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {(user?.role?.name === "ADMIN" ||
                    user?.role?.name === "VENTAS") && (
                    <button
                      onClick={openBulkContactModal}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold text-[#1a2b4c] dark:text-zinc-100 transition-colors"
                    >
                      <Upload size={15} />
                      Cargar contactos
                    </button>
                  )}
                </div>
              </div>

              {/* Toolbar de búsqueda y filtros */}
              <div className="flex flex-wrap items-center gap-2 mb-4">
                {/* Búsqueda global */}
                <div className="flex gap-1 bg-white dark:bg-dark-900 p-1 rounded-lg border border-zinc-200 dark:border-dark-700 flex-1 min-w-[200px]">
                  <input
                    value={contactSearch}
                    onChange={(e) => setContactSearch(e.target.value)}
                    placeholder="Buscar contacto…"
                    className="bg-transparent border-none text-sm text-zinc-800 dark:text-zinc-100 placeholder:text-zinc-400 px-3 w-full focus:outline-none"
                  />
                  <div className="px-3 py-1.5 text-black dark:text-zinc-400">
                    <Search size={16} />
                  </div>
                </div>

                <div className="flex flex-col items-center gap-1">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleExportContactsPDF}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold border border-red-200 dark:border-red-500/30 bg-white dark:bg-red-500/10 text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/20 transition-colors whitespace-nowrap"
                      title="Exportar a PDF"
                    >
                      <FileText size={14} /> Exportar a PDF
                    </button>

                    <button
                      onClick={handleExportContactsExcel}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold border border-emerald-200 dark:border-emerald-500/30 bg-white dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/20 transition-colors whitespace-nowrap"
                      title="Exportar a Excel"
                    >
                      <FileSpreadsheet size={14} /> Exportar a Excel
                    </button>
                  </div>
                </div>

                {/* Botón filtros */}
                <button
                  onClick={() => setShowContactFilters((v) => !v)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold border transition-colors ${
                    showContactFilters || activeContactFilterCount > 0 ?
                      "bg-[#2277B4] text-white border-[#2277B4]"
                    : "bg-white dark:bg-dark-900 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-dark-700 hover:bg-zinc-50 dark:hover:bg-dark-800"
                  }`}
                >
                  <SlidersHorizontal size={15} />
                  Filtros
                  {activeContactFilterCount > 0 && (
                    <span className="ml-1 bg-white text-[#2277B4] rounded-full text-xs font-bold size-5 flex items-center justify-center">
                      {activeContactFilterCount}
                    </span>
                  )}
                </button>

                {/* Limpiar filtros */}
                {activeContactFilterCount > 0 && (
                  <button
                    onClick={clearContactFilters}
                    className="flex items-center gap-1 px-2 py-2 rounded-lg text-xs text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <X size={14} /> Limpiar
                  </button>
                )}

                <span className="text-xs text-zinc-400 ml-auto">
                  Pág. {contactsTable.getState().pagination.pageIndex + 1} de{" "}
                  {contactsTable.getPageCount() || 1}
                </span>
              </div>

              {/* Selector de filtros individuales */}
              <ContactFilterPicker
                isOpen={!!activeContactFilterPickerField && showContactFilters}
                onClose={closeContactFilterPicker}
                activeContactFilterPickerField={activeContactFilterPickerField}
                activeContactFilterPickerConfig={activeContactFilterPickerConfig}
                contactFilterPickerSearch={contactFilterPickerSearch}
                setContactFilterPickerSearch={setContactFilterPickerSearch}
                visibleContactFilterPickerOptions={visibleContactFilterPickerOptions}
                contactFilters={contactFilters}
                applyContactFilterValue={applyContactFilterValue}
                normalizeSearchText={normalizeSearchText}
              />

              <div className="px-4 py-2 min-h-10 bg-blue-50 dark:bg-blue-500/5 border border-zinc-200 dark:border-dark-700 border-b-0 rounded-t-md text-xs text-[#2277B4] dark:text-blue-400 flex items-center justify-between gap-3">
                <div className="flex items-center gap-1 shrink-0">
                  <Lightbulb size={14} className="inline" /> Clic en
                  <ChevronRight size={12} className="inline" /> para más
                  detalles
                </div>

                <div className="flex items-center gap-3">
                  <div
                    className={`flex items-center gap-2 transition-opacity duration-150 ${
                      showContactFilters ? "opacity-100" : "opacity-0 pointer-events-none"
                    }`}
                  >
                    {contactQuickFilterButtons.map((button) => {
                      const selectedValue = String(
                        contactFilters[button.fieldName] || "",
                      );

                      return (
                        <button
                          key={button.id}
                          onClick={() =>
                            openContactFilterPicker(button.fieldName)
                          }
                          className={`inline-flex items-center gap-2 px-3 py-1 rounded-md text-xs border transition-colors whitespace-nowrap ${
                            selectedValue ?
                              "bg-[#2277B4] text-white border-[#2277B4]"
                            : "bg-white dark:bg-dark-900 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-dark-700 hover:bg-zinc-100 dark:hover:bg-dark-800"
                          }`}
                        >
                          <span className="font-semibold tracking-wide">
                            {button.buttonLabel}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  
                  <button
                    onClick={handleDownloadContactsTemplate}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-zinc-700 dark:text-zinc-300 bg-white dark:bg-dark-800 border border-zinc-200 dark:border-dark-700 hover:bg-zinc-50 dark:hover:bg-dark-700 transition-colors whitespace-nowrap"
                    title="Descargar plantilla de carga masiva de contactos"
                  > 
                    <FileSpreadsheet size={13} /> Descargar plantilla excel
                  </button>
                </div>
              </div>

              {/* Tabla TanStack */}
              <div
                className={`bg-white dark:bg-dark-900 overflow-x-auto border border-zinc-200 dark:border-dark-700 border-t-0 rounded-b-md ${
                  shouldEnableContactTableScroll ? "h-[65vh] overflow-y-scroll" : ""
                }`}
              >
                <table className="w-full text-sm">
                  <thead>
                    {contactsTable.getHeaderGroups().map((hg) => (
                      <tr
                        key={hg.id}
                        className="bg-zinc-50 dark:bg-dark-800 border-b border-zinc-200 dark:border-dark-700"
                      >
                        {hg.headers.map((header) => (
                          <th
                            key={header.id}
                            onClick={
                              header.column.getCanSort() ?
                                header.column.getToggleSortingHandler()
                              : undefined
                            }
                            className={`px-4 py-3 text-left text-xs font-semibold text-[#2277B4] dark:text-blue-400 uppercase tracking-wider transition-colors ${
                              shouldEnableContactTableScroll ? "sticky top-0 z-20 bg-zinc-50 dark:bg-dark-800" : ""
                            } ${
                              header.column.getCanSort() ?
                                "cursor-pointer hover:bg-zinc-100 dark:hover:bg-dark-700"
                              : "cursor-default"
                            } ${header.column.id === "expander" ? "w-12" : ""}`}
                          >
                            <div className="flex items-center gap-2">
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
                  <tbody className="divide-y divide-zinc-100 dark:divide-dark-700">
                    {visibleContactRows.map((row) => {
                      const isExpanded = !!expandedContactRows[row.original.id];
                      const rowDetailColumns = contactDetailColumns.filter(
                        (column) => hasValue(row.original?.[column.name]),
                      );
                      const detailColumnsByPrimary =
                        contactPrimaryColumns.reduce((acc, primaryColumn) => {
                          acc[primaryColumn.name] = [];
                          return acc;
                        }, {});

                      rowDetailColumns.forEach((column) => {
                        const hostColumn =
                          resolveDetailHostColumn(
                            column,
                            contactPrimaryColumns,
                            detailColumnsByPrimary,
                          ) || contactPrimaryColumns[0]?.name;

                        if (hostColumn && detailColumnsByPrimary[hostColumn]) {
                          detailColumnsByPrimary[hostColumn].push(column);
                        }
                      });

                      return (
                        <Fragment key={row.id}>
                          <tr className="hover:bg-zinc-50 dark:hover:bg-dark-800 transition-colors">
                            {row.getVisibleCells().map((cell) => (
                              <td key={cell.id} className="px-4 py-3 align-top">
                                {flexRender(
                                  cell.column.columnDef.cell,
                                  cell.getContext(),
                                )}
                              </td>
                            ))}
                          </tr>

                          {isExpanded && rowDetailColumns.length > 0 && (
                            <tr className="bg-zinc-50/80 dark:bg-dark-800/80">
                              {row.getVisibleCells().map((cell) => {
                                const columnId = cell.column.id;
                                const alignedDetails =
                                  detailColumnsByPrimary[columnId] || [];

                                return (
                                  <td
                                    key={`${cell.id}__detail`}
                                    className="px-4 py-4 align-top"
                                  >
                                    {alignedDetails.length > 0 && (
                                      <div className="space-y-3">
                                        {alignedDetails.map((column) => {
                                          const rawValue =
                                            row.original?.[column.name];
                                          const value =
                                            hasValue(rawValue) ?
                                              String(rawValue)
                                            : "—";

                                          return (
                                            <div
                                              key={`${row.id}_${column.name}`}
                                              className="min-w-0"
                                            >
                                              <p className="text-[10px] font-semibold uppercase text-[#2277B4] dark:text-blue-400 tracking-wider">
                                                {column.label}
                                              </p>
                                              <p className="text-sm text-zinc-700 dark:text-zinc-100 break-words">
                                                {value}
                                              </p>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </td>
                                );
                              })}
                            </tr>
                          )}
                        </Fragment>
                      );
                    })}
                  </tbody>
                </table>

                {visibleContactRows.length === 0 && (
                  <div className="py-12 text-center">
                    <div className="flex justify-center mb-2 text-zinc-300">
                      <Users size={48} />
                    </div>
                    <p className="text-sm text-zinc-500">
                      {(
                        filteredContacts.length === 0 &&
                        activeContactFilterCount > 0
                      ) ?
                        "No se encontraron contactos con los filtros aplicados."
                      : "Este cliente aún no tiene contactos registrados."}
                    </p>
                  </div>
                )}
              </div>

              {/* Paginación de contactos */}
              {filteredContacts.length > 0 && (
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-zinc-500 dark:text-zinc-400">Mostrar</span>
                    <select
                      value={contactsTable.getState().pagination.pageSize}
                      onChange={(e) =>
                        contactsTable.setPageSize(Number(e.target.value))
                      }
                      className="px-2 py-1 rounded-lg text-sm text-[#1a2b4c] dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#153465] dark:focus:ring-blue-500 bg-white dark:bg-dark-900 border border-zinc-200 dark:border-dark-700"
                    >
                      {[10, 25, 50, 100].map((size) => (
                        <option key={size} value={size} className="dark:bg-dark-900 dark:text-zinc-100">
                          {size}
                        </option>
                      ))}
                    </select>
                    <span className="text-sm text-zinc-500 dark:text-zinc-400">por página</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => contactsTable.setPageIndex(0)}
                      disabled={!contactsTable.getCanPreviousPage()}
                      className="px-2 py-1 text-sm font-medium text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-white/5 rounded-lg hover:bg-zinc-200 dark:hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      ««
                    </button>
                    <button
                      onClick={() => contactsTable.previousPage()}
                      disabled={!contactsTable.getCanPreviousPage()}
                      className="px-3 py-1 text-sm font-medium text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-white/5 rounded-lg hover:bg-zinc-200 dark:hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Anterior
                    </button>
                    <button
                      onClick={() => contactsTable.nextPage()}
                      disabled={!contactsTable.getCanNextPage()}
                      className="px-3 py-1 text-sm font-medium text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-white/5 rounded-lg hover:bg-zinc-200 dark:hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Siguiente
                    </button>
                    <button
                      onClick={() =>
                        contactsTable.setPageIndex(
                          contactsTable.getPageCount() - 1,
                        )
                      }
                      disabled={!contactsTable.getCanNextPage()}
                      className="px-2 py-1 text-sm font-medium text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-white/5 rounded-lg hover:bg-zinc-200 dark:hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      »»
                    </button>
                  </div>
                </div>
              )}

              {/* Desplegable de contactos deshabilitados */}
              {disabledContacts.length > 0 && (
                <div className="mt-3">
                  <button
                    onClick={() => setShowDisabled((v) => !v)}
                    className="flex items-center gap-2 text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors select-none group px-1 py-1"
                  >
                    <ChevronRight
                      size={14}
                      className={`transition-transform duration-200 ${
                        showDisabled ? "rotate-90" : ""
                      }`}
                    />
                    <span className="group-hover:underline">
                      {showDisabled ?
                        "Ocultar contactos deshabilitados"
                      : `Mostrar contactos deshabilitados (${disabledContacts.length})`
                      }
                    </span>
                  </button>

                  {showDisabled && (
                    <>
                      <div
                        className={`mt-2 overflow-x-auto rounded-md border border-zinc-200 dark:border-dark-700 animate-fade-in ${
                          shouldEnableDisabledContactsTableScroll ? "max-h-[12rem] overflow-y-auto" : ""
                        }`}
                      >
                        <table className="w-full text-sm bg-white dark:bg-dark-900">
                          <thead>
                            {disabledContactsTable
                              .getHeaderGroups()
                              .map((hg) => (
                                <tr
                                  key={hg.id}
                                  className="bg-zinc-100 dark:bg-dark-800 border-b border-zinc-200 dark:border-dark-700"
                                >
                                  {hg.headers.map((header) => (
                                    <th
                                      key={header.id}
                                      className={`px-4 py-2 text-left text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider ${
                                        shouldEnableDisabledContactsTableScroll ? "sticky top-0 z-20 bg-zinc-100 dark:bg-dark-800" : ""
                                      }`}
                                    >
                                      {flexRender(
                                        header.column.columnDef.header,
                                        header.getContext(),
                                      )}
                                    </th>
                                  ))}
                                </tr>
                              ))}
                          </thead>
                          <tbody className="divide-y divide-zinc-100 dark:divide-dark-700">
                            {visibleDisabledContactRows.map((row) => (
                              <tr
                                key={row.id}
                                className="bg-zinc-50 dark:bg-dark-900 opacity-50"
                              >
                                {row.getVisibleCells().map((cell) => (
                                  <td key={cell.id} className="px-4 py-2.5">
                                    {flexRender(
                                      cell.column.columnDef.cell,
                                      cell.getContext(),
                                    )}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-zinc-500 dark:text-zinc-400">Mostrar</span>
                          <select
                            value={
                              disabledContactsTable.getState().pagination
                                .pageSize
                            }
                            onChange={(e) =>
                              disabledContactsTable.setPageSize(
                                Number(e.target.value),
                              )
                            }
                            className="px-2 py-1 rounded-lg text-sm text-[#1a2b4c] dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#153465] dark:focus:ring-blue-500 bg-white dark:bg-dark-900 border border-zinc-200 dark:border-dark-700"
                          >
                            {[3, 10, 25, 50, 100].map((size) => (
                              <option key={size} value={size} className="dark:bg-dark-900 dark:text-zinc-100">
                                {size}
                              </option>
                            ))}
                          </select>
                          <span className="text-sm text-zinc-500 dark:text-zinc-400">
                            por página
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() =>
                              disabledContactsTable.setPageIndex(0)
                            }
                            disabled={
                              !disabledContactsTable.getCanPreviousPage()
                            }
                            className="px-2 py-1 text-sm font-medium text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-white/5 rounded-lg hover:bg-zinc-200 dark:hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            ««
                          </button>
                          <button
                            onClick={() => disabledContactsTable.previousPage()}
                            disabled={
                              !disabledContactsTable.getCanPreviousPage()
                            }
                            className="px-3 py-1 text-sm font-medium text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-white/5 rounded-lg hover:bg-zinc-200 dark:hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Anterior
                          </button>
                          <button
                            onClick={() => disabledContactsTable.nextPage()}
                            disabled={!disabledContactsTable.getCanNextPage()}
                            className="px-3 py-1 text-sm font-medium text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-white/5 rounded-lg hover:bg-zinc-200 dark:hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Siguiente
                          </button>
                          <button
                            onClick={() =>
                              disabledContactsTable.setPageIndex(
                                disabledContactsTable.getPageCount() - 1,
                              )
                            }
                            disabled={!disabledContactsTable.getCanNextPage()}
                            className="px-2 py-1 text-sm font-medium text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-white/5 rounded-lg hover:bg-zinc-200 dark:hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            »»
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </Card>
          </div>
        </div>
      )}

      {activeTab === "products" && client && (
        <ClientProductsTab
          clientId={client.id}
          contacts={contactRows}
          productsList={productsList}
        />
      )}

      {/* Modal de edición de contacto */}
      <ContactEditModal
        isOpen={!!editingContactId}
        onClose={() => setEditingContactId(null)}
        contactEditableColumns={contactEditableColumns}
        contactForm={contactForm}
        setContactForm={setContactForm}
        handleUpdateContact={handleUpdateContact}
        getContactFieldInputType={getContactFieldInputType}
      />

      {/* Modal de Carga Masiva de Contactos */}
      <ContactBulkModal
        isOpen={showBulkContactModal}
        onClose={() => setShowBulkContactModal(false)}
        clientBusinessName={clientBusinessName}
        bulkContactDriveUrl={bulkContactDriveUrl}
        setBulkContactDriveUrl={setBulkContactDriveUrl}
        executeBulkContactDriveImport={executeBulkContactDriveImport}
        bulkContactDriveImporting={bulkContactDriveImporting}
        bulkContactResult={bulkContactResult}
        bulkContactFileRef={bulkContactFileRef}
        handleBulkContactFile={handleBulkContactFile}
        executeBulkContactUpload={executeBulkContactUpload}
        bulkContactUploading={bulkContactUploading}
        bulkContactErrors={bulkContactErrors}
        bulkContactData={bulkContactData}
      />
    </div>
  );
}
