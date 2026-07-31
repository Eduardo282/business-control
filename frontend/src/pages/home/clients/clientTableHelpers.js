import { normalizeSearchText } from "../../../utils/formatters";
import {
  DEFAULT_VISIBLE_CLIENT_COLUMNS,
  FIXED_MAIN_COLUMNS_COUNT,
  QUICK_FILTER_FIELDS,
} from "./clientConstants";

export function hasValue(value) {
  return value !== null && value !== undefined && String(value).trim() !== "";
}

function scoreColumnAffinity(detailColumn, primaryColumn) {
  const detailTokens = String(detailColumn?.name || "")
    .toLowerCase()
    .split(/[_\s]+/);
  const primaryTokens = String(primaryColumn?.name || "")
    .toLowerCase()
    .split(/[_\s]+/);

  return detailTokens.filter((token) => primaryTokens.includes(token)).length;
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

export function getFilterableColumns(dynamicColumns = []) {
  return dynamicColumns.filter(
    (column) => column.name && column.name !== "portal_password_hash",
  );
}

export function getQuickFilterButtons(
  filterableColumns,
  columnLabelOverrides,
) {
  const availableColumns = new Set(
    filterableColumns.map((column) => column.name),
  );
  const columnsByName = new Map(
    filterableColumns.map((column) => [column.name, column]),
  );

  return QUICK_FILTER_FIELDS.map((config) => {
    const resolvedFieldName =
      config.aliases.find((name) => availableColumns.has(name)) || config.id;
    const column = columnsByName.get(resolvedFieldName);

    return {
      ...config,
      fieldName: resolvedFieldName,
      modalLabel:
        columnLabelOverrides[resolvedFieldName] ||
        column?.label ||
        config.buttonLabel,
    };
  });
}

export function getFilterPickerOptions(allClients, fieldName) {
  if (!fieldName) return [];

  const uniqueValues = new Map();
  allClients.forEach((client) => {
    const rawValue = client?.[fieldName];
    if (!hasValue(rawValue)) return;

    const value = String(rawValue).trim();
    const normalized = normalizeSearchText(value);
    if (!normalized || uniqueValues.has(normalized)) return;

    uniqueValues.set(normalized, value);
  });

  return Array.from(uniqueValues.values()).sort((a, b) =>
    a.localeCompare(b, "es", { sensitivity: "base" }),
  );
}

export function filterPickerOptions(options, search) {
  const normalizedSearch = normalizeSearchText(search);
  if (!normalizedSearch) return options;

  return options.filter((value) =>
    normalizeSearchText(value).includes(normalizedSearch),
  );
}

export function getFixedMainColumnNames(excelViewColumns) {
  if (Array.isArray(excelViewColumns) && excelViewColumns.length) {
    const excelOrdered = excelViewColumns.filter(
      (name, index, columns) =>
        !!name &&
        name !== "portal_password_hash" &&
        columns.indexOf(name) === index,
    );

    if (excelOrdered.length) {
      return excelOrdered.slice(0, FIXED_MAIN_COLUMNS_COUNT);
    }
  }

  return DEFAULT_VISIBLE_CLIENT_COLUMNS.slice(0, FIXED_MAIN_COLUMNS_COUNT);
}

export function getTableColumnsFromView({
  filterableColumns,
  excelViewColumns,
  columnLabelOverrides,
  fixedMainColumnNames,
}) {
  let nextColumns = filterableColumns;

  if (Array.isArray(excelViewColumns) && excelViewColumns.length) {
    const columnsByName = new Map(
      filterableColumns.map((column) => [column.name, column]),
    );
    const fixedColumns = fixedMainColumnNames
      .map((columnName) => columnsByName.get(columnName))
      .filter(Boolean);
    const fixedColumnsSet = new Set(
      fixedColumns.map((column) => column.name),
    );
    const excelSubset = excelViewColumns
      .map((columnName) => columnsByName.get(columnName))
      .filter(Boolean)
      .filter((column) => !fixedColumnsSet.has(column.name));
    const mergedColumns = [...fixedColumns, ...excelSubset];

    if (mergedColumns.length) nextColumns = mergedColumns;
  }

  return nextColumns.map((column) => ({
    ...column,
    label: columnLabelOverrides[column.name] || column.label,
  }));
}

export function getPrimaryTableColumns(
  tableColumnsFromView,
  fixedMainColumnNames,
) {
  const columnsByName = new Map(
    tableColumnsFromView.map((column) => [column.name, column]),
  );
  let orderedColumns = fixedMainColumnNames
    .map((columnName) => columnsByName.get(columnName))
    .filter(Boolean);

  if (orderedColumns.length < FIXED_MAIN_COLUMNS_COUNT) {
    const orderedSet = new Set(orderedColumns.map((column) => column.name));
    const needed = FIXED_MAIN_COLUMNS_COUNT - orderedColumns.length;
    const fallbackColumns = tableColumnsFromView
      .filter((column) => !orderedSet.has(column.name))
      .slice(0, needed);

    orderedColumns = [...orderedColumns, ...fallbackColumns];
  }

  return orderedColumns.slice(0, FIXED_MAIN_COLUMNS_COUNT);
}

export function getDetailColumns(tableColumnsFromView, primaryTableColumns) {
  const primarySet = new Set(
    primaryTableColumns.map((column) => column.name),
  );

  return tableColumnsFromView.filter(
    (column) => !primarySet.has(column.name),
  );
}

export function filterClients({
  allClients,
  query,
  filters,
  searchableColumns,
}) {
  const normalizedQuery = normalizeSearchText(query);
  const activeFilters = Object.entries(filters).filter(
    ([, value]) => String(value || "").trim() !== "",
  );

  if (!normalizedQuery && activeFilters.length === 0) return allClients;

  return allClients.filter((client) => {
    const globalMatch =
      !normalizedQuery ||
      searchableColumns.some((column) =>
        normalizeSearchText(client[column.name]).includes(normalizedQuery),
      );
    const fieldFiltersMatch = activeFilters.every(
      ([key, value]) =>
        normalizeSearchText(client[key]) === normalizeSearchText(value),
    );

    return globalMatch && fieldFiltersMatch;
  });
}

export function sortClientRowsForExcelView(clients, excelViewColumns) {
  if (!excelViewColumns?.length) return clients;

  const withIndex = clients.map((row, index) => ({
    row,
    index,
    hasExcel: excelViewColumns.some((columnName) =>
      hasValue(row?.[columnName]),
    ),
  }));

  withIndex.sort((a, b) => {
    if (a.hasExcel !== b.hasExcel) return a.hasExcel ? -1 : 1;

    const aId = Number(a.row?.id || 0);
    const bId = Number(b.row?.id || 0);
    if (aId !== bId) return bId - aId;

    return a.index - b.index;
  });

  return withIndex.map((item) => item.row);
}

export function getRowDetailColumns(row, detailColumns) {
  return detailColumns.filter((column) => hasValue(row?.[column.name]));
}

export function groupDetailColumnsByPrimary(
  rowDetailColumns,
  primaryTableColumns,
) {
  const groupedColumns = primaryTableColumns.reduce((acc, primaryColumn) => {
    acc[primaryColumn.name] = [];
    return acc;
  }, {});

  rowDetailColumns.forEach((column) => {
    const hostColumn =
      resolveDetailHostColumn(
        column,
        primaryTableColumns,
        groupedColumns,
      ) || primaryTableColumns[0]?.name;

    if (hostColumn && groupedColumns[hostColumn]) {
      groupedColumns[hostColumn].push(column);
    }
  });

  return groupedColumns;
}

export function buildExportColumns(tableColumnsFromView) {
  const usedLabels = new Set();

  return tableColumnsFromView.map((column) => {
    const baseLabel = String(column.label || column.name || "").trim();
    const fallbackLabel = String(column.name || "").trim();
    const base = baseLabel || fallbackLabel || "Columna";
    let label = base;
    const normalized = base.toLowerCase();

    if (usedLabels.has(normalized)) {
      label = `${base} (${fallbackLabel || normalized})`;
    }

    usedLabels.add(normalized);

    return {
      name: column.name,
      label,
    };
  });
}
