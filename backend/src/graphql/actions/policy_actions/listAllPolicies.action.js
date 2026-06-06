import {
  getAssignedPolicies,
  getStandalonePolicies,
  getLegacyAssignedPolicies,
} from "../../../repositories/policy.repository.js";
import { determineStatus } from "../../../utils/policyStatus.js";

function mapPolicyRows(rows) {
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
      product_type: row.product_type || null,
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
      product_type: row.product_type || null,
    },
    contact: null,
    client: row.client_id ? {
      id: row.client_id,
      business_name: row.business_name,
    } : null,
  }));
}

export async function listAllPoliciesAction() {
  try {
    const cpRows = await getAssignedPolicies();
    const assignedResults = mapPolicyRows(cpRows);

    const standaloneRows = await getStandalonePolicies();
    const standaloneResults = mapStandaloneProducts(standaloneRows);

    return [...assignedResults, ...standaloneResults];
  } catch (error) {
    if (error.code !== "ER_NO_SUCH_TABLE") {
      throw error;
    }

    const legacyRows = await getLegacyAssignedPolicies();
    const assignedResults = mapPolicyRows(legacyRows);

    try {
      const standaloneRows = await getStandalonePolicies();
      const standaloneResults = mapStandaloneProducts(standaloneRows);
      return [...assignedResults, ...standaloneResults];
    } catch {
      return assignedResults;
    }
  }
}
