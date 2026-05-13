import {
  Fragment,
  useEffect,
  useState,
  useContext,
  useMemo,
  useRef,
} from "react";
import { createPortal, flushSync } from "react-dom";
import Swal from "sweetalert2";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  flexRender,
} from "@tanstack/react-table";
import { AuthContext } from "../../context/AuthContext";
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import {
  getClientApi,
  updateClientDynamicApi,
  deleteClientApi,
  listClientActiveServicesApi,
  listClientsDynamicApi,
} from "../../actionsAPI/clients.api";
import {
  createContactApi,
  updateContactApi,
  updateContactDynamicApi,
  deleteContactApi,
  listContactProductsApi,
  createContactProductApi,
  deleteContactProductApi,
  bulkCreateContactsApi,
  listContactsDynamicByClientApi,
  importContactsFromDriveApi,
} from "../../actionsAPI/contacts.api";
import {
  listProductsApi,
  createProductApi,
  deleteProductApi,
} from "../../actionsAPI/products.api";
import {
  Lock,
  Tag,
  AlertTriangle,
  Clipboard,
  ClipboardList,
  MapPin,
  Building,
  Building2,
  Edit2,
  ScrollText,
  UserPlus,
  Pencil,
  ChevronUp,
  ChevronDown,
  ChevronRight,
  Contact,
  Users,
  FileText,
  Trash2,
  X,
  Search,
  Key,
  Package,
  Sparkles,
  Library,
  Plus,
  Upload,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertCircle,
  Lightbulb,
  SlidersHorizontal,
  Filter,
  ArrowLeft,
} from "@icons";

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
const CONTACT_FALLBACK_COLUMNS = [
  { name: "full_name", label: "Nombre Completo", type: "varchar" },
  { name: "email", label: "Correo Electrónico", type: "varchar" },
  { name: "phone", label: "Teléfono", type: "varchar" },
  { name: "position_title", label: "Puesto", type: "varchar" },
  { name: "has_portal_access", label: "Acceso Portal", type: "tinyint" },
  { name: "is_active", label: "Activo", type: "tinyint" },
];
const CONTACT_TEMPLATE_COLUMNS = [
  "NOMBRE COMPLETO",
  "CORREO ELECTRONICO",
  "PUESTO",
  "TELEFONO",
];
const CLIENT_DETAIL_HIDDEN_FIELDS = new Set([
  "id",
  "created_at",
  "updated_at",
  "created_by_user_id",
  "portal_password_hash",
]);
const CLIENT_DETAIL_FULL_WIDTH_FIELDS = new Set([
  "business_name",
  "email2",
  "address",
  "direccion",
]);

function getClientFieldInputType(fieldName) {
  const key = String(fieldName || "").toLowerCase();
  if (key.includes("email") || key.includes("correo")) return "email";
  if (key.includes("tel") || key.includes("phone") || key.includes("celular")) {
    return "tel";
  }
  return "text";
}

function isClientFieldFullWidth(fieldName) {
  const key = String(fieldName || "").toLowerCase();
  return (
    CLIENT_DETAIL_FULL_WIDTH_FIELDS.has(key) ||
    key.includes("address") ||
    key.includes("direccion")
  );
}

function isClientFieldReadOnly(fieldName) {
  return String(fieldName || "").toLowerCase() === "rfc";
}

function normalizeSearchText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function normalizeExcelHeader(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function hasValue(value) {
  return value !== null && value !== undefined && String(value).trim() !== "";
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

const CATALOG = [
  {
    category: "Contabilidad y Finanzas",
    items: [
      {
        name: "CONTPAQi Contabilidad (Desktop)",
        description:
          "El sistema estándar para contadores que integra la gestión de CFDI y generación de pólizas.",
      },
      {
        name: "CONTPAQi Contabiliza (Nube)",
        description:
          "Versión 100% web que permite llevar la contabilidad desde cualquier lugar, ideal para despachos modernos.",
      },
      {
        name: "CONTPAQi Bancos (Desktop)",
        description:
          "Controla tesorería, flujo de efectivo y conciliaciones bancarias.",
      },
      {
        name: "CONTPAQi Analiza (Nube)",
        description:
          "Herramienta de auditoría para validar y confrontar datos fiscales directamente con el SAT.",
      },
    ],
  },
  {
    category: "Nóminas y Recursos Humanos",
    items: [
      {
        name: "CONTPAQi Nóminas (Desktop)",
        description:
          "Software robusto para el cálculo masivo de sueldos, IMSS, ISR y timbrado de recibos (actualizado para 2026).",
      },
      {
        name: "CONTPAQi Personia (Nube)",
        description:
          "Gestión de nómina en la nube para empresas que buscan movilidad y simplicidad.",
      },
      {
        name: "CONTPAQi Evalúa 035",
        description:
          "Ayuda a cumplir con la NOM-035 (riesgos psicosociales) mediante encuestas y reportes.",
      },
      {
        name: "CONTPAQi Colabora",
        description:
          "Plataforma de comunicación entre la empresa y sus empleados para entrega de recibos y avisos.",
      },
    ],
  },
  {
    category: "Comercial y Ventas",
    items: [
      {
        name: "CONTPAQi Comercial (Start, Pro y Premium)",
        description:
          "Niveles de software que van desde lo básico para emprendedores hasta soluciones complejas de manufactura e inventarios.",
      },
      {
        name: "CONTPAQi Factura Electrónica",
        description:
          "Especializado en empresas de servicios que solo requieren emisión de comprobantes y cuentas por cobrar.",
      },
      {
        name: "CONTPAQi Vende (Nube)",
        description:
          "Facturación rápida y sencilla desde el navegador, enfocada en microempresas y freelancers.",
      },
      {
        name: "CONTPAQi Cobra",
        description:
          "Gestión de cobranza automatizada para mejorar el flujo de efectivo.",
      },
    ],
  },
  {
    category: "Herramientas de Productividad y Nube",
    items: [
      {
        name: "CONTPAQi XML en Línea+",
        description: "Descarga masiva de facturas desde el portal del SAT.",
      },
      {
        name: "CONTPAQi Respaldos",
        description:
          "Servicio para resguardar la información de tus sistemas de escritorio de forma segura en la nube.",
      },
      {
        name: "CONTPAQi Escritorio Virtual",
        description:
          "Permite subir tus sistemas tradicionales (Desktop) a un servidor en la nube para acceder a ellos vía remota.",
      },
      {
        name: "CONTPAQi Viáticos",
        description: "Control y comprobación de gastos de viaje y caja chica.",
      },
    ],
  },
];

const ManagePortalModal = ({ contact, onClose }) => {
  const [access, setAccess] = useState(contact.has_portal_access);
  const [saving, setSaving] = useState(false);
  // Password state removed as it is auto-generated

  const generatePassword = () => {
    // Formato: 20240131 + 6 caracteres aleatorios (ej. 20240131ABC123)
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const random = Math.random().toString(36).slice(-6).toUpperCase();
    return `${date}${random}`;
  };

  const handleSaveAccess = async () => {
    if (saving) return;
    setSaving(true);

    try {
      const newAccess = !access;
      let generatedPass = undefined;

      if (newAccess) {
        generatedPass = generatePassword();
      }

      await updateContactApi(contact.id, {
        has_portal_access: newAccess,
        portal_password: generatedPass,
      });

      if (newAccess) {
        Swal.fire({
          icon: "success",
          title: "Acceso habilitado",
          text: `${contact.email || "su dirección"} ya tiene acceso al portal.`,
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        Swal.fire({
          icon: "success",
          title: "Acceso revocado",
          text: "El acceso al portal fue revocado correctamente.",
          timer: 1500,
          showConfirmButton: false,
        });
      }
      setAccess(newAccess);
      setSaving(false);
      onClose(true);
      return;
    } catch (e) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: e.message,
        confirmButtonColor: "#2277B4",
      });
      setSaving(false);
    }
  };

  return createPortal(
    <div
      style={{ zIndex: 9999 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
        {/* Header del modal */}
        <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between bg-[#1a2b4c]">
          <div>
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              Portal del Contacto
            </h2>
            <div className="text-sm text-zinc-300 mt-1">
              {" "}
              <span className="text-white font-medium">
                {contact.full_name}
              </span>
            </div>
          </div>
          <button
            onClick={() => onClose(false)}
            className="size-8 flex items-center justify-center rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Body del modal */}
        <div className="p-6 space-y-6 bg-zinc-50/50">
          <div className="p-5 rounded-2xl bg-white border border-zinc-200 shadow-sm relative overflow-hidden">
            {/* Decoration */}
            <div className="absolute top-0 right-0 size-32 bg-[#2277B4]/10 blur-2xl -translate-y-1/2 translate-x-1/2 rounded-full"></div>

            <h3 className="font-semibold text-[#1a2b4c] mb-6 flex items-center gap-2 relative z-10">
              <span className="text-lg text-[#2277B4]">
                <Lock size={20} />
              </span>{" "}
              Credenciales de Acceso
            </h3>

            <div className="space-y-6 relative z-10">
              <p className="text-sm text-zinc-600">
                Al habilitar el acceso, se generará una{" "}
                <strong>nueva contraseña automática</strong> y se enviará por
                correo electrónico al contacto.
              </p>

              <button
                onClick={handleSaveAccess}
                disabled={saving}
                className={`w-full justify-center text-white shadow-lg py-3 rounded-xl font-bold mt-4 border-0 ${saving ? "opacity-70 cursor-not-allowed" : ""} ${access ? "bg-red-600 hover:bg-red-700 shadow-red-200" : "bg-[#2277B4] hover:bg-[#125280] shadow-[#2277B450]"}`}>
                {saving ?
                  "Procesando…"
                : access ?
                  "Revocar acceso al portal"
                : "Habilitar acceso al portal"}
              </button>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-zinc-200 shadow-sm relative overflow-hidden">
            <h3 className="font-semibold text-[#1a2b4c] mb-2 flex items-center gap-2 text-sm">
              <span className="text-lg text-[#2277B4]">
                <Tag size={20} />
              </span>{" "}
              Enviar Oferta Rápida a: {contact.full_name}
            </h3>
            <p className="text-xs text-zinc-500 mb-4">
              Notificar al contacto sobre una promoción especial.
            </p>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Ej. Descuento del 10% en renovación"
                className="flex-1 px-3 py-2 rounded-lg text-sm border border-zinc-300 bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-[#2277B4]/30 focus:border-[#2277B4] transition-all placeholder:text-zinc-400 text-zinc-800"
              />
              <button className="px-4 py-2 rounded-lg bg-white border border-zinc-300 hover:bg-zinc-50 text-zinc-700 text-xs font-bold transition-colors shadow-sm">
                Enviar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
};

// Componente para gestionar servicios activos del cliente
const ServicesSection = ({ clientId, contacts = [], productsList = [] }) => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [serviceForm, setServiceForm] = useState({
    contact_id: "",
    product_id: "",
    license_key: "",
    expiration_date: "",
  });

  const loadServices = () => {
    setLoading(true);
    listClientActiveServicesApi(clientId)
      .then((res) => {
        setServices(res);
        setLoading(false);
      })
      .catch((e) => {
        console.error(e);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadServices();
  }, [clientId]);

  const handleAddService = async (e) => {
    e.preventDefault();
    if (
      !serviceForm.contact_id ||
      !serviceForm.product_id ||
      !serviceForm.expiration_date
    ) {
      alert("Por favor completa los campos requeridos");
      return;
    }
    try {
      await createContactProductApi({
        contact_id: serviceForm.contact_id,
        product_id: serviceForm.product_id,
        license_key: serviceForm.license_key || null,
        expiration_date: serviceForm.expiration_date,
        start_date: new Date().toISOString().split("T")[0],
      });
      setServiceForm({
        contact_id: "",
        product_id: "",
        license_key: "",
        expiration_date: "",
      });
      loadServices();
    } catch (e) {
      alert(e.message);
    }
  };

  const handleDeleteService = async (id) => {
    if (!confirm("¿Eliminar este servicio?")) return;
    try {
      await deleteContactProductApi(id);
      loadServices();
    } catch (e) {
      alert(e.message);
    }
  };

  return (
    <Card>
      <h3 className="font-semibold text-light-text-primary dark:text-white mb-6 flex items-center gap-2">
        <span className="text-accent-400">
          <Tag size={20} />
        </span>{" "}
        Servicios Activos
      </h3>

      {/* Formulario para agregar servicio */}
      <form
        onSubmit={handleAddService}
        className="mb-6 p-4 rounded-xl bg-zinc-50 border border-zinc-200">
        <h4 className="text-sm font-semibold text-zinc-700 mb-3 flex items-center gap-2">
          <UserPlus size={16} /> Asignar Nuevo Servicio
        </h4>
        <div className="grid grid-cols-12 gap-3">
          <div className="col-span-3">
            <label className="text-xs text-zinc-500 mb-1 block">
              Contacto *
            </label>
            <select
              className="w-full px-3 py-2 rounded-lg border border-zinc-300 bg-white text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              value={serviceForm.contact_id}
              onChange={(e) =>
                setServiceForm({ ...serviceForm, contact_id: e.target.value })
              }
              required>
              <option value="">Seleccionar...</option>
              {contacts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.full_name}
                </option>
              ))}
            </select>
          </div>
          <div className="col-span-3">
            <label className="text-xs text-zinc-500 mb-1 block">
              Producto *
            </label>
            <select
              className="w-full px-3 py-2 rounded-lg border border-zinc-300 bg-white text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              value={serviceForm.product_id}
              onChange={(e) =>
                setServiceForm({ ...serviceForm, product_id: e.target.value })
              }
              required>
              <option value="">Seleccionar...</option>
              {productsList.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div className="col-span-2">
            <label className="text-xs text-zinc-500 mb-1 block">
              Licencia / Serial
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 rounded-lg border border-zinc-300 bg-white text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              placeholder="Opcional"
              value={serviceForm.license_key}
              onChange={(e) =>
                setServiceForm({ ...serviceForm, license_key: e.target.value })
              }
            />
          </div>
          <div className="col-span-2">
            <label className="text-xs text-zinc-500 mb-1 block">
              Vencimiento *
            </label>
            <input
              type="date"
              className="w-full px-3 py-2 rounded-lg border border-zinc-300 bg-white text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              value={serviceForm.expiration_date}
              onChange={(e) =>
                setServiceForm({
                  ...serviceForm,
                  expiration_date: e.target.value,
                })
              }
              required
            />
          </div>
          <div className="col-span-2 flex items-end">
            <button
              type="submit"
              className="w-full px-4 py-2 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors text-sm">
              Asignar
            </button>
          </div>
        </div>
      </form>

      {loading ?
        <div className="text-center py-8 text-zinc-500">
          Cargando servicios...
        </div>
      : <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-200">
                <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-600 uppercase">
                  Producto
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-600 uppercase">
                  Contacto
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-600 uppercase">
                  Licencia
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-600 uppercase">
                  Vence
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-600 uppercase">
                  Estado
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-600 uppercase">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {services.map((s) => (
                <tr
                  key={s.id}
                  className="hover:bg-blue-50/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-zinc-800">
                    {s.product.name}
                  </td>
                  <td className="px-4 py-3 text-zinc-600">{s.contact_name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-zinc-500">
                    {s.license_key || "—"}
                  </td>
                  <td className="px-4 py-3 text-zinc-600">
                    {new Date(s.expiration_date).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-bold ${
                        s.status === "ACTIVE" ?
                          "bg-emerald-100 text-emerald-600"
                        : s.status === "CANCELLED" ?
                          "bg-zinc-100 text-zinc-600"
                        : s.status === "EXPIRING_SOON" ?
                          "bg-amber-100 text-amber-600"
                        : "bg-red-100 text-red-500"
                      }`}>
                      {s.status === "ACTIVE" ?
                        "Activo"
                      : s.status === "CANCELLED" ?
                        "Inactivo"
                      : s.status === "EXPIRING_SOON" ?
                        "Por vencer"
                      : "Vencido"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleDeleteService(s.id)}
                      className="text-red-500 hover:text-red-700 text-sm font-medium flex items-center gap-1"
                      title="Eliminar">
                      <Trash2 size={16} /> Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {services.length === 0 && (
            <div className="py-12 text-center">
              <div className="flex justify-center mb-2 opacity-20">
                <Tag size={36} />
              </div>
              <p className="text-sm text-zinc-500">
                No hay servicios asignados a este cliente.
              </p>
            </div>
          )}
        </div>
      }
    </Card>
  );
};

const ClientProductsTab = ({ clientId, contacts, productsList }) => {
  const [products, setProducts] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: "",
    category: "Licencia de Software",
    price: 0,
    users_count: 0,
    description: "",
  });

  const load = () => {
    setLoading(true);
    listProductsApi(clientId)
      .then((res) => {
        // Filtrar para mostrar solo los productos EXCLUSIVOS de este cliente
        setProducts(res.filter((p) => p.client_id == clientId));
        setLoading(false);
      })
      .catch((e) => {
        console.error(e);
        setLoading(false);
      });
  };

  useEffect(() => {
    if (clientId) load();
  }, [clientId]);

  const handleTemplateSelect = (e) => {
    const val = e.target.value;
    if (!val) return;
    const [catIdx, itemIdx] = val.split("-");
    const item = CATALOG[catIdx].items[itemIdx];
    const category = CATALOG[catIdx].category;

    if (item) {
      setNewProduct({
        ...newProduct,
        name: item.name,
        category: category,
        price: 0,
        description: item.description || "",
        users_count: 0,
      });
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await createProductApi({ ...newProduct, client_id: clientId });
      setIsCreating(false);
      setNewProduct({
        name: "",
        category: "Licencia de Software",
        price: 0,
        users_count: 0,
        description: "",
      });
      load();
    } catch (e) {
      alert(e.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("¿Eliminar producto?")) return;
    try {
      await deleteProductApi(id);
      load();
    } catch (e) {
      alert(e.message);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <Card>
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-semibold text-light-text-primary dark:text-white flex items-center gap-2">
            <span className="text-light-accent dark:text-primary-400">
              <Package size={20} />
            </span>{" "}
            Productos Exclusivos
          </h3>
          <Button size="sm" onClick={() => setIsCreating(!isCreating)}>
            + Nuevo Producto
          </Button>
        </div>

        {isCreating && (
          <form onSubmit={handleCreate} className="mb-6 animate-fade-in">
            <div className="p-6 rounded-xl glass-panel shadow-xl">
              <h4 className="flex items-center gap-2 font-bold text-light-text-primary dark:text-white mb-4">
                <span className="text-lg">
                  <Sparkles size={20} />
                </span>{" "}
                Nuevo Producto
                <span className="text-xs font-normal text-light-text-secondary dark:text-zinc-400 ml-2">
                  Registra un nuevo item en el inventario/catálogo.
                </span>
              </h4>

              {/* Rapid Catalog */}
              <div className="mb-6">
                <label className="text-xs font-bold text-light-accent dark:text-primary-400 uppercase mb-2 flex items-center gap-1">
                  <span className="text-lg">
                    <Library size={20} />
                  </span>{" "}
                  Catálogo Rápido
                </label>
                <div className="relative">
                  <select
                    className="w-full pl-4 pr-10 py-3 rounded-xl bg-light-bg dark:bg-zinc-950/50 border border-light-border dark:border-white/10 text-light-text-primary dark:text-zinc-300 focus:ring-1 focus:ring-light-accent dark:focus:ring-primary-500 outline-none appearance-none transition-all cursor-pointer hover:bg-light-bg/80 dark:hover:bg-zinc-900"
                    onChange={handleTemplateSelect}
                    defaultValue="">
                    <option value="">-- Seleccionar plantilla --</option>
                    {CATALOG.map((cat, catIdx) => (
                      <optgroup
                        key={cat.category}
                        label={cat.category}
                        className="bg-light-card dark:bg-zinc-900 text-light-text-primary dark:text-zinc-300 font-semibold">
                        {cat.items.map((item, itemIdx) => (
                          <option
                            key={item.name}
                            value={`${catIdx}-${itemIdx}`}
                            className="bg-light-bg dark:bg-zinc-800 text-light-text-secondary dark:text-zinc-400 font-normal">
                            {item.name}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-light-text-secondary dark:text-zinc-500">
                    <ChevronDown size={16} />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <Input
                  label="NOMBRE DEL PRODUCTO"
                  placeholder="Ej. Contabilidad 2024"
                  value={newProduct.name}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, name: e.target.value })
                  }
                  required
                />
                <Input
                  label="CATEGORÍA"
                  placeholder="Ej. Licencias"
                  value={newProduct.category}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, category: e.target.value })
                  }
                  required
                />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Input
                      label="PRECIO (MXN)"
                      type="number"
                      placeholder="0.00"
                      value={newProduct.price}
                      onChange={(e) =>
                        setNewProduct({ ...newProduct, price: e.target.value })
                      }
                      required
                    />
                    {newProduct.price && !isNaN(newProduct.price) && (
                      <div className="text-[10px] text-light-accent dark:text-primary-400 mt-1 font-mono text-right">
                        + IVA: $
                        {(parseFloat(newProduct.price) * 0.16).toFixed(2)}
                      </div>
                    )}
                  </div>
                  <Input
                    label="USUARIOS (OP)"
                    type="number"
                    placeholder="1"
                    value={newProduct.users_count}
                    onChange={(e) =>
                      setNewProduct({
                        ...newProduct,
                        users_count: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-light-text-secondary dark:text-zinc-400">
                    Descripción
                  </label>
                  <textarea
                    className="w-full bg-light-bg/50 dark:bg-zinc-950/30 border border-light-border dark:border-white/10 rounded-lg p-3 text-sm text-light-text-primary dark:text-zinc-200 outline-none focus:ring-1 focus:ring-light-accent dark:focus:ring-primary-500 min-h-[100px]"
                    placeholder="Detalles técnicos…"
                    value={newProduct.description}
                    onChange={(e) =>
                      setNewProduct({
                        ...newProduct,
                        description: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-light-border dark:border-white/5">
                <Button
                  type="submit"
                  className="px-8 justify-center bg-light-accent dark:bg-primary-600 hover:bg-light-accent/90 dark:hover:bg-primary-500">
                  Registrar Producto
                </Button>
              </div>
            </div>
          </form>
        )}

        <div className="space-y-2">
          {products.map((p) => (
            <div
              key={p.id}
              className="flex justify-between items-center p-3 rounded-lg glass-panel hover:border-light-accent/30 dark:hover:border-white/20 transition-all">
              <div>
                <div className="font-bold text-light-text-primary dark:text-zinc-200">
                  {p.name}
                </div>
                <div className="text-xs text-light-text-secondary dark:text-zinc-400">
                  {p.category} • $
                  {(parseFloat(p.current_price) || 0).toLocaleString("es-MX", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Link
                  to={`/productos/${p.id}`}
                  className="text-xs bg-light-bg dark:bg-zinc-800 hover:bg-light-bg/80 dark:hover:bg-zinc-700 text-light-accent dark:text-primary-400 px-3 py-1.5 rounded-lg transition-colors border border-light-border dark:border-white/5">
                  Ver detalles
                </Link>
                <button
                  onClick={() => handleDelete(p.id)}
                  className="text-light-error dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 px-2"
                  title="Eliminar producto">
                  🗑️
                </button>
              </div>
            </div>
          ))}
          {products.length === 0 && !loading && (
            <p className="text-light-text-secondary dark:text-zinc-500 text-sm text-center py-4">
              No hay productos exclusivos registrados.
            </p>
          )}
        </div>
      </Card>

      {/* Sección de Servicios Activos */}
      <ServicesSection
        clientId={clientId}
        contacts={contacts}
        productsList={productsList}
      />
    </div>
  );
};

const STATUS_LABELS = {
  ACTIVE: "ACTIVO",
  CANCELLED: "INACTIVO",
  EXPIRING_SOON: "Por vencer",
  EXPIRED: "EXPIRADO",
};

const STATUS_STYLES = {
  ACTIVE: "text-[#1B4733]",
  CANCELLED: "text-zinc-600",
  EXPIRING_SOON: "text-amber-700",
  EXPIRED: "text-red-700",
};

const POLICIES_COLUMNS = [
  {
    accessorKey: "product_name",
    header: "Póliza o servicio",
    cell: ({ getValue }) => (
      <span className="font-medium text-light-text-primary hover:text-[#2277B4]">
        {getValue()}
      </span>
    ),
  },
  {
    accessorKey: "contact_name",
    header: "Contacto Asignado",
    cell: ({ getValue }) => (
      <span className="text-light-text-secondary">{getValue() || "—"}</span>
    ),
  },
  {
    accessorKey: "license_key",
    header: "Folio",
    cell: ({ getValue }) => (
      <span className="font-mono text-xs text-light-text-secondary">
        {getValue() || "—"}
      </span>
    ),
  },
  {
    accessorKey: "expiration_date",
    header: "Vence",
    cell: ({ getValue }) => (
      <span className="text-light-text-secondary">
        {getValue() ? new Date(getValue()).toLocaleDateString() : "—"}
      </span>
    ),
  },
  {
    accessorKey: "status",
    header: "Estado",
    cell: ({ getValue }) => {
      const v = getValue();
      return (
        <span
          className={`px-2 py-0.5 rounded-full text-xs font-bold ${
            STATUS_STYLES[v] || "bg-zinc-100 text-zinc-600"
          }`}>
          {STATUS_LABELS[v] || v}
        </span>
      );
    },
    filterFn: (row, columnId, filterValue) =>
      !filterValue ||
      row.getValue(columnId)?.toLowerCase().includes(filterValue.toLowerCase()),
  },
];

const ClientPoliciesTab = ({ clientId }) => {
  const [services, setServices] = useState([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState([]);
  const [deletingServiceId, setDeletingServiceId] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    status: "",
    license_key: "",
  });
  const [activePolicyFilterPickerField, setActivePolicyFilterPickerField] =
    useState(null);
  const [policyFilterPickerSearch, setPolicyFilterPickerSearch] = useState("");

  const loadServices = () => {
    listClientActiveServicesApi(clientId)
      .then((data) =>
        setServices(
          data.map((s) => ({
            ...s,
            product_name: s.product?.name || "",
          })),
        ),
      )
      .catch(console.error);
  };

  useEffect(() => {
    loadServices();
  }, [clientId]);

  const handleDeleteService = async (service) => {
    const result = await Swal.fire({
      title: "¿Eliminar póliza o servicio?",
      text: "Esta acción desasignará el registro del cliente.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#2277B4",
    });

    if (!result.isConfirmed) return;

    try {
      setDeletingServiceId(service.id);
      await deleteContactProductApi(service.id);
      await Swal.fire({
        icon: "success",
        title: "Eliminado",
        text: "La póliza o servicio fue eliminado correctamente.",
        timer: 1300,
        showConfirmButton: false,
      });
      loadServices();
    } catch (e) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: e.message || "No se pudo eliminar el registro.",
        confirmButtonColor: "#2277B4",
      });
    } finally {
      setDeletingServiceId(null);
    }
  };

  const activeFilterCount = Object.values(filters).filter(
    (v) => v.trim() !== "",
  ).length;
  const canClearFilters = activeFilterCount > 0 || globalFilter.trim() !== "";

  const policyFilterFieldLabels = {
    status: "Estado",
    license_key: "Folio",
  };

  const openPolicyFilterPicker = (fieldName) => {
    setActivePolicyFilterPickerField(fieldName);
    setPolicyFilterPickerSearch("");
  };

  const closePolicyFilterPicker = () => {
    setActivePolicyFilterPickerField(null);
    setPolicyFilterPickerSearch("");
  };

  const applyPolicyFilterValue = (value) => {
    if (!activePolicyFilterPickerField) return;

    setFilters((prev) => ({
      ...prev,
      [activePolicyFilterPickerField]: value,
    }));
    closePolicyFilterPicker();
  };

  useEffect(() => {
    if (!showFilters) {
      closePolicyFilterPicker();
    }
  }, [showFilters]);

  const policyFilterPickerOptions = useMemo(() => {
    if (!activePolicyFilterPickerField) return [];

    const uniqueValues = new Map();

    services.forEach((service) => {
      let value = "";

      if (activePolicyFilterPickerField === "license_key") {
        value = service.license_key || "";
      } else if (activePolicyFilterPickerField === "status") {
        value = STATUS_LABELS[service.status] || service.status || "";
      }

      const normalized = normalizeSearchText(value);
      if (!normalized || uniqueValues.has(normalized)) return;
      uniqueValues.set(normalized, value);
    });

    return Array.from(uniqueValues.values()).sort((a, b) =>
      a.localeCompare(b, "es", { sensitivity: "base" }),
    );
  }, [services, activePolicyFilterPickerField]);

  const visiblePolicyFilterPickerOptions = useMemo(() => {
    const s = normalizeSearchText(policyFilterPickerSearch);
    if (!s) return policyFilterPickerOptions;

    return policyFilterPickerOptions.filter((value) =>
      normalizeSearchText(value).includes(s),
    );
  }, [policyFilterPickerSearch, policyFilterPickerOptions]);

  const filteredServices = useMemo(() => {
    const s = normalizeSearchText(globalFilter);
    const hasFieldFilters = Object.values(filters).some((v) => v.trim() !== "");

    if (!s && !hasFieldFilters) return services;

    return services.filter((service) => {
      const statusLabel = STATUS_LABELS[service.status] || service.status || "";
      const expirationDate =
        service.expiration_date ?
          new Date(service.expiration_date).toLocaleDateString("es-MX")
        : "";

      const haystack = normalizeSearchText(
        [
          service.product_name,
          service.contact_name,
          service.license_key,
          service.status,
          statusLabel,
          expirationDate,
        ].join(" "),
      );

      const matchGlobal = !s || haystack.includes(s);

      const matchFilters =
        (!filters.license_key ||
          normalizeSearchText(service.license_key).includes(
            normalizeSearchText(filters.license_key),
          )) &&
        (!filters.status ||
          normalizeSearchText(statusLabel) ===
            normalizeSearchText(filters.status));

      return matchGlobal && matchFilters;
    });
  }, [services, globalFilter, filters]);

  const clearFilters = () => {
    setGlobalFilter("");
    setFilters({
      status: "",
      license_key: "",
    });
    closePolicyFilterPicker();
  };

  const policyColumns = [
    ...POLICIES_COLUMNS,
    {
      id: "actions",
      header: "Acciones",
      enableSorting: false,
      cell: ({ row }) => {
        const service = row.original;
        const isDeleting = deletingServiceId === service.id;

        return (
          <button
            onClick={() => handleDeleteService(service)}
            disabled={isDeleting}
            className="inline-flex items-center justify-center size-8 text-red-700 transition-transform duration-150 hover:scale-75 disabled:opacity-60 disabled:cursor-not-allowed"
            title={isDeleting ? "Eliminando…" : "Eliminar póliza o servicio"}>
            <Trash2 size={13} className={isDeleting ? "animate-pulse" : ""} />
          </button>
        );
      },
    },
  ];

  const table = useReactTable({
    data: filteredServices,
    columns: policyColumns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  const { pageIndex, pageSize } = table.getState().pagination;
  const totalRows = filteredServices.length;
  const from = totalRows === 0 ? 0 : pageIndex * pageSize + 1;
  const to = Math.min((pageIndex + 1) * pageSize, totalRows);

  return (
    <Card className="animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
        <h3 className="font-semibold text-light-text-primary flex items-center gap-2 flex-1">
          <FileText size={18} /> Pólizas y Servicios
          {totalRows !== services.length && (
            <span className="ml-2 text-xs font-normal text-light-text-secondary">
              ({totalRows} de {services.length})
            </span>
          )}
        </h3>

        <div className="flex items-center gap-2 min-h-[32px]">
          {canClearFilters && (
            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-sm font-medium text-red-600 border border-red-100 hover:bg-red-50 transition-colors"
              title="Limpiar filtros">
              <X size={14} /> Limpiar
            </button>
          )}

          {[
            { id: "status", label: "ESTADO" },
            { id: "license_key", label: "FOLIO" },
          ].map((button) => {
            const selectedValue = String(filters[button.id] || "");

            return (
              <button
                key={button.id}
                onClick={() => openPolicyFilterPicker(button.id)}
                tabIndex={showFilters ? 0 : -1}
                className={`inline-flex items-center gap-2 px-3 py-1 rounded-md text-[11px] border transition-all whitespace-nowrap ${
                  selectedValue ?
                    "bg-[#2277B4] text-white border-[#2277B4]"
                  : "bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-100"
                } ${
                  showFilters ?
                    "opacity-100 translate-y-0"
                  : "opacity-0 -translate-y-1 pointer-events-none"
                }`}>
                <span className="uppercase font-bold tracking-wide">
                  {button.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Buscador global */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search
              size={14}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-light-text-secondary"
            />
            <input
              type="text"
              placeholder="Buscar…"
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="pl-3 pr-8 py-1.5 text-sm rounded-lg border border-light-border bg-white focus:outline-none focus:ring-1 focus:ring-[#2277B4] w-44 text-black"
            />
          </div>
          <button
            onClick={() => setShowFilters((p) => !p)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border transition-colors ${
              showFilters || activeFilterCount > 0 ?
                "bg-[#2277B4] text-white border-[#2277B4]"
              : "bg-white text-light-text-secondary border-light-border hover:bg-zinc-50"
            }`}>
            <Filter size={13} />
            Filtros
            {activeFilterCount > 0 && (
              <span className="ml-1 bg-white text-[#2277B4] rounded-full px-1.5 py-0 text-[10px] font-bold">
                {activeFilterCount}
              </span>
            )}
          </button>
          <span className="text-xs text-light-text-secondary whitespace-nowrap">
            Pág. {pageIndex + 1} de {table.getPageCount() || 1}
          </span>
        </div>
      </div>

      {activePolicyFilterPickerField &&
        showFilters &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] bg-black/45 flex items-center justify-center p-4"
            onClick={closePolicyFilterPicker}>
            <div
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
              onClick={(e) => e.stopPropagation()}>
              <div className="px-5 py-4 border-b border-zinc-100 bg-[#1a2b4c] flex items-center justify-between">
                <div>
                  <h3 className="text-white font-semibold text-base uppercase">
                    FILTRAR POR{" "}
                    {policyFilterFieldLabels[activePolicyFilterPickerField]}
                  </h3>
                  <p className="text-[11px] text-zinc-300 mt-1">
                    Selecciona o busca un valor para filtrar 
                  </p>
                </div>
                <button
                  onClick={closePolicyFilterPicker}
                  className="size-8 rounded-lg text-white hover:bg-white/10 flex items-center justify-center">
                  <X size={16} />
                </button>
              </div>

              <div className="p-4 space-y-3">
                <div className="flex items-center gap-2 bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2">
                  <Search size={15} className="text-zinc-500" />
                  <input
                    value={policyFilterPickerSearch}
                    onChange={(e) =>
                      setPolicyFilterPickerSearch(e.target.value)
                    }
                    placeholder="Buscar valor…"
                    className="w-full bg-transparent text-sm text-zinc-800 placeholder:text-zinc-400 focus:outline-none"
                  />
                </div>

                <div className="h-72 overflow-y-auto rounded-lg border border-zinc-100 divide-y divide-zinc-100">
                  {visiblePolicyFilterPickerOptions.length > 0 ?
                    visiblePolicyFilterPickerOptions.map((value) => {
                      const isSelected =
                        normalizeSearchText(
                          filters[activePolicyFilterPickerField],
                        ) === normalizeSearchText(value);

                      return (
                        <button
                          key={`${activePolicyFilterPickerField}_${value}`}
                          onClick={() => applyPolicyFilterValue(value)}
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

      {/* Tabla */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-light-text-secondary uppercase bg-[#F2F5F9]">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((header, i) => {
                  const canSort = header.column.getCanSort();

                  return (
                    <th
                      key={header.id}
                      onClick={
                        canSort ?
                          header.column.getToggleSortingHandler()
                        : undefined
                      }
                      className={`px-4 py-3 select-none whitespace-nowrap transition-colors text-[#2277B4] ${
                        canSort ? "cursor-pointer hover:bg-[#e8edf3]" : ""
                      } ${i === 0 ? "rounded-l-lg" : ""} ${
                        i === hg.headers.length - 1 ? "rounded-r-lg" : ""
                      }`}>
                      <span className="flex items-center gap-1">
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                        {canSort && header.column.getIsSorted() === "asc" && (
                          <ChevronUp size={12} />
                        )}
                        {canSort && header.column.getIsSorted() === "desc" && (
                          <ChevronDown size={12} />
                        )}
                        {canSort && !header.column.getIsSorted() && (
                          <span className="opacity-30 text-[10px]">⇅</span>
                        )}
                      </span>
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-light-border">
            {table.getRowModel().rows.length > 0 ?
              table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="hover:bg-zinc-50 transition-colors">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </td>
                  ))}
                </tr>
              ))
            : <tr>
                <td
                  colSpan={policyColumns.length}
                  className="text-center py-10 text-light-text-secondary text-sm">
                  {services.length === 0 ?
                    "No hay servicios activos."
                  : "Sin resultados para los filtros aplicados."}
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      <div className="flex items-center justify-between pt-4 border-t border-light-border mt-4 flex-wrap gap-2">
        <div className="flex items-center gap-2 text-xs text-light-text-secondary">
          <span>Mostrar</span>
          <select
            value={pageSize}
            onChange={(e) => table.setPageSize(Number(e.target.value))}
            className="text-xs border border-light-border rounded px-2 py-1 bg-white text-black">
            {[10, 25, 50, 100].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
          <span className="hidden sm:inline">
            {from}–{to} de {totalRows} registros
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
            className="px-2 py-1 text-sm font-medium text-zinc-600 bg-zinc-100 rounded-lg hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed">
            ««
          </button>
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="px-3 py-1 text-sm font-medium text-zinc-600 bg-zinc-100 rounded-lg hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed">
            Anterior
          </button>
          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="px-3 py-1 text-sm font-medium text-zinc-600 bg-zinc-100 rounded-lg hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed">
            Siguiente
          </button>
          <button
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
            className="px-2 py-1 text-sm font-medium text-zinc-600 bg-zinc-100 rounded-lg hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed">
            »»
          </button>
        </div>
      </div>
    </Card>
  );
};

export default function ClientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
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

  // Carga masiva de contactos
  const [showBulkContactModal, setShowBulkContactModal] = useState(false);
  const [bulkContactData, setBulkContactData] = useState([]);
  const [bulkContactErrors, setBulkContactErrors] = useState([]);
  const [bulkContactUploading, setBulkContactUploading] = useState(false);
  const [bulkContactDriveImporting, setBulkContactDriveImporting] =
    useState(false);
  const [bulkContactDriveUrl, setBulkContactDriveUrl] = useState("");
  const [bulkContactResult, setBulkContactResult] = useState(null);
  const bulkContactFileRef = useRef(null);

  const CONTACT_COLUMN_MAP = {
    nombre: "full_name",
    "nombre completo": "full_name",
    full_name: "full_name",
    "full name": "full_name",
    contacto: "full_name",
    correo: "email",
    email: "email",
    "correo electronico": "email",
    "correo principal": "email",
    telefono: "phone",
    tel: "phone",
    phone: "phone",
    celular: "phone",
    puesto: "position_title",
    position_title: "position_title",
    cargo: "position_title",
    posicion: "position_title",
  };

  const handleBulkContactFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBulkContactResult(null);
    setBulkContactErrors([]);

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const XLSX = await import("xlsx");
        const wb = XLSX.read(evt.target.result, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws, {
          header: 1,
          defval: "",
          blankrows: false,
        });

        if (!rows.length) {
          setBulkContactData([]);
          setBulkContactErrors([
            "El archivo está vacío o no contiene encabezados.",
          ]);
          return;
        }

        const [headerRow = [], ...sheetRows] = rows;
        const normalizedHeaders = headerRow.map((header) =>
          normalizeExcelHeader(header),
        );
        const mappedFields = normalizedHeaders.map(
          (header) => CONTACT_COLUMN_MAP[header] || null,
        );

        if (!mappedFields.some(Boolean)) {
          setBulkContactData([]);
          setBulkContactErrors([
            "No se reconocieron columnas válidas. Usa la plantilla 'Descargar plantilla'.",
          ]);
          return;
        }

        const missingTemplateHeaders = CONTACT_TEMPLATE_COLUMNS.filter(
          (header) => !normalizedHeaders.includes(normalizeExcelHeader(header)),
        );

        const mapped = [];
        sheetRows.forEach((row, idx) => {
          const cells = Array.isArray(row) ? row : [];
          const isEmptyRow = cells.every(
            (cell) => String(cell ?? "").trim() === "",
          );
          if (isEmptyRow) return;

          const mapped_row = {};
          cells.forEach((value, columnIndex) => {
            const field = mappedFields[columnIndex];
            if (!field) return;

            const parsedValue = String(value ?? "").trim();
            if (parsedValue === "") return;

            mapped_row[field] = parsedValue;
          });

          mapped_row._row = idx + 2;
          mapped.push(mapped_row);
        });

        if (!mapped.length) {
          setBulkContactData([]);
          setBulkContactErrors([
            "El archivo no contiene filas con datos para importar.",
          ]);
          return;
        }

        const errors = [];

        if (missingTemplateHeaders.length) {
          errors.push(
            `Faltan columnas de la plantilla: ${missingTemplateHeaders.join(", ")}.`,
          );
        }

        mapped.forEach((r) => {
          if (!r.full_name) {
            errors.push(`Fila ${r._row}: Falta "Nombre" (obligatorio).`);
          }
        });

        const valid = mapped.filter((r) => r.full_name);

        if (!valid.length) {
          errors.push("No hay filas válidas para importar.");
        }

        setBulkContactData(valid);
        setBulkContactErrors(errors);
      } catch {
        setBulkContactData([]);
        setBulkContactErrors([
          "No se pudo leer el archivo. Verifica que sea un Excel válido (.xlsx / .xls).",
        ]);
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = "";
  };

  const fireBulkContactModalAlert = (options) =>
    Swal.fire({
      ...options,
      didOpen: () => {
        const container = Swal.getContainer();
        if (container) {
          container.style.zIndex = "11000";
        }

        if (typeof options.didOpen === "function") {
          options.didOpen();
        }
      },
    });

  const executeBulkContactUpload = async () => {
    setBulkContactUploading(true);
    setBulkContactResult(null);
    try {
      const inputs = bulkContactData.map(({ _row, ...rest }) => ({
        client_id: id,
        full_name: rest.full_name,
        email: rest.email || null,
        phone: rest.phone || null,
        position_title: rest.position_title || null,
      }));

      // Enviar en lotes de 200 para evitar error 413
      const CHUNK = 200;
      let totalCreated = 0;
      for (let i = 0; i < inputs.length; i += CHUNK) {
        const chunk = inputs.slice(i, i + CHUNK);
        const created = await bulkCreateContactsApi(chunk);
        totalCreated += created.length;
      }

      setBulkContactResult({ success: true, count: totalCreated });
      flushSync(() => {
        setShowBulkContactModal(false);
      });
      await fireBulkContactModalAlert({
        title: "Importacion completada",
        text: `Se importaron ${totalCreated} contactos exitosamente.`,
        icon: "success",
        confirmButtonColor: "#2277B4",
        timer: 2200,
        timerProgressBar: true,
        showConfirmButton: false,
        allowOutsideClick: false,
      });
      setBulkContactData([]);
      await load();
    } catch (err) {
      setBulkContactResult({
        success: false,
        message: err.message || "Error en la carga masiva.",
      });
      fireBulkContactModalAlert({
        title: "Error",
        text: err.message || "Error en la carga masiva.",
        icon: "error",
        confirmButtonColor: "#d33",
      });
    } finally {
      setBulkContactUploading(false);
    }
  };

  const executeBulkContactDriveImport = async () => {
    const fileUrl = bulkContactDriveUrl.trim();
    if (!fileUrl) {
      setBulkContactResult({
        success: false,
        message: "Debes ingresar la URL del archivo en Google Drive.",
      });
      fireBulkContactModalAlert({
        title: "Falta la URL",
        text: "Debes ingresar la URL del archivo en Google Drive.",
        icon: "warning",
        confirmButtonColor: "#2277B4",
      });
      return;
    }

    setBulkContactDriveImporting(true);
    setBulkContactResult(null);
    try {
      const report = await importContactsFromDriveApi({
        fileUrl,
        clientId: id,
      });

      const mappedHeadersByColumn = report.mappedHeadersByColumn || {};
      const mappedColumnNames = Object.keys(mappedHeadersByColumn);
      if (mappedColumnNames.length) {
        setContactColumnLabelOverrides(mappedHeadersByColumn);
        setContactExcelViewColumns(mappedColumnNames);
        localStorage.setItem(
          CONTACTS_EXCEL_VIEW_STORAGE_KEY,
          JSON.stringify({
            columnLabelOverrides: mappedHeadersByColumn,
            excelViewColumns: mappedColumnNames,
          }),
        );
      }

      setBulkContactResult({
        success: true,
        count: report.importedCount,
        skippedCount: report.skippedCount,
        details: report,
      });
      flushSync(() => {
        setShowBulkContactModal(false);
      });
      await fireBulkContactModalAlert({
        title: "Importacion completada",
        text:
          report.skippedCount > 0 ?
            `Se importaron ${report.importedCount} contactos. Se omitieron ${report.skippedCount} filas.`
          : `Se importaron ${report.importedCount} contactos exitosamente.`,
        icon: "success",
        confirmButtonColor: "#2277B4",
        timer: 2200,
        timerProgressBar: true,
        showConfirmButton: false,
        allowOutsideClick: false,
      });
      await load();
    } catch (err) {
      setBulkContactResult({
        success: false,
        message: err.message || "Error importando archivo desde Drive.",
      });
      fireBulkContactModalAlert({
        title: "Error",
        text: err.message || "Error importando archivo desde Drive.",
        icon: "error",
        confirmButtonColor: "#d33",
      });
    } finally {
      setBulkContactDriveImporting(false);
    }
  };

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
            // Keep canonical GraphQL id for route/actions and safe rendering.
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
      // Obtener SOLO productos pertenecientes a ESTE cliente para el selector del modal
      listProductsApi(id)
        .then((all) => {
          setProductsList(all.filter((p) => p.client_id == id));
        })
        .catch(console.error);
    } catch (e) {
      setError(e.message || "Error cargando cliente");
    } finally {
      setLoading(false);
    }
  };

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
      (field) => field?.name && field.name !== "business_name",
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
      label: contactColumnLabelOverrides[column.name] || column.label,
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
        modalLabel:
          contactColumnLabelOverrides[resolvedFieldName] ||
          column?.label ||
          config.modalLabel,
      };
    });
  }, [contactColumnsFromView, contactColumnLabelOverrides]);

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

      // RFC is immutable from this form.
      if (Object.prototype.hasOwnProperty.call(payload, "rfc")) {
        payload.rfc = client?.rfc ?? payload.rfc;
      }

      await updateClientDynamicApi(id, payload);
      setIsEditingClient(false);
      await load();
    } catch (e) {
      alert(e.message);
    }
  };

  const handleDeleteClient = async () => {
    const contactCount = contactRows.length || 0;
    const text =
      contactCount > 0 ?
        `Este cliente tiene ${contactCount} contacto(s) asociado(s). Se eliminará "${client.business_name}" y todos sus datos.`
      : `Se eliminará el cliente "${client.business_name}".`;

    const result = await Swal.fire({
      title: "¿Estás seguro?",
      text: text,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#2277B4",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });

    if (!result.isConfirmed) return;

    try {
      await deleteClientApi(id);
      Swal.fire({
        title: "¡Eliminado!",
        text: "El cliente ha sido eliminado.",
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
      });
      navigate("/clientes");
    } catch (e) {
      Swal.fire({
        title: "Error",
        text: e.message,
        icon: "error",
        confirmButtonColor: "#3085d6",
      });
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
    } catch (e) {
      alert(e.message);
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
    } catch (e) {
      alert(e.message);
    }
  };

  const handleDeleteContact = async (contactId) => {
    const result = await Swal.fire({
      title: "¿Deshabilitar contacto?",
      text: "El contacto dejará de ser accesible.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, deshabilitar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#2277B4",
    });
    if (!result.isConfirmed) return;
    try {
      await deleteContactApi(contactId);
      load();
    } catch (e) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: e.message,
        confirmButtonColor: "#2277B4",
      });
    }
  };

  // Columnas para la tabla de contactos (debe estar antes de los early returns)
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
                  className={`font-medium ${row.original.is_active === false || row.original.is_active === 0 ? "text-zinc-400 line-through" : "text-zinc-800"}`}>
                  {value}
                </span>
                {(
                  row.original.is_active === false ||
                  row.original.is_active === 0
                ) ?
                  <span className="ml-2 text-[10px] uppercase font-bold text-zinc-400 bg-zinc-100 px-1.5 py-0.5 rounded border border-zinc-300">
                    Deshabilitado
                  </span>
                : row.original.has_portal_access ?
                  <span className="ml-2 text-[8px] uppercase font-bold text-emerald-700 px-1.5 py-0.5 rounded">
                    CON PORTAL
                  </span>
                : <span className="ml-2 text-[8px] uppercase font-bold text-orange-500 px-1.5 py-0.5 rounded">
                    SIN PORTAL
                  </span>
                }
              </div>
            </div>
          );
        }

        return <span className="text-zinc-600 break-words">{value}</span>;
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
              className="size-7 inline-flex items-center justify-center rounded-lg hover:bg-zinc-100 transition-colors text-zinc-500"
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
                <button className="px-4 py-1.5 text-sm font-semibold text-zinc-400 bg-zinc-100 rounded-xl border border-zinc-200 shadow-sm flex items-center gap-1.5">
                  <Key size={14} /> Acceso
                </button>
                <button className="size-8 flex items-center justify-center rounded-lg text-[#92400E]">
                  <Edit2 size={16} />
                </button>
                <button className="size-8 flex items-center justify-center rounded-lg text-red-800">
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
                               "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
                             : "bg-red-50 text-red-800 border-red-200 hover:bg-red-100"
                           }`}>
                <Key size={14} className="opacity-90" /> Acceso
              </button>
              <button
                onClick={() => startEditContact(row.original)}
                className="size-8 flex items-center justify-center rounded-lg text-[#92400E] transition-colors hover:scale-75"
                title="Editar">
                <Edit2 size={16} />
              </button>
              <button
                onClick={() => handleDeleteContact(row.original.id)}
                className="size-8 flex items-center justify-center rounded-lg text-red-800 transition-colors hover:scale-75"
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
        header: "Nombre",
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
        header: "Puesto",
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
        header: "Correo",
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
        header: "Teléfono",
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

      // Búsqueda global
      const matchQ =
        !normalizedQuery ||
        searchableColumns.some((column) =>
          normalizeSearchText(c?.[column.name]).includes(normalizedQuery),
        );

      // Filtros individuales
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

  const getContactExportContext = () => {
    const usedLabels = new Set();
    const exportColumns = contactColumnsFromView
      .filter((column) => column.name !== "is_active")
      .map((column) => {
      const baseLabel = String(column.label || column.name || "").trim();
      const fallbackLabel = String(column.name || "").trim();
      let base = baseLabel || fallbackLabel || "Columna";

      if (column.name === "has_portal_access") {
        base = "Acceso al Portal";
      }

      let label = base;
      const normalized = base.toLowerCase();

      if (usedLabels.has(normalized)) {
        label = `${base} (${fallbackLabel || normalized})`;
      }

      usedLabels.add(normalized);

      return {
        name: column.name,
        label,
      };
    });

    const exportRows = contactsTable
      .getSortedRowModel()
      .rows.map((row) => row.original);

    return {
      exportColumns,
      exportRows,
    };
  };

  const resolveContactExportValue = (row, columnName) => {
    if (columnName === "has_portal_access") {
      return row?.has_portal_access ? "Sí" : "No";
    }

    if (columnName === "is_active") {
      const isActive = row?.is_active !== false && row?.is_active !== 0;
      return isActive ? "Sí" : "No";
    }

    const rawValue = row?.[columnName];
    return hasValue(rawValue) ? rawValue : "";
  };

  const handleExportContactsPDF = async () => {
    const { exportColumns, exportRows } = getContactExportContext();

    if (!exportRows.length) {
      Swal.fire({
        title: "Sin datos",
        text: "No hay contactos para exportar.",
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
      doc.text("Contactos", 14, 16);
      doc.setFontSize(10);
      doc.setTextColor(90, 90, 90);
      doc.text(`Exportado: ${new Date().toLocaleString("es-MX")}`, 14, 23);

      autoTable(doc, {
        startY: 28,
        head: [exportColumns.map((column) => column.label.toUpperCase())],
        body: exportRows.map((row) =>
          exportColumns.map((column) => {
            const value = resolveContactExportValue(row, column.name);
            return hasValue(value) ? String(value) : "—";
          }),
        ),
        theme: "grid",
        headStyles: { fillColor: [34, 119, 180] },
        styles: { fontSize: 8, cellPadding: 2.5 },
      });

      doc.save(`Contactos_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (e) {
      Swal.fire({
        title: "Error",
        text: e.message || "No se pudo generar el PDF.",
        icon: "error",
        confirmButtonColor: "#d33",
      });
    }
  };

  const handleExportContactsExcel = async () => {
    const { exportColumns, exportRows } = getContactExportContext();

    if (!exportRows.length) {
      Swal.fire({
        title: "Sin datos",
        text: "No hay contactos para exportar.",
        icon: "info",
        confirmButtonColor: "#2277B4",
      });
      return;
    }

    try {
      const XLSX = await import("xlsx");

      const rows = exportRows.map((row) => {
        const nextRow = {};

        exportColumns.forEach((column) => {
          const value = resolveContactExportValue(row, column.name);
          nextRow[column.label] = hasValue(value) ? value : "";
        });

        return nextRow;
      });

      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Contactos");
      XLSX.writeFile(
        wb,
        `Contactos_${new Date().toISOString().slice(0, 10)}.xlsx`,
      );
    } catch (e) {
      Swal.fire({
        title: "Error",
        text: e.message || "No se pudo generar el Excel.",
        icon: "error",
        confirmButtonColor: "#d33",
      });
    }
  };

  const handleDownloadContactsTemplate = async () => {
    try {
      const XLSX = await import("xlsx");

      const ws = XLSX.utils.aoa_to_sheet([CONTACT_TEMPLATE_COLUMNS]);
      ws["!cols"] = [{ wch: 34 }, { wch: 34 }, { wch: 26 }, { wch: 20 }];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Plantilla Contactos");
      XLSX.writeFile(wb, "Plantilla_Contactos.xlsx");
    } catch (e) {
      Swal.fire({
        title: "Error",
        text: e.message || "No se pudo generar la plantilla de Excel.",
        icon: "error",
        confirmButtonColor: "#d33",
      });
    }
  };

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
      {isEditingClient &&
        createPortal(
          <div
            style={{ zIndex: 9999 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
              <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between bg-[#1a2b4c]">
                <div className="flex justify-center items-center gap-2">
                  <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                    Editar cliente
                  </h2>
                  <span className="text-sm text-zinc-300">
                    {clientBusinessName}
                  </span>
                </div>
                <button
                  onClick={() => setIsEditingClient(false)}
                  className="p-2 rounded-full text-white transition-colors">
                  <X size={18} />
                </button>
              </div>
              <form
                onSubmit={handleUpdateClient}
                className="px-6 py-2 space-y-4 overflow-y-auto max-h-[70vh]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {clientGeneralFields.map((field) => (
                    <div
                      key={field.name}
                      className={
                        isClientFieldFullWidth(field.name) ? "md:col-span-2" : (
                          ""
                        )
                      }>
                      <Input
                        label={field.label}
                        type={getClientFieldInputType(field.name)}
                        disabled={isClientFieldReadOnly(field.name)}
                        value={clientForm[field.name] || ""}
                        onChange={(e) =>
                          setClientForm((prev) => ({
                            ...prev,
                            [field.name]: e.target.value,
                          }))
                        }
                      />
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsEditingClient(false)}
                    className="flex-1 py-3 text-zinc-600 font-semibold rounded-xl hover:bg-zinc-100 transition-colors">
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-[#2277B4] hover:bg-[#125280] text-white font-bold rounded-xl shadow-lg shadow-[#2277B450] transition-all duration-150 active:scale-95 active:translate-y-px">
                    Guardar cambios
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body,
        )}

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
      <div className="bg-white p-6 rounded-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-baseline gap-3">
            <h1 className="text-3xl font-semibold text-[#1a2b4c] tracking-tight">
              {clientBusinessName.toUpperCase()}
            </h1>
            <span className="px-2 py-0.5 rounded text-xs font-mono bg-white/10 text-zinc-400 border border-white/5">
              ID: {clientIdShort || "N/A"}
            </span>
          </div>
          <div className="flex flex-wrap gap-4 mt-2 text-sm text-light-text-secondary dark:text-zinc-400">
            <span className="flex items-center gap-1">
              <ClipboardList size={16} className="text-black" />{" "}
              {client.rfc || "Sin RFC"}
            </span>
            {hasValue(client.address) && (
              <span className="flex items-center gap-1">
                <MapPin size={16} className="text-black" /> {client.address}
              </span>
            )}
          </div>
        </div>

        <Link
          to="/clientes"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-black hover:text-light-text-primary px-1 py-1 rounded-lg transition-colors">
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
                "bg-white text-black border-[#CBD5E1] shadow-sm"
              : "text-zinc-400 border-transparent hover:text-black hover:border-zinc-200 hover:bg-white/70"
            }`}>
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
                <h3 className="font-semibold text-[#1a2b4c] flex items-center gap-2">
                  <Building2 size={20} className="text-black" /> Datos generales
                  de {client.business_name}
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={openEditClientModal}
                    className="p-1.5 rounded-lg text-[#92400E] transition hover:scale-75"
                    title="Editar">
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={handleDeleteClient}
                    className="p-1.5 rounded-lg text-red-800 transition hover:scale-75"
                    title="Eliminar cliente">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                {clientGeneralFields.map((field) => {
                  const isFullWidthField =
                    field.name === "business_name" ||
                    field.name === orphanClientGeneralFieldName;

                  return (
                    <div
                      key={field.name}
                      className={`${isFullWidthField ? "md:col-span-2" : ""} h-full p-3.5 rounded-xl border border-zinc-200/80 shadow-sm`}>
                      <span className="text-xs font-semibold text-[#2277B4] uppercase block mb-1.5 tracking-wide">
                        {field.label}
                      </span>
                      <div className="text-light-text-primary whitespace-normal break-words leading-relaxed">
                        {field.value}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            <Card>
              <h3 className="font-semibold text-light-text-primary mb-4 flex items-center gap-2">
                <UserPlus size={20} className="text-black" /> Asignar Contacto
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
                  <h3 className="font-semibold text-lg text-light-text-primary">
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
                      onClick={() => {
                        setShowBulkContactModal(true);
                        setBulkContactData([]);
                        setBulkContactErrors([]);
                        setBulkContactResult(null);
                        setBulkContactDriveUrl("");
                      }}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold text-[#1a2b4c] transition-colors">
                      <Upload size={15} />
                      Cargar contactos
                    </button>
                  )}
                </div>
              </div>

              {/* Toolbar de búsqueda y filtros */}
              <div className="flex flex-wrap items-center gap-2 mb-4">
                {/* Búsqueda global */}
                <div className="flex gap-1 bg-white p-1 rounded-lg border border-zinc-200 flex-1 min-w-[200px]">
                  <input
                    value={contactSearch}
                    onChange={(e) => setContactSearch(e.target.value)}
                    placeholder="Buscar contacto…"
                    className="bg-transparent border-none text-sm text-zinc-800 placeholder:text-zinc-400 px-3 w-full focus:outline-none"
                  />
                  <div className="px-3 py-1.5 text-black">
                    <Search size={16} />
                  </div>
                </div>

                <div className="flex flex-col items-center gap-1">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleExportContactsPDF}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold border border-red-200 bg-white text-red-700 hover:bg-red-50 transition-colors whitespace-nowrap"
                      title="Exportar a PDF">
                      <FileText size={14} /> Exportar a PDF
                    </button>

                    <button
                      onClick={handleExportContactsExcel}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold border border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50 transition-colors whitespace-nowrap"
                      title="Exportar a Excel">
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
                    : "bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50"
                  }`}>
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
                    className="flex items-center gap-1 px-2 py-2 rounded-lg text-xs text-red-500 hover:bg-red-50 transition-colors">
                    <X size={14} /> Limpiar
                  </button>
                )}

                <span className="text-xs text-zinc-400 ml-auto">
                  Pág. {contactsTable.getState().pagination.pageIndex + 1} de{" "}
                  {contactsTable.getPageCount() || 1}
                </span>
              </div>

              {activeContactFilterPickerField &&
                showContactFilters &&
                createPortal(
                  <div
                    className="fixed inset-0 z-[9999] bg-black/45 flex items-center justify-center p-4"
                    onClick={closeContactFilterPicker}>
                    <div
                      className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
                      onClick={(e) => e.stopPropagation()}>
                      <div className="px-5 py-4 border-b border-zinc-100 bg-[#1a2b4c] flex items-center justify-between">
                        <div>
                          <h3 className="text-white font-semibold text-base">
                            Filtrar por{" "}
                            {(
                              activeContactFilterPickerConfig?.buttonLabel ||
                              "campo"
                            ).toLowerCase()}
                          </h3>
                          <p className="text-[11px] text-zinc-300 mt-1">
                            Selecciona o busca un valor
                          </p>
                        </div>
                        <button
                          onClick={closeContactFilterPicker}
                          className="size-8 rounded-lg text-white hover:bg-white/10 flex items-center justify-center">
                          <X size={16} />
                        </button>
                      </div>

                      <div className="p-4 space-y-3">
                        <div className="flex items-center gap-2 bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2">
                          <Search size={15} className="text-zinc-500" />
                          <input
                            value={contactFilterPickerSearch}
                            onChange={(e) =>
                              setContactFilterPickerSearch(e.target.value)
                            }
                            placeholder="Buscar valor…"
                            className="w-full bg-transparent text-sm text-zinc-800 placeholder:text-zinc-400 focus:outline-none"
                          />
                        </div>

                        <div className="h-72 overflow-y-auto rounded-lg border border-zinc-100 divide-y divide-zinc-100">
                          {visibleContactFilterPickerOptions.length > 0 ?
                            visibleContactFilterPickerOptions.map((value) => {
                              const isSelected =
                                normalizeSearchText(
                                  contactFilters[
                                    activeContactFilterPickerField
                                  ],
                                ) === normalizeSearchText(value);

                              return (
                                <button
                                  key={`${activeContactFilterPickerField}_${value}`}
                                  onClick={() => applyContactFilterValue(value)}
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

              <div className="px-4 py-2 min-h-10 bg-blue-50 border border-zinc-200 border-b-0 rounded-t-md text-xs text-[#2277B4] flex items-center justify-between gap-3">
                <div className="flex items-center gap-1 shrink-0">
                  <Lightbulb size={14} className="inline" /> Clic en
                  <ChevronRight size={12} className="inline" /> para más
                  detalles
                </div>

                <div className="flex items-center gap-3">
                  <div
                    className={`flex items-center gap-2 transition-opacity duration-150 ${
                      showContactFilters ? "opacity-100" : (
                        "opacity-0 pointer-events-none"
                      )
                    }`}>
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
                            : "bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-100"
                          }`}>
                          <span className="font-semibold tracking-wide">
                            {button.buttonLabel}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  
                  <button
                    onClick={handleDownloadContactsTemplate}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-zinc-700 bg-white transition-colors whitespace-nowrap"
                    title="Descargar plantilla de carga masiva de contactos"> 
                    <FileSpreadsheet size={13} /> Descargar plantilla excel
                  </button>
                </div>
              </div>

              {/* Modal de edición inline removido */}

              {/* Tabla TanStack */}
              <div
                className={`bg-white overflow-x-auto border border-zinc-200 border-t-0 rounded-b-md ${
                  shouldEnableContactTableScroll ?
                    "h-[65vh] overflow-y-scroll"
                  : ""
                }`}>
                <table className="w-full text-sm">
                  <thead>
                    {contactsTable.getHeaderGroups().map((hg) => (
                      <tr
                        key={hg.id}
                        className="bg-zinc-50 border-b border-zinc-200">
                        {hg.headers.map((header) => (
                          <th
                            key={header.id}
                            onClick={
                              header.column.getCanSort() ?
                                header.column.getToggleSortingHandler()
                              : undefined
                            }
                            className={`px-4 py-3 text-left text-xs font-semibold text-[#2277B4] uppercase tracking-wider transition-colors ${
                              shouldEnableContactTableScroll ?
                                "sticky top-0 z-20 bg-zinc-50"
                              : ""
                            } ${
                              header.column.getCanSort() ?
                                "cursor-pointer hover:bg-zinc-100"
                              : "cursor-default"
                            } ${header.column.id === "expander" ? "w-12" : ""}`}>
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
                  <tbody className="divide-y divide-zinc-100">
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
                          <tr className="hover:bg-zinc-50 transition-colors">
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
                            <tr className="bg-zinc-50/80">
                              {row.getVisibleCells().map((cell) => {
                                const columnId = cell.column.id;
                                const alignedDetails =
                                  detailColumnsByPrimary[columnId] || [];

                                return (
                                  <td
                                    key={`${cell.id}__detail`}
                                    className="px-4 py-4 align-top">
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
                                              className="min-w-0">
                                              <p className="text-[10px] font-semibold uppercase text-[#2277B4] tracking-wider">
                                                {column.label}
                                              </p>
                                              <p className="text-sm text-zinc-700 break-words">
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
                    <span className="text-sm text-zinc-500">Mostrar</span>
                    <select
                      value={contactsTable.getState().pagination.pageSize}
                      onChange={(e) =>
                        contactsTable.setPageSize(Number(e.target.value))
                      }
                      className="px-2 py-1 rounded-lg text-sm text-[#1a2b4c] focus:outline-none focus:ring-2 focus:ring-[#153465] bg-white border border-zinc-200">
                      {[10, 25, 50, 100].map((size) => (
                        <option key={size} value={size}>
                          {size}
                        </option>
                      ))}
                    </select>
                    <span className="text-sm text-zinc-500">por página</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => contactsTable.setPageIndex(0)}
                      disabled={!contactsTable.getCanPreviousPage()}
                      className="px-2 py-1 text-sm font-medium text-zinc-600 bg-zinc-100 rounded-lg hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed">
                      ««
                    </button>
                    <button
                      onClick={() => contactsTable.previousPage()}
                      disabled={!contactsTable.getCanPreviousPage()}
                      className="px-3 py-1 text-sm font-medium text-zinc-600 bg-zinc-100 rounded-lg hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed">
                      Anterior
                    </button>
                    <button
                      onClick={() => contactsTable.nextPage()}
                      disabled={!contactsTable.getCanNextPage()}
                      className="px-3 py-1 text-sm font-medium text-zinc-600 bg-zinc-100 rounded-lg hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed">
                      Siguiente
                    </button>
                    <button
                      onClick={() =>
                        contactsTable.setPageIndex(
                          contactsTable.getPageCount() - 1,
                        )
                      }
                      disabled={!contactsTable.getCanNextPage()}
                      className="px-2 py-1 text-sm font-medium text-zinc-600 bg-zinc-100 rounded-lg hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed">
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
                    className="flex items-center gap-2 text-xs text-zinc-400 hover:text-zinc-600 transition-colors select-none group px-1 py-1">
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
                        className={`mt-2 overflow-x-auto rounded-md border border-zinc-200 animate-fade-in ${
                          shouldEnableDisabledContactsTableScroll ?
                            "max-h-[12rem] overflow-y-auto"
                          : ""
                        }`}>
                        <table className="w-full text-sm">
                          <thead>
                            {disabledContactsTable
                              .getHeaderGroups()
                              .map((hg) => (
                                <tr
                                  key={hg.id}
                                  className="bg-zinc-100 border-b border-zinc-200">
                                  {hg.headers.map((header) => (
                                    <th
                                      key={header.id}
                                      className={`px-4 py-2 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider ${
                                        (
                                          shouldEnableDisabledContactsTableScroll
                                        ) ?
                                          "sticky top-0 z-20 bg-zinc-100"
                                        : ""
                                      }`}>
                                      {flexRender(
                                        header.column.columnDef.header,
                                        header.getContext(),
                                      )}
                                    </th>
                                  ))}
                                </tr>
                              ))}
                          </thead>
                          <tbody className="divide-y divide-zinc-100">
                            {visibleDisabledContactRows.map((row) => (
                              <tr
                                key={row.id}
                                className="bg-zinc-50 opacity-50">
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
                          <span className="text-sm text-zinc-500">Mostrar</span>
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
                            className="px-2 py-1 rounded-lg text-sm text-[#1a2b4c] focus:outline-none focus:ring-2 focus:ring-[#153465] bg-white border border-zinc-200">
                            {[3, 10, 25, 50, 100].map((size) => (
                              <option key={size} value={size}>
                                {size}
                              </option>
                            ))}
                          </select>
                          <span className="text-sm text-zinc-500">
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
                            className="px-2 py-1 text-sm font-medium text-zinc-600 bg-zinc-100 rounded-lg hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed">
                            ««
                          </button>
                          <button
                            onClick={() => disabledContactsTable.previousPage()}
                            disabled={
                              !disabledContactsTable.getCanPreviousPage()
                            }
                            className="px-3 py-1 text-sm font-medium text-zinc-600 bg-zinc-100 rounded-lg hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed">
                            Anterior
                          </button>
                          <button
                            onClick={() => disabledContactsTable.nextPage()}
                            disabled={!disabledContactsTable.getCanNextPage()}
                            className="px-3 py-1 text-sm font-medium text-zinc-600 bg-zinc-100 rounded-lg hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed">
                            Siguiente
                          </button>
                          <button
                            onClick={() =>
                              disabledContactsTable.setPageIndex(
                                disabledContactsTable.getPageCount() - 1,
                              )
                            }
                            disabled={!disabledContactsTable.getCanNextPage()}
                            className="px-2 py-1 text-sm font-medium text-zinc-600 bg-zinc-100 rounded-lg hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed">
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
      {editingContactId &&
        createPortal(
          <div
            style={{ zIndex: 9999 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in"
            onClick={() => setEditingContactId(null)}>
            <div
              className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}>
              <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between bg-[#1a2b4c]">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  Editar Contacto
                </h2>
                <button
                  onClick={() => setEditingContactId(null)}
                  className="p-2 rounded-full text-white transition-colors">
                  <X size={18} />
                </button>
              </div>
              <div className="px-6 py-4 overflow-y-auto max-h-[70vh]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {contactEditableColumns.map((column) => (
                    <div key={column.name} className="min-w-0">
                      <Input
                        label={column.label}
                        type={getContactFieldInputType(column.name)}
                        value={contactForm[column.name] || ""}
                        onChange={(e) =>
                          setContactForm((prev) => ({
                            ...prev,
                            [column.name]: e.target.value,
                          }))
                        }
                        required={column.name === "full_name"}
                      />
                    </div>
                  ))}
                </div>
              </div>
              <div className="px-6 py-4 border-t border-zinc-100 flex gap-2">
                <button
                  className="flex-1 py-3 text-zinc-600 font-semibold rounded-xl hover:bg-zinc-100 transition-colors"
                  onClick={() => setEditingContactId(null)}>
                  Cancelar
                </button>
                <button
                  onClick={handleUpdateContact}
                  className="flex-1 py-3 bg-[#2277B4] hover:bg-[#125280] text-white font-bold rounded-xl shadow-lg shadow-[#2277B450] transition-all duration-150 backdrop-blur-sm active:scale-95 active:translate-y-px">
                  Guardar Cambios
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* Modal de Carga Masiva de Contactos */}
      {showBulkContactModal &&
        createPortal(
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
              {/* Header */}
              <div className="px-6 py-4 border-b border-zinc-100 bg-[#1a2b4c] flex items-center justify-between">
                <h3 className="text-white text-lg font-semibold flex items-center gap-2">
                  <FileSpreadsheet size={20} />
                  Carga de Contactos
                </h3>
              </div>

              <div className="p-6 overflow-y-auto flex-1 space-y-5">
                {/* Instrucciones */}
                <div className="bg-[#2277B412] border border-blue-200 rounded-xl p-4">
                  <p className="text-sm font-semibold text-[#2277B4] mb-2 flex items-center gap-1">
                    <Lightbulb size={15} /> Ayuda
                  </p>
                  <ul className="text-xs text-[#2277B4] space-y-1 mb-3 list-disc pl-5">
                    <li>
                      Los contactos se asignarán automáticamente a:{" "}
                      <b>{client?.business_name}</b>
                    </li>
                    <li>
                      También puedes pegar la URL del archivo de Google Drive.
                    </li>
                  </ul>
                </div>

                {/* Importar desde Drive */}
                <div className="space-y-2 rounded-xl border border-zinc-200 p-4 bg-white">
                  <p className="text-xs font-semibold text-zinc-600 tracking-wide">
                    Importar desde Google Drive
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="url"
                      value={bulkContactDriveUrl}
                      onChange={(e) => setBulkContactDriveUrl(e.target.value)}
                      placeholder="Pega la URL del archivo de Drive…"
                      className="flex-1 px-3 py-2 rounded-lg border border-zinc-300 text-sm text-zinc-700 focus:outline-none focus:ring-2 focus:ring-[#2277B4]/30 focus:border-[#2277B4] bg-white"
                    />
                    <button
                      onClick={executeBulkContactDriveImport}
                      disabled={bulkContactDriveImporting}
                      className="px-4 py-2 rounded-lg bg-[#2277B4] text-white text-sm font-semibold hover:bg-[#125280] transition-colors disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap">
                      {bulkContactDriveImporting ? "Importando…" : "Importar"}
                    </button>
                  </div>
                </div>

                {bulkContactResult?.success &&
                  bulkContactResult?.details?.ignoredHeaders?.length > 0 && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-800">
                      <p className="font-semibold mb-1">
                        Columnas ignoradas del Excel
                      </p>
                      <p>
                        {bulkContactResult.details.ignoredHeaders.join(", ")}
                      </p>
                    </div>
                  )}

                {bulkContactResult?.success &&
                  bulkContactResult?.details?.createdColumns?.length > 0 && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-xs text-emerald-800">
                      <p className="font-semibold mb-1">
                        Columnas nuevas creadas en contactos
                      </p>
                      <p>
                        {bulkContactResult.details.createdColumns
                          .map((item) => `${item.header} -> ${item.columnName}`)
                          .join(", ")}
                      </p>
                    </div>
                  )}

                {/* Subir archivo */}
                <div>
                  <input
                    ref={bulkContactFileRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleBulkContactFile}
                    className="hidden"
                  />
                  <button
                    onClick={() => bulkContactFileRef.current?.click()}
                    className="w-full py-8 border-2 border-dashed border-zinc-300 rounded-xl flex flex-col items-center gap-2 text-zinc-500 hover:border-[#2277B4] hover:text-[#2277B4] transition-colors cursor-pointer">
                    <Upload size={28} />
                    <span className="text-sm font-semibold">
                      Haz clic para seleccionar el archivo Excel
                    </span>
                    <span className="text-[11px] text-zinc-400">
                      O usa la plantilla descargada
                    </span>
                  </button>
                </div>

                {/* Errores */}
                {bulkContactErrors.length > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <p className="text-sm font-semibold text-amber-800 mb-2 flex items-center gap-1">
                      <AlertCircle size={15} /> Advertencias
                    </p>
                    <ul className="text-xs text-amber-700 space-y-1 max-h-32 overflow-y-auto">
                      {bulkContactErrors.map((err, i) => (
                        <li key={i}>• {err}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Vista previa */}
                {bulkContactData.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold text-zinc-700 mb-2">
                      Vista previa ({bulkContactData.length} contactos listos
                      para importar)
                    </p>
                    <div className="border border-zinc-200 rounded-xl overflow-hidden max-h-64 overflow-y-auto">
                      <table className="w-full text-xs">
                        <thead className="bg-zinc-50 sticky top-0">
                          <tr>
                            <th className="px-3 py-2 text-left font-semibold text-zinc-600">
                              #
                            </th>
                            <th className="px-3 py-2 text-left font-semibold text-zinc-600">
                              Nombre
                            </th>
                            <th className="px-3 py-2 text-left font-semibold text-zinc-600">
                              Correo
                            </th>
                            <th className="px-3 py-2 text-left font-semibold text-zinc-600">
                              Teléfono
                            </th>
                            <th className="px-3 py-2 text-left font-semibold text-zinc-600">
                              Puesto
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100">
                          {bulkContactData.map((r, i) => (
                            <tr key={i} className="hover:bg-zinc-50">
                              <td className="px-3 py-2 text-zinc-400">
                                {i + 1}
                              </td>
                              <td className="px-3 py-2 font-medium text-zinc-800">
                                {r.full_name}
                              </td>
                              <td className="px-3 py-2 text-zinc-600">
                                {r.email || "—"}
                              </td>
                              <td className="px-3 py-2 text-zinc-600">
                                {r.phone || "—"}
                              </td>
                              <td className="px-3 py-2 text-zinc-600">
                                {r.position_title || "—"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-zinc-100 flex items-center justify-end gap-3">
                {bulkContactData.length > 0 && (
                  <button
                    onClick={executeBulkContactUpload}
                    disabled={bulkContactUploading}
                    className="px-6 py-2.5 bg-[#2277B4] text-white font-bold rounded-xl hover:bg-[#125280] transition-colors shadow-lg shadow-[#2277B450] disabled:opacity-50 flex items-center gap-2">
                    {bulkContactUploading ?
                      <>
                        <span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Importando…
                      </>
                    : <>
                        <CheckCircle2 size={16} />
                        Importar {bulkContactData.length} Contactos
                      </>
                    }
                  </button>
                )}
                <button
                  onClick={() => setShowBulkContactModal(false)}
                  className="px-5 py-2.5 text-zinc-600 font-semibold rounded-xl hover:bg-zinc-100 transition-colors">
                  Cerrar
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
