import {
  calculateItemTotal,
  normalizeDiscount,
  roundMoney,
} from "../../../../../shared/quotePricingRules.js";

let quoteItemIdSequence = 0;

export function createQuoteItemId() {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }

  quoteItemIdSequence += 1;
  return `quote-item-${Date.now()}-${quoteItemIdSequence}`;
}

/**
 * Create a new quote item from a product.
 * Uses a safe ID factory so local non-secure HTTP contexts do not break.
 *
 * @param {object} product - Product data with id, name, current_price
 * @param {number} quantity - Initial quantity (min 1)
 * @param {() => string} idFactory - ID generator
 * @returns {object} New quote item
 */
export function createQuoteItem(product, quantity = 1, idFactory = createQuoteItemId) {
  const safeQuantity = Math.max(1, Number(quantity) || 1);
  const price = roundMoney(product.current_price);

  return {
    tempId: idFactory(),
    product_id: product.id,
    name: product.name,
    price,
    discount: 0,
    quantity: safeQuantity,
    total: calculateItemTotal(price, safeQuantity, 0),
  };
}

/**
 * Add a product to the items list, or increase quantity if already present.
 *
 * @param {object[]} items - Current items array
 * @param {object} product - Product to add
 * @param {number} quantity - Quantity to add
 * @param {() => string} idFactory - ID generator
 * @returns {object[]} Updated items array (new reference)
 */
export function upsertQuoteItem(items, product, quantity = 1, idFactory) {
  const safeQuantity = Math.max(1, Number(quantity) || 1);
  const existing = items.find((item) => item.product_id === product.id);

  if (!existing) {
    return [...items, createQuoteItem(product, safeQuantity, idFactory)];
  }

  return items.map((item) => {
    if (item.product_id !== product.id) return item;

    const nextQuantity = item.quantity + safeQuantity;
    return {
      ...item,
      quantity: nextQuantity,
      total: calculateItemTotal(item.price, nextQuantity, item.discount),
    };
  });
}

/**
 * Update a draft quote item with partial changes (quantity, price, discount).
 * Recalculates totals automatically.
 *
 * @param {object} item - Current item
 * @param {object} patch - Fields to update
 * @returns {object} Updated item (new reference)
 */
export function updateQuoteItemDraft(item, patch) {
  const quantity = Math.max(1, Number.parseInt(patch.quantity ?? item.quantity, 10) || 1);
  const price = Math.max(0, roundMoney(patch.price ?? item.price));
  const discount = normalizeDiscount(patch.discount ?? item.discount);

  return {
    ...item,
    quantity,
    price,
    discount,
    total: calculateItemTotal(price, quantity, discount),
  };
}
