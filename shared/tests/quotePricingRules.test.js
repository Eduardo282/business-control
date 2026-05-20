import { test } from "node:test";
import assert from "node:assert/strict";

import {
  calculateQuotePricing,
  normalizeDiscount,
  normalizeQuantity,
  roundMoney,
} from "../quotePricingRules.js";

test("normalizeQuantity clamps to at least 1", () => {
  assert.equal(normalizeQuantity(0), 1);
  assert.equal(normalizeQuantity(-5), 1);
  assert.equal(normalizeQuantity(3), 3);
});

test("normalizeDiscount clamps between 0 and 100", () => {
  assert.equal(normalizeDiscount(-2), 0);
  assert.equal(normalizeDiscount(55.5), 55.5);
  assert.equal(normalizeDiscount(200), 100);
  assert.equal(normalizeDiscount("nope"), 0);
});

test("roundMoney keeps 2 decimals", () => {
  assert.equal(roundMoney(12.3456), 12.35);
  assert.equal(roundMoney(12.344), 12.34);
});

test("calculateQuotePricing applies discount and iva", () => {
  const pricing = calculateQuotePricing({
    items: [{ product_id: 1, quantity: 2, discount: 10 }],
    products: [{ id: 1, name: "Service", category: "Cat", current_price: 100 }],
  });

  assert.equal(pricing.subtotal, 180);
  assert.equal(pricing.iva, 28.8);
  assert.equal(pricing.total, 208.8);
  assert.equal(pricing.grossSubtotal, 200);
  assert.equal(pricing.totalDiscount, 20);
  assert.equal(pricing.items[0].unit_price, 90);
  assert.equal(pricing.items[0].discount, 10);
});

test("calculateQuotePricing throws when product is missing", () => {
  assert.throws(() =>
    calculateQuotePricing({
      items: [{ product_id: 99, quantity: 1, discount: 0 }],
      products: [{ id: 1, name: "Service", category: "Cat", current_price: 100 }],
    }),
  );
});
