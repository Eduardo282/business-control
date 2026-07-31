import {
  CLIENT_DETAIL_FULL_WIDTH_FIELDS,
  CLIENT_DETAIL_HIDDEN_FIELDS,
  CONTACT_DEFAULT_MAIN_COLUMNS,
  CONTACT_FALLBACK_COLUMNS,
  CONTACT_FIELD_LABELS,
  CONTACT_FIXED_MAIN_COLUMNS_COUNT,
  CONTACT_HIDDEN_FIELDS,
  CONTACT_QUICK_FILTER_FIELDS,
  CONTACT_READONLY_FIELDS,
} from "./clientDetailConstants";
import { normalizeSearchText } from "./utils";

export function isClientFieldFullWidth(fieldName) {
  const key = String(fieldName || "").toLowerCase();
  return (
    CLIENT_DETAIL_FULL_WIDTH_FIELDS.has(key) ||
    key.includes("address") ||
    key.includes("direccion")
  );
}

export function getClientFieldInputType(fieldName) {
  const key = String(fieldName || "").toLowerCase();
  if (key.includes("email") || key.includes("correo")) return "email";
  if (key.includes("tel") || key.includes("phone") || key.includes("celular")) {
    return "tel";
  }
  return "text";
}

export function isClientFieldReadOnly(fieldName) {
  return String(fieldName || "").toLowerCase() === "rfc";
}

export function getContactFieldInputType(fieldName) {
  const key = String(fieldName || "").toLowerCase();
  if (key.includes("email") || key.includes("correo")) return "email";
  if (key.includes("tel") || key.includes("phone") || key.includes("cel")) {
    return "tel";
  }
  return "text";
}

function tokenizeFieldTerms(value) {
  return Array.from(
    new Set(
      normalizeSearchText(value)
        .split(" ")
        .map((token) => token.replace(/[0-9]+/g, ""))
        .filter((token) => token.length > 1),
    ),
  );
}

function scoreColumnAffinity(detailColumn, primaryColumn) {
  const detailTokens = tokenizeFieldTerms(
    `${detailColumn?.name || ""} ${detailColumn?.label || ""}`,
  );
  if (!detailTokens.length) return 0;

  const primaryTokens = new Set(
    tokenizeFieldTerms(
      `${primaryColumn?.name || ""} ${primaryColumn?.label || ""}`,
    ),
  );

  return detailTokens.reduce(
    (score, token) => (primaryTokens.has(token) ? score + 1 : score),
    0,
  );
}

export function resolveDetailHostColumn(
  detailColumn,
  primaryColumns = [],
  detailColumnsByPrimary = {},
) {
  if (!primaryColumns.length) return null;

  let bestColumn = primaryColumns[0];
  let bestScore = -1;
  let bestLoad = Number.POSITIVE_INFINITY;

  primaryColumns.forEach((primaryColumn) => {
    const score = scoreColumnAffinity(detailColumn, primaryColumn);
    const load = (detailColumnsByPrimary[primaryColumn.name] || []).length;

    if (score > bestScore || (score === bestScore && load < bestLoad)) {
      bestColumn = primaryColumn;
      bestScore = score;
      bestLoad = load;
    }
  });

  return bestColumn?.name || primaryColumns[0]?.name || null;
}

export function getClientGeneralColumns(
  clientDynamicColumns,
  excelViewColumns,
) {
  const availableColumns = clientDynamicColumns.filter(
    (column) =>
      column?.name && !CLIENT_DETAIL_HIDDEN_FIELDS.has(column.name),
  );

  if (Array.isArray(excelViewColumns) && excelViewColumns.length) {
    const columnsByName = new Map(
      availableColumns.map((column) => [column.name, column]),
    );
    const excelSubset = excelViewColumns
      .map((columnName) => columnsByName.get(columnName))
      .filter(Boolean);

    if (excelSubset.length) return excelSubset;
  }

  return availableColumns;
}

export function getClientGeneralFields(
  client,
  clientGeneralColumns,
  columnLabelOverrides,
) {
  if (!client) return [];

  const fields = clientGeneralColumns.map((column) => {
    const rawValue = client[column.name];
    const value =
      rawValue === null ||
      rawValue === undefined ||
      String(rawValue).trim() === ""
        ? "—"
        : String(rawValue);

    return {
      name: column.name,
      label: columnLabelOverrides[column.name] || column.label,
      value,
    };
  });

  if (fields.length) return fields;

  return [
    {
      name: "business_name",
      label: "Razón Social",
      value: client.business_name || "—",
    },
    { name: "rfc", label: "RFC", value: client.rfc || "—" },
    {
      name: "email1",
      label: "Correo Principal",
      value: client.email1 || "—",
    },
    {
      name: "email2",
      label: "Correo Secundario",
      value: client.email2 || "—",
    },
    { name: "celular", label: "Celular", value: client.celular || "—" },
    {
      name: "telefono",
      label: "Teléfono",
      value: client.telefono || "—",
    },
    {
      name: "codigo_postal",
      label: "Código Postal",
      value: client.codigo_postal || "—",
    },
    { name: "ciudad", label: "Ciudad", value: client.ciudad || "—" },
  ];
}

export function getOrphanClientGeneralFieldName(clientGeneralFields) {
  const compactFields = clientGeneralFields.filter(
    (field) =>
      field?.name &&
      field.name !== "business_name" &&
      !isClientFieldFullWidth(field.name),
  );

  if (compactFields.length % 2 === 0) return null;
  return compactFields[compactFields.length - 1]?.name || null;
}

export function getContactColumnsFromView(
  contactDynamicColumns,
  contactExcelViewColumns,
  contactColumnLabelOverrides,
) {
  const availableColumns = contactDynamicColumns.filter(
    (column) => column?.name && !CONTACT_HIDDEN_FIELDS.has(column.name),
  );

  let orderedColumns = availableColumns;
  if (
    Array.isArray(contactExcelViewColumns) &&
    contactExcelViewColumns.length
  ) {
    const columnsByName = new Map(
      availableColumns.map((column) => [column.name, column]),
    );
    const excelSubset = contactExcelViewColumns
      .map((columnName) => columnsByName.get(columnName))
      .filter(Boolean);
    if (excelSubset.length) {
      const excelSet = new Set(excelSubset.map((column) => column.name));
      const remaining = availableColumns.filter(
        (column) => !excelSet.has(column.name),
      );
      orderedColumns = [...excelSubset, ...remaining];
    }
  }

  return orderedColumns.map((column) => ({
    ...column,
    label:
      CONTACT_FIELD_LABELS[column.name] ||
      contactColumnLabelOverrides[column.name] ||
      column.label,
  }));
}

export function getContactPrimaryColumns(contactColumnsFromView) {
  const columnsByName = new Map(
    contactColumnsFromView.map((column) => [column.name, column]),
  );

  let orderedColumns = CONTACT_DEFAULT_MAIN_COLUMNS.map((columnName) =>
    columnsByName.get(columnName),
  ).filter(Boolean);

  if (orderedColumns.length < CONTACT_FIXED_MAIN_COLUMNS_COUNT) {
    const selected = new Set(orderedColumns.map((column) => column.name));
    const needed = CONTACT_FIXED_MAIN_COLUMNS_COUNT - orderedColumns.length;
    const fallback = contactColumnsFromView
      .filter((column) => !selected.has(column.name))
      .slice(0, needed);
    orderedColumns = [...orderedColumns, ...fallback];
  }

  return orderedColumns.slice(0, CONTACT_FIXED_MAIN_COLUMNS_COUNT);
}

export function getContactDetailColumns(
  contactColumnsFromView,
  contactPrimaryColumns,
) {
  const primarySet = new Set(
    contactPrimaryColumns.map((column) => column.name),
  );
  return contactColumnsFromView.filter(
    (column) =>
      !primarySet.has(column.name) &&
      column.name !== "has_portal_access" &&
      column.name !== "is_active",
  );
}

export function getContactEditableColumns(contactColumnsFromView) {
  return contactColumnsFromView.filter(
    (column) => !CONTACT_READONLY_FIELDS.has(column.name),
  );
}

export function getContactQuickFilterButtons(contactColumnsFromView) {
  const availableColumns = new Set(
    contactColumnsFromView.map((column) => column.name),
  );
  const columnsByName = new Map(
    contactColumnsFromView.map((column) => [column.name, column]),
  );

  return CONTACT_QUICK_FILTER_FIELDS.map((config) => {
    const resolvedFieldName =
      config.aliases?.find((name) => availableColumns.has(name)) || config.id;
    const column = columnsByName.get(resolvedFieldName);

    return {
      ...config,
      fieldName: resolvedFieldName,
      modalLabel: column?.label || config.modalLabel,
    };
  });
}

export function getContactFilterOptions(contactRows, fieldName) {
  if (!fieldName) return [];

  const uniqueValues = new Map();
  contactRows.forEach((contact) => {
    if (contact.is_active === false || contact.is_active === 0) return;

    const rawValue = contact?.[fieldName];
    if (rawValue === null || rawValue === undefined) return;

    const value = String(rawValue).trim();
    if (!value) return;

    const normalized = normalizeSearchText(value);
    if (!normalized || uniqueValues.has(normalized)) return;

    uniqueValues.set(normalized, value);
  });

  return Array.from(uniqueValues.values()).sort((a, b) =>
    a.localeCompare(b, "es", { sensitivity: "base" }),
  );
}

export function filterContacts(
  contactRows,
  contactSearch,
  contactFilters,
  contactColumnsFromView,
) {
  if (!contactRows.length) return [];

  const normalizedQuery = normalizeSearchText(contactSearch);
  const activeFilters = Object.entries(contactFilters).filter(
    ([, value]) => String(value || "").trim() !== "",
  );
  const searchableColumns =
    contactColumnsFromView.length
      ? contactColumnsFromView
      : CONTACT_FALLBACK_COLUMNS;

  return contactRows.filter((contact) => {
    if (contact.is_active === false || contact.is_active === 0) return false;

    const matchesQuery =
      !normalizedQuery ||
      searchableColumns.some((column) =>
        normalizeSearchText(contact?.[column.name]).includes(normalizedQuery),
      );
    const matchesFilters = activeFilters.every(
      ([key, value]) =>
        normalizeSearchText(contact?.[key]) === normalizeSearchText(value),
    );

    return matchesQuery && matchesFilters;
  });
}

export function getDisabledContacts(contactRows) {
  return contactRows.filter(
    (contact) =>
      contact.is_active === false || contact.is_active === 0,
  );
}
