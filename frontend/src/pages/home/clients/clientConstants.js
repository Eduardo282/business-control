export const EXCEL_VIEW_STORAGE_KEY = "clients_excel_view_config";

export const DEFAULT_VISIBLE_CLIENT_COLUMNS = [
  "business_name",
  "rfc",
  "email1",
  "celular",
];

export const FIXED_MAIN_COLUMNS_COUNT = 4;

export const QUICK_FILTER_FIELDS = [
  {
    id: "business_name",
    aliases: ["business_name", "razon_social"],
    buttonLabel: "razon social",
  },
  {
    id: "codigo_postal",
    aliases: ["codigo_postal", "cp", "postal_code"],
    buttonLabel: "codigo postal",
  },
  {
    id: "ciudad",
    aliases: ["ciudad", "city"],
    buttonLabel: "ciudad",
  },
];

export const CLIENT_TEMPLATE_COLUMNS = [
  "RAZÓN SOCIAL",
  "RFC",
  "CORREO PRINCIPAL",
  "CELULAR",
  "CIUDAD",
  "TELÉFONO",
  "CORREO SECUNDARIO",
  "CÓDIGO POSTAL",
];

export const CLIENT_PAGE_SIZES = [10, 25, 50, 100];
