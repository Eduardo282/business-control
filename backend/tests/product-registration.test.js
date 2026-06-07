import { after, describe, test } from "node:test";
import assert from "node:assert/strict";

import { pool } from "../src/config/db.js";
import { createCategoryAction } from "../src/graphql/actions/product_actions/createCategory.action.js";
import { assignCategoryTypeAction } from "../src/graphql/actions/product_actions/assignCategoryType.action.js";
import { createProductAction } from "../src/graphql/actions/product_actions/createProduct.action.js";
import { normalizeCatalogProductType } from "../src/repositories/product.repository.js";

after(async () => {
  await pool.end();
});

const canRunIntegration = process.env.RUN_INTEGRATION_TESTS === "true";

describe("product registration catalog rules", () => {
  test("normalizes product type aliases before persistence", () => {
    assert.equal(normalizeCatalogProductType("contpaqi_product"), "CONTPAQI");
    assert.equal(normalizeCatalogProductType(" service "), "SERVICE");
    assert.equal(normalizeCatalogProductType("POLICY"), "POLICY");
    assert.equal(normalizeCatalogProductType("unknown"), "PRODUCT");
  });

  test(
    "registering a service persists folio, category type and history",
    { skip: !canRunIntegration },
    async () => {
      const suffix = Date.now();
      const category = `QA Servicios ${suffix}`;
      const productName = `QA Servicio ${suffix}`;
      let productId;

      try {
        const createdCategory = await createCategoryAction(category);
        assert.equal(createdCategory.name, category);

        const assignedCategory = await assignCategoryTypeAction(category, "SERVICE");
        assert.equal(assignedCategory.product_type, "SERVICE");

        const createdProduct = await createProductAction({
          name: productName,
          category,
          price: 1499.99,
          description: "Integration test service",
          users_count: 99,
          product_type: "SERVICE",
        });
        productId = createdProduct.id;

        assert.match(createdProduct.folio, /^SRV-\d{6}$/);
        assert.equal(createdProduct.product_type, "SERVICE");
        assert.equal(createdProduct.users_count, 1);
        assert.equal(createdProduct.update_version, 1);

        const [products] = await pool.query(
          `SELECT folio, product_type, current_price, users_count, update_version
           FROM products
           WHERE id = ?`,
          [productId],
        );
        assert.equal(products.length, 1);
        assert.equal(products[0].folio, createdProduct.folio);
        assert.equal(products[0].product_type, "SERVICE");
        assert.equal(Number(products[0].current_price), 1499.99);
        assert.equal(Number(products[0].users_count), 1);
        assert.equal(Number(products[0].update_version), 1);

        const [categories] = await pool.query(
          "SELECT product_type FROM product_categories WHERE name = ?",
          [category],
        );
        assert.equal(categories.length, 1);
        assert.equal(categories[0].product_type, "SERVICE");

        const [priceHistory] = await pool.query(
          "SELECT price FROM product_price_history WHERE product_id = ?",
          [productId],
        );
        assert.equal(priceHistory.length, 1);
        assert.equal(Number(priceHistory[0].price), 1499.99);

        const [updateHistory] = await pool.query(
          `SELECT update_version, change_type, summary
           FROM product_update_history
           WHERE product_id = ?`,
          [productId],
        );
        assert.equal(updateHistory.length, 1);
        assert.equal(Number(updateHistory[0].update_version), 1);
        assert.equal(updateHistory[0].change_type, "CREATED");
      } finally {
        if (productId) {
          await pool.query("DELETE FROM product_update_history WHERE product_id = ?", [productId]);
          await pool.query("DELETE FROM product_price_history WHERE product_id = ?", [productId]);
          await pool.query("DELETE FROM products WHERE id = ?", [productId]);
        }
        await pool.query("DELETE FROM product_categories WHERE name = ?", [category]);
      }
    },
  );
});
