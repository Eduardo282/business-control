export function updateQuoteRequestCart(cart, productId, delta) {
  const key = String(productId);
  const currentQuantity = Number(cart?.[key]) || 0;
  const nextQuantity = Math.max(0, currentQuantity + Number(delta || 0));

  if (nextQuantity === 0) {
    const nextCart = { ...(cart || {}) };
    delete nextCart[key];
    return nextCart;
  }

  return {
    ...(cart || {}),
    [key]: nextQuantity,
  };
}

export function buildQuoteRequestItems(cart) {
  return Object.entries(cart || {})
    .map(([productId, quantity]) => ({
      product_id: productId,
      quantity: Number(quantity) || 0,
    }))
    .filter((item) => item.quantity > 0);
}

export function getQuoteRequestSummary(cart) {
  const items = buildQuoteRequestItems(cart);

  return {
    productCount: items.length,
    totalQuantity: items.reduce((total, item) => total + item.quantity, 0),
  };
}

