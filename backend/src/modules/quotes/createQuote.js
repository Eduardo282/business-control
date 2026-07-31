import {
  createQuoteWithItems,
  fetchProductsForQuote,
} from "../../repositories/quote.repository.js";
import { quotePricingService } from "../../services/quotePricing.service.js";
import { buildCreateQuoteUseCase } from "./application/createQuote.usecase.js";
import { createQuoteActor, createQuoteDraft } from "./domain/quoteDraft.js";
import { resolveQuoteFolio } from "./infrastructure/quoteFolio.js";

export const createQuoteFromDraft = buildCreateQuoteUseCase({
  quoteRepository: {
    fetchProductsForQuote,
    createQuoteWithItems,
  },
  pricingService: quotePricingService,
  folioService: {
    resolveQuoteFolio,
  },
  clock: () => new Date(),
});

export function buildCreateQuoteAction({
  createQuoteDraft: mapQuoteDraft,
  createQuoteActor: mapQuoteActor,
  createQuoteFromDraft: executeCreateQuoteFromDraft,
  pricingService,
}) {
  return async function createQuoteAction(input, user) {
    const quoteDraft = mapQuoteDraft(input);
    const actor = mapQuoteActor(user);

    return executeCreateQuoteFromDraft({
      quoteDraft,
      actor,
      pricingService,
    });
  };
}

export const createQuoteAction = buildCreateQuoteAction({
  createQuoteDraft,
  createQuoteActor,
  createQuoteFromDraft,
  pricingService: quotePricingService,
});
