import {
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
  Shield,
  ShoppingBag,
  ShoppingCart,
  User,
  Users,
} from "@icons";

export const PRODUCT_TYPE_PRESENTATION = {
  PRODUCT: {
    label: "Producto",
    badgeClass:
      "bg-sky-50 text-sky-700 border-sky-100 dark:bg-sky-950/20 dark:text-sky-400 dark:border-sky-900/30",
  },
  SERVICE: {
    label: "Servicio",
    badgeClass:
      "bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30",
  },
  POLICY: {
    label: "Póliza",
    badgeClass:
      "bg-purple-50 text-purple-700 border-purple-100 dark:bg-purple-950/20 dark:text-purple-400 dark:border-purple-900/30",
  },
};

export const PRODUCT_TYPE_FILTER_OPTIONS = Object.entries(
  PRODUCT_TYPE_PRESENTATION,
).map(([value, config]) => ({
  value,
  label: config.label,
}));

const PRODUCT_ICON_RULES = [
  { includes: ["contpaqi contabilidad"], Icon: FileSpreadsheet },
  { includes: ["contpaqi bancos"], Icon: Building2 },
  { includes: ["contpaqi contabiliza"], Icon: Globe },
  { includes: ["contpaqi gastos"], Icon: BadgeDollarSign },
  { includes: ["contpaqi comercial premium"], Icon: ShoppingBag },
  { includes: ["contpaqi comercial pro"], Icon: ShoppingCart },
  { includes: ["contpaqi comercial start"], Icon: Package },
  { includes: ["contpaqi factura electronica"], Icon: FileText },
  { includes: ["contpaqi vende"], Icon: ShoppingCart },
  { includes: ["contpaqi punto de venta"], Icon: Building },
  { includes: ["contpaqi nominas"], Icon: Users },
  { includes: ["contpaqi personia"], Icon: User },
  { includes: ["contpaqi evalua"], Icon: ClipboardList },
  { includes: ["contpaqi xml en linea"], Icon: Download },
  { includes: ["contpaqi respaldos"], Icon: Shield },
  { includes: ["contpaqi escritorio virtual"], Icon: Building2 },
  { includes: ["contpaqi optimiza"], Icon: LayoutDashboard },
];

function normalizeText(value = "") {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function getProductTypePresentation(productType) {
  const type = String(productType || "PRODUCT")
    .trim()
    .toUpperCase();
  return PRODUCT_TYPE_PRESENTATION[type] || PRODUCT_TYPE_PRESENTATION.PRODUCT;
}

export function getProductIcon(product = {}) {
  const normalizedName = normalizeText(product.name);
  const match = PRODUCT_ICON_RULES.find((rule) =>
    rule.includes.some((needle) => normalizedName.includes(needle)),
  );
  return match?.Icon || Package;
}
