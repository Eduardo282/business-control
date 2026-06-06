import { createQuoteWithItems, fetchProductsForQuote } from "../../../repositories/quote.repository.js";
import { createQuoteActor, createQuoteDraft } from "../../../services/quoteDraft.service.js";
import { quotePricingService } from "../../../services/quotePricing.service.js";
import { resolveQuoteFolio } from "./quoteFolio.js";

export const createQuoteAction = async (input, user) => {
  const quoteDraft = createQuoteDraft(input);
  const actor = createQuoteActor(user);

  return createQuoteFromDraft({
    quoteDraft,
    actor,
    pricingService: quotePricingService,
  });
};

export const createQuoteFromDraft = async ({
  quoteDraft,
  actor,
  pricingService = quotePricingService,
}) => {
  const productIds = quoteDraft.items.map((item) => item.product_id);
  const products = await fetchProductsForQuote(productIds);
  const pricing = pricingService.calculate({
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
    status: "PENDING",
    is_registered: false,
    notes: quoteDraft.notes,
    created_at: new Date(),
  };
};
