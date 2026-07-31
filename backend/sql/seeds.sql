-- Roles base.
INSERT IGNORE INTO roles (name)
VALUES ('ADMIN'), ('VENTAS'), ('SOPORTE'), ('CONTACTO');

-- Usuarios demo.
-- admin@businesscontrol.com / Admin123*
-- ventas@businesscontrol.com / Password123*
-- soporte@businesscontrol.com / Password123*
INSERT INTO users (role_id, full_name, email, telefono, password_hash)
SELECT r.id, 'Administrador', 'admin@businesscontrol.com', '555-000-0000',
       '$2a$10$/2bZf8v74shgLeu4bShB5.5R5JJdkIRtCGhJSDFbnZr6RaXqxaLQu'
FROM roles r
WHERE r.name = 'ADMIN'
ON DUPLICATE KEY UPDATE
  role_id = VALUES(role_id),
  full_name = VALUES(full_name),
  telefono = VALUES(telefono);

INSERT INTO users (role_id, full_name, email, telefono, password_hash)
SELECT r.id, 'Vendedor Demo', 'ventas@businesscontrol.com', '555-111-0000',
       '$2a$10$xIzfSV1VMZV32R5i6QS2M./uI2LTVCtkFS5r2rOJ1wXOYagwH7QGu'
FROM roles r
WHERE r.name = 'VENTAS'
ON DUPLICATE KEY UPDATE
  role_id = VALUES(role_id),
  full_name = VALUES(full_name),
  telefono = VALUES(telefono);

INSERT INTO users (role_id, full_name, email, telefono, password_hash)
SELECT r.id, 'Soporte Tecnico', 'soporte@businesscontrol.com', '555-222-0000',
       '$2a$10$xIzfSV1VMZV32R5i6QS2M./uI2LTVCtkFS5r2rOJ1wXOYagwH7QGu'
FROM roles r
WHERE r.name = 'SOPORTE'
ON DUPLICATE KEY UPDATE
  role_id = VALUES(role_id),
  full_name = VALUES(full_name),
  telefono = VALUES(telefono);

SET @admin_id := (SELECT id FROM users WHERE email = 'admin@businesscontrol.com' LIMIT 1);

INSERT INTO clients (
  created_by_user_id,
  business_name,
  rfc,
  email1,
  email2,
  celular,
  telefono,
  codigo_postal,
  ciudad,
  address
)
SELECT
  @admin_id,
  'Empresa Cliente Demo',
  'XAXX010101000',
  'contacto@cliente.com',
  'compras@cliente.com',
  '555-333-4444',
  '555-333-0000',
  '64000',
  'Monterrey',
  'Av. Demo 123'
WHERE NOT EXISTS (
  SELECT 1 FROM clients WHERE business_name = 'Empresa Cliente Demo'
);

SET @client_id := (SELECT id FROM clients WHERE business_name = 'Empresa Cliente Demo' LIMIT 1);

INSERT INTO client_contacts (
  client_id,
  full_name,
  email,
  phone,
  position_title,
  has_portal_access,
  portal_password_hash
)
SELECT
  @client_id,
  'Contacto Demo Portal',
  'contacto@cliente.com',
  '555-111-2222',
  'Compras',
  1,
  '$2a$10$xIzfSV1VMZV32R5i6QS2M./uI2LTVCtkFS5r2rOJ1wXOYagwH7QGu'
WHERE NOT EXISTS (
  SELECT 1 FROM client_contacts WHERE email = 'contacto@cliente.com'
);

UPDATE client_contacts
SET
  client_id = @client_id,
  full_name = 'Contacto Demo Portal',
  phone = '555-111-2222',
  position_title = 'Compras',
  has_portal_access = 1,
  portal_password_hash = '$2a$10$xIzfSV1VMZV32R5i6QS2M./uI2LTVCtkFS5r2rOJ1wXOYagwH7QGu'
WHERE email = 'contacto@cliente.com';

-- Catalogo de productos base.
INSERT INTO products (name, category, current_price, description, users_count, client_id)
SELECT 'Licencia Anual ERP', 'Licencias', 12000.00, 'Acceso completo al sistema ERP por 1 anio. Incluye soporte estandar.', 5, NULL
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Licencia Anual ERP');

INSERT INTO products (name, category, current_price, description, users_count, client_id)
SELECT 'Poliza de Soporte Premium', 'Servicios', 5000.00, 'Soporte 24/7 y tiempo de respuesta menor a 2 horas.', 0, NULL
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Poliza de Soporte Premium');

INSERT INTO products (name, category, current_price, description, users_count, client_id)
SELECT 'Modulo de Facturacion', 'Add-ons', 3500.00, 'Timbrado ilimitado.', 0, NULL
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Modulo de Facturacion');

INSERT INTO products (name, category, current_price, description, users_count, client_id)
SELECT 'Instalacion en Sitio', 'Servicios', 2500.00, 'Visita tecnica para configuracion de servidores.', 0, NULL
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Instalacion en Sitio');

INSERT INTO products (name, category, current_price, description, users_count, client_id)
SELECT 'Servicio Personalizado Demo', 'Servicio Personalizado', 1800.00, 'Servicio asignable a contacto para pruebas.', 0, NULL
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Servicio Personalizado Demo');

INSERT INTO products (name, category, current_price, description, users_count, client_id)
SELECT 'Poliza Personalizada Demo', 'Poliza Personalizada', 4200.00, 'Poliza asignable a contacto para pruebas.', 0, NULL
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Poliza Personalizada Demo');

INSERT INTO products (name, category, current_price, description, users_count, client_id)
SELECT 'CONTPAQi Contabilidad (Desktop)', 'Contabilidad y Finanzas', 4590.00, 'Licencia oficial CONTPAQi', 1, NULL
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'CONTPAQi Contabilidad (Desktop)');

INSERT INTO products (name, category, current_price, description, users_count, client_id)
SELECT 'CONTPAQi Contabiliza (Nube)', 'Contabilidad y Finanzas', 3890.00, 'Licencia oficial CONTPAQi', 1, NULL
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'CONTPAQi Contabiliza (Nube)');

INSERT INTO products (name, category, current_price, description, users_count, client_id)
SELECT 'CONTPAQi Bancos (Desktop)', 'Contabilidad y Finanzas', 3590.00, 'Licencia oficial CONTPAQi', 1, NULL
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'CONTPAQi Bancos (Desktop)');

INSERT INTO products (name, category, current_price, description, users_count, client_id)
SELECT 'CONTPAQi Analiza (Nube)', 'Contabilidad y Finanzas', 2990.00, 'Licencia oficial CONTPAQi', 1, NULL
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'CONTPAQi Analiza (Nube)');

INSERT INTO products (name, category, current_price, description, users_count, client_id)
SELECT 'CONTPAQi Nominas (Desktop)', 'Nominas y Recursos Humanos', 4890.00, 'Licencia oficial CONTPAQi', 1, NULL
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'CONTPAQi Nominas (Desktop)');

INSERT INTO products (name, category, current_price, description, users_count, client_id)
SELECT 'CONTPAQi Personia (Nube)', 'Nominas y Recursos Humanos', 3290.00, 'Licencia oficial CONTPAQi', 1, NULL
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'CONTPAQi Personia (Nube)');

INSERT INTO products (name, category, current_price, description, users_count, client_id)
SELECT 'CONTPAQi Evalua 035', 'Nominas y Recursos Humanos', 2500.00, 'Licencia oficial CONTPAQi', 1, NULL
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'CONTPAQi Evalua 035');

INSERT INTO products (name, category, current_price, description, users_count, client_id)
SELECT 'CONTPAQi Colabora', 'Nominas y Recursos Humanos', 1500.00, 'Licencia oficial CONTPAQi', 1, NULL
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'CONTPAQi Colabora');

INSERT INTO products (name, category, current_price, description, users_count, client_id)
SELECT 'CONTPAQi Comercial (Start, Pro y Premium)', 'Comercial y Ventas', 5290.00, 'Licencia oficial CONTPAQi', 1, NULL
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'CONTPAQi Comercial (Start, Pro y Premium)');

INSERT INTO products (name, category, current_price, description, users_count, client_id)
SELECT 'CONTPAQi Factura Electronica', 'Comercial y Ventas', 2890.00, 'Licencia oficial CONTPAQi', 1, NULL
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'CONTPAQi Factura Electronica');

INSERT INTO products (name, category, current_price, description, users_count, client_id)
SELECT 'CONTPAQi Vende (Nube)', 'Comercial y Ventas', 2190.00, 'Licencia oficial CONTPAQi', 1, NULL
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'CONTPAQi Vende (Nube)');

INSERT INTO products (name, category, current_price, description, users_count, client_id)
SELECT 'CONTPAQi Cobra', 'Comercial y Ventas', 1890.00, 'Licencia oficial CONTPAQi', 1, NULL
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'CONTPAQi Cobra');

INSERT INTO products (name, category, current_price, description, users_count, client_id)
SELECT 'CONTPAQi XML en Linea+', 'Herramientas de Productividad y Nube', 1990.00, 'Licencia oficial CONTPAQi', 1, NULL
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'CONTPAQi XML en Linea+');

INSERT INTO products (name, category, current_price, description, users_count, client_id)
SELECT 'CONTPAQi Escritorio Virtual', 'Herramientas de Productividad y Nube', 890.00, 'Licencia oficial CONTPAQi', 1, NULL
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'CONTPAQi Escritorio Virtual');

INSERT INTO products (name, category, current_price, description, users_count, client_id)
SELECT 'CONTPAQi Respaldos', 'Herramientas de Productividad y Nube', 1290.00, 'Licencia oficial CONTPAQi', 1, NULL
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'CONTPAQi Respaldos');

UPDATE products
SET product_type = 'POLICY'
WHERE UPPER(COALESCE(product_type, 'PRODUCT')) = 'PRODUCT'
  AND (
    UPPER(COALESCE(name, '')) LIKE '%POLIZA%'
    OR UPPER(COALESCE(category, '')) LIKE '%POLIZA%'
  );

UPDATE products
SET product_type = 'SERVICE'
WHERE UPPER(COALESCE(product_type, 'PRODUCT')) = 'PRODUCT'
  AND (
    UPPER(COALESCE(name, '')) LIKE '%SERVICIO%'
    OR UPPER(COALESCE(category, '')) LIKE '%SERVICIO%'
  );

UPDATE products
SET product_type = 'CONTPAQI'
WHERE UPPER(COALESCE(product_type, 'PRODUCT')) = 'PRODUCT'
  AND UPPER(COALESCE(name, '')) LIKE '%CONTPAQI%';

INSERT INTO product_categories (name, product_type)
SELECT
  category AS name,
  CASE
    WHEN SUM(UPPER(COALESCE(product_type, 'PRODUCT')) = 'SERVICE') > 0 THEN 'SERVICE'
    WHEN SUM(UPPER(COALESCE(product_type, 'PRODUCT')) = 'POLICY') > 0 THEN 'POLICY'
    WHEN SUM(
      UPPER(COALESCE(product_type, 'PRODUCT')) = 'CONTPAQI'
      OR UPPER(COALESCE(name, '')) LIKE '%CONTPAQI%'
    ) > 0 THEN 'CONTPAQI'
    ELSE 'PRODUCT'
  END AS product_type
FROM products
WHERE category IS NOT NULL AND TRIM(category) <> ''
GROUP BY category
ON DUPLICATE KEY UPDATE
  product_type = COALESCE(product_categories.product_type, VALUES(product_type));

INSERT INTO product_price_history (product_id, price)
SELECT p.id, p.current_price
FROM products p
WHERE NOT EXISTS (
  SELECT 1
  FROM product_price_history h
  WHERE h.product_id = p.id
);

UPDATE products
SET folio = CONCAT(
  CASE
    WHEN UPPER(COALESCE(product_type, 'PRODUCT')) = 'SERVICE' THEN 'SRV'
    WHEN UPPER(COALESCE(product_type, 'PRODUCT')) = 'POLICY' THEN 'POL'
    ELSE 'PRD'
  END,
  '-',
  LPAD(id, 6, '0')
)
WHERE folio IS NULL OR TRIM(folio) = '';

INSERT INTO product_update_history (product_id, update_version, change_type, summary, changed_at)
SELECT
  p.id,
  GREATEST(COALESCE(p.update_version, 1), 1),
  'CREATED',
  'Registro inicial del producto',
  COALESCE(p.created_at, CURRENT_TIMESTAMP)
FROM products p
WHERE NOT EXISTS (
  SELECT 1
  FROM product_update_history puh
  WHERE puh.product_id = p.id
);

SET @contact_id := (SELECT id FROM client_contacts WHERE email = 'contacto@cliente.com' LIMIT 1);
SET @service_product_id := (SELECT id FROM products WHERE name = 'Servicio Personalizado Demo' LIMIT 1);
SET @policy_product_id := (SELECT id FROM products WHERE name = 'Poliza Personalizada Demo' LIMIT 1);
SET @license_product_id := (SELECT id FROM products WHERE name = 'CONTPAQi Contabilidad (Desktop)' LIMIT 1);

INSERT INTO contact_products (client_id, contact_id, product_id, license_key, start_date, expiration_date, status)
SELECT @client_id, @contact_id, @license_product_id, 'LIC-DEMO-001', CURDATE(), DATE_ADD(CURDATE(), INTERVAL 1 YEAR), 'ACTIVE'
WHERE @contact_id IS NOT NULL
  AND @license_product_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM contact_products
    WHERE contact_id = @contact_id
      AND product_id = @license_product_id
      AND license_key = 'LIC-DEMO-001'
  );

INSERT INTO contact_products (client_id, contact_id, product_id, license_key, start_date, expiration_date, status)
SELECT @client_id, @contact_id, @service_product_id, 'SRV-DEMO-001', CURDATE(), DATE_ADD(CURDATE(), INTERVAL 6 MONTH), 'ACTIVE'
WHERE @contact_id IS NOT NULL
  AND @service_product_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM contact_products
    WHERE contact_id = @contact_id
      AND product_id = @service_product_id
      AND license_key = 'SRV-DEMO-001'
  );

INSERT INTO contact_products (client_id, contact_id, product_id, license_key, start_date, expiration_date, status)
SELECT @client_id, @contact_id, @policy_product_id, 'POL-DEMO-001', CURDATE(), DATE_ADD(CURDATE(), INTERVAL 1 YEAR), 'ACTIVE'
WHERE @contact_id IS NOT NULL
  AND @policy_product_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM contact_products
    WHERE contact_id = @contact_id
      AND product_id = @policy_product_id
      AND license_key = 'POL-DEMO-001'
  );

INSERT INTO services (
  contact_product_id,
  client_id,
  contact_id,
  product_id,
  folio,
  start_date,
  expiration_date,
  status
)
SELECT
  cp.id,
  cp.client_id,
  cp.contact_id,
  cp.product_id,
  cp.license_key,
  cp.start_date,
  cp.expiration_date,
  cp.status
FROM contact_products cp
JOIN products p ON p.id = cp.product_id
LEFT JOIN services s ON s.contact_product_id = cp.id
WHERE s.id IS NULL
  AND LOWER(TRIM(REPLACE(REPLACE(REPLACE(p.category, 'á', 'a'), 'Á', 'a'), 'ó', 'o'))) = 'servicio personalizado';

INSERT INTO policies (
  contact_product_id,
  client_id,
  contact_id,
  product_id,
  folio,
  start_date,
  expiration_date,
  status
)
SELECT
  cp.id,
  cp.client_id,
  cp.contact_id,
  cp.product_id,
  cp.license_key,
  cp.start_date,
  cp.expiration_date,
  cp.status
FROM contact_products cp
JOIN products p ON p.id = cp.product_id
LEFT JOIN policies pol ON pol.contact_product_id = cp.id
WHERE pol.id IS NULL
  AND LOWER(TRIM(REPLACE(REPLACE(REPLACE(p.category, 'á', 'a'), 'Á', 'a'), 'ó', 'o'))) = 'poliza personalizada';

SET @quote_product_id := (SELECT id FROM products WHERE name = 'Licencia Anual ERP' LIMIT 1);
SET @quote_demo_folio := 'DEMO001';

INSERT INTO quotes (
  folio,
  client_id,
  contact_id,
  user_id,
  total,
  notes,
  status,
  is_sent_to_client_portal,
  notification_read
)
SELECT
  @quote_demo_folio,
  @client_id,
  @contact_id,
  @admin_id,
  12000.00,
  'Cotizacion demo generada desde el setup SQL.',
  'PENDIENTE',
  1,
  0
WHERE @client_id IS NOT NULL
  AND @admin_id IS NOT NULL
  AND @quote_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM quotes WHERE notes = 'Cotizacion demo generada desde el setup SQL.');

SET @quote_id := (SELECT id FROM quotes WHERE notes = 'Cotizacion demo generada desde el setup SQL.' LIMIT 1);

INSERT INTO quote_items (
  quote_id,
  product_id,
  quantity,
  base_unit_price,
  unit_price,
  discount,
  total
)
SELECT
  @quote_id,
  @quote_product_id,
  1,
  12000.00,
  12000.00,
  0.00,
  12000.00
WHERE @quote_id IS NOT NULL
  AND @quote_product_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM quote_items
    WHERE quote_id = @quote_id
      AND product_id = @quote_product_id
  );

-- Login resumen:
-- Admin interno: admin@businesscontrol.com / Admin123*
-- Ventas: ventas@businesscontrol.com / Password123*
-- Soporte: soporte@businesscontrol.com / Password123*
-- Portal cliente: contacto@cliente.com / Password123*

SET SQL_SAFE_UPDATES = 1;
