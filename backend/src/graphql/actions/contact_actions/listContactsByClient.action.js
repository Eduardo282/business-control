import { listContactsByClient } from "../../../repositories/contact.repository.js";

export async function listContactsByClientAction(client_id) {
  const rows = await listContactsByClient(client_id);
  return rows.map((r) => ({
    ...r,
    has_portal_access: Boolean(r.has_portal_access),
    is_active: Boolean(r.is_active),
  }));
}
