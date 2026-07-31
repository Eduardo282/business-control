import React from "react";

export const AVATAR_COLORS = [
  ["#1a2b4c", "#e8edf5"],
  ["#2277B4", "#e3f0fb"],
  ["#7c3aed", "#ede9fe"],
  ["#0f766e", "#ccfbf1"],
  ["#b45309", "#fef3c7"],
  ["#be123c", "#ffe4e6"],
  ["#1d4ed8", "#dbeafe"],
  ["#15803d", "#dcfce7"],
];

export const PRODUCT_UPDATE_ROW_HEIGHT = 34;

export function getAvatarColors(str = "") {
  let h = 0;
  for (let i = 0; i < str.length; i++)
    h = (h * 31 + str.charCodeAt(i)) & 0xffff;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

export function normalizeCategory(category = "") {
  return String(category)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function inferProductType(product) {
  const explicitType = String(product?.product_type || "")
    .trim()
    .toUpperCase();
  if (["PRODUCT", "CONTPAQI", "SERVICE", "POLICY"].includes(explicitType)) {
    return explicitType;
  }

  const source = `${product?.name || ""} ${product?.category || ""}`;
  const normalized = normalizeCategory(source);

  if (normalized.includes("poliza")) return "POLICY";
  if (normalized.includes("servicio")) return "SERVICE";
  if (normalized.includes("contpaqi")) return "CONTPAQI";
  return "PRODUCT";
}

export function ProductAvatar({ name = "", category = "", size = "md" }) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
  const [bg, fg] = getAvatarColors(category + name);

  const sizeClasses = {
    sm: "size-9 text-[11px] rounded-lg",
    md: "size-14 text-[20px] rounded-2xl",
    lg: "size-20 text-[28px] rounded-3xl",
  };

  return (
    <div
      className={`flex-shrink-0 flex items-center justify-center font-extrabold tracking-tight select-none shadow-sm ${sizeClasses[size] || sizeClasses.md}`}
      style={{ backgroundColor: bg, color: fg }}
    >
      {initials || "?"}
    </div>
  );
}
