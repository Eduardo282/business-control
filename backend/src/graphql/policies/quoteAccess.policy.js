export function canContactAccessQuote(found, contactId) {
  return (
    String(found?.contact_id) === String(contactId) &&
    Boolean(found?.is_registered) &&
    Boolean(found?.is_sent_to_client_portal) &&
    !found?.is_deleted_portal
  );
}  
