export function createQuoteDraft(input = {}) {
  const { client_id, contact_id, items = [], notes = null, folio = null } = input;

  return {
    client_id,
    contact_id,
    items: Array.isArray(items) ? items : [],
    notes,
    folio,
  };
}

export function createQuoteActor(user = {}) {
  return {
    user_id: user.id || user.userId,
  };
}
