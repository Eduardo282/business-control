export function buildCreateQuoteUseCase({
  quoteRepository,
  pricingService,
  folioService,
  clock,
}) {
  const { fetchProductsForQuote, createQuoteWithItems } = quoteRepository;
  const { resolveQuoteFolio } = folioService;

  return async function createQuoteFromDraft({
    quoteDraft,
    actor,
    pricingService: activePricingService = pricingService,
  }) {
    const productIds = quoteDraft.items.map((item) => item.product_id);
    const products = await fetchProductsForQuote(productIds);
    const pricing = activePricingService.calculate({
      items: quoteDraft.items,
      products,
    });

    const folio = await resolveQuoteFolio({
      explicitFolio: quoteDraft.folio,
    });

    const quoteId = await createQuoteWithItems({
      folio,
      client_id: quoteDraft.client_id,
      contact_id: quoteDraft.contact_id,
      user_id: actor.user_id,
      total: pricing.total,
      notes: quoteDraft.notes,
      items: pricing.items,
    });

    return {
      id: quoteId,
      folio,
      client_id: quoteDraft.client_id,
      user_id: actor.user_id,
      total: pricing.total,
      subtotal: pricing.subtotal,
      iva: pricing.iva,
      status: "PENDIENTE",
      is_registered: false,
      notes: quoteDraft.notes,
      created_at: clock(),
    };
  };
}
