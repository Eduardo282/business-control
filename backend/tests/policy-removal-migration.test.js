import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import test from "node:test";
import mysql from "mysql2/promise";

test("retirement removes only business policies and preserves mixed quotes, sales and services", {
  skip: process.env.RUN_POLICY_REMOVAL_DB_TESTS !== "true",
}, async () => {
  const database = `bc_retirement_${randomUUID().replaceAll("-", "")}_test`;
  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST || "localhost",
    port: Number(process.env.MYSQL_PORT || 3306),
    user: process.env.MYSQL_USER || "root",
    password: process.env.MYSQL_PASSWORD || "",
    multipleStatements: true,
  });
  let created = false;
  try {
    await connection.query(`CREATE DATABASE \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    created = true;
    await connection.changeUser({ database });
    await connection.query(`
      CREATE TABLE products (id INT PRIMARY KEY, name VARCHAR(180), category VARCHAR(80), product_type VARCHAR(20));
      CREATE TABLE product_categories (id INT PRIMARY KEY, name VARCHAR(80), product_type VARCHAR(20));
      CREATE TABLE quotes (id INT PRIMARY KEY, total DECIMAL(10,2), notes VARCHAR(100));
      CREATE TABLE quote_items (id INT PRIMARY KEY, quote_id INT, product_id INT, total DECIMAL(10,2),
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE);
      CREATE TABLE sales (id INT PRIMARY KEY, total DECIMAL(10,2));
      CREATE TABLE sale_items (id INT PRIMARY KEY, sale_id INT, quote_item_id INT, product_id INT, total DECIMAL(10,2),
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        FOREIGN KEY (quote_item_id) REFERENCES quote_items(id) ON DELETE CASCADE);
      CREATE TABLE contact_products (id INT PRIMARY KEY, product_id INT,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE);
      CREATE TABLE services (id INT PRIMARY KEY, contact_product_id INT, product_id INT,
        FOREIGN KEY (contact_product_id) REFERENCES contact_products(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE);
      CREATE TABLE policies (id INT PRIMARY KEY, contact_product_id INT, product_id INT,
        FOREIGN KEY (contact_product_id) REFERENCES contact_products(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE);
      INSERT INTO products VALUES
        (1,'Servicio normal','Compartida','SERVICE'),
        (2,'Contrato anual','Compartida','POLICY'),
        (3,'Póliza antigua','Pólizas','PRODUCT'),
        (4,'CONTPAQi Contabilidad','Contabilidad','CONTPAQI'),
        (5,'Producto regular','General','PRODUCT');
      INSERT INTO product_categories VALUES
        (1,'Compartida','POLICY'),(2,'Pólizas','POLICY'),(3,'Contabilidad','CONTPAQI'),(4,'General','PRODUCT');
      INSERT INTO quotes VALUES (1,34.80,'Preservar'),(2,11.60,'Solo retirada'),(3,23.20,'Sin cambios');
      INSERT INTO quote_items VALUES (1,1,1,20),(2,1,2,10),(3,2,3,10),(4,3,5,20);
      INSERT INTO sales VALUES (1,34.80),(2,11.60),(3,23.20);
      INSERT INTO sale_items VALUES (1,1,1,1,20),(2,1,2,2,10),(3,2,3,3,10),(4,3,4,5,20);
      INSERT INTO contact_products VALUES (1,1),(2,2),(3,3);
      INSERT INTO services VALUES (1,1,1);
      INSERT INTO policies VALUES (1,2,2),(2,3,3);
    `);
    const sql = await readFile(new URL("../sql/migrations/025_remove_business_policies.sql", import.meta.url), "utf8");
    await connection.query(sql);
    const rows = async sql => (await connection.query(sql))[0];
    assert.deepEqual((await rows("SELECT id FROM products ORDER BY id")).map(p => p.id), [1, 4, 5]);
    assert.deepEqual(await rows("SELECT * FROM services"), [{ id: 1, contact_product_id: 1, product_id: 1 }]);
    assert.deepEqual(await rows("SELECT * FROM contact_products"), [{ id: 1, product_id: 1 }]);
    assert.deepEqual((await rows("SELECT id,total FROM quotes ORDER BY id")), [
      { id: 1, total: "23.20" }, { id: 2, total: "0.00" }, { id: 3, total: "23.20" },
    ]);
    assert.deepEqual(await rows("SELECT id,total FROM sales ORDER BY id"), await rows("SELECT id,total FROM quotes ORDER BY id"));
    assert.equal((await rows("SELECT notes FROM quotes WHERE id=1"))[0].notes, "Preservar");
    assert.deepEqual(await rows("SELECT id FROM quote_items ORDER BY id"), [{ id: 1 }, { id: 4 }]);
    assert.deepEqual(await rows("SELECT id FROM sale_items ORDER BY id"), [{ id: 1 }, { id: 4 }]);
    assert.deepEqual(await rows("SELECT id,product_type FROM product_categories ORDER BY id"), [
      { id: 1, product_type: "SERVICE" }, { id: 3, product_type: "CONTPAQI" }, { id: 4, product_type: "PRODUCT" },
    ]);
    assert.equal((await rows("SHOW TABLES LIKE 'policies'")).length, 0);
    await connection.query(sql);
    assert.equal((await rows("SELECT COUNT(*) n FROM products"))[0].n, 3);
  } finally {
    if (created) {
      assert.match(database, /^bc_retirement_[a-f0-9]{32}_test$/);
      await connection.query(`DROP DATABASE \`${database}\``);
    }
    await connection.end();
  }
});
