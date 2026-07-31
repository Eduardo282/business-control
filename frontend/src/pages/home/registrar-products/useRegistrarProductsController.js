import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  assignCategoryTypeApi,
  createCategoryApi,
  createProductApi,
} from "../../../actionsAPI/products.api";
import { usePersistedFormDraft } from "../../../hooks/usePersistedFormDraft";
import { notificationService } from "../../../services/notificationService";
import {
  CATEGORY_CHIPS_PAGE_SIZE,
  EMPTY_PRODUCT,
  buildProductSuccessMessage,
  categoryMatches,
  getCategoryTypeKey,
  getFormLabels,
  getProductTypeLabel,
  inferProductType,
  isServiceProductMode,
  normalizeCatalogProductType,
  normalizeServicePolicyCategory,
  sanitizeCategoryLabel,
} from "./productHelpers";
import useProductCatalog from "./useProductCatalog";

export default function useRegistrarProductsController() {
  const [searchParams] = useSearchParams();
  const fixedClientId = searchParams.get("client_id") || "";
  const [newProduct, setNewProduct] = useState(EMPTY_PRODUCT);
  const [currentMaxUsers, setCurrentMaxUsers] = useState(30);
  const [selectedSourceType, setSelectedSourceType] = useState("PRODUCT");
  const [isSourceModalOpen, setIsSourceModalOpen] = useState(false);
  const [isContpaqiModalOpen, setIsContpaqiModalOpen] = useState(false);
  const [isServicesModalOpen, setIsServicesModalOpen] = useState(false);
  const [isCategoriesModalOpen, setIsCategoriesModalOpen] = useState(false);
  const [isPoliciesModalOpen, setIsPoliciesModalOpen] = useState(false);
  const [isGeneralProductsModalOpen, setIsGeneralProductsModalOpen] = useState(false);
  const [activeFormMode, setActiveFormMode] = useState(null);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [categoryPage, setCategoryPage] = useState(1);
  const [isFormHighlighted, setIsFormHighlighted] = useState(false);

  const catalog = useProductCatalog();
  const selectedCategory = String(newProduct.category || "").trim();
  const selectedCategoryType =
    catalog.categoryTypeByName[getCategoryTypeKey(selectedCategory)] || "";
  const totalCategoryPages = Math.max(
    1,
    Math.ceil(catalog.availableCategories.length / CATEGORY_CHIPS_PAGE_SIZE)
  );

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

  const filteredContpaqiProducts = useMemo(
    () =>
      [...catalog.builtInProducts, ...catalog.customContpaqiProducts].filter(
        (item) => categoryMatches(item.category, selectedCategory)
      ),
    [catalog.builtInProducts, catalog.customContpaqiProducts, selectedCategory]
  );
  const filteredServices = useMemo(
    () =>
      catalog.customServices.filter((service) =>
        categoryMatches(service.category, selectedCategory)
      ),
    [catalog.customServices, selectedCategory]
  );
  const filteredPolicies = useMemo(
    () =>
      catalog.customPolicies.filter((policy) =>
        categoryMatches(policy.category, selectedCategory)
      ),
    [catalog.customPolicies, selectedCategory]
  );
  const filteredGeneralProducts = useMemo(
    () =>
      catalog.customGeneralProducts.filter((product) =>
        categoryMatches(product.category, selectedCategory)
      ),
    [catalog.customGeneralProducts, selectedCategory]
  );

  const isServiceMode = useMemo(
    () =>
      isServiceProductMode({
        activeFormMode,
        selectedCategoryType,
        selectedSourceType,
        category: newProduct.category,
      }),
    [activeFormMode, selectedCategoryType, selectedSourceType, newProduct.category]
  );
  const productTypeLabel = useMemo(
    () =>
      getProductTypeLabel({
        activeFormMode,
        selectedCategoryType,
        category: newProduct.category,
      }),
    [activeFormMode, selectedCategoryType, newProduct.category]
  );
  const formLabels = useMemo(
    () =>
      getFormLabels({
        activeFormMode,
        selectedCategoryType,
        isServiceMode,
        category: newProduct.category,
      }),
    [activeFormMode, selectedCategoryType, isServiceMode, newProduct.category]
  );

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

    const nextCategoryType =
      catalog.categoryTypeByName[getCategoryTypeKey(nextCategory)] || "PRODUCT";
    setNewProduct({
      ...EMPTY_PRODUCT,
      category: nextCategory,
      product_type: nextCategoryType,
    });
    setCurrentMaxUsers(30);
    setSelectedSourceType(nextCategoryType);
    setActiveFormMode(null);
  };

  const handleAddCategory = async () => {
    const nextCategory = sanitizeCategoryLabel(newCategoryName);
    if (!nextCategory) return;
    const normalizedNewCategoryName =
      normalizeServicePolicyCategory(newCategoryName);
    const isDuplicateCategory =
      !!normalizedNewCategoryName &&
      catalog.availableCategories.some(
        (category) =>
          normalizeServicePolicyCategory(category) === normalizedNewCategoryName
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
      catalog.mergeCategories([nextCategory]);
      applyCategorySelection(nextCategory);
      setNewCategoryName("");
      setIsCategoriesModalOpen(false);
    } catch (error) {
      notificationService.error(
        "Error",
        error.message || "No se pudo crear la categoría."
      );
    }
  };

  const setSelectorOpen = (source, isOpen) => {
    if (source === "CONTPAQI") setIsContpaqiModalOpen(isOpen);
    if (source === "POLICY") setIsPoliciesModalOpen(isOpen);
    if (source === "PRODUCT") setIsGeneralProductsModalOpen(isOpen);
    if (source === "SERVICE") setIsServicesModalOpen(isOpen);
  };

  const handleSourceSelection = async (source) => {
    const category = sanitizeCategoryLabel(selectedCategory);
    const productType = normalizeCatalogProductType(source) || "PRODUCT";
    if (!category) return;

    try {
      const savedCategory = await assignCategoryTypeApi(category, productType);
      catalog.setCategoryType(
        savedCategory?.name || category,
        normalizeCatalogProductType(savedCategory?.product_type) || productType
      );
      catalog.mergeCategories([category]);
      setSelectedSourceType(productType);
      setIsSourceModalOpen(false);
      setSelectorOpen(productType, true);
    } catch (error) {
      notificationService.error(
        "Error",
        error.message || "No se pudo asignar el tipo de la categoría."
      );
    }
  };

  const selectProduct = (item, productType) => {
    const isService = productType === "SERVICE" || productType === "POLICY";
    setNewProduct((prev) => ({
      ...prev,
      name: item.name,
      category: selectedCategory || item.category || prev.category,
      price: Math.max(0, Number(item.price) || 0),
      users_count: 1,
      description: item.description || "",
      product_type: productType,
    }));
    setCurrentMaxUsers(
      isService
        ? 1
        : productType === "CONTPAQI"
        ? Math.max(1, Number(item.max_users) || 30)
        : item.max_users || 1
    );
    setSelectedSourceType(isService ? "SERVICE" : "PRODUCT");
    setActiveFormMode(productType);
    setIsSourceModalOpen(false);
    setSelectorOpen(productType, false);
    triggerFormHighlight();
  };

  const handlePriceChange = (value) => {
    if (value === "") {
      setNewProduct((prev) => ({ ...prev, price: "" }));
      return;
    }
    const numeric = Number(value);
    if (Number.isNaN(numeric)) return;
    setNewProduct((prev) => ({ ...prev, price: numeric < 0 ? 0 : value }));
  };

  const handlePriceStep = (direction) => {
    setNewProduct((prev) => {
      const current = parseFloat(prev.price);
      const base = Number.isFinite(current) ? current : 0;
      const next = Math.max(0, base + direction * 0.01);
      return { ...prev, price: next.toFixed(2) };
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
    setNewProduct((prev) => ({
      ...prev,
      users_count: clampUsersValue(value),
    }));
  };

  const handleUsersStep = (direction) => {
    setNewProduct((prev) => {
      const base = clampUsersValue(prev.users_count || 1);
      const nextUsers = Math.min(currentMaxUsers, Math.max(1, base + direction));
      return { ...prev, users_count: nextUsers };
    });
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    try {
      const safeName = String(newProduct.name || "").trim();
      const safeCategory = String(newProduct.category || "").trim();
      if (!safeName || !safeCategory) {
        notificationService.warning(
          "Falta información",
          "Debes capturar nombre y categoría."
        );
        return;
      }

      let productType = normalizeCatalogProductType(activeFormMode);
      if (!productType) {
        productType = normalizeCatalogProductType(
          catalog.categoryTypeByName[getCategoryTypeKey(safeCategory)]
        );
      }
      if (!productType) {
        productType = inferProductType({
          name: safeName,
          category: safeCategory,
        });
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

      catalog.upsertProduct(productType, nextItem);
      catalog.mergeCategories([safeCategory]);
      catalog.setCategoryType(safeCategory, productType);
      setNewProduct({
        ...EMPTY_PRODUCT,
        category: safeCategory,
        product_type: productType,
      });
      setCurrentMaxUsers(30);
      setSelectedSourceType("PRODUCT");
      setActiveFormMode(null);

      notificationService.success(
        "¡Éxito!",
        buildProductSuccessMessage({
          productType,
          folio: createdProduct?.folio,
        })
      );
    } catch (error) {
      notificationService.error("Error", error.message || "Error al crear producto");
    }
  };

  const startNewProduct = (productType) => {
    setSelectorOpen(productType, false);
    setNewProduct({
      ...EMPTY_PRODUCT,
      category: selectedCategory,
      product_type: productType,
    });
    setCurrentMaxUsers(productType === "SERVICE" || productType === "POLICY" ? 1 : 30);
    setActiveFormMode(productType);
    triggerFormHighlight();
  };

  const returnToSource = (productType) => {
    setSelectorOpen(productType, false);
    setIsSourceModalOpen(true);
  };

  return {
    formProps: {
      activeFormMode,
      currentMaxUsers,
      formLabels,
      handleCreate,
      handlePriceChange,
      handlePriceStep,
      handleUsersChange,
      handleUsersStep,
      isFormHighlighted,
      isServiceMode,
      newProduct,
      openCategoriesModal: () => setIsCategoriesModalOpen(true),
      openSourceModal,
      productTypeLabel,
      selectedCategory,
      setNewProduct,
    },
    modalProps: {
      applyCategorySelection,
      availableCategories: catalog.availableCategories,
      categoryPage,
      closeCategoriesModal: () => setIsCategoriesModalOpen(false),
      closeSelector: (productType) => setSelectorOpen(productType, false),
      closeSourceModal: () => setIsSourceModalOpen(false),
      filteredContpaqiProducts,
      filteredGeneralProducts,
      filteredPolicies,
      filteredServices,
      handleAddCategory,
      handleSourceSelection,
      isCategoriesModalOpen,
      isContpaqiModalOpen,
      isGeneralProductsModalOpen,
      isPoliciesModalOpen,
      isServicesModalOpen,
      isSourceModalOpen,
      newCategoryName,
      normalizeServicePolicyCategory,
      returnToSource,
      selectedCategory,
      selectProduct,
      setCategoryPage,
      setNewCategoryName,
      startNewProduct,
    },
  };
}
