import {
  updateContactProductDatesTx,
} from "../../../repositories/policy.repository.js";

const ALLOWED_STATUS = new Set(["ACTIVE", "EXPIRED", "CANCELLED"]);

function normalizeStatus(status) {
  const normalized = String(status || "").trim().toUpperCase();
  return ALLOWED_STATUS.has(normalized) ? normalized : "ACTIVE";
}

/**
 * Actualiza vigencia y estado de un contact_product existente.
 * Si el ID empieza con "product-", significa que es un producto suelto
 * sin contact_product y no se puede actualizar por este medio.
 */
export async function updateContactProductDatesAction(id, { start_date, expiration_date, status, license_key }) {
  // Verificar que no sea un producto "suelto" (sin contact_product)
  if (String(id).startsWith("product-")) {
    throw new Error("Este servicio/póliza aún no tiene asignación. Asígnelo a un contacto primero para editar su vigencia.");
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

