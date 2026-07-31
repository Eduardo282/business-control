export const EXCEL_VIEW_STORAGE_KEY = "clients_excel_view_config";
export const CONTACTS_EXCEL_VIEW_STORAGE_KEY = "contacts_excel_view_config";

export const CONTACT_TABLE_HEADER_HEIGHT = 41;
export const CONTACT_TABLE_ROW_HEIGHT = 56;

export const CONTACT_QUICK_FILTER_FIELDS = [
  {
    id: "position_title",
    aliases: ["position_title", "puesto", "cargo", "posicion"],
    buttonLabel: "PUESTO",
    modalLabel: "Puesto",
  },
];

export const CONTACT_HIDDEN_FIELDS = new Set([
  "id",
  "client_id",
  "created_at",
  "updated_at",
  "portal_password_hash",
]);

export const CONTACT_READONLY_FIELDS = new Set([
  "id",
  "client_id",
  "created_at",
  "updated_at",
  "portal_password_hash",
  "has_portal_access",
  "is_active",
]);

export const CONTACT_DEFAULT_MAIN_COLUMNS = ["full_name", "email"];
export const CONTACT_FIXED_MAIN_COLUMNS_COUNT = 2;

export const CONTACT_FIELD_LABELS = {
  full_name: "Nombre completo",
  email: "Correo electrónico",
  phone: "Teléfono",
  position_title: "Puesto",
  has_portal_access: "Acceso al portal",
  is_active: "Activo",
};

export const CONTACT_FALLBACK_COLUMNS = [
  { name: "full_name", label: CONTACT_FIELD_LABELS.full_name, type: "varchar" },
  { name: "email", label: CONTACT_FIELD_LABELS.email, type: "varchar" },
  { name: "phone", label: CONTACT_FIELD_LABELS.phone, type: "varchar" },
  {
    name: "position_title",
    label: CONTACT_FIELD_LABELS.position_title,
    type: "varchar",
  },
  {
    name: "has_portal_access",
    label: CONTACT_FIELD_LABELS.has_portal_access,
    type: "tinyint",
  },
  { name: "is_active", label: CONTACT_FIELD_LABELS.is_active, type: "tinyint" },
];

export const CLIENT_DETAIL_HIDDEN_FIELDS = new Set([
  "id",
  "created_at",
  "updated_at",
  "created_by_user_id",
  "address",
  "direccion",
  "has_client_portal_access",
  "is_active",
  "portal_password_hash",
]);

export const CLIENT_DETAIL_FULL_WIDTH_FIELDS = new Set([
  "business_name",
  "email2",
  "address",
  "direccion",
]);

export const INITIAL_CLIENT_FORM = {
  business_name: "",
  rfc: "",
  email1: "",
  email2: "",
  celular: "",
  telefono: "",
  codigo_postal: "",
  ciudad: "",
};

export const INITIAL_CONTACT_FORM = {
  full_name: "",
  email: "",
  phone: "",
  position_title: "",
};

export const INITIAL_CONTACT_FILTERS = {
  position_title: "",
};
