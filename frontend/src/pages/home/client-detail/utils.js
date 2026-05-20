export { normalizeSearchText } from "../../../utils/formatters";

export function normalizeExcelHeader(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function hasValue(value) {
  return value !== null && value !== undefined && String(value).trim() !== "";
}
