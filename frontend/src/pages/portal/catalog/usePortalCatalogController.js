import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { listPortalProductsApi, requestQuoteApi } from "../../../actionsAPI/portal.api";
import { logger } from "../../../services/logger";
import { groupProductsByName } from "../../home/products/productHelpers";
import {
  buildQuoteRequestItems,
  getQuoteRequestSummary,
  updateQuoteRequestCart,
} from "../quoteRequestCart";

export default function usePortalCatalogController() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [globalFilter, setGlobalFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [isCategoriesModalOpen, setIsCategoriesModalOpen] = useState(false);
  const [categoryPage, setCategoryPage] = useState(1);
  const [cart, setCart] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedProductByGroup, setSelectedProductByGroup] = useState({});
  const [activeFolioGroup, setActiveFolioGroup] = useState(null);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await listPortalProductsApi();
      setProducts(resp);
    } catch (e) {
      logger.error("Error loading portal catalog", e);
      Swal.fire({
        title: "Error",
        text: "No se pudieron cargar los productos",
        icon: "error",
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const displayProducts = useMemo(
    () => groupProductsByName(products, selectedProductByGroup),
    [products, selectedProductByGroup],
  );

  const tableData = useMemo(() => {
    let result = displayProducts;
    if (categoryFilter !== "ALL") {
      result = result.filter((p) => p.category === categoryFilter);
    }
    if (typeFilter !== "ALL") {
      result = result.filter((p) => (p.product_type || "PRODUCT") === typeFilter);
    }
    return result;
  }, [displayProducts, categoryFilter, typeFilter]);

  const updateCart = useCallback((productId, delta) => {
    setCart((prev) => updateQuoteRequestCart(prev, productId, delta));
  }, []);

  const getQuantity = useCallback((productId) => cart[productId] || 0, [cart]);

  const requestItems = useMemo(() => buildQuoteRequestItems(cart), [cart]);
  const { productCount: cartProductCount, totalQuantity: cartTotalItems } =
    useMemo(() => getQuoteRequestSummary(cart), [cart]);

  const cartLines = useMemo(() => {
    const productsById = new Map(
      products.map((product) => [String(product.id), product]),
    );

    return requestItems.map((item) => ({
      ...item,
      product: productsById.get(String(item.product_id)),
    }));
  }, [products, requestItems]);

  const handleRequestQuote = useCallback(async () => {
    if (requestItems.length === 0) return;

    const productLabel =
      cartProductCount === 1 ? "1 producto" : `${cartProductCount} productos`;
    const quantityLabel =
      cartTotalItems === 1 ? "1 unidad" : `${cartTotalItems} unidades`;

    const result = await Swal.fire({
      title: "¿Solicitar Cotización?",
      text: `Se solicitará cotización por ${productLabel} (${quantityLabel}). Un asesor te enviará la propuesta con precios.`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Sí, solicitar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#10b981",
    });
    if (!result.isConfirmed) return;

    setIsSubmitting(true);
    try {
      await requestQuoteApi(requestItems);
      await Swal.fire({
        title: "¡Solicitud Enviada!",
        text: "Hemos recibido tu solicitud. Pronto recibirás la cotización en tu correo y en este portal.",
        icon: "success",
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true,
      });
      setCart({});
      navigate("/portal/quotes?filter=recent");
    } catch (e) {
      Swal.fire({
        title: "Error",
        text: e.message || "Error al enviar solicitud",
        icon: "error",
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [cartProductCount, cartTotalItems, navigate, requestItems]);

  const categories = useMemo(
    () => [
      "ALL",
      ...Array.from(
        new Set(products.map((p) => p.category).filter(Boolean)),
      ).sort(),
    ],
    [products],
  );

  const CATEGORY_CHIPS_PAGE_SIZE = 12;
  const totalCategoryPages = Math.max(
    1,
    Math.ceil(categories.length / CATEGORY_CHIPS_PAGE_SIZE)
  );
  const safeCategoryPage = Math.min(categoryPage, totalCategoryPages);

  const visibleCategories = useMemo(() => {
    const start = (safeCategoryPage - 1) * CATEGORY_CHIPS_PAGE_SIZE;
    return categories.slice(start, start + CATEGORY_CHIPS_PAGE_SIZE);
  }, [categories, safeCategoryPage]);

  const handleSelectGroupProduct = useCallback((groupKey, product) => {
    setSelectedProductByGroup((current) => ({
      ...current,
      [groupKey]: product.id,
    }));
    setActiveFolioGroup(null);
  }, []);

  return {
    activeFolioGroup,
    cart,
    cartLines,
    cartProductCount,
    cartTotalItems,
    categories,
    categoryFilter,
    categoryPage,
    displayProducts,
    getQuantity,
    globalFilter,
    handleRequestQuote,
    handleSelectGroupProduct,
    isCategoriesModalOpen,
    isSubmitting,
    loading,
    products,
    requestItems,
    selectedProduct,
    selectedProductByGroup,
    setActiveFolioGroup,
    setCart,
    setCategoryFilter,
    setCategoryPage,
    setGlobalFilter,
    setIsCategoriesModalOpen,
    setSelectedProduct,
    setTypeFilter,
    tableData,
    totalCategoryPages,
    typeFilter,
    updateCart,
    visibleCategories,
  };
}
