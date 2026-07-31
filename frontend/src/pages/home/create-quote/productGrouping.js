function normalizeProductText(value = "") {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function inferQuoteProductType(product = {}) {
  const explicitType = String(product.product_type || "")
    .trim()
    .toUpperCase();
  const searchableText = normalizeProductText(
    `${product.name || ""} ${product.category || ""}`,
  );

  if (explicitType === "CONTPAQI" || searchableText.includes("contpaqi")) {
    return "CONTPAQI";
  }
  if (explicitType === "POLICY") return "POLICY";
  if (explicitType === "SERVICE") return "SERVICE";
  if (searchableText.includes("poliza")) return "POLICY";
  if (searchableText.includes("servicio")) return "SERVICE";
  return "PRODUCT";
}

export function formatQuoteProductVariantOption(product = {}) {
  const folio = product.folio || "Sin folio";
  const price = Number(product.current_price || 0).toLocaleString("es-MX", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return `${folio} · $${price}`;
}

export function groupQuoteProductResults(
  products = [],
  selectedProductByGroup = {},
) {
  const groups = new Map();

  products.forEach((product) => {
    const key = normalizeProductText(product.name) || `product-${product.id}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(product);
  });

  return Array.from(groups.entries()).map(([key, groupItems]) => {
    const orderedItems = [...groupItems].sort((a, b) =>
      String(a.folio || "").localeCompare(String(b.folio || ""), "es", {
        sensitivity: "base",
      }),
    );
    const selectedId = selectedProductByGroup[key];
    const selectedProduct =
      orderedItems.find((product) => String(product.id) === String(selectedId)) ||
      orderedItems[0];

    return {
      ...selectedProduct,
      _groupKey: key,
      _groupCount: orderedItems.length,
      _groupItems: orderedItems,
    };
  });
}
