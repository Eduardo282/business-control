export const IVA_RATE = 0.16;

/**
 * Round a numeric value to 2 decimals.
 * @param {number} value
 * @returns {number}
 */
export function roundMoney(value) {
  return Number((Number(value) || 0).toFixed(2));
}

/**
 * Normalize quantity to a positive integer (min 1).
 * @param {number} quantity
 * @returns {number}
 */
export function normalizeQuantity(quantity) {
  return Math.max(1, Number(quantity) || 1);
}

/**
 * Normalize discount to a percentage between 0 and 100.
 * @param {number} discount
 * @returns {number}
 */
export function normalizeDiscount(discount) {
  const numericDiscount = Number(discount);
  if (!Number.isFinite(numericDiscount)) return 0;
  return Math.min(100, Math.max(0, numericDiscount));
}

/**
 * Resolve the base unit price from item input or product data.
 * @param {object} item
 * @param {object|null} product
 * @returns {number}
 */
export function resolveBaseUnitPrice(item = {}, product = null) {
  const baseUnitPrice = Number(item.base_unit_price);
  const inputUnitPrice = Number(item.unit_price);
  const inputPrice = Number(item.price);
  const productPrice = Number(product?.current_price);

  if (Number.isFinite(baseUnitPrice) && baseUnitPrice > 0) {
    return baseUnitPrice;
  }

  if (Number.isFinite(inputUnitPrice) && inputUnitPrice > 0) {
    return inputUnitPrice;
  }

  if (Number.isFinite(inputPrice) && inputPrice > 0) {
    return inputPrice;
  }

  return Number.isFinite(productPrice) ? productPrice : 0;
}

/**
 * Calculate the discounted unit price.
 * @param {number} price
 * @param {number} discount
 * @returns {number}
 */
export function calculateDiscountedUnitPrice(price, discount = 0) {
  return roundMoney(
    resolveBaseUnitPrice({ price }) * (1 - normalizeDiscount(discount) / 100),
  );
}

/**
 * Calculate line total for an item.
 * @param {number} price
 * @param {number} quantity
 * @param {number} discount
 * @returns {number}
 */
export function calculateItemTotal(price, quantity, discount = 0) {
  return roundMoney(
    calculateDiscountedUnitPrice(price, discount) *
      normalizeQuantity(quantity),
  );
}

/**
 * Calculate full quote pricing including IVA, discounts, and totals.
 * @param {object} params
 * @param {Array<object>} params.items
 * @param {Array<object>} params.products
 * @returns {object}
 */
export function calculateQuotePricing({ items = [], products = [] }) {
  let subtotal = 0;
  const hasProductCatalog = products.length > 0;
  const productMap = new Map(
    products.map((product) => [String(product.id), product]),
  );

  const pricedItems = items.map((item) => {
    const product = productMap.get(String(item.product_id));

    if (hasProductCatalog && !product) {
      throw new Error(`Producto con ID ${item.product_id} no encontrado`);
    }

    const quantity = normalizeQuantity(item.quantity);
    const discount = normalizeDiscount(item.discount);
    const base_unit_price = roundMoney(resolveBaseUnitPrice(item, product));
    const unit_price = calculateDiscountedUnitPrice(base_unit_price, discount);
    const lineTotal = roundMoney(unit_price * quantity);

    subtotal += lineTotal;

    return {
      ...item,
      product_id: product?.id ?? item.product_id,
      product_name: product?.name ?? item.product_name,
      product_category: product?.category ?? item.product_category,
      product_type: product?.product_type ?? item.product_type,
      quantity,
      base_unit_price,
      unit_price,
      discounted_unit_price: unit_price,
      discount,
      total: lineTotal,
    };
  });

  const roundedSubtotal = roundMoney(subtotal);
  const iva = roundMoney(roundedSubtotal * IVA_RATE);
  const total = roundMoney(roundedSubtotal + iva);
  const grossSubtotal = roundMoney(
    pricedItems.reduce(
      (sum, item) => sum + item.base_unit_price * item.quantity,
      0,
    ),
  );
  const totalDiscount = roundMoney(Math.max(0, grossSubtotal - roundedSubtotal));

  return {
    items: pricedItems,
    grossSubtotal,
    totalDiscount,
    subtotal: roundedSubtotal,
    iva,
    total,
  };
}
