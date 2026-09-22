import {
  getAssignedServices,
  getLegacyAssignedServices,
  getStandaloneServices,
  updateContactProductDatesTx,
} from "../../repositories/service.repository.js";
import { determineStatus, normalizeProductType } from "../../utils/serviceStatus.js";

const ALLOWED_STATUS = new Set(["ACTIVE", "EXPIRED", "CANCELLED"]);

function normalizeStatus(status) {
  const normalized = String(status || "").trim().toUpperCase();
  return ALLOWED_STATUS.has(normalized) ? normalized : "ACTIVE";
}

function mapServiceRows(rows) {
  return rows.map((row) => ({
    id: row.contact_product_id,
    contact_id: row.contact_id,
    client_id: row.client_id,
    license_key: row.license_key,
    start_date: row.start_date ? new Date(row.start_date).toISOString() : null,
    expiration_date: row.expiration_date ? new Date(row.expiration_date).toISOString() : null,
    status: determineStatus(row.status, row.expiration_date),
    product: {
      id: row.product_id,
      folio: row.product_folio,
      name: row.product_name,
      category: row.product_category,
      current_price: row.current_price,
      product_type: normalizeProductType(row),
    },
    contact: row.contact_id ? {
      id: row.contact_id,
      client_id: row.client_id,
      full_name: row.contact_name,
      email: row.contact_email,
    } : null,
    client: row.client_id ? {
      id: row.client_id,
      business_name: row.business_name,
    } : null,
  }));
}

function mapStandaloneProducts(rows) {
  const now = new Date();
  const oneYearLater = new Date(now);
  oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);

  return rows.map((row) => ({
    id: `product-${row.product_id}`,
    contact_id: null,
    client_id: row.client_id || null,
    license_key: null,
    start_date: now.toISOString(),
    expiration_date: oneYearLater.toISOString(),
    status: "ACTIVE",
    product: {
      id: row.product_id,
      folio: row.product_folio,
      name: row.product_name,
      category: row.product_category,
      current_price: row.current_price,
      product_type: normalizeProductType(row),
    },
    contact: null,
    client: row.client_id ? {
      id: row.client_id,
      business_name: row.business_name,
    } : null,
  }));
}

/**
 * Lists all assigned and standalone services.
 */
export async function listAllServicesAction() {
  try {
    const cpRows = await getAssignedServices();
    const assignedResults = mapServiceRows(cpRows);

    const standaloneRows = await getStandaloneServices();
    const standaloneResults = mapStandaloneProducts(standaloneRows);

    return [...assignedResults, ...standaloneResults];
  } catch (error) {
    if (error.code !== "ER_NO_SUCH_TABLE") {
      throw error;
    }

    const legacyRows = await getLegacyAssignedServices();
    const assignedResults = mapServiceRows(legacyRows);

    try {
      const standaloneRows = await getStandaloneServices();
      const standaloneResults = mapStandaloneProducts(standaloneRows);
      return [...assignedResults, ...standaloneResults];
    } catch {
      return assignedResults;
    }
  }
}

/**
 * Updates expiration dates, status, or license key of a service assignment.
 */
export async function updateContactProductDatesAction(id, { start_date, expiration_date, status, license_key }) {
  if (String(id).startsWith("product-")) {
    throw new Error("Este servicio aún no tiene asignación. Asígnelo a un contacto primero para editar su vigencia.");
  }

  const normalizedStatus = status !== undefined && status !== null ? normalizeStatus(status) : undefined;

  const row = await updateContactProductDatesTx(id, {
    start_date,
    expiration_date,
    status: normalizedStatus,
    license_key,
  });

  return {
    id: row.id,
    contact_id: row.contact_id,
    client_id: row.client_id,
    license_key: row.license_key,
    start_date: row.start_date ? new Date(row.start_date).toISOString() : null,
    expiration_date: row.expiration_date ? new Date(row.expiration_date).toISOString() : null,
    status: row.status,
    product: {
      id: row.product_id,
      name: row.product_name,
      category: row.product_category,
    },
  };
}
