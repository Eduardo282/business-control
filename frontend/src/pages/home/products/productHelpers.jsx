import React from "react";
import { AVATAR_COLORS } from "./productConstants";

export function formatPrice(value) {
  return (Number.parseFloat(value) || 0).toLocaleString("es-MX", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function normalizeCategory(category = "") {
  return String(category)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function getAvatarColors(seed = "") {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) & 0xffff;
  }
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

export function ProductAvatar({ name = "", category = "" }) {
  const initials = String(name)
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("");
  const [backgroundColor, color] = getAvatarColors(`${category}${name}`);

  return (
    <div
      className="flex-shrink-0 size-9 rounded-lg flex items-center justify-center text-[11px] font-extrabold tracking-tight select-none"
      style={{ backgroundColor, color }}
      aria-hidden="true"
    >
      {initials || "?"}
    </div>
  );
}

export function inferProductType(product) {
  const explicitType = String(product?.product_type || "")
    .trim()
    .toUpperCase();
  const source = `${product?.name || ""} ${product?.category || ""}`;
  const normalized = normalizeCategory(source);

  if (explicitType === "CONTPAQI" || normalized.includes("contpaqi")) return "CONTPAQI";
  if (explicitType === "POLICY") return "POLICY";
  if (explicitType === "SERVICE") return "SERVICE";
  if (normalized.includes("poliza")) return "POLICY";
  if (normalized.includes("servicio")) return "SERVICE";
  return "PRODUCT";
}

export function groupProductsByName(products, selectedProductByGroup = {}) {
  const groups = new Map();

  products.forEach((product) => {
    const key = normalizeCategory(product.name) || `product-${product.id}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(product);
  });

  return Array.from(groups.entries()).map(([key, items]) => {
    const orderedItems = [...items].sort((a, b) =>
      String(a.folio || "").localeCompare(String(b.folio || ""), "es", {
        sensitivity: "base",
      }),
    );
    const selectedId = selectedProductByGroup[key];
    const selectedProduct =
      orderedItems.find(
        (product) => String(product.id) === String(selectedId),
      ) || orderedItems[0];

    return {
      ...selectedProduct,
      _groupKey: key,
      _groupCount: orderedItems.length,
      _groupItems: orderedItems,
    };
  });
}

export function buildProductsPdfTableData(products) {
  const body = products.map((product) => [
    product.folio || "",
    product.name || "",
    product.category || "",
    String(product._groupCount || 1),
    `$${parseFloat(product.current_price || 0).toLocaleString("es-MX", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`,
    product.users_count || "0",
    product.description || "",
  ]);

  return {
    totalProducts: products.reduce(
      (total, product) => total + (Number(product._groupCount) || 1),
      0,
    ),
    head: [
      [
        "FOLIO",
        "PRODUCTO",
        "CATEGORÍA",
        "CANTIDAD",
        "PRECIO",
        "LÍMITE DE USUARIOS",
        "DESCRIPCIÓN",
      ],
    ],
    body,
  };
}
