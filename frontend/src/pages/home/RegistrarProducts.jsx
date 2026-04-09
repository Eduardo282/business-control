import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Link, useSearchParams } from "react-router-dom";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Swal from "sweetalert2";
import {
  ArrowLeft,
  BadgeDollarSign,
  Building,
  Building2,
  ClipboardList,
  Download,
  FileSpreadsheet,
  FileText,
  Globe,
  LayoutDashboard,
  Package,
  Library,
  ChevronDown,
  Plus,
  Shield,
  ShoppingBag,
  ShoppingCart,
  User,
  Users,
  X,
} from "@icons";
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import { axiosClient } from "../../actionsAPI/axiosClient";
import { createProductApi } from "../../actionsAPI/products.api";
import { listClientsApi } from "../../actionsAPI/clients.api";
import {
  createContactProductApi,
  listContactsByClientApi,
} from "../../actionsAPI/contacts.api";

export const CATALOG = [
  {
    category: "Procesos Contables y Financieros",
    items: [
      {
        name: "CONTPAQi Contabilidad",
        category: "Contabilidad",
        price: 4590,
        max_users: 15,
        description:
          "Sistema estándar en México para contadores. Automatiza el registro de pólizas a partir de los CFDI, genera estados financieros y cumple con toda la normativa de Contabilidad Electrónica del SAT.",
      },
      {
        name: "CONTPAQi Bancos",
        category: "Tesorería",
        price: 6390,
        max_users: 10,
        description:
          "Software para el control de tesorería. Gestiona ingresos, egresos, conciliaciones bancarias automáticas y el flujo de efectivo proyectado.",
      },
      {
        name: "CONTPAQi Contabiliza (Nube)",
        category: "Contabilidad",
        price: 4390,
        max_users: 25,
        description:
          "Versión 100% web de contabilidad. Permite trabajar desde cualquier lugar sin instalar servidores, con descarga automática de comprobantes desde el SAT.",
      },
      {
        name: "CONTPAQi Gastos",
        category: "Productividad",
        price: 0,
        max_users: 30,
        description:
          "Aplicación para que los empleados registren sus gastos de viaje o viáticos de forma digital. Facilita la comprobación y fiscalización de facturas.",
      },
    ],
  },
  {
    category: "Procesos Comerciales y Facturación",
    items: [
      {
        name: "CONTPAQi Comercial Premium",
        category: "Comercial",
        price: 10490,
        max_users: 30,
        description:
          "Software más robusto para empresas con almacenes. Controla inventarios multialmacén, procesos de compra, ventas, cuentas por cobrar y pagar.",
      },
      {
        name: "CONTPAQi Comercial Pro",
        category: "Comercial",
        price: 11290,
        max_users: 20,
        description:
          "Versión escalable para PyMEs con mayor profundidad en reportes y personalización de procesos comerciales.",
      },
      {
        name: "CONTPAQi Comercial Start",
        category: "Comercial",
        price: 2690,
        max_users: 5,
        description:
          "Para negocios que inician con procesos básicos de compra-venta e inventario.",
      },
      {
        name: "CONTPAQi Factura Electrónica",
        category: "Facturación",
        price: 2690,
        max_users: 10,
        description:
          "Ideal para prestadores de servicios. Emisión masiva de CFDI: facturas, notas de crédito, recibos de honorarios.",
      },
      {
        name: "CONTPAQi Vende (Nube)",
        category: "Facturación",
        price: 1690,
        max_users: 15,
        description:
          "Herramienta web para microempresas o emprendedores. Factura rápido desde navegador o celular y gestiona catálogos de clientes.",
      },
      {
        name: "CONTPAQi Punto de Venta",
        category: "Comercial",
        price: 2990,
        max_users: 12,
        description:
          "Especializado para tiendas con mostrador. Compatible con básculas, lectores de códigos de barras y cajones de dinero.",
      },
    ],
  },
  {
    category: "Nómina y Recursos Humanos",
    items: [
      {
        name: "CONTPAQi Nóminas",
        category: "Nómina",
        price: 5590,
        max_users: 20,
        description:
          "Cálculo de sueldos con timbrado masivo de CFDI de nómina, cálculos de IMSS, Infonavit, ISR, finiquitos y PTU.",
      },
      {
        name: "CONTPAQi Personia (Nube)",
        category: "Nómina",
        price: 3090,
        max_users: 30,
        description:
          "Versión en la nube para cálculo de nómina. Ideal para despachos o empresas pequeñas que necesitan movilidad.",
      },
      {
        name: "CONTPAQi Evalúa",
        category: "Recursos Humanos",
        price: 2190,
        max_users: 10,
        description:
          "Herramienta para cumplir con la NOM-035. Aplica encuestas de riesgo psicosocial y genera reportes automáticos.",
      },
    ],
  },
  {
    category: "Productividad e Infraestructura",
    items: [
      {
        name: "CONTPAQi XML en Línea+",
        category: "Productividad",
        price: 1790,
        max_users: 5,
        description:
          "Buscador y descargador masivo de facturas. Conecta con el SAT para bajar todos los XML emitidos y recibidos.",
      },
      {
        name: "CONTPAQi Respaldos",
        category: "Infraestructura",
        price: 1690,
        max_users: 1,
        description:
          "Servicio de almacenamiento en la nube con copias de seguridad automáticas de bases de datos. Protege contra fallas, robo y Ransomware.",
      },
      {
        name: "CONTPAQi Escritorio Virtual",
        category: "Infraestructura",
        price: 1690,
        max_users: 30,
        description:
          "Sube tus sistemas de escritorio a un servidor en la nube. Usa programas como Contabilidad o Nóminas desde cualquier computadora.",
      },
      {
        name: "CONTPAQi Optimiza",
        category: "Productividad",
        price: 1690,
        max_users: 15,
        description:
          "Tablero de gestión para despachos contables. Monitorea el avance de tareas, el estado de cumplimiento de clientes y el flujo de trabajo del equipo.",
      },
    ],
  },
];

const PRODUCT_LOGO_MAP = {
  "CONTPAQi Contabilidad": FileSpreadsheet,
  "CONTPAQi Bancos": Building2,
  "CONTPAQi Contabiliza (Nube)": Globe,
  "CONTPAQi Gastos": BadgeDollarSign,
  "CONTPAQi Comercial Premium": ShoppingBag,
  "CONTPAQi Comercial Pro": ShoppingCart,
  "CONTPAQi Comercial Start": Package,
  "CONTPAQi Factura Electrónica": FileText,
  "CONTPAQi Vende (Nube)": ShoppingCart,
  "CONTPAQi Punto de Venta": Building,
  "CONTPAQi Nóminas": Users,
  "CONTPAQi Personia (Nube)": User,
  "CONTPAQi Evalúa": ClipboardList,
  "CONTPAQi XML en Línea+": Download,
  "CONTPAQi Respaldos": Shield,
  "CONTPAQi Escritorio Virtual": Building2,
  "CONTPAQi Optimiza": LayoutDashboard,
};

const QUICK_POLICY_STATUS_OPTIONS = [
  { value: "ACTIVE", label: "Activo" },
  { value: "EXPIRING_SOON", label: "Pendiente" },
  { value: "CANCELLED", label: "Inactivo" },
];

function toIsoDate(value = new Date()) {
  const date = new Date(value);
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 10);
}

function addDaysIso(days, baseDate = new Date()) {
  const date = new Date(baseDate);
  date.setDate(date.getDate() + days);
  return toIsoDate(date);
}

function addYearsIso(years, baseDate = new Date()) {
  const date = new Date(baseDate);
  date.setFullYear(date.getFullYear() + years);
  return toIsoDate(date);
}

function isoToDate(isoDate) {
  const value = String(isoDate || "").trim();
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  return new Date(year, month - 1, day);
}

function yearFromIso(isoDate) {
  const value = String(isoDate || "").trim();
  const match = /^(\d{4})-\d{2}-\d{2}$/.exec(value);
  return match ? match[1] : String(new Date().getFullYear());
}

function buildNextServicePolicyFolio(startDate, existingFolios = []) {
  const year = yearFromIso(startDate);
  const folioRe = new RegExp(`^BC-${year}-(\\d{3})$`, "i");

  const maxSequence = existingFolios.reduce((max, folio) => {
    const match = folioRe.exec(String(folio || "").trim());
    if (!match) return max;
    const sequence = parseInt(match[1], 10);
    return Number.isNaN(sequence) ? max : Math.max(max, sequence);
  }, 0);

  return `BC-${year}-${String(maxSequence + 1).padStart(3, "0")}`;
}

function normalizeServicePolicyCategory(category = "") {
  return String(category)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function isServicePolicyCategory(category = "") {
  const normalized = normalizeServicePolicyCategory(category);
  return (
    normalized === "servicio personalizado" ||
    normalized === "poliza personalizada"
  );
}

export default function RegistrarProducts() {
  const [searchParams] = useSearchParams();
  const clientId = searchParams.get("client_id");
  const fixedClientId = clientId ? String(clientId) : "";
  const [newProduct, setNewProduct] = useState({
    name: "",
    category: "",
    price: 0,
    users_count: 1,
    description: "",
  });

  const [isMainModalOpen, setIsMainModalOpen] = useState(false);
  const [isContpaqiModalOpen, setIsContpaqiModalOpen] = useState(false);
  const [isNewCategoryModalOpen, setIsNewCategoryModalOpen] = useState(false);
  const [isServicePolicyModalOpen, setIsServicePolicyModalOpen] =
    useState(false);
  const [clients, setClients] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [savingServicePolicy, setSavingServicePolicy] = useState(false);
  const [pendingServicePolicy, setPendingServicePolicy] = useState(null);
  const [folioCatalog, setFolioCatalog] = useState([]);
  const [servicePolicyForm, setServicePolicyForm] = useState({
    type: "SERVICE",
    name: "",
    client_id: fixedClientId,
    contact_id: "",
    license_key: "",
    start_date: toIsoDate(),
    expiration_date: addYearsIso(1),
    status: "ACTIVE",
  });
  const [customCategories, setCustomCategories] = useState(() => {
    try {
      const saved = localStorage.getItem("customProductCategories");
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter((item) => item && item.category);
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(
      "customProductCategories",
      JSON.stringify(customCategories),
    );
  }, [customCategories]);

  useEffect(() => {
    if (!isServicePolicyCategory(newProduct.category)) {
      setPendingServicePolicy(null);
    }
  }, [newProduct.category]);

  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryProductName, setNewCategoryProductName] = useState("");
  const [currentMaxUsers, setCurrentMaxUsers] = useState(30);

  const loadServicePolicyFolios = async () => {
    const { data } = await axiosClient.post("", {
      query: `
        query {
          policies {
            license_key
          }
        }
      `,
    });

    if (data.errors?.length) {
      throw new Error(data.errors[0].message);
    }

    const rows = data?.data?.policies || [];
    const uniqueFolios = [
      ...new Set(rows.map((row) => row?.license_key).filter(Boolean)),
    ];
    setFolioCatalog(uniqueFolios);
    return uniqueFolios;
  };

  const loadClients = async () => {
    if (clients.length) return;
    setLoadingClients(true);
    try {
      const response = await listClientsApi();
      setClients(Array.isArray(response) ? response : []);
    } catch (error) {
      Swal.fire({
        title: "Error",
        text: error.message || "No se pudo cargar la lista de clientes.",
        icon: "error",
        confirmButtonColor: "#d33",
      });
    } finally {
      setLoadingClients(false);
    }
  };

  const openServicePolicyModal = () => {
    const initialForm = {
      type: "SERVICE",
      name: "",
      client_id: fixedClientId,
      contact_id: "",
      license_key: "",
      start_date: toIsoDate(),
      expiration_date: addYearsIso(1),
      status: "ACTIVE",
    };

    setServicePolicyForm({
      ...initialForm,
      license_key: buildNextServicePolicyFolio(
        initialForm.start_date,
        folioCatalog,
      ),
    });

    setContacts([]);
    setIsServicePolicyModalOpen(true);
    loadClients();
    loadServicePolicyFolios().catch((error) => {
      Swal.fire({
        title: "Aviso",
        text:
          error.message ||
          "No se pudo calcular el consecutivo de folio con historial, se usará un folio local.",
        icon: "info",
        confirmButtonColor: "#2277B4",
      });
    });
  };

  const handleQuickStatusChange = (nextStatus) => {
    setServicePolicyForm((prev) => {
      let nextExpiration = prev.expiration_date;
      if (nextStatus === "EXPIRING_SOON") {
        const maxSoonDate = addDaysIso(30);
        if (!nextExpiration || nextExpiration > maxSoonDate) {
          nextExpiration = addDaysIso(15);
        }
      }
      if (nextStatus === "ACTIVE") {
        const minActiveDate = addDaysIso(31);
        if (!nextExpiration || nextExpiration <= minActiveDate) {
          nextExpiration = addYearsIso(1);
        }
      }

      return {
        ...prev,
        status: nextStatus,
        expiration_date: nextExpiration,
      };
    });
  };

  const handleCreateServicePolicy = (e) => {
    e.preventDefault();

    const name = servicePolicyForm.name.trim();
    if (!name) {
      Swal.fire({
        title: "Falta información",
        text: "Debes capturar el nombre del servicio o póliza.",
        icon: "warning",
        confirmButtonColor: "#2277B4",
      });
      return;
    }

    if (
      servicePolicyForm.start_date &&
      servicePolicyForm.expiration_date &&
      servicePolicyForm.status !== "CANCELLED" &&
      servicePolicyForm.expiration_date < servicePolicyForm.start_date
    ) {
      Swal.fire({
        title: "Vigencia inválida",
        text: "La fecha de vencimiento no puede ser menor a la fecha de inicio.",
        icon: "warning",
        confirmButtonColor: "#2277B4",
      });
      return;
    }

    setSavingServicePolicy(true);
    const category =
      servicePolicyForm.type === "POLICY" ?
        "Póliza Personalizada"
      : "Servicio Personalizado";
    const createdDescription =
      servicePolicyForm.type === "POLICY" ?
        "Descripcion de Póliza personalizada"
      : "Descripcion de Servicio personalizado";

    const nextFormProduct = {
      name,
      category,
      price: 0,
      users_count: 1,
      description: createdDescription,
    };

    setNewProduct(nextFormProduct);
    setCurrentMaxUsers(30);
    setPendingServicePolicy({
      client_id: servicePolicyForm.client_id || "",
      contact_id: servicePolicyForm.contact_id || "",
      license_key:
        servicePolicyForm.license_key ||
        buildNextServicePolicyFolio(servicePolicyForm.start_date, folioCatalog),
      start_date: servicePolicyForm.start_date || toIsoDate(),
      expiration_date: servicePolicyForm.expiration_date || addYearsIso(1),
      status: servicePolicyForm.status || "ACTIVE",
    });
    setCustomCategories((prev) => {
      const normalizedName = nextFormProduct.name.trim().toLowerCase();
      const normalizedCategory = nextFormProduct.category.trim().toLowerCase();

      const withoutDuplicated = prev.filter((item) => {
        const itemName = String(item?.name || "")
          .trim()
          .toLowerCase();
        const itemCategory = String(item?.category || "")
          .trim()
          .toLowerCase();
        return !(
          itemName === normalizedName && itemCategory === normalizedCategory
        );
      });

      return [
        {
          name: nextFormProduct.name,
          category: nextFormProduct.category,
        },
        ...withoutDuplicated,
      ];
    });

    setIsServicePolicyModalOpen(false);
    setSavingServicePolicy(false);
  };

  useEffect(() => {
    if (!isServicePolicyModalOpen || !servicePolicyForm.client_id) {
      setContacts([]);
      return;
    }

    let isCancelled = false;
    setLoadingContacts(true);

    listContactsByClientApi(servicePolicyForm.client_id)
      .then((response) => {
        if (isCancelled) return;
        const contactRows = Array.isArray(response) ? response : [];
        setContacts(contactRows);
        setServicePolicyForm((prev) => {
          if (
            prev.contact_id &&
            contactRows.some(
              (row) => String(row.id) === String(prev.contact_id),
            )
          ) {
            return prev;
          }
          return {
            ...prev,
            contact_id: contactRows[0] ? String(contactRows[0].id) : "",
          };
        });
      })
      .catch((error) => {
        if (isCancelled) return;
        setContacts([]);
        Swal.fire({
          title: "Error",
          text: error.message || "No se pudieron cargar los contactos.",
          icon: "error",
          confirmButtonColor: "#d33",
        });
      })
      .finally(() => {
        if (!isCancelled) {
          setLoadingContacts(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [isServicePolicyModalOpen, servicePolicyForm.client_id]);

  useEffect(() => {
    if (!isServicePolicyModalOpen) return;

    const nextFolio = buildNextServicePolicyFolio(
      servicePolicyForm.start_date,
      folioCatalog,
    );

    setServicePolicyForm((prev) => {
      if (prev.license_key === nextFolio) return prev;
      return {
        ...prev,
        license_key: nextFolio,
      };
    });
  }, [isServicePolicyModalOpen, servicePolicyForm.start_date, folioCatalog]);

  const handleTemplateSelect = (e) => {
    const val = e.target.value;
    if (!val) return;
    const [catIdx, itemIdx] = val.split("-");
    const item = CATALOG[catIdx]?.items?.[itemIdx];
    const category = CATALOG[catIdx]?.category;
    if (item) {
      const nextCategory = item.category || category;
      setNewProduct((prev) => ({
        ...prev,
        name: item.name,
        category: nextCategory,
        price: item.price ?? 0,
        description: item.description || "",
        users_count: 1,
      }));
      if (!isServicePolicyCategory(nextCategory)) {
        setPendingServicePolicy(null);
      }
    }
  };

  const handlePriceChange = (value) => {
    if (value === "") {
      setNewProduct((prev) => ({ ...prev, price: "" }));
      return;
    }

    const numeric = Number(value);
    if (Number.isNaN(numeric)) return;

    setNewProduct((prev) => ({
      ...prev,
      price: numeric < 0 ? 0 : value,
    }));
  };

  const handlePriceStep = (direction) => {
    setNewProduct((prev) => {
      const current = parseFloat(prev.price);
      const base = Number.isFinite(current) ? current : 0;
      const next = Math.max(0, base + direction * 0.01);

      return {
        ...prev,
        price: next.toFixed(2),
      };
    });
  };

  const clampUsersValue = (value) => {
    let parsed = parseInt(value, 10);
    if (Number.isNaN(parsed)) parsed = 1;
    if (parsed < 1) parsed = 1;
    if (parsed > currentMaxUsers) parsed = currentMaxUsers;
    return parsed;
  };

  const handleUsersChange = (value) => {
    if (value === "") {
      setNewProduct((prev) => ({ ...prev, users_count: "" }));
      return;
    }

    const nextUsers = clampUsersValue(value);
    setNewProduct((prev) => ({
      ...prev,
      users_count: nextUsers,
    }));
  };

  const handleUsersStep = (direction) => {
    setNewProduct((prev) => {
      const base = clampUsersValue(prev.users_count || 1);
      const nextUsers = Math.min(
        currentMaxUsers,
        Math.max(1, base + direction),
      );

      return {
        ...prev,
        users_count: nextUsers,
      };
    });
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const isServicePolicy = isServicePolicyCategory(newProduct.category);

      if (isServicePolicy && !pendingServicePolicy) {
        Swal.fire({
          title: "Falta información",
          text: "Primero completa el modal de Nuevo servicio o póliza para registrar correctamente en la tabla.",
          icon: "warning",
          confirmButtonColor: "#2277B4",
        });
        return;
      }

      if (
        isServicePolicy &&
        (!pendingServicePolicy?.client_id ||
          !pendingServicePolicy?.contact_id ||
          !pendingServicePolicy?.start_date ||
          !pendingServicePolicy?.expiration_date)
      ) {
        Swal.fire({
          title: "Falta información",
          text: "Para servicio o póliza debes seleccionar cliente, contacto y vigencia.",
          icon: "warning",
          confirmButtonColor: "#2277B4",
        });
        return;
      }

      if (
        isServicePolicy &&
        pendingServicePolicy?.status !== "CANCELLED" &&
        pendingServicePolicy?.expiration_date < pendingServicePolicy?.start_date
      ) {
        Swal.fire({
          title: "Vigencia inválida",
          text: "La fecha de vencimiento no puede ser menor a la fecha de inicio.",
          icon: "warning",
          confirmButtonColor: "#2277B4",
        });
        return;
      }

      const payload = {
        ...newProduct,
        price: parseFloat(newProduct.price) || 0,
        users_count: parseInt(newProduct.users_count, 10) || 1,
        client_id:
          pendingServicePolicy?.client_id ||
          (clientId ? String(clientId) : null),
      };
      const createdProduct = await createProductApi(payload);

      if (isServicePolicy) {
        let nextStatus = pendingServicePolicy.status;
        let nextExpirationDate = pendingServicePolicy.expiration_date;

        if (nextStatus === "EXPIRING_SOON") {
          const maxSoonDate = addDaysIso(30, pendingServicePolicy.start_date);
          if (!nextExpirationDate || nextExpirationDate > maxSoonDate) {
            nextExpirationDate = addDaysIso(
              15,
              pendingServicePolicy.start_date,
            );
          }
          nextStatus = "ACTIVE";
        }

        await createContactProductApi({
          contact_id: pendingServicePolicy.contact_id,
          product_id: createdProduct.id,
          license_key: pendingServicePolicy.license_key,
          start_date: pendingServicePolicy.start_date,
          expiration_date: nextExpirationDate,
          status: nextStatus,
        });
      }

      setNewProduct({
        name: "",
        category: "",
        price: 0,
        users_count: 1,
        description: "",
      });
      setPendingServicePolicy(null);
      Swal.fire({
        title: "¡Éxito!",
        text:
          isServicePolicy ? "Registro correcto." : "Registrado correctamente",
        icon: "success",
        confirmButtonColor: "#2277B4",
      });
    } catch (e) {
      Swal.fire({
        title: "Error",
        text: e.message || "Error al crear producto",
        icon: "error",
        confirmButtonColor: "#d33",
      });
    }
  };

  return (
    <div className="space-y-6 pb-20 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 tracking-tight">
            Registrar productos
          </h1>
        </div>
        <Link
          to={"/productos"}
          className="text-[#00] hover:text-primary-700 text-sm font-semibold flex items-center gap-2">
          <ArrowLeft size={16} /> Volver a productos
        </Link>
      </div>

      <form onSubmit={handleCreate} className="mb-6 animate-fade-in">
        <div className="p-6 rounded-xl glass-panel shadow-xl">
          <button
            type="button"
            onClick={openServicePolicyModal}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[#2277B4]/25 bg-[#2277B4]/5 text-[#2277B4] text-sm font-semibold hover:bg-[#2277B4]/10 transition-colors mb-4">
            <Plus size={16} /> Nuevo servicio o póliza
          </button>
          <div className="mb-6">
            <div className="relative">
              <div
                className="w-full pl-4 pr-10 py-3 rounded-xl bg-white text-[#2277B4] border border-gray-200 outline-none transition-all cursor-pointer hover:bg-gray-50 flex justify-between items-center"
                onClick={() => setIsMainModalOpen(true)}>
                <span>-- Seleccionar productos o servicios de Contpaqi--</span>
                <ChevronDown size={16} className="text-light-text-secondary" />
              </div>
            </div>
            <div className="mt-3 flex justify-end"></div>
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
              placeholder="Ej. Contabilidad"
              value={newProduct.category}
              onChange={(e) =>
                setNewProduct({ ...newProduct, category: e.target.value })
              }
              required
            />

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-light-text-secondary dark:text-slate-400 ml-1 uppercase tracking-wider transition-colors">
                  PRECIO (MXN)
                </label>
                <div className="relative">
                  <input
                    id="register-price-input"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={newProduct.price}
                    onChange={(e) => handlePriceChange(e.target.value)}
                    className="w-full rounded-xl pl-4 pr-16 py-3 text-sm bg-white text-light-text-primary focus:ring-2 focus:ring-[#153465] focus:outline-none border border-gray-300"
                    required
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex overflow-hidden rounded-md border border-[#b8cce6] shadow-sm bg-[#e8f2ff]">
                    <button
                      type="button"
                      onClick={() => handlePriceStep(-1)}
                      className="w-4 h-4 text-xs font-bold text-[#2277B4] hover:bg-[#dcecff] transition-colors leading-none">
                      -
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePriceStep(1)}
                      className="w-4 h-4 text-xs font-bold text-[#2277B4] hover:bg-[#dcecff] border-l border-[#b8cce6] transition-colors leading-none">
                      +
                    </button>
                  </div>
                </div>
                {newProduct.price && !isNaN(newProduct.price) && (
                  <div className="text-[10px] text-black mt-1 font-mono text-right">
                    + IVA: ${(parseFloat(newProduct.price) * 0.16).toFixed(2)}
                  </div>
                )}
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-light-text-secondary dark:text-slate-400 ml-1 uppercase tracking-wider transition-colors">
                  {`USUARIOS (MÁXIMA CAPACIDAD. ${currentMaxUsers})`}
                </label>
                <div className="relative">
                  <input
                    id="register-users-input"
                    type="number"
                    min="1"
                    max={currentMaxUsers.toString()}
                    step="1"
                    placeholder="1"
                    value={newProduct.users_count}
                    onChange={(e) => handleUsersChange(e.target.value)}
                    className="w-full rounded-xl pl-4 pr-16 py-3 text-sm bg-white text-light-text-primary focus:ring-2 focus:ring-[#153465] focus:outline-none border border-gray-300"
                    required
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex overflow-hidden rounded-md border border-[#b8cce6] shadow-sm bg-[#e8f2ff]">
                    <button
                      type="button"
                      onClick={() => handleUsersStep(-1)}
                      className="w-4 h-4 text-xs font-bold text-[#2277B4] hover:bg-[#dcecff] transition-colors leading-none">
                      -
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUsersStep(1)}
                      className="w-4 h-4 text-xs font-bold text-[#2277B4] hover:bg-[#dcecff] border-l border-[#b8cce6] transition-colors leading-none">
                      +
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-light-text-secondary dark:text-slate-400">
                Descripción
              </label>
              <textarea
                className="w-full bg-white border border-light-border rounded-lg p-3 text-sm text-light-text-primary outline-none focus:ring-1 focus:ring-[#125280] min-h-[100px]"
                placeholder="Detalles técnicos..."
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

          <div className="flex justify-end mt-6 pt-4 border-t border-light-border dark:border-white/5">
            <button
              type="submit"
              className="px-8 py-2 justify-center bg-[#2277B4] hover:bg-[#125280] text-white rounded-xl shadow-lg shadow-[#2277B450]">
              Registrar Producto
            </button>
          </div>
        </div>
      </form>

      {/* Main Modal */}
      {isMainModalOpen &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-500/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-fade-in relative">
              <div className="p-4 border-b border-[#24395f] bg-[#1a2b4c] flex items-center justify-between">
                <h2 className="font-bold text-white text-lg">
                  Seleccionar producto
                </h2>
                <button
                  onClick={() => setIsMainModalOpen(false)}
                  className="text-white/80 hover:text-white transition-colors p-1">
                  <X size={20} />
                </button>
              </div>

              <div className="p-4 space-y-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsMainModalOpen(false);
                    setIsContpaqiModalOpen(true);
                  }}
                  className="w-full text-left px-4 py-3 rounded-xl border border-blue-200 bg-blue-50/50 hover:bg-blue-50 text-[#125280] font-semibold transition-all flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                      <Package size={18} />
                    </div>
                    Productos de CONTPAQI
                  </div>
                  <ChevronDown
                    size={16}
                    className="-rotate-90 text-blue-400 group-hover:text-blue-600"
                  />
                </button>

                {customCategories.length > 0 && (
                  <div>
                    <h3 className="text-xs font-bold text-gray-400 uppercase mb-3 px-1">
                      Nuevo producto registrado
                    </h3>
                    <div
                      className={`space-y-2 ${customCategories.length > 3 ? "max-h-60 overflow-y-auto pr-1" : ""}`}>
                      {customCategories.map((customProd, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setNewProduct((prev) => ({
                              ...prev,
                              name: customProd.name || "",
                              category: customProd.category,
                              description: "",
                              price: 0,
                              users_count: 1,
                            }));
                            setCurrentMaxUsers(30);
                            setIsMainModalOpen(false);
                          }}
                          className="w-full text-left px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 font-semibold transition-all flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-gray-200 flex items-center justify-center text-gray-500 shrink-0">
                            <Package size={18} />
                          </div>
                          <div className="flex flex-col overflow-hidden">
                            <span className="truncate">
                              {customProd.name || customProd.category}
                            </span>
                            {customProd.name && (
                              <span className="text-[10px] text-gray-400 uppercase truncate">
                                {customProd.category}
                              </span>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setIsMainModalOpen(false);
                    setIsNewCategoryModalOpen(true);
                  }}
                  className="w-full py-3 px-4 rounded-xl border-2 border-dashed border-[#125280]/35 text-[#125280] font-semibold hover:border-[#125280] hover:text-[#125280] hover:bg-blue-50 transition-all flex items-center justify-center gap-2">
                  <Plus size={18} /> Nuevo producto
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* Contpaqi Categories Modal */}
      {isContpaqiModalOpen &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-500/50 backdrop-blur-sm">
            <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl animate-fade-in flex flex-col max-h-[85vh]">
              <div className="p-4 border-b border-[#24395f] bg-[#1a2b4c] flex items-center gap-3">
                <button
                  onClick={() => {
                    setIsContpaqiModalOpen(false);
                    setIsMainModalOpen(true);
                  }}
                  className="text-white/80 hover:text-white transition-colors p-2 bg-white/10 hover:bg-white/20 rounded-full">
                  <ArrowLeft size={20} />
                </button>
                <h2 className="font-bold text-white text-xl flex items-center gap-2">
                  <Package className="text-blue-300" size={24} /> Productos de
                  CONTPAQi
                </h2>
              </div>

              <div className="p-6 overflow-y-auto space-y-8 bg-[#f8fafc]">
                {CATALOG.map((cat, catIdx) => (
                  <div key={cat.category}>
                    <h3 className="font-bold text-sm text-gray-500 uppercase mb-4 px-1 tracking-wider">
                      {cat.category}
                    </h3>
                    <div className="space-y-3">
                      {cat.items.map((item) => {
                        const ProductLogo =
                          PRODUCT_LOGO_MAP[item.name] || Package;

                        return (
                          <button
                            key={item.name}
                            type="button"
                            onClick={() => {
                              setNewProduct((prev) => ({
                                ...prev,
                                name: item.name,
                                category: item.category || cat.category,
                                price: item.price ?? 0,
                                description: item.description || "",
                                users_count: 1,
                              }));
                              setCurrentMaxUsers(item.max_users || 30);
                              setIsContpaqiModalOpen(false);
                            }}
                            className="w-full text-left p-5 rounded-2xl border border-gray-200 bg-white hover:border-blue-300 hover:shadow-md transition-all group">
                            <div className="flex justify-between items-start gap-4 mb-1.5">
                              <div className="flex items-start gap-3 min-w-0">
                                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-400 group-hover:border-blue-200 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
                                  <ProductLogo size={13} />
                                </span>
                                <div className="font-bold text-lg text-[#1e293b] group-hover:text-blue-600 min-w-0">
                                  {item.name}
                                </div>
                              </div>
                              {(item.category || cat.category) && (
                                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-500/70 bg-blue-50/50 px-2 py-0.5 rounded-md border border-blue-100/50 shrink-0">
                                  {item.category || cat.category}
                                </span>
                              )}
                            </div>
                            {item.description && (
                              <div className="text-sm text-gray-500 leading-relaxed line-clamp-2">
                                {item.description}
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {customCategories.length > 0 && (
                  <div>
                    <h3 className="font-bold text-sm text-gray-500 uppercase mb-4 px-1 tracking-wider">
                      PRODUCTOS PERSONALIZADOS
                    </h3>
                    <div className="space-y-3">
                      {customCategories.map((customProd, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setNewProduct((prev) => ({
                              ...prev,
                              name: customProd.name || "",
                              category: customProd.category,
                              description: "",
                              price: 0,
                              users_count: 1,
                            }));
                            setCurrentMaxUsers(30);
                            setIsContpaqiModalOpen(false);
                          }}
                          className="w-full text-left p-5 rounded-2xl border border-gray-200 bg-white hover:border-blue-300 hover:shadow-md transition-all group">
                          <div className="flex justify-between items-start gap-4 mb-1.5">
                            <div className="font-bold text-lg text-[#1e293b] group-hover:text-blue-600">
                              {customProd.name || customProd.category}
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-500/70 bg-blue-50/50 px-2 py-0.5 rounded-md border border-blue-100/50 shrink-0">
                              {customProd.category}
                            </span>
                          </div>
                          <div className="text-sm text-gray-500 leading-relaxed">
                            {customProd.name ?
                              "Producto personalizado"
                            : "Categoría personalizada"}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* New Category Modal */}
      {isNewCategoryModalOpen &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-500/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl animate-fade-in">
              <div className="p-4 border-b border-[#24395f] bg-[#1a2b4c] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      setIsNewCategoryModalOpen(false);
                      setIsMainModalOpen(true);
                    }}
                    className="text-white/80 hover:text-white transition-colors p-1 bg-white/10 hover:bg-white/20 rounded-lg">
                    <ArrowLeft size={20} />
                  </button>
                  <h2 className="font-bold text-white text-lg">
                    Nuevo producto
                  </h2>
                </div>
                <button
                  onClick={() => setIsNewCategoryModalOpen(false)}
                  className="text-white/80 hover:text-white transition-colors p-1">
                  <X size={20} />
                </button>
              </div>

              <div className="p-5 space-y-4">
                <Input
                  label="NOMBRE DEL PRODUCTO"
                  placeholder="Ej. Sistema a la medida"
                  value={newCategoryProductName}
                  onChange={(e) => setNewCategoryProductName(e.target.value)}
                  autoFocus
                />
                <Input
                  label="CATEGORÍA"
                  placeholder="Ej. Soft de tec"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  required
                />

                <button
                  type="button"
                  className="w-full py-3 px-4 rounded-xl bg-[#125280] text-white font-bold hover:bg-[#0f4660] transition-colors shadow-lg shadow-[#125280]/30 flex justify-center items-center gap-2"
                  onClick={() => {
                    if (newCategoryName.trim()) {
                      const newProdName = newCategoryProductName.trim();
                      const newCatName = newCategoryName.trim();

                      setCustomCategories((prev) => [
                        ...prev,
                        { name: newProdName, category: newCatName },
                      ]);

                      setNewProduct((prev) => ({
                        ...prev,
                        category: newCatName,
                        description: "",
                        price: 0,
                        users_count: 1,
                        ...(newProdName ? { name: newProdName } : {}),
                      }));

                      setCurrentMaxUsers(30);
                      setNewCategoryName("");
                      setNewCategoryProductName("");
                      setIsNewCategoryModalOpen(false);
                      // It closes entirely to let the user finish the product registration with the fields filled
                    }
                  }}>
                  <Plus size={18} /> Agregar producto
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* New Service/Policy Modal */}
      {isServicePolicyModalOpen &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-500/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl animate-fade-in max-h-[90vh] overflow-y-auto">
              <div className="p-4 flex items-center justify-between sticky top-0 z-10 bg-[#1a2b4c] border-b border-[#24395f]">
                <h2 className="font-bold text-white text-lg">
                  Nuevo servicio o póliza
                </h2>
                <button
                  type="button"
                  onClick={() => setIsServicePolicyModalOpen(false)}
                  className="text-white/80 hover:text-white transition-colors p-1">
                  <X size={20} />
                </button>
              </div>

              <form
                onSubmit={handleCreateServicePolicy}
                className="p-5 space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                      Tipo
                    </label>
                    <select
                      value={servicePolicyForm.type}
                      onChange={(e) =>
                        setServicePolicyForm((prev) => ({
                          ...prev,
                          type: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#2277B4]/20 focus:border-[#2277B4]">
                      <option value="SERVICE">Servicio</option>
                      <option value="POLICY">Póliza</option>
                    </select>
                  </div>

                  <Input
                    label="NOMBRE"
                    placeholder="Ej. Renovación anual CONTPAQi"
                    value={servicePolicyForm.name}
                    onChange={(e) =>
                      setServicePolicyForm((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    required
                  />

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                      Cliente
                    </label>
                    <select
                      value={servicePolicyForm.client_id}
                      onChange={(e) =>
                        setServicePolicyForm((prev) => ({
                          ...prev,
                          client_id: e.target.value,
                          contact_id: "",
                        }))
                      }
                      disabled={!!fixedClientId || loadingClients}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#2277B4]/20 focus:border-[#2277B4] disabled:opacity-70">
                      <option value="">Selecciona un cliente...</option>
                      {clients.map((client) => (
                        <option key={client.id} value={client.id}>
                          {client.business_name}
                        </option>
                      ))}
                    </select>
                    {fixedClientId && (
                      <p className="text-[11px] text-gray-500 mt-1">
                        Cliente fijado desde la vista actual.
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                      Contacto
                    </label>
                    <select
                      value={servicePolicyForm.contact_id}
                      onChange={(e) =>
                        setServicePolicyForm((prev) => ({
                          ...prev,
                          contact_id: e.target.value,
                        }))
                      }
                      disabled={!servicePolicyForm.client_id || loadingContacts}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#2277B4]/20 focus:border-[#2277B4] disabled:opacity-70">
                      <option value="">
                        {!servicePolicyForm.client_id ?
                          "Selecciona un cliente primero"
                        : loadingContacts ?
                          "Cargando contactos..."
                        : "Selecciona un contacto..."}
                      </option>
                      {contacts.map((contact) => (
                        <option key={contact.id} value={contact.id}>
                          {contact.full_name}
                          {contact.email ? ` (${contact.email})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>

                  <Input
                    label="FOLIO"
                    placeholder="Se genera automáticamente"
                    value={servicePolicyForm.license_key}
                    readOnly
                  />

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                      Vigencia inicio
                    </label>
                    <DatePicker
                      selected={isoToDate(servicePolicyForm.start_date)}
                      onChange={(date) =>
                        setServicePolicyForm((prev) => ({
                          ...prev,
                          start_date: date ? toIsoDate(date) : "",
                        }))
                      }
                      dateFormat="MM/dd/yyyy"
                      placeholderText="MM/DD/YYYY"
                      showPopperArrow={false}
                      popperClassName="price-history-datepicker-popper"
                      calendarClassName="price-history-datepicker-calendar"
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#2277B4]/20 focus:border-[#2277B4]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                      Vigencia fin
                    </label>
                    <DatePicker
                      selected={isoToDate(servicePolicyForm.expiration_date)}
                      onChange={(date) =>
                        setServicePolicyForm((prev) => ({
                          ...prev,
                          expiration_date: date ? toIsoDate(date) : "",
                        }))
                      }
                      minDate={
                        isoToDate(servicePolicyForm.start_date) || undefined
                      }
                      dateFormat="MM/dd/yyyy"
                      placeholderText="MM/DD/YYYY"
                      showPopperArrow={false}
                      popperClassName="price-history-datepicker-popper"
                      calendarClassName="price-history-datepicker-calendar"
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#2277B4]/20 focus:border-[#2277B4]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                      Estado
                    </label>
                    <select
                      value={servicePolicyForm.status}
                      onChange={(e) => handleQuickStatusChange(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#2277B4]/20 focus:border-[#2277B4]">
                      {QUICK_POLICY_STATUS_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    {/* <p className="text-[11px] text-gray-500 mt-1">
                      Pendiente se reflejará "Por vencer".
                    </p> */}
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setIsServicePolicyModalOpen(false)}
                    className="px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors">
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={savingServicePolicy}
                    className="px-5 py-2 rounded-lg bg-[#2277B4] text-white font-semibold hover:bg-[#125280] transition-colors disabled:opacity-70">
                    {savingServicePolicy ? "Agregando..." : "Agregar"}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
