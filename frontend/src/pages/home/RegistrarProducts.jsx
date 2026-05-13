import { useState, useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { Link, useSearchParams } from "react-router-dom";
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
import Input from "../../components/ui/Input";
import { createProductApi } from "../../actionsAPI/products.api";

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

const STORAGE_KEYS = {
  categories: "customProductCategories",
  contpaqiProducts: "customContpaqiProducts",
  services: "customRegisteredServices",
  policies: "customRegisteredPolicies",
  generalProducts: "customGeneralProducts",
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

function readStoredList(key, projector) {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.map(projector).filter(Boolean);
  } catch {
    return [];
  }
}

function categoryMatches(sourceCategory, selectedCategory) {
  const source = normalizeServicePolicyCategory(sourceCategory);
  const selected = normalizeServicePolicyCategory(selectedCategory);

  if (!selected) return true;
  if (!source) return false;

  // Permitir coincidencia exacta o coincidencia parcial (ej. "comercial" en "comercial y ventas")
  return source === selected || selected.includes(source) || source.includes(selected);
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
  const [newContpaqiProduct, setNewContpaqiProduct] = useState({
    name: "",
    category: "",
    price: 0,
    max_users: 30,
    description: "",
  });
  const [newService, setNewService] = useState({
    name: "",
    category: "",
    price: 0,
    description: "",
  });
  const [newPolicy, setNewPolicy] = useState({
    name: "",
    category: "",
    price: 0,
    description: "",
  });
  const [newGeneralProduct, setNewGeneralProduct] = useState({
    name: "",
    category: "",
    price: 0,
    max_users: 1,
    description: "",
  });

  const [customCategories, setCustomCategories] = useState(() => {
    return uniqueByNormalizedValue(
      readStoredList(STORAGE_KEYS.categories, (item) => {
        if (typeof item === "string") return item;
        if (item && typeof item === "object") return item.category;
        return "";
      }),
    );
  });

  const [customPolicies, setCustomPolicies] = useState(() => {
    return readStoredList(STORAGE_KEYS.policies, (item) => {
      const name = String(item.name || "").trim();
      const category = String(item.category || "").trim();
      
      if (!name || !category) return null;

      return {
        id: String(item.id || `${name}-${category}`),
        name,
        category,
        price: Math.max(0, Number(item.price) || 0),
        description: String(item.description || "").trim(),
      };
    });
  });

  const [customGeneralProducts, setCustomGeneralProducts] = useState(() => {
    return readStoredList(STORAGE_KEYS.generalProducts, (item) => {
      const name = String(item.name || "").trim();
      const category = String(item.category || "").trim();
      
      if (!name || !category) return null;

      return {
        id: String(item.id || `${name}-${category}`),
        name,
        category,
        price: Math.max(0, Number(item.price) || 0),
        description: String(item.description || "").trim(),
      };
    });
  });

  const [customContpaqiProducts, setCustomContpaqiProducts] = useState(() => {
    return readStoredList(STORAGE_KEYS.contpaqiProducts, (item) => {
      if (!item || typeof item !== "object") return null;

      const name = String(item.name || "").trim();
      const category = String(item.category || "").trim();
      if (!name || !category) return null;

      return {
        id: String(item.id || `${name}-${category}`),
        name,
        category,
        price: Math.max(0, Number(item.price) || 0),
        max_users: Math.max(1, parseInt(item.max_users, 10) || 30),
        description: String(item.description || "").trim(),
        isCustom: true,
      };
    });
  });

  const [customServices, setCustomServices] = useState(() => {
    return readStoredList(STORAGE_KEYS.services, (item) => {
      if (!item || typeof item !== "object") return null;

      const name = String(item.name || "").trim();
      const category = String(item.category || "").trim();
      if (!name || !category) return null;

      return {
        id: String(item.id || `${name}-${category}`),
        name,
        category,
        price: Math.max(0, Number(item.price) || 0),
        description: String(item.description || "").trim(),
      };
    });
  });

  const prevCustomCategoriesRef = useRef([]);

  useEffect(() => {
    prevCustomCategoriesRef.current = customCategories;
  }, [customCategories]);

  const loadCategoriesFromAPI = async () => {
    try {
      const { listProductsApi } = await import("../../actionsAPI/products.api");
      const apiProducts = await listProductsApi();
      const apiCategories = apiProducts.map(p => p.category);
      
      // Helper logic directly since inferProductType might not be imported
      const getType = (p) => {
        const source = `${p?.name || ""} ${p?.category || ""}`;
        const normalized = source
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase()
          .trim();
        
        if (normalized.includes("poliza")) return "POLICY";
        if (normalized.includes("servicio")) return "SERVICE";
        return "PRODUCT";
      };

      // Update customServices with API services
      const apiServices = apiProducts.filter(p => getType(p) === "SERVICE");
      if (apiServices.length > 0) {
        setCustomServices(prev => {
          const map = new Map();
          if (prev) prev.forEach(s => map.set(normalizeServicePolicyCategory(s.name), s));
          apiServices.forEach(apiService => {
            const nName = normalizeServicePolicyCategory(apiService.name);
            if (!map.has(nName)) {
              map.set(nName, {
                id: apiService.id || crypto.randomUUID(),
                name: apiService.name,
                category: apiService.category,
                price: parseFloat(apiService.current_price || apiService.price || 0),
                description: apiService.description || "",
              });
            }
          });
          return Array.from(map.values());
        });
      }

      // Update customPolicies with API policies
      const apiPolicies = apiProducts.filter(p => getType(p) === "POLICY");
      if (apiPolicies.length > 0) {
        setCustomPolicies(prev => {
          const map = new Map();
          if (prev) prev.forEach(s => map.set(normalizeServicePolicyCategory(s.name), s));
          apiPolicies.forEach(apiPolicy => {
            const nName = normalizeServicePolicyCategory(apiPolicy.name);
            if (!map.has(nName)) {
              map.set(nName, {
                id: apiPolicy.id || crypto.randomUUID(),
                name: apiPolicy.name,
                category: apiPolicy.category,
                price: parseFloat(apiPolicy.current_price || apiPolicy.price || 0),
                description: apiPolicy.description || "",
              });
            }
          });
          return Array.from(map.values());
        });
      }

      // Update customGeneralProducts with API general products
      const apiGeneralProducts = apiProducts.filter(p => {
        const type = getType(p);
        if (type === "SERVICE" || type === "POLICY") return false;
        if (p.name?.toUpperCase().includes("CONTPAQI")) return false;
        return true;
      });
      if (apiGeneralProducts.length > 0) {
        setCustomGeneralProducts(prev => {
          const map = new Map();
          if (prev) prev.forEach(s => map.set(normalizeServicePolicyCategory(s.name), s));
          apiGeneralProducts.forEach(apiProduct => {
            const nName = normalizeServicePolicyCategory(apiProduct.name);
            if (!map.has(nName)) {
              map.set(nName, {
                id: apiProduct.id || crypto.randomUUID(),
                name: apiProduct.name,
                category: apiProduct.category,
                price: parseFloat(apiProduct.current_price || apiProduct.price || 0),
                description: apiProduct.description || "",
              });
            }
          });
          return Array.from(map.values());
        });
      }
      
      const localCategories = readStoredList(STORAGE_KEYS.categories, (item) => {
        if (typeof item === "string") return item;
        if (item && typeof item === "object") return item.category;
        return "";
      });

      const allCategories = uniqueByNormalizedValue([...apiCategories, ...localCategories, ...prevCustomCategoriesRef.current]);
      setCustomCategories(allCategories);
      setCustomCategories(prev => {
        return uniqueByNormalizedValue([...prev, ...allCategories]);
      });
    } catch (e) {
      console.error("Failed to load categories from API", e);
    }
  };

  useEffect(() => {
    loadCategoriesFromAPI();
  }, []);

  const selectedCategory = String(newProduct.category || "").trim();

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
    [builtInCategories, customCategories],
  );

  const totalCategoryPages = Math.max(
    1,
    Math.ceil(availableCategories.length / CATEGORY_CHIPS_PAGE_SIZE),
  );
  const safeCategoryPage = Math.min(categoryPage, totalCategoryPages);

  const visibleCategories = useMemo(() => {
    const start = (safeCategoryPage - 1) * CATEGORY_CHIPS_PAGE_SIZE;
    return availableCategories.slice(start, start + CATEGORY_CHIPS_PAGE_SIZE);
  }, [availableCategories, safeCategoryPage]);

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
          isCustom: false,
        })),
      ),
    [],
  );

  const filteredContpaqiProducts = useMemo(() => {
    const allProducts = [...builtInProducts, ...customContpaqiProducts];
    return allProducts.filter((item) =>
      categoryMatches(item.category, selectedCategory),
    );
  }, [builtInProducts, customContpaqiProducts, selectedCategory]);

  const filteredServices = useMemo(
    () =>
      customServices.filter((service) =>
        categoryMatches(service.category, selectedCategory),
      ),
    [customServices, selectedCategory],
  );

  const filteredPolicies = useMemo(
    () =>
      customPolicies.filter((policy) =>
        categoryMatches(policy.category, selectedCategory),
      ),
    [customPolicies, selectedCategory],
  );

  const filteredGeneralProducts = useMemo(
    () =>
      customGeneralProducts.filter((product) =>
        categoryMatches(product.category, selectedCategory),
      ),
    [customGeneralProducts, selectedCategory],
  );

  const isServiceMode = useMemo(() => {
    if (activeFormMode === "SERVICE" || activeFormMode === "POLICY") return true;
    if (activeFormMode === "PRODUCT" || activeFormMode === "CONTPAQI") return false;
    
    const normalizedCategory = normalizeServicePolicyCategory(
      newProduct.category,
    );
    return (
      selectedSourceType === "SERVICE" ||
      normalizedCategory.includes("servicio") ||
      normalizedCategory.includes("poliza")
    );
  }, [selectedSourceType, newProduct.category, activeFormMode]);

  const formLabels = useMemo(() => {
    if (activeFormMode === "POLICY") return { nameLabel: "NOMBRE DE LA PÓLIZA", button: "Registrar Póliza" };
    if (activeFormMode === "SERVICE") return { nameLabel: "NOMBRE DEL SERVICIO", button: "Registrar Servicio" };
    if (activeFormMode === "CONTPAQI") return { nameLabel: "NOMBRE DEL PRODUCTO", button: "Registrar Producto" };
    if (activeFormMode === "PRODUCT") return { nameLabel: "NOMBRE DEL PRODUCTO", button: "Registrar Producto" };
    
    if (isServiceMode) {
      const normalizedCategory = normalizeServicePolicyCategory(newProduct.category);
      if (normalizedCategory.includes("poliza")) return { nameLabel: "NOMBRE DE LA PÓLIZA", button: "Registrar Póliza" };
      return { nameLabel: "NOMBRE DEL SERVICIO", button: "Registrar Servicio" };
    }
    return { nameLabel: "NOMBRE DEL PRODUCTO", button: "Registrar Producto" };
  }, [activeFormMode, isServiceMode, newProduct.category]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(
      STORAGE_KEYS.categories,
      JSON.stringify(uniqueByNormalizedValue(customCategories)),
    );
  }, [customCategories]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(
      STORAGE_KEYS.contpaqiProducts,
      JSON.stringify(customContpaqiProducts),
    );
  }, [customContpaqiProducts]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(
      STORAGE_KEYS.services,
      JSON.stringify(customServices),
    );
  }, [customServices]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(
      STORAGE_KEYS.policies,
      JSON.stringify(customPolicies),
    );
  }, [customPolicies]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(
      STORAGE_KEYS.generalProducts,
      JSON.stringify(customGeneralProducts),
    );
  }, [customGeneralProducts]);

  useEffect(() => {
    setNewContpaqiProduct((prev) => ({
      ...prev,
      category: selectedCategory || prev.category,
    }));
    setNewService((prev) => ({
      ...prev,
      category: selectedCategory || prev.category,
    }));
    setNewPolicy((prev) => ({
      ...prev,
      category: selectedCategory || prev.category,
    }));
    setNewGeneralProduct((prev) => ({
      ...prev,
      category: selectedCategory || prev.category,
    }));
  }, [selectedCategory]);

  useEffect(() => {
    setCategoryPage((prev) => Math.min(prev, totalCategoryPages));
  }, [totalCategoryPages]);

  useEffect(() => {
    if (!isCategoriesModalOpen) return;
    setCategoryPage(1);
  }, [isCategoriesModalOpen]);

  const openSourceModal = () => {
    if (!selectedCategory) {
      Swal.fire({
        title: "Selecciona una categoría",
        text: "Primero registra o elige una categoría para filtrar productos y servicios.",
        icon: "info",
        confirmButtonColor: "#2277B4",
      });
      return;
    }

    setIsSourceModalOpen(true);
  };

  const selectContpaqiProduct = (item) => {
    setNewProduct((prev) => ({
      ...prev,
      name: item.name,
      category: item.category || prev.category,
      price: Math.max(0, Number(item.price) || 0),
      users_count: 1,
      description: item.description || "",
    }));
    setCurrentMaxUsers(Math.max(1, Number(item.max_users) || 30));
    setSelectedSourceType("PRODUCT");
    setIsSourceModalOpen(false);
    setIsContpaqiModalOpen(false);
    setIsNewContpaqiModalOpen(false);
  };

  const selectService = (service) => {
    setNewProduct((prev) => ({
      ...prev,
      name: service.name,
      category: service.category || prev.category,
      price: Math.max(0, Number(service.price) || 0),
      users_count: 1,
      description: service.description || "",
    }));
    setCurrentMaxUsers(1);
    setSelectedSourceType("SERVICE");
    setIsSourceModalOpen(false);
    setIsServicesModalOpen(false);
    setIsNewServiceModalOpen(false);
  };

  const selectPolicy = (policy) => {
    setNewProduct((prev) => ({
      ...prev,
      name: policy.name,
      category: policy.category || prev.category,
      price: Math.max(0, Number(policy.price) || 0),
      users_count: 1,
      description: policy.description || "",
    }));
    setCurrentMaxUsers(1);
    setSelectedSourceType("SERVICE");
    setIsSourceModalOpen(false);
    setIsPoliciesModalOpen(false);
  };

  const selectGeneralProduct = (product) => {
    setNewProduct((prev) => ({
      ...prev,
      name: product.name,
      category: product.category || prev.category,
      price: Math.max(0, Number(product.price) || 0),
      users_count: 1,
      description: product.description || "",
    }));
    setCurrentMaxUsers(product.max_users || 1);
    setSelectedSourceType("PRODUCT");
    setIsSourceModalOpen(false);
    setIsGeneralProductsModalOpen(false);
  };

  const destroyCategory = (category) => {
    const isEditing = normalizeServicePolicyCategory(category) === normalizeServicePolicyCategory(selectedCategory);
    setCustomCategories((prev) => prev.filter((c) => normalizeServicePolicyCategory(c) !== normalizeServicePolicyCategory(category)));
    if (isEditing) {
      applyCategorySelection("");
    }
  };

    const applyCategorySelection = (category) => {
      const nextCategory = sanitizeCategoryLabel(category);
      if (!nextCategory) return;
  
      const isSameCategory =
        normalizeServicePolicyCategory(nextCategory) ===
        normalizeServicePolicyCategory(selectedCategory);
  
      if (isSameCategory) return;
  
      setNewProduct({
        name: "",
        category: nextCategory,
        price: 0,
        users_count: 1,
        description: "",
      });
      setCurrentMaxUsers(30);
      setActiveFormMode(null);
    };

  const handleAddCategory = () => {
    const nextCategory = sanitizeCategoryLabel(newCategoryName);
    if (!nextCategory) return;
    
    const normalizedNewCategoryName = normalizeServicePolicyCategory(newCategoryName);
    const isDuplicateCategory =
      !!normalizedNewCategoryName &&
      availableCategories.some(
        (category) =>
          normalizeServicePolicyCategory(category) === normalizedNewCategoryName,
      );

    if (isDuplicateCategory) {
      Swal.fire({
        title: "Categoría duplicada",
        text: "Ya existe una categoría registrada con ese nombre.",
        icon: "warning",
        confirmButtonColor: "#2277B4",
      });
      return;
    }

    setCustomCategories((prev) =>
      uniqueByNormalizedValue([nextCategory, ...prev]),
    );
    applyCategorySelection(nextCategory);
    setNewCategoryName("");
    setIsCategoriesModalOpen(false);
  };

  const handleCreateCustomContpaqiProduct = (e) => {
    e.preventDefault();

    const name = String(newContpaqiProduct.name || "").trim();
    const category = String(
      newContpaqiProduct.category || selectedCategory || "",
    ).trim();
    const price = Math.max(0, Number(newContpaqiProduct.price) || 0);
    const maxUsers = Math.max(
      1,
      parseInt(newContpaqiProduct.max_users, 10) || 30,
    );
    const description = String(newContpaqiProduct.description || "").trim();

    if (!name || !category) {
      Swal.fire({
        title: "Falta información",
        text: "Debes capturar nombre y categoría.",
        icon: "warning",
        confirmButtonColor: "#2277B4",
      });
      return;
    }

    const nextItem = {
      id: `custom-${Date.now()}`,
      name,
      category,
      price,
      max_users: maxUsers,
      description,
      isCustom: true,
    };

    setCustomContpaqiProducts((prev) => {
      const normalizedName = normalizeServicePolicyCategory(name);
      const normalizedCategory = normalizeServicePolicyCategory(category);
      const filtered = prev.filter((item) => {
        return !(
          normalizeServicePolicyCategory(item.name) === normalizedName &&
          normalizeServicePolicyCategory(item.category) === normalizedCategory
        );
      });
      return [nextItem, ...filtered];
    });

    setCustomCategories((prev) => uniqueByNormalizedValue([category, ...prev]));
    setNewContpaqiProduct({
      name: "",
      category,
      price: 0,
      max_users: 30,
      description: "",
    });
    selectContpaqiProduct(nextItem);
  };

  const handleCreateService = (e) => {
    e.preventDefault();

    const name = String(newService.name || "").trim();
    const category = String(
      newService.category || selectedCategory || "",
    ).trim();
    const price = Math.max(0, Number(newService.price) || 0);
    const description = String(newService.description || "").trim();

    if (!name || !category) {
      Swal.fire({
        title: "Falta información",
        text: "Debes capturar nombre y categoría del servicio.",
        icon: "warning",
        confirmButtonColor: "#2277B4",
      });
      return;
    }

    const nextService = {
      id: `service-${Date.now()}`,
      name,
      category,
      price,
      description,
    };

    setCustomServices((prev) => {
      const normalizedName = normalizeServicePolicyCategory(name);
      const normalizedCategory = normalizeServicePolicyCategory(category);
      const filtered = prev.filter((item) => {
        return !(
          normalizeServicePolicyCategory(item.name) === normalizedName &&
          normalizeServicePolicyCategory(item.category) === normalizedCategory
        );
      });

      return [nextService, ...filtered];
    });

    setCustomCategories((prev) => uniqueByNormalizedValue([category, ...prev]));
    setNewService({
      name: "",
      category,
      price: 0,
      description: "",
    });
    selectService(nextService);
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
      const safeName = String(newProduct.name || "").trim();
      const safeCategory = String(newProduct.category || "").trim();

      if (!safeName || !safeCategory) {
        Swal.fire({
          title: "Falta información",
          text: "Debes capturar nombre y categoría.",
          icon: "warning",
          confirmButtonColor: "#2277B4",
        });
        return;
      }

      const getType = (p) => {
        const source = `${p?.name || ""} ${p?.category || ""}`;
        const normalized = source
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase()
          .trim();
        
        if (normalized.includes("poliza")) return "POLICY";
        if (normalized.includes("servicio")) return "SERVICE";
        return "PRODUCT";
      };

      // Determine type: prefer explicit form mode, fallback to name/category detection
      let productType;
      if (activeFormMode === "SERVICE") productType = "SERVICE";
      else if (activeFormMode === "POLICY") productType = "POLICY";
      else productType = getType({ name: safeName, category: safeCategory });

      const payload = {
        ...newProduct,
        name: safeName,
        category: safeCategory,
        price: parseFloat(newProduct.price) || 0,
        users_count:
          isServiceMode ? 1 : parseInt(newProduct.users_count, 10) || 1,
        client_id: fixedClientId || null,
        product_type: productType,
      };

      const createdProduct = await createProductApi(payload);

      const nextItem = {
        id: String(createdProduct?.id || `custom-${Date.now()}`),
        name: safeName,
        category: safeCategory,
        price: payload.price,
        max_users: Math.max(1, parseInt(payload.users_count, 10) || 1),
        description: String(payload.description || "").trim(),
        isCustom: true,
      };

      const normalizeObj = (item) => {
        const nN = normalizeServicePolicyCategory(item.name);
        const nC = normalizeServicePolicyCategory(item.category);
        return { nN, nC };
      };

      const nName = normalizeServicePolicyCategory(safeName);
      const nCat = normalizeServicePolicyCategory(safeCategory);

      if (productType === "SERVICE") {
        setCustomServices((prev) => {
          const filtered = prev.filter(item => {
            const { nN, nC } = normalizeObj(item);
            return !(nN === nName && nC === nCat);
          });
          return [nextItem, ...filtered];
        });
      } else if (productType === "POLICY") {
        setCustomPolicies((prev) => {
          const filtered = prev.filter(item => {
            const { nN, nC } = normalizeObj(item);
            return !(nN === nName && nC === nCat);
          });
          return [nextItem, ...filtered];
        });
      } else {
        if (safeName.toUpperCase().includes("CONTPAQI")) {
          setCustomContpaqiProducts((prev) => {
            const filtered = prev.filter(item => {
              const { nN, nC } = normalizeObj(item);
              return !(nN === nName && nC === nCat);
            });
            return [nextItem, ...filtered];
          });
        } else {
          setCustomGeneralProducts((prev) => {
            const filtered = prev.filter(item => {
              const { nN, nC } = normalizeObj(item);
              return !(nN === nName && nC === nCat);
            });
            return [nextItem, ...filtered];
          });
        }
      }

      setCustomCategories((prev) =>
        uniqueByNormalizedValue([safeCategory, ...prev]),
      );

      setNewProduct({
        name: "",
        category: safeCategory,
        price: 0,
        users_count: 1,
        description: "",
      });
      setCurrentMaxUsers(30);
      setSelectedSourceType("PRODUCT");
      setActiveFormMode(null);

      const typeLabels = { SERVICE: "Servicio", POLICY: "Póliza", PRODUCT: "Producto" };
      const typeLabel = typeLabels[productType] || "Producto";
      const dualTable = productType === "SERVICE" || productType === "POLICY";

      await Swal.fire({
        title: "¡Éxito!",
        text: dualTable
          ? `${typeLabel} registrado en Productos y en Historial de Servicios y Pólizas.`
          : `${typeLabel} registrado correctamente.`,
        icon: "success",
        confirmButtonColor: "#2277B4",
        timer: 2800,
        timerProgressBar: true,
        showConfirmButton: false,
        allowOutsideClick: false,
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
          <h1 className="text-3xl font-semibold text-zinc-800 tracking-tight">
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
            onClick={() => setIsCategoriesModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[#2277B4]/25 bg-[#2277B4]/5 text-[#2277B4] text-sm font-semibold hover:bg-[#2277B4]/10 transition-colors mb-4">
            <Plus size={16} /> Gestionar categorías
          </button>

          <div className="mb-6">
            <div className="relative">
              <div
                className="w-full pl-4 pr-10 py-3 rounded-xl bg-white text-[#2277B4] border border-zinc-200 outline-none transition-all cursor-pointer hover:bg-zinc-50 flex justify-between items-center"
                onClick={openSourceModal}>
                <span className="truncate pr-3">
                  {newProduct.name ?
                    `${newProduct.name} (${isServiceMode ? "Servicio" : "Producto"})`
                  : "-- Seleccionar o agregar productos o servicios --"}
                </span>
                <ChevronDown size={16} className="text-light-text-secondary" />
              </div>
            </div>
            <div className="mt-2 text-xs text-zinc-500">
              {selectedCategory ?
                ``
              : "Primero selecciona o registra una categoría para abrir el selector."
              }
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label={formLabels.nameLabel}
                placeholder={
                  isServiceMode ?
                    "Ej. Renovación anual"
                  : activeFormMode === "CONTPAQI" ? "Ej. CONTPAQi Contabilidad 2024" 
                  : "Ej. Contabilidad 2024"
                }
                value={newProduct.name}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, name: e.target.value })
                }
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
                  className="w-full rounded-xl px-4 py-3 text-sm bg-white text-light-text-primary focus:ring-2 focus:ring-[#153465] focus:outline-none border border-zinc-300 disabled:bg-zinc-100 disabled:text-zinc-500 disabled:border-zinc-200 disabled:cursor-not-allowed"
                  required
                />
              </div>
            </div>

            <div
              className={`grid ${isServiceMode ? "grid-cols-1" : "grid-cols-2"} gap-4`}>
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
                    className="w-full rounded-xl pl-4 pr-16 py-3 text-sm bg-white text-light-text-primary focus:ring-2 focus:ring-[#153465] focus:outline-none border border-zinc-300"
                    required
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex overflow-hidden rounded-md border border-[#b8cce6] shadow-sm bg-[#e8f2ff]">
                    <button
                      type="button"
                      onClick={() => handlePriceStep(-1)}
                      className="size-4 text-xs font-bold text-[#2277B4] hover:bg-[#dcecff] transition-colors leading-none">
                      -
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePriceStep(1)}
                      className="size-4 text-xs font-bold text-[#2277B4] hover:bg-[#dcecff] border-l border-[#b8cce6] transition-colors leading-none">
                      +
                    </button>
                  </div>
                </div>
                {Number(newProduct.price) > 0 && (
                  <div className="text-[10px] text-black mt-1 font-mono text-right">
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
                      className="w-full rounded-xl pl-4 pr-16 py-3 text-sm bg-white text-light-text-primary focus:ring-2 focus:ring-[#153465] focus:outline-none border border-zinc-300"
                      required
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex overflow-hidden rounded-md border border-[#b8cce6] shadow-sm bg-[#e8f2ff]">
                      <button
                        type="button"
                        onClick={() => handleUsersStep(-1)}
                        className="size-4 text-xs font-bold text-[#2277B4] hover:bg-[#dcecff] transition-colors leading-none">
                        -
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUsersStep(1)}
                        className="size-4 text-xs font-bold text-[#2277B4] hover:bg-[#dcecff] border-l border-[#b8cce6] transition-colors leading-none">
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
                className="w-full bg-white border border-light-border rounded-lg p-3 text-sm text-light-text-primary outline-none focus:ring-1 focus:ring-[#125280] min-h-[100px]"
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

          <div className="flex justify-end mt-6 pt-4 border-t border-light-border dark:border-white/5">
            <button
              type="submit"
              className="px-8 py-2 justify-center bg-[#2277B4] hover:bg-[#125280] text-white rounded-xl shadow-lg shadow-[#2277B450]">
              {formLabels.button}
            </button>
          </div>
        </div>
      </form>

      {/* Modal selector de origen */}
      {isSourceModalOpen &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-500/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-fade-in relative">
              <div className="p-4 rounded-t-2xl border-b border-[#24395f] bg-[#1a2b4c] flex items-center justify-between">
                <h2 className="font-semibold text-white text-lg">
                  Productos y Servicios
                </h2>
                <button
                  onClick={() => setIsSourceModalOpen(false)}
                  className="text-white/80 hover:text-white transition-colors p-1">
                  <X size={20} />
                </button>
              </div>

              <div className="p-4 space-y-4">
                <div className="text-xs text-zinc-500 bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2">
                  Categoría activa: <strong>{selectedCategory}</strong>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setIsSourceModalOpen(false);
                    setIsContpaqiModalOpen(true);
                  }}
                  className="w-full text-left px-4 py-3 rounded-xl border border-blue-200 bg-blue-50/50 hover:bg-blue-50 text-[#125280] font-semibold transition-all flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <div className="size-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                      <Package size={18} />
                    </div>
                    Productos de CONTPAQI
                  </div>
                  <ChevronDown
                    size={16}
                    className="-rotate-90 text-blue-400 group-hover:text-blue-600"
                  />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsSourceModalOpen(false);
                    setIsPoliciesModalOpen(true);
                  }}
                  className="w-full text-left px-4 py-3 rounded-xl border border-blue-200 bg-blue-50/50 hover:bg-blue-50 text-[#125280] font-semibold transition-all flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <div className="size-8 rounded-lg bg-blue-100 flex items-center justify-center text-purple-600">
                      <Shield size={18} />
                    </div>
                    Pólizas
                  </div>
                  <ChevronDown
                    size={16}
                    className="-rotate-90 text-blue-400 group-hover:text-blue-600"
                  />
                </button>

                 <button
                  type="button"
                  onClick={() => {
                    setIsSourceModalOpen(false);
                    setIsGeneralProductsModalOpen(true);
                  }}
                  className="w-full text-left px-4 py-3 rounded-xl border border-blue-200 bg-blue-50/50 hover:bg-blue-50 text-[#125280] font-semibold transition-all flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <div className="size-8 rounded-lg bg-blue-100 flex items-center justify-center text-emerald-600">
                      <ShoppingBag size={18} />
                    </div>
                    Productos
                  </div>
                  <ChevronDown
                    size={16}
                    className="-rotate-90 text-blue-400 group-hover:text-blue-600"
                  />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsSourceModalOpen(false);
                    setIsServicesModalOpen(true);
                  }}
                  className="w-full py-3 px-4 rounded-xl border-2 border-dashed border-[#125280]/35 text-[#125280] font-semibold hover:border-[#125280] hover:text-[#125280] hover:bg-blue-50 transition-all flex items-center justify-center gap-2">
                  <Library size={18} /> Servicios
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* Modal de categorías */}
      {isCategoriesModalOpen &&
        createPortal(
          <div className="fixed inset-0 z-[105] flex items-center justify-center p-4 bg-zinc-500/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-fade-in relative">
              <div className="p-4 rounded-t-2xl border-b border-[#24395f] bg-[#1a2b4c] flex items-center justify-between">
                <h2 className="font-semibold text-white text-lg">Categorías</h2>
                <button
                  onClick={() => setIsCategoriesModalOpen(false)}
                  className="text-white/80 hover:text-white transition-colors p-1">
                  <X size={20} />
                </button>
              </div>

              <div className="p-5 space-y-4">
                <div className="flex gap-2">
                  <input
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="Ej. Contabilidad"
                    className="flex-1 rounded-xl px-4 py-3 text-sm bg-white text-light-text-primary focus:ring-2 focus:ring-[#153465] focus:outline-none border border-zinc-300"
                  />
                  <button
                    type="button"
                    onClick={handleAddCategory}
                    disabled={
                      !normalizeServicePolicyCategory(newCategoryName) ||
                      availableCategories.some(
                        (c) =>
                          normalizeServicePolicyCategory(c) ===
                          normalizeServicePolicyCategory(newCategoryName),
                      )
                    }
                    className="px-4 py-2 rounded-lg bg-[#2277B4] text-white text-sm font-semibold hover:bg-[#125280] transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#2277B4]">
                    Agregar
                  </button>
                </div>
                <div className="h-5 overflow-hidden" aria-live="polite">
                  {!!normalizeServicePolicyCategory(newCategoryName) &&
                    availableCategories.some(
                      (c) =>
                        normalizeServicePolicyCategory(c) ===
                        normalizeServicePolicyCategory(newCategoryName),
                    ) && (
                      <p className="text-xs font-medium text-red-500">
                        Ya existe una categoría con ese nombre.
                      </p>
                    )}
                </div>

                <div>
                  <h3 className="text-xs font-semibold text-zinc-400 uppercase mb-3">
                    Categorías
                  </h3>
                  {availableCategories.length === 0 ?
                    <p className="text-sm text-zinc-500">
                      Aún no hay categorías registradas.
                    </p>
                  : <div className="min-h-[190px] flex flex-col">
                      <div className="flex flex-wrap content-start gap-2 h-[138px] overflow-hidden pr-1">
                        {visibleCategories.map((category) => (
                          <button
                            key={category}
                            type="button"
                            onClick={() => {
                              applyCategorySelection(category);
                              setIsCategoriesModalOpen(false);
                            }}
                            className={`px-3 py-1.5 rounded-full border text-xs font-semibold transition-colors ${
                              (
                                normalizeServicePolicyCategory(category) ===
                                normalizeServicePolicyCategory(selectedCategory)
                              ) ?
                                "border-[#2277B4] bg-[#2277B4]/10 text-[#2277B4]"
                              : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50"
                            }`}>
                            {category}
                          </button>
                        ))}
                      </div>

                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-xs text-zinc-500">
                          Página {safeCategoryPage} de {totalCategoryPages}
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              setCategoryPage((prev) => Math.max(1, prev - 1))
                            }
                            disabled={safeCategoryPage === 1}
                            className="px-3 py-1.5 rounded-md border border-zinc-200 text-xs font-semibold text-zinc-600 hover:bg-zinc-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                            Anterior
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setCategoryPage((prev) =>
                                Math.min(totalCategoryPages, prev + 1),
                              )
                            }
                            disabled={safeCategoryPage === totalCategoryPages}
                            className="px-3 py-1.5 rounded-md border border-zinc-200 text-xs font-semibold text-zinc-600 hover:bg-zinc-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                            Siguiente
                          </button>
                        </div>
                      </div>
                    </div>
                  }
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* Contpaqi Categories Modal */}
      {isContpaqiModalOpen &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-500/50 backdrop-blur-sm">
            <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl animate-fade-in flex flex-col max-h-[85vh] overflow-hidden">
              <div className="p-4 border-b border-[#24395f] bg-[#1a2b4c] flex items-center gap-3">
                <button
                  onClick={() => {
                    setIsContpaqiModalOpen(false);
                    setIsSourceModalOpen(true);
                  }}
                  className="text-white/80 hover:text-white transition-colors p-2 bg-white/10 hover:bg-white/20 rounded-full">
                  <ArrowLeft size={20} />
                </button>
                <h2 className="font-semibold text-white text-xl flex items-center gap-2">
                  <Package className="text-blue-300" size={24} /> Productos de
                  CONTPAQi
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    setIsContpaqiModalOpen(false);
                    setNewProduct({
                      name: "",
                      category: selectedCategory,
                      price: 0,
                      users_count: 1,
                      description: "",
                    });
                    setCurrentMaxUsers(30);
                    setActiveFormMode("CONTPAQI");
                  }}
                  className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2277B4] hover:bg-[#125280] text-white text-xs font-semibold transition-colors">
                  <Plus size={14} /> Nuevo producto
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-8 bg-[#f8fafc]">
                <div className="space-y-3">
                  {filteredContpaqiProducts.length === 0 && (
                    <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-5 text-sm text-zinc-500 text-center">
                      No hay productos para la categoría{" "}
                      <strong>{selectedCategory}</strong>. <br /> Usa el botón{" "}
                      <strong>Nuevo producto</strong>.
                    </div>
                  )}

                  {filteredContpaqiProducts.map((item) => {
                    const ProductLogo = PRODUCT_LOGO_MAP[item.name] || Package;

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => selectContpaqiProduct(item)}
                        className="w-full text-left p-5 rounded-2xl border border-zinc-200 bg-white hover:border-blue-300 hover:shadow-md transition-all group">
                        <div className="flex justify-between items-start gap-4 mb-1.5">
                          <div className="flex items-start gap-3 min-w-0">
                            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-zinc-200 bg-zinc-50 text-zinc-400 group-hover:border-blue-200 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
                              <ProductLogo size={13} />
                            </span>
                            <div className="font-bold text-lg text-[#1e293b] group-hover:text-blue-600 min-w-0 truncate">
                              {item.name}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {item.isCustom && (
                              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                Nuevo
                              </span>
                            )}
                            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-500/70 bg-blue-50/50 px-2 py-0.5 rounded-md border border-blue-100/50">
                              {item.category}
                            </span>
                          </div>
                        </div>

                        {item.description && (
                          <div className="text-sm text-zinc-500 leading-relaxed line-clamp-2">
                            {item.description}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* Modal General Products */}
      {isGeneralProductsModalOpen &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-500/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl animate-fade-in overflow-hidden">
              <div className="p-4 border-b border-[#24395f] bg-[#1a2b4c] flex items-center gap-3">
                <button
                  onClick={() => {
                    setIsGeneralProductsModalOpen(false);
                    setIsSourceModalOpen(true);
                  }}
                  className="text-white/80 hover:text-white transition-colors p-2 bg-white/10 hover:bg-white/20 rounded-full">
                  <ArrowLeft size={20} />
                </button>
                <h2 className="font-semibold text-white text-lg">Productos</h2>
                <button
                  type="button"
                  onClick={() => {
                    setIsGeneralProductsModalOpen(false);
                    setNewProduct({
                      name: "",
                      category: selectedCategory,
                      price: 0,
                      users_count: 1,
                      description: "",
                    });
                    setCurrentMaxUsers(30);
                    setActiveFormMode("PRODUCT");
                  }}
                  className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2277B4] hover:bg-[#125280] text-white text-xs font-semibold transition-colors">
                  <Plus size={14} /> Nuevo producto
                </button>
              </div>

              <div className="p-5 space-y-4 max-h-[72vh] overflow-y-auto">
                <div className="space-y-2">
                  {filteredGeneralProducts.length === 0 && (
                    <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-4 text-sm text-zinc-500 text-center">
                      No hay productos para la categoría{" "}
                      <strong>{selectedCategory}</strong>.
                    </div>
                  )}

                  {filteredGeneralProducts.map((product) => (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => selectGeneralProduct(product)}
                      className="w-full text-left p-4 rounded-xl border border-emerald-200 bg-white hover:bg-emerald-50 transition-colors">
                      <div className="font-semibold text-zinc-800 truncate">
                        {product.name}
                      </div>
                      <div className="text-[11px] text-zinc-500 uppercase tracking-wide mt-1 truncate">
                        {product.category}
                      </div>
                      {product.description && (
                        <div className="text-xs text-zinc-400 mt-2 line-clamp-2">
                          {product.description}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* Modal Policies */}
      {isPoliciesModalOpen &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-500/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl animate-fade-in overflow-hidden">
              <div className="p-4 border-b border-[#24395f] bg-[#1a2b4c] flex items-center gap-3">
                <button
                  onClick={() => {
                    setIsPoliciesModalOpen(false);
                    setIsSourceModalOpen(true);
                  }}
                  className="text-white/80 hover:text-white transition-colors p-2 bg-white/10 hover:bg-white/20 rounded-full">
                  <ArrowLeft size={20} />
                </button>
                <h2 className="font-semibold text-white text-lg">Pólizas</h2>
                <button
                  type="button"
                  onClick={() => {
                    setIsPoliciesModalOpen(false);
                    setNewProduct({
                      name: "",
                      category: selectedCategory,
                      price: 0,
                      users_count: 1,
                      description: "",
                    });
                    setCurrentMaxUsers(1);
                    setActiveFormMode("POLICY");
                  }}
                  className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2277B4] hover:bg-[#125280] text-white text-xs font-semibold transition-colors">
                  <Plus size={14} /> Nueva póliza
                </button>
              </div>

              <div className="p-5 space-y-4 max-h-[72vh] overflow-y-auto">
                <div className="space-y-2">
                  {filteredPolicies.length === 0 && (
                    <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-4 text-sm text-zinc-500 text-center">
                      No hay pólizas para la categoría{" "}
                      <strong>{selectedCategory}</strong>.
                    </div>
                  )}

                  {filteredPolicies.map((policy) => (
                    <button
                      key={policy.id}
                      type="button"
                      onClick={() => selectPolicy(policy)}
                      className="w-full text-left p-4 rounded-xl border border-purple-200 bg-white hover:bg-purple-50 transition-colors">
                      <div className="font-semibold text-zinc-800 truncate">
                        {policy.name}
                      </div>
                      <div className="text-[11px] text-zinc-500 uppercase tracking-wide mt-1 truncate">
                        {policy.category}
                      </div>
                      {policy.description && (
                        <div className="text-xs text-zinc-400 mt-2 line-clamp-2">
                          {policy.description}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}



      {/* Modal de servicios propios */}
      {isServicesModalOpen &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-500/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl animate-fade-in overflow-hidden">
              <div className="p-4 border-b border-[#24395f] bg-[#1a2b4c] flex items-center gap-3">
                <button
                  onClick={() => {
                    setIsServicesModalOpen(false);
                    setIsSourceModalOpen(true);
                  }}
                  className="text-white/80 hover:text-white transition-colors p-2 bg-white/10 hover:bg-white/20 rounded-full">
                  <ArrowLeft size={20} />
                </button>
                <h2 className="font-semibold text-white text-lg">Servicios</h2>
                <button
                  type="button"
                  onClick={() => {
                    setIsServicesModalOpen(false);
                    setNewProduct({
                      name: "",
                      category: selectedCategory,
                      price: 0,
                      users_count: 1,
                      description: "",
                    });
                    setCurrentMaxUsers(1);
                    setActiveFormMode("SERVICE");
                  }}
                  className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2277B4] hover:bg-[#125280] text-white text-xs font-semibold transition-colors">
                  <Plus size={14} /> Nuevo servicio
                </button>
              </div>

              <div className="p-5 space-y-4 max-h-[72vh] overflow-y-auto">
                <div className="space-y-2">
                  {filteredServices.length === 0 && (
                    <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-4 text-sm text-zinc-500 text-center">
                      No hay servicios para la categoría{" "}
                      <strong>{selectedCategory}</strong>. <br /> Usa el botón
                      <strong> Nuevo servicio</strong>.
                    </div>
                  )}

                  {filteredServices.map((service) => (
                    <button
                      key={service.id}
                      type="button"
                      onClick={() => selectService(service)}
                      className="w-full text-left p-4 rounded-xl border border-[#B58DE0]/45 bg-white hover:bg-[#B58DE0]/5 transition-colors">
                      <div className="font-semibold text-zinc-800 truncate">
                        {service.name}
                      </div>
                      <div className="text-[11px] text-zinc-500 uppercase tracking-wide mt-1 truncate">
                        {service.category}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}

    </div>
  );
}
