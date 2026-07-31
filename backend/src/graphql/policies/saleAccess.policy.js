export function canContactAccessSale(sale, contactId) {
  return (
    sale &&
    String(sale.contact_id) === String(contactId) &&
    Boolean(sale.is_sent_to_client_portal) &&
    !sale.is_deleted_portal
  );
}
