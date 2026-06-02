import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  createQuoteItem,
  upsertQuoteItem,
  updateQuoteItemDraft,
} from "../../frontend/src/features/quotes/domain/quoteItems.js";

describe("createQuoteItem", () => {
  const fakeId = () => "test-uuid-1";
  const product = { id: 42, name: "Cloud ERP", current_price: 999.99 };

  it("creates an item with correct defaults", () => {
    const item = createQuoteItem(product, 1, fakeId);
    assert.equal(item.tempId, "test-uuid-1");
    assert.equal(item.product_id, 42);
    assert.equal(item.name, "Cloud ERP");
    assert.equal(item.price, 999.99);
    assert.equal(item.discount, 0);
    assert.equal(item.quantity, 1);
    assert.equal(item.total, 999.99);
  });

  it("clamps quantity to at least 1", () => {
    const item = createQuoteItem(product, -5, fakeId);
    assert.equal(item.quantity, 1);
  });

  it("handles NaN quantity", () => {
    const item = createQuoteItem(product, NaN, fakeId);
    assert.equal(item.quantity, 1);
  });
});

describe("upsertQuoteItem", () => {
  const fakeId = () => "test-uuid-2";
  const product = { id: 10, name: "Nómina", current_price: 500.0 };

  it("adds new item when not present", () => {
    const items = upsertQuoteItem([], product, 3, fakeId);
    assert.equal(items.length, 1);
    assert.equal(items[0].quantity, 3);
    assert.equal(items[0].product_id, 10);
  });

  it("increases quantity when product already exists", () => {
    const initial = [createQuoteItem(product, 2, fakeId)];
    const updated = upsertQuoteItem(initial, product, 3, fakeId);
    assert.equal(updated.length, 1);
    assert.equal(updated[0].quantity, 5);
  });
});

describe("updateQuoteItemDraft", () => {
  const baseItem = {
    tempId: "x",
    product_id: 1,
    name: "Test",
    price: 100,
    discount: 10,
    quantity: 2,
    total: 180,
  };

  it("updates quantity and recalculates total", () => {
    const updated = updateQuoteItemDraft(baseItem, { quantity: 5 });
    assert.equal(updated.quantity, 5);
    assert.equal(updated.price, 100);
    assert.equal(updated.discount, 10);
    // total = 100 * 5 * (1 - 10/100) = 450
    assert.equal(updated.total, 450);
  });

  it("clamps negative price to 0", () => {
    const updated = updateQuoteItemDraft(baseItem, { price: -50 });
    assert.equal(updated.price, 0);
  });

  it("clamps discount to 0-100", () => {
    const updated = updateQuoteItemDraft(baseItem, { discount: 150 });
    assert.equal(updated.discount, 100);
  });
});
