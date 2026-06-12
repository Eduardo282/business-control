import React, { useState, useEffect, useMemo, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
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
} from "@icons";
import Input from "../../components/ui/Input";
import {
  assignCategoryTypeApi,
  createProductApi,
  listCategoriesApi,
  createCategoryApi,
  deleteCategoryApi,
} from "../../actionsAPI/products.api";
import { notificationService } from "../../services/notificationService";
import { logger } from "../../services/logger";
import { usePersistedFormDraft } from "../../hooks/usePersistedFormDraft";

// Modularized components
import SourceSelectionModal from "./registrar-products/SourceSelectionModal";
import CategoryManagerModal from "./registrar-products/CategoryManagerModal";
import ProductSelectorModal from "./registrar-products/ProductSelectorModal";

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

const CATEGORY_CHIPS_PAGE_SIZE = 12;

function sanitizeCategoryLabel(category = "") {
  return String(category).replace(/\s+/g, " ").trim();
}

function normalizeServicePolicyCategory(category = "") {
  return sanitizeCategoryLabel(category)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function uniqueByNormalizedValue(values = []) {
  const seen = new Set();
  const result = [];

  values.forEach((entry) => {
    const value = String(entry || "").trim();
    if (!value) return;

    const normalized = normalizeServicePolicyCategory(value);
    if (seen.has(normalized)) return;

    seen.add(normalized);
    result.push(value);
  });

  return result;
}

function categoryMatches(sourceCategory, selectedCategory) {
  const source = normalizeServicePolicyCategory(sourceCategory);
  const selected = normalizeServicePolicyCategory(selectedCategory);

  if (!selected) return true;
  if (!source) return false;

  return source === selected || selected.includes(source) || source.includes(selected);
}

const PRODUCT_TYPE_VALUES = ["PRODUCT", "CONTPAQI", "SERVICE", "POLICY"];
const PRODUCT_TYPE_PRIORITY = {
  PRODUCT: 1,
  CONTPAQI: 2,
  SERVICE: 3,
  POLICY: 3,
};

function normalizeCatalogProductType(value) {
  const normalized = String(value || "").trim().toUpperCase();
  if (normalized === "CONTPAQI" || normalized === "CONTPAQI_PRODUCT") return "CONTPAQI";
  if (PRODUCT_TYPE_VALUES.includes(normalized)) return normalized;
  return "";
}

function inferProductType(product = {}) {
  const explicitType = normalizeCatalogProductType(product.product_type);
  if (explicitType) return explicitType;

  const source = `${product?.name || ""} ${product?.category || ""}`;
  const normalized = normalizeServicePolicyCategory(source);

  if (normalized.includes("poliza")) return "POLICY";
  if (normalized.includes("servicio")) return "SERVICE";
  if (normalized.includes("contpaqi")) return "CONTPAQI";
  return "PRODUCT";
}

function getCategoryTypeKey(category = "") {
  return normalizeServicePolicyCategory(category);
}

function shouldReplaceCategoryType(currentType, nextType) {
  if (!currentType) return true;
  return (PRODUCT_TYPE_PRIORITY[nextType] || 0) >= (PRODUCT_TYPE_PRIORITY[currentType] || 0);
}

function toCatalogItem(product = {}) {
  return {
    id: String(product.id || crypto.randomUUID()),
    folio: product.folio || "",
    name: product.name,
    category: product.category,
    price: parseFloat(product.current_price || product.price || 0),
    max_users: Math.max(1, parseInt(product.users_count || product.max_users || 1, 10) || 1),
    description: product.description || "",
    product_type: inferProductType(product),
    isCustom: true,
  };
}

function upsertCatalogItem(list, nextItem) {
  const nextName = normalizeServicePolicyCategory(nextItem.name);
  const nextCategory = normalizeServicePolicyCategory(nextItem.category);
  const filtered = list.filter((item) => {
    const itemName = normalizeServicePolicyCategory(item.name);
    const itemCategory = normalizeServicePolicyCategory(item.category);
    return !(itemName === nextName && itemCategory === nextCategory);
  });

  return [nextItem, ...filtered];
}

export default function RegistrarProducts() {
  const [searchParams] = useSearchParams();
  const fixedClientId = searchParams.get("client_id") || "";

  const [newProduct, setNewProduct] = useState({
    name: "",
    category: "",
    price: 0,
    users_count: 1,
    description: "",
    product_type: "PRODUCT",
  });

  const [currentMaxUsers, setCurrentMaxUsers] = useState(30);
  const [selectedSourceType, setSelectedSourceType] = useState("PRODUCT");

  const [isSourceModalOpen, setIsSourceModalOpen] = useState(false);
  const [isContpaqiModalOpen, setIsContpaqiModalOpen] = useState(false);
  const [isServicesModalOpen, setIsServicesModalOpen] = useState(false);
  const [isCategoriesModalOpen, setIsCategoriesModalOpen] = useState(false);
  const [isPoliciesModalOpen, setIsPoliciesModalOpen] = useState(false);
  const [isGeneralProductsModalOpen, setIsGeneralProductsModalOpen] = useState(false);

  const [activeFormMode, setActiveFormMode] = useState(null); // "PRODUCT" | "SERVICE" | "POLICY" | "CONTPAQI" | null
  const [newCategoryName, setNewCategoryName] = useState("");
  const [categoryPage, setCategoryPage] = useState(1);
  const [isFormHighlighted, setIsFormHighlighted] = useState(false);

  const [customCategories, setCustomCategories] = useState([]);
  const [customPolicies, setCustomPolicies] = useState([]);
  const [customGeneralProducts, setCustomGeneralProducts] = useState([]);
  const [customContpaqiProducts, setCustomContpaqiProducts] = useState([]);
  const [customServices, setCustomServices] = useState([]);
  const [categoryTypeByName, setCategoryTypeByName] = useState({});

  const prevCustomCategoriesRef = useRef([]);

  useEffect(() => {
    prevCustomCategoriesRef.current = customCategories;
  }, [customCategories]);

  const loadCategoriesFromAPI = async () => {
    try {
      const { listProductsApi } = await import("../../actionsAPI/products.api");
      const apiProducts = await listProductsApi();
      const apiCategories = apiProducts.map((p) => p.category);

      setCategoryTypeByName((prev) => {
        const next = { ...prev };
        apiProducts.forEach((product) => {
          const categoryKey = getCategoryTypeKey(product.category);
          const productType = inferProductType(product);
          if (!categoryKey) return;
          if (shouldReplaceCategoryType(next[categoryKey], productType)) {
            next[categoryKey] = productType;
          }
        });
        return next;
      });

      // Services
      const apiServices = apiProducts.filter((p) => inferProductType(p) === "SERVICE");
      if (apiServices.length > 0) {
        setCustomServices((prev) => {
          let next = prev || [];
          apiServices.forEach((apiService) => {
            next = upsertCatalogItem(next, toCatalogItem(apiService));
          });
          return next;
        });
      }

      // Policies
      const apiPolicies = apiProducts.filter((p) => inferProductType(p) === "POLICY");
      if (apiPolicies.length > 0) {
        setCustomPolicies((prev) => {
          let next = prev || [];
          apiPolicies.forEach((apiPolicy) => {
            next = upsertCatalogItem(next, toCatalogItem(apiPolicy));
          });
          return next;
        });
      }

      // Custom CONTPAQi products
      const apiContpaqiProducts = apiProducts.filter((p) => inferProductType(p) === "CONTPAQI");
      if (apiContpaqiProducts.length > 0) {
        setCustomContpaqiProducts((prev) => {
          let next = prev || [];
          apiContpaqiProducts.forEach((apiProduct) => {
            next = upsertCatalogItem(next, toCatalogItem(apiProduct));
          });
          return next;
        });
      }

      // General Products
      const apiGeneralProducts = apiProducts.filter((p) => {
        return inferProductType(p) === "PRODUCT";
      });
      if (apiGeneralProducts.length > 0) {
        setCustomGeneralProducts((prev) => {
          let next = prev || [];
          apiGeneralProducts.forEach((apiProduct) => {
            next = upsertCatalogItem(next, toCatalogItem(apiProduct));
          });
          return next;
        });
      }

      const allCategories = uniqueByNormalizedValue([
        ...apiCategories,
        ...prevCustomCategoriesRef.current,
      ]);
      setCustomCategories((prev) => uniqueByNormalizedValue([...prev, ...allCategories]));
    } catch (e) {
      logger.error("Failed to load categories from API", e);
    }
  };

  useEffect(() => {
    loadCategoriesFromAPI();
  }, []);

  const selectedCategory = String(newProduct.category || "").trim();
  const selectedCategoryType =
    categoryTypeByName[getCategoryTypeKey(selectedCategory)] || "";

  const productDraftScope = fixedClientId ? `client:${fixedClientId}` : "global";
  const productDraftData = useMemo(
    () => ({
      newProduct,
      currentMaxUsers,
      selectedSourceType,
      activeFormMode,
    }),
    [newProduct, currentMaxUsers, selectedSourceType, activeFormMode]
  );

  usePersistedFormDraft({
    formKey: "register-product",
    scopeKey: productDraftScope,
    data: productDraftData,
    isMeaningfulDraft: (draft) => {
      const product = draft?.newProduct || {};
      return Boolean(
        String(product.name || "").trim() ||
          String(product.category || "").trim() ||
          String(product.description || "").trim() ||
          Number(product.price || 0) > 0 ||
          Number(product.users_count || 1) > 1 ||
          draft?.activeFormMode
      );
    },
    onDraftLoaded: (draft) => {
      if (draft?.newProduct) {
        setNewProduct((prev) => ({
          ...prev,
          ...draft.newProduct,
          product_type:
            normalizeCatalogProductType(draft.newProduct.product_type) ||
            prev.product_type,
        }));
      }
      if (draft?.currentMaxUsers) {
        setCurrentMaxUsers(Math.max(1, Number(draft.currentMaxUsers) || 30));
      }
      if (draft?.selectedSourceType) {
        setSelectedSourceType(
          normalizeCatalogProductType(draft.selectedSourceType) || "PRODUCT"
        );
      }
      if (draft?.activeFormMode) {
        setActiveFormMode(
          normalizeCatalogProductType(draft.activeFormMode) || null
        );
      }
    },
  });

  const builtInCategories = useMemo(() => {
    const values = [];
    CATALOG.forEach((group) => {
      group.items.forEach((item) => {
        if (item.category) {
          values.push(item.category);
        }
      });
    });
    return uniqueByNormalizedValue(values);
  }, []);

  const availableCategories = useMemo(
    () => uniqueByNormalizedValue([...builtInCategories, ...customCategories]),
    [builtInCategories, customCategories]
  );

  const totalCategoryPages = Math.max(
    1,
    Math.ceil(availableCategories.length / CATEGORY_CHIPS_PAGE_SIZE)
  );

  const builtInProducts = useMemo(
    () =>
      CATALOG.flatMap((group) =>
        group.items.map((item) => ({
          id: `catalog-${item.name}`,
          name: item.name,
          category: item.category || group.category,
          price: Math.max(0, Number(item.price) || 0),
          max_users: Math.max(1, parseInt(item.max_users, 10) || 30),
          description: item.description || "",
          product_type: "CONTPAQI",
          isCustom: false,
        }))
      ),
    []
  );

  const filteredContpaqiProducts = useMemo(() => {
    const allProducts = [...builtInProducts, ...customContpaqiProducts];
    return allProducts.filter((item) => categoryMatches(item.category, selectedCategory));
  }, [builtInProducts, customContpaqiProducts, selectedCategory]);

  const filteredServices = useMemo(
    () => customServices.filter((service) => categoryMatches(service.category, selectedCategory)),
    [customServices, selectedCategory]
  );

  const filteredPolicies = useMemo(
    () => customPolicies.filter((policy) => categoryMatches(policy.category, selectedCategory)),
    [customPolicies, selectedCategory]
  );

  const filteredGeneralProducts = useMemo(
    () =>
      customGeneralProducts.filter((product) =>
        categoryMatches(product.category, selectedCategory)
      ),
    [customGeneralProducts, selectedCategory]
  );

  const isServiceMode = useMemo(() => {
    if (activeFormMode === "SERVICE" || activeFormMode === "POLICY") return true;
    if (activeFormMode === "PRODUCT" || activeFormMode === "CONTPAQI") return false;
    if (selectedCategoryType === "SERVICE" || selectedCategoryType === "POLICY") return true;
    if (selectedCategoryType === "PRODUCT" || selectedCategoryType === "CONTPAQI") return false;

    const normalizedCategory = normalizeServicePolicyCategory(newProduct.category);
    return (
      selectedSourceType === "SERVICE" ||
      normalizedCategory.includes("servicio") ||
      normalizedCategory.includes("poliza")
    );
  }, [selectedSourceType, newProduct.category, activeFormMode, selectedCategoryType]);

  const productTypeLabel = useMemo(() => {
    if (activeFormMode === "POLICY") return "Póliza";
    if (activeFormMode === "SERVICE") return "Servicio";
    if (activeFormMode === "CONTPAQI") return "Producto CONTPAQi";
    if (activeFormMode === "PRODUCT") return "Producto";
    if (selectedCategoryType === "POLICY") return "Póliza";
    if (selectedCategoryType === "SERVICE") return "Servicio";
    if (selectedCategoryType === "CONTPAQI") return "Producto CONTPAQi";
    if (selectedCategoryType === "PRODUCT") return "Producto";

    const normalizedCategory = normalizeServicePolicyCategory(newProduct.category);
    if (normalizedCategory.includes("poliza")) return "Póliza";
    if (normalizedCategory.includes("servicio")) return "Servicio";
    if (normalizedCategory.includes("contpaqi")) return "Producto CONTPAQi";

    return "Producto";
  }, [activeFormMode, newProduct.category, selectedCategoryType]);

  const formLabels = useMemo(() => {
    if (activeFormMode === "POLICY")
      return { nameLabel: "NOMBRE DE LA PÓLIZA", button: "Registrar Póliza" };
    if (activeFormMode === "SERVICE")
      return { nameLabel: "NOMBRE DEL SERVICIO", button: "Registrar Servicio" };
    if (activeFormMode === "CONTPAQI")
      return { nameLabel: "NOMBRE DEL PRODUCTO", button: "Registrar Producto" };
    if (activeFormMode === "PRODUCT")
      return { nameLabel: "NOMBRE DEL PRODUCTO", button: "Registrar Producto" };
    if (selectedCategoryType === "POLICY")
      return { nameLabel: "NOMBRE DE LA PÓLIZA", button: "Registrar Póliza" };
    if (selectedCategoryType === "SERVICE")
      return { nameLabel: "NOMBRE DEL SERVICIO", button: "Registrar Servicio" };

    if (isServiceMode) {
      const normalizedCategory = normalizeServicePolicyCategory(newProduct.category);
      if (normalizedCategory.includes("poliza"))
        return { nameLabel: "NOMBRE DE LA PÓLIZA", button: "Registrar Póliza" };
      return { nameLabel: "NOMBRE DEL SERVICIO", button: "Registrar Servicio" };
    }
    return { nameLabel: "NOMBRE DEL PRODUCTO", button: "Registrar Producto" };
  }, [activeFormMode, isServiceMode, newProduct.category, selectedCategoryType]);

  // Sync categories from API
  useEffect(() => {
    async function fetchCategories() {
      try {
        const cats = await listCategoriesApi();
        setCustomCategories((prev) =>
          uniqueByNormalizedValue([...cats.map((c) => c.name), ...prev])
        );
        setCategoryTypeByName((prev) => {
          const next = { ...prev };
          cats.forEach((category) => {
            const key = getCategoryTypeKey(category.name);
            const type = normalizeCatalogProductType(category.product_type);
            if (key && type) next[key] = type;
          });
          return next;
        });
      } catch (e) {
        console.warn("No se pudieron cargar categorías desde el servidor:", e.message);
      }
    }
    fetchCategories();
  }, []);

  useEffect(() => {
    setCategoryPage((prev) => Math.min(prev, totalCategoryPages));
  }, [totalCategoryPages]);

  useEffect(() => {
    if (!isCategoriesModalOpen) return;
    setCategoryPage(1);
  }, [isCategoriesModalOpen]);

  const triggerFormHighlight = () => {
    setIsFormHighlighted(true);
    setTimeout(() => {
      const input = document.getElementById("register-product-name-input");
      if (input) {
        input.focus();
        input.select();
      }
    }, 150);
    setTimeout(() => {
      setIsFormHighlighted(false);
    }, 700);
  };

  const openSourceModal = () => {
    if (!selectedCategory) {
      notificationService.info(
        "Selecciona una categoría",
        "Primero registra o elige una categoría para filtrar productos y servicios."
      );
      return;
    }
    setIsSourceModalOpen(true);
  };

  const applyCategorySelection = (category) => {
    const nextCategory = sanitizeCategoryLabel(category);
    if (!nextCategory) return;

    const isSameCategory =
      normalizeServicePolicyCategory(nextCategory) ===
      normalizeServicePolicyCategory(selectedCategory);

    if (isSameCategory) return;

    const nextCategoryType = categoryTypeByName[getCategoryTypeKey(nextCategory)] || "PRODUCT";

    setNewProduct({
      name: "",
      category: nextCategory,
      price: 0,
      users_count: 1,
      description: "",
      product_type: nextCategoryType,
    });
    setCurrentMaxUsers(30);
    setSelectedSourceType(nextCategoryType);
    setActiveFormMode(null);
  };

  const handleAddCategory = async () => {
    const nextCategory = sanitizeCategoryLabel(newCategoryName);
    if (!nextCategory) return;

    const normalizedNewCategoryName = normalizeServicePolicyCategory(newCategoryName);
    const isDuplicateCategory =
      !!normalizedNewCategoryName &&
      availableCategories.some(
        (category) => normalizeServicePolicyCategory(category) === normalizedNewCategoryName
      );

    if (isDuplicateCategory) {
      notificationService.warning(
        "Categoría duplicada",
        "Ya existe una categoría registrada con ese nombre."
      );
      return;
    }

    try {
      await createCategoryApi(nextCategory);
      setCustomCategories((prev) => uniqueByNormalizedValue([nextCategory, ...prev]));
      applyCategorySelection(nextCategory);
      setNewCategoryName("");
      setIsCategoriesModalOpen(false);
    } catch (e) {
      notificationService.error("Error", e.message || "No se pudo crear la categoría.");
    }
  };

  const openSelectorBySource = (source) => {
    if (source === "CONTPAQI") setIsContpaqiModalOpen(true);
    if (source === "POLICY") setIsPoliciesModalOpen(true);
    if (source === "PRODUCT") setIsGeneralProductsModalOpen(true);
    if (source === "SERVICE") setIsServicesModalOpen(true);
  };

  const handleSourceSelection = async (source) => {
    const category = sanitizeCategoryLabel(selectedCategory);
    const productType = normalizeCatalogProductType(source) || "PRODUCT";
    if (!category) return;

    try {
      const savedCategory = await assignCategoryTypeApi(category, productType);
      setCategoryTypeByName((prev) => ({
        ...prev,
        [getCategoryTypeKey(savedCategory?.name || category)]:
          normalizeCatalogProductType(savedCategory?.product_type) || productType,
      }));
      setCustomCategories((prev) => uniqueByNormalizedValue([category, ...prev]));
      setSelectedSourceType(productType);
      setIsSourceModalOpen(false);
      openSelectorBySource(productType);
    } catch (e) {
      notificationService.error(
        "Error",
        e.message || "No se pudo asignar el tipo de la categoría."
      );
    }
  };

  const selectContpaqiProduct = (item) => {
    setNewProduct((prev) => ({
      ...prev,
      name: item.name,
      category: selectedCategory || item.category || prev.category,
      price: Math.max(0, Number(item.price) || 0),
      users_count: 1,
      description: item.description || "",
      product_type: "CONTPAQI",
    }));
    setCurrentMaxUsers(Math.max(1, Number(item.max_users) || 30));
    setSelectedSourceType("PRODUCT");
    setActiveFormMode("CONTPAQI");
    setIsSourceModalOpen(false);
    setIsContpaqiModalOpen(false);
    triggerFormHighlight();
  };

  const selectService = (service) => {
    setNewProduct((prev) => ({
      ...prev,
      name: service.name,
      category: selectedCategory || service.category || prev.category,
      price: Math.max(0, Number(service.price) || 0),
      users_count: 1,
      description: service.description || "",
      product_type: "SERVICE",
    }));
    setCurrentMaxUsers(1);
    setSelectedSourceType("SERVICE");
    setActiveFormMode("SERVICE");
    setIsSourceModalOpen(false);
    setIsServicesModalOpen(false);
    triggerFormHighlight();
  };

  const selectPolicy = (policy) => {
    setNewProduct((prev) => ({
      ...prev,
      name: policy.name,
      category: selectedCategory || policy.category || prev.category,
      price: Math.max(0, Number(policy.price) || 0),
      users_count: 1,
      description: policy.description || "",
      product_type: "POLICY",
    }));
    setCurrentMaxUsers(1);
    setSelectedSourceType("SERVICE");
    setActiveFormMode("POLICY");
    setIsSourceModalOpen(false);
    setIsPoliciesModalOpen(false);
    triggerFormHighlight();
  };

  const selectGeneralProduct = (product) => {
    setNewProduct((prev) => ({
      ...prev,
      name: product.name,
      category: selectedCategory || product.category || prev.category,
      price: Math.max(0, Number(product.price) || 0),
      users_count: 1,
      description: product.description || "",
      product_type: "PRODUCT",
    }));
    setCurrentMaxUsers(product.max_users || 1);
    setSelectedSourceType("PRODUCT");
    setActiveFormMode("PRODUCT");
    setIsSourceModalOpen(false);
    setIsGeneralProductsModalOpen(false);
    triggerFormHighlight();
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
      const nextUsers = Math.min(currentMaxUsers, Math.max(1, base + direction));

      return {
        ...prev,
        users_count: nextUsers,
      };
    });
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const safeName = String(newProduct.name || "").trim();
      const safeCategory = String(newProduct.category || "").trim();

      if (!safeName || !safeCategory) {
        notificationService.warning("Falta información", "Debes capturar nombre y categoría.");
        return;
      }

      let productType = normalizeCatalogProductType(activeFormMode);
      if (!productType) {
        productType = normalizeCatalogProductType(
          categoryTypeByName[getCategoryTypeKey(safeCategory)]
        );
      }
      if (!productType) {
        productType = inferProductType({ name: safeName, category: safeCategory });
      }

      const payload = {
        ...newProduct,
        name: safeName,
        category: safeCategory,
        price: parseFloat(newProduct.price) || 0,
        users_count:
          productType === "SERVICE" || productType === "POLICY"
            ? 1
            : parseInt(newProduct.users_count, 10) || 1,
        client_id: fixedClientId || null,
        product_type: productType,
      };

      const createdProduct = await createProductApi(payload);

      const nextItem = {
        id: String(createdProduct?.id || `custom-${Date.now()}`),
        folio: createdProduct?.folio || "",
        name: safeName,
        category: safeCategory,
        price: payload.price,
        max_users: Math.max(1, parseInt(payload.users_count, 10) || 1),
        description: String(payload.description || "").trim(),
        product_type: productType,
        isCustom: true,
      };

      if (productType === "SERVICE") {
        setCustomServices((prev) => upsertCatalogItem(prev, nextItem));
      } else if (productType === "POLICY") {
        setCustomPolicies((prev) => upsertCatalogItem(prev, nextItem));
      } else if (productType === "CONTPAQI") {
        setCustomContpaqiProducts((prev) => upsertCatalogItem(prev, nextItem));
      } else {
        setCustomGeneralProducts((prev) => upsertCatalogItem(prev, nextItem));
      }

      setCustomCategories((prev) => uniqueByNormalizedValue([safeCategory, ...prev]));
      setCategoryTypeByName((prev) => ({
        ...prev,
        [getCategoryTypeKey(safeCategory)]: productType,
      }));

      setNewProduct({
        name: "",
        category: safeCategory,
        price: 0,
        users_count: 1,
        description: "",
        product_type: productType,
      });
      setCurrentMaxUsers(30);
      setSelectedSourceType("PRODUCT");
      setActiveFormMode(null);

      const typeLabels = {
        SERVICE: "Servicio",
        POLICY: "Póliza",
        CONTPAQI: "Producto CONTPAQi",
        PRODUCT: "Producto",
      };
      const typeLabel = typeLabels[productType] || "Producto";
      const dualTable = productType === "SERVICE" || productType === "POLICY";
      const folioText = createdProduct?.folio ? ` Folio: ${createdProduct.folio}.` : "";

      notificationService.success(
        "¡Éxito!",
        dualTable
          ? `${typeLabel} registrado en Productos y en Historial de Servicios y Pólizas.${folioText}`
          : `${typeLabel} registrado correctamente.${folioText}`
      );
    } catch (e) {
      notificationService.error("Error", e.message || "Error al crear producto");
    }
  };

  return (
    <div className="space-y-6 pb-20 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="inline-flex items-center gap-3 text-3xl font-semibold text-zinc-800 dark:text-zinc-100 tracking-tight">
            <span>Registrar productos</span>
          </h1>
        </div>
        <Link
          to={"/productos"}
          className="text-[#00] hover:text-primary-700 text-sm font-semibold flex items-center gap-2"
        >
          <ArrowLeft size={16} /> Volver a productos
        </Link>
      </div>

      <form onSubmit={handleCreate} className="mb-6 animate-fade-in">
        <div
          className={`p-6 rounded-xl glass-panel shadow-xl border transition-all duration-500 ease-out ${
            isFormHighlighted
              ? "ring-4 ring-[#2277B4]/60 dark:ring-blue-400/50 shadow-[0_0_25px_rgba(34,119,180,0.4)] dark:shadow-[0_0_25px_rgba(96,165,250,0.4)] border-[#2277B4] dark:border-blue-400 bg-blue-50/40 dark:bg-blue-900/30 scale-[1.01]"
              : "border-zinc-200 dark:border-dark-700 scale-100"
          }`}
        >
          <button
            type="button"
            onClick={() => setIsCategoriesModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[#2277B4]/25 bg-[#2277B4]/5 text-[#2277B4] text-sm font-semibold hover:bg-[#2277B4]/10 transition-colors mb-4"
          >
            <Plus size={16} /> Gestionar categorías
          </button>

          <div className="mb-6">
            <div className="relative">
              <div
                className="w-full pl-4 pr-10 py-3 rounded-xl bg-white dark:bg-dark-900 text-[#2277B4] dark:text-blue-400 border border-zinc-200 dark:border-dark-700 outline-none transition-all cursor-pointer hover:bg-zinc-50 dark:hover:bg-dark-800 flex justify-between items-center"
                onClick={openSourceModal}
              >
                <span className="truncate pr-3">
                  {newProduct.name
                    ? `${newProduct.name} (${productTypeLabel})`
                    : "-- Seleccionar o agregar productos o servicios --"}
                </span>
                <ChevronDown size={16} className="text-light-text-secondary" />
              </div>
            </div>
            <div className="mt-2 text-xs text-zinc-500">
              {selectedCategory
                ? ``
                : "Primero selecciona o registra una categoría para abrir el selector."}
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                id="register-product-name-input"
                label={formLabels.nameLabel}
                placeholder={
                  isServiceMode
                    ? "Ej. Renovación anual"
                    : activeFormMode === "CONTPAQI"
                    ? "Ej. CONTPAQi Contabilidad 2024"
                    : "Ej. Contabilidad 2024"
                }
                value={newProduct.name}
                onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                required
              />

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-light-text-secondary dark:text-zinc-400 ml-1 uppercase tracking-wider transition-colors">
                  CATEGORÍA
                </label>
                <input
                  placeholder="Selecciona una categoría en Gestionar categorías"
                  value={newProduct.category}
                  readOnly
                  disabled={!selectedCategory}
                  className="w-full rounded-xl px-4 py-3 text-sm bg-white dark:bg-dark-900 text-light-text-primary dark:text-zinc-100 focus:ring-2 focus:ring-[#153465] focus:outline-none border border-zinc-300 dark:border-dark-700 disabled:bg-zinc-100 dark:disabled:bg-dark-800 disabled:text-zinc-500 disabled:border-zinc-200 dark:disabled:border-dark-700 disabled:cursor-not-allowed transition-colors"
                  required
                />
              </div>
            </div>

            <div className={`grid ${isServiceMode ? "grid-cols-1" : "grid-cols-2"} gap-4`}>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-light-text-secondary dark:text-zinc-400 ml-1 uppercase tracking-wider transition-colors">
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
                    className="w-full rounded-xl pl-4 pr-16 py-3 text-sm bg-white dark:bg-dark-900 text-light-text-primary dark:text-zinc-100 focus:ring-2 focus:ring-[#153465] focus:outline-none border border-zinc-300 dark:border-dark-700 transition-colors"
                    required
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex overflow-hidden rounded-md border border-[#b8cce6] dark:border-dark-600 shadow-sm bg-[#e8f2ff] dark:bg-dark-800">
                    <button
                      type="button"
                      onClick={() => handlePriceStep(-1)}
                      className="size-4 text-xs font-bold text-[#2277B4] hover:bg-[#dcecff] transition-colors leading-none"
                    >
                      -
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePriceStep(1)}
                      className="size-4 text-xs font-bold text-[#2277B4] dark:text-blue-400 hover:bg-[#dcecff] dark:hover:bg-dark-700 border-l border-[#b8cce6] dark:border-dark-600 transition-colors leading-none"
                    >
                      +
                    </button>
                  </div>
                </div>
                {Number(newProduct.price) > 0 && (
                  <div className="text-[10px] text-black dark:text-zinc-400 mt-1 font-mono text-right">
                    + IVA: ${(parseFloat(newProduct.price) * 0.16).toFixed(2)}
                  </div>
                )}
              </div>

              {!isServiceMode && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-light-text-secondary dark:text-zinc-400 ml-1 uppercase tracking-wider transition-colors">
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
                      className="w-full rounded-xl pl-4 pr-16 py-3 text-sm bg-white dark:bg-dark-900 text-light-text-primary dark:text-zinc-100 focus:ring-2 focus:ring-[#153465] focus:outline-none border border-zinc-300 dark:border-dark-700 transition-colors"
                      required
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex overflow-hidden rounded-md border border-[#b8cce6] dark:border-dark-600 shadow-sm bg-[#e8f2ff] dark:bg-dark-800">
                      <button
                        type="button"
                        onClick={() => handleUsersStep(-1)}
                        className="size-4 text-xs font-bold text-[#2277B4] hover:bg-[#dcecff] transition-colors leading-none"
                      >
                        -
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUsersStep(1)}
                        className="size-4 text-xs font-bold text-[#2277B4] dark:text-blue-400 hover:bg-[#dcecff] dark:hover:bg-dark-700 border-l border-[#b8cce6] dark:border-dark-600 transition-colors leading-none"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-light-text-secondary dark:text-zinc-400">
                Descripción
              </label>
              <textarea
                className="w-full bg-white dark:bg-dark-900 border border-light-border dark:border-dark-700 rounded-lg p-3 text-sm text-light-text-primary dark:text-zinc-100 outline-none focus:ring-1 focus:ring-[#125280] min-h-[100px] transition-colors"
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

          <div className="flex justify-end mt-6 pt-4">
            <button
              type="submit"
              className="px-8 py-2 justify-center bg-[#2277B4] hover:bg-[#125280] text-white rounded-xl shadow-lg shadow-[#2277B450]"
            >
              {formLabels.button}
            </button>
          </div>
        </div>
      </form>

      {/* Selector of origins */}
      <SourceSelectionModal
        isOpen={isSourceModalOpen}
        onClose={() => setIsSourceModalOpen(false)}
        selectedCategory={selectedCategory}
        onSelectSource={handleSourceSelection}
      />

      {/* Categories modal */}
      <CategoryManagerModal
        isOpen={isCategoriesModalOpen}
        onClose={() => setIsCategoriesModalOpen(false)}
        newCategoryName={newCategoryName}
        setNewCategoryName={setNewCategoryName}
        handleAddCategory={handleAddCategory}
        availableCategories={availableCategories}
        normalizeServicePolicyCategory={normalizeServicePolicyCategory}
        selectedCategory={selectedCategory}
        applyCategorySelection={applyCategorySelection}
        categoryPage={categoryPage}
        setCategoryPage={setCategoryPage}
      />

      {/* CONTPAQi Product Selector Modal */}
      <ProductSelectorModal
        isOpen={isContpaqiModalOpen}
        onClose={() => setIsContpaqiModalOpen(false)}
        onBack={() => {
          setIsContpaqiModalOpen(false);
          setIsSourceModalOpen(true);
        }}
        title="Productos de CONTPAQi"
        type="CONTPAQI"
        products={filteredContpaqiProducts}
        selectedCategory={selectedCategory}
        onSelectProduct={selectContpaqiProduct}
        productLogoMap={PRODUCT_LOGO_MAP}
        Icon={Package}
        onNewProductClick={() => {
          setIsContpaqiModalOpen(false);
          setNewProduct({
            name: "",
            category: selectedCategory,
            price: 0,
            users_count: 1,
            description: "",
            product_type: "CONTPAQI",
          });
          setCurrentMaxUsers(30);
          setActiveFormMode("CONTPAQI");
          triggerFormHighlight();
        }}
      />

      {/* Policies Selector Modal */}
      <ProductSelectorModal
        isOpen={isPoliciesModalOpen}
        onClose={() => setIsPoliciesModalOpen(false)}
        onBack={() => {
          setIsPoliciesModalOpen(false);
          setIsSourceModalOpen(true);
        }}
        title="Pólizas"
        type="POLICY"
        products={filteredPolicies}
        selectedCategory={selectedCategory}
        onSelectProduct={selectPolicy}
        Icon={Shield}
        onNewProductClick={() => {
          setIsPoliciesModalOpen(false);
          setNewProduct({
            name: "",
            category: selectedCategory,
            price: 0,
            users_count: 1,
            description: "",
            product_type: "POLICY",
          });
          setCurrentMaxUsers(1);
          setActiveFormMode("POLICY");
          triggerFormHighlight();
        }}
      />

      {/* General Products Selector Modal */}
      <ProductSelectorModal
        isOpen={isGeneralProductsModalOpen}
        onClose={() => setIsGeneralProductsModalOpen(false)}
        onBack={() => {
          setIsGeneralProductsModalOpen(false);
          setIsSourceModalOpen(true);
        }}
        title="Productos"
        type="PRODUCT"
        products={filteredGeneralProducts}
        selectedCategory={selectedCategory}
        onSelectProduct={selectGeneralProduct}
        Icon={ShoppingBag}
        onNewProductClick={() => {
          setIsGeneralProductsModalOpen(false);
          setNewProduct({
            name: "",
            category: selectedCategory,
            price: 0,
            users_count: 1,
            description: "",
            product_type: "PRODUCT",
          });
          setCurrentMaxUsers(30);
          setActiveFormMode("PRODUCT");
          triggerFormHighlight();
        }}
      />

      {/* Services Selector Modal */}
      <ProductSelectorModal
        isOpen={isServicesModalOpen}
        onClose={() => setIsServicesModalOpen(false)}
        onBack={() => {
          setIsServicesModalOpen(false);
          setIsSourceModalOpen(true);
        }}
        title="Servicios"
        type="SERVICE"
        products={filteredServices}
        selectedCategory={selectedCategory}
        onSelectProduct={selectService}
        Icon={Library}
        onNewProductClick={() => {
          setIsServicesModalOpen(false);
          setNewProduct({
            name: "",
            category: selectedCategory,
            price: 0,
            users_count: 1,
            description: "",
            product_type: "SERVICE",
          });
          setCurrentMaxUsers(1);
          setActiveFormMode("SERVICE");
          triggerFormHighlight();
        }}
      />
    </div>
  );
}
