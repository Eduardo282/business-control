export const CATEGORY_CHIPS_PAGE_SIZE = 12;
export const EMPTY_PRODUCT = {
  name: "",
  category: "",
  price: 0,
  users_count: 1,
  description: "",
  product_type: "PRODUCT",
};

const PRODUCT_TYPE_VALUES = ["PRODUCT", "CONTPAQI", "SERVICE", "POLICY"];
const PRODUCT_TYPE_PRIORITY = {
  PRODUCT: 1,
  CONTPAQI: 2,
  SERVICE: 3,
  POLICY: 3,
};
const PRODUCT_TYPE_LABELS = {
  SERVICE: "Servicio",
  POLICY: "Póliza",
  CONTPAQI: "Producto CONTPAQi",
  PRODUCT: "Producto",
};

export function sanitizeCategoryLabel(category = "") {
  return String(category).replace(/\s+/g, " ").trim();
}

export function normalizeServicePolicyCategory(category = "") {
  return sanitizeCategoryLabel(category)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function uniqueByNormalizedValue(values = []) {
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

export function categoryMatches(sourceCategory, selectedCategory) {
  const source = normalizeServicePolicyCategory(sourceCategory);
  const selected = normalizeServicePolicyCategory(selectedCategory);

  if (!selected) return true;
  if (!source) return false;

  return source === selected || selected.includes(source) || source.includes(selected);
}

export function normalizeCatalogProductType(value) {
  const normalized = String(value || "").trim().toUpperCase();
  if (normalized === "CONTPAQI" || normalized === "CONTPAQI_PRODUCT") return "CONTPAQI";
  if (PRODUCT_TYPE_VALUES.includes(normalized)) return normalized;
  return "";
}

export function buildProductSuccessMessage({ productType}) {
  const typeLabel = PRODUCT_TYPE_LABELS[productType] || "Producto";
  const appearsInServiceHistory =
    productType === "SERVICE" || productType === "POLICY";

  return appearsInServiceHistory
  ? `${typeLabel} registrado correctamente.`
  : `${typeLabel} registrado correctamente.`;
}

export function inferProductType(product = {}) {
  const explicitType = normalizeCatalogProductType(product.product_type);
  if (explicitType) return explicitType;

  const source = `${product?.name || ""} ${product?.category || ""}`;
  const normalized = normalizeServicePolicyCategory(source);

  if (normalized.includes("poliza")) return "POLICY";
  if (normalized.includes("servicio")) return "SERVICE";
  if (normalized.includes("contpaqi")) return "CONTPAQI";
  return "PRODUCT";
}

export function getCategoryTypeKey(category = "") {
  return normalizeServicePolicyCategory(category);
}

export function shouldReplaceCategoryType(currentType, nextType) {
  if (!currentType) return true;
  return (PRODUCT_TYPE_PRIORITY[nextType] || 0) >= (PRODUCT_TYPE_PRIORITY[currentType] || 0);
}

export function toCatalogItem(product = {}) {
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

export function upsertCatalogItem(list, nextItem) {
  const nextName = normalizeServicePolicyCategory(nextItem.name);
  const nextCategory = normalizeServicePolicyCategory(nextItem.category);
  const filtered = list.filter((item) => {
    const itemName = normalizeServicePolicyCategory(item.name);
    const itemCategory = normalizeServicePolicyCategory(item.category);
    return !(itemName === nextName && itemCategory === nextCategory);
  });

  return [nextItem, ...filtered];
}

export function createBuiltInCategories(catalog) {
  const values = [];
  catalog.forEach((group) => {
    group.items.forEach((item) => {
      if (item.category) {
        values.push(item.category);
      }
    });
  });
  return uniqueByNormalizedValue(values);
}

export function createBuiltInProducts(catalog) {
  return catalog.flatMap((group) =>
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
  );
}

export function isServiceProductMode({
  activeFormMode,
  selectedCategoryType,
  selectedSourceType,
  category,
}) {
  if (activeFormMode === "SERVICE" || activeFormMode === "POLICY") return true;
  if (activeFormMode === "PRODUCT" || activeFormMode === "CONTPAQI") return false;
  if (selectedCategoryType === "SERVICE" || selectedCategoryType === "POLICY") return true;
  if (selectedCategoryType === "PRODUCT" || selectedCategoryType === "CONTPAQI") return false;

  const normalizedCategory = normalizeServicePolicyCategory(category);
  return (
    selectedSourceType === "SERVICE" ||
    normalizedCategory.includes("servicio") ||
    normalizedCategory.includes("poliza")
  );
}

export function getProductTypeLabel({
  activeFormMode,
  selectedCategoryType,
  category,
}) {
  if (activeFormMode === "POLICY") return "Póliza";
  if (activeFormMode === "SERVICE") return "Servicio";
  if (activeFormMode === "CONTPAQI") return "Producto CONTPAQi";
  if (activeFormMode === "PRODUCT") return "Producto";
  if (selectedCategoryType === "POLICY") return "Póliza";
  if (selectedCategoryType === "SERVICE") return "Servicio";
  if (selectedCategoryType === "CONTPAQI") return "Producto CONTPAQi";
  if (selectedCategoryType === "PRODUCT") return "Producto";

  const normalizedCategory = normalizeServicePolicyCategory(category);
  if (normalizedCategory.includes("poliza")) return "Póliza";
  if (normalizedCategory.includes("servicio")) return "Servicio";
  if (normalizedCategory.includes("contpaqi")) return "Producto CONTPAQi";

  return "Producto";
}

export function getFormLabels({
  activeFormMode,
  selectedCategoryType,
  isServiceMode,
  category,
}) {
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
    const normalizedCategory = normalizeServicePolicyCategory(category);
    if (normalizedCategory.includes("poliza"))
      return { nameLabel: "NOMBRE DE LA PÓLIZA", button: "Registrar Póliza" };
    return { nameLabel: "NOMBRE DEL SERVICIO", button: "Registrar Servicio" };
  }
  return { nameLabel: "NOMBRE DEL PRODUCTO", button: "Registrar Producto" };
}
