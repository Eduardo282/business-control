import { useEffect, useMemo, useRef, useState } from "react";
import { listCategoriesApi } from "../../../actionsAPI/products.api";
import { logger } from "../../../services/logger";
import { CATALOG } from "./catalog";
import {
  createBuiltInCategories,
  createBuiltInProducts,
  getCategoryTypeKey,
  inferProductType,
  normalizeCatalogProductType,
  shouldReplaceCategoryType,
  toCatalogItem,
  uniqueByNormalizedValue,
  upsertCatalogItem,
} from "./productHelpers";

export default function useProductCatalog() {
  const [customCategories, setCustomCategories] = useState([]);
  const [customPolicies, setCustomPolicies] = useState([]);
  const [customGeneralProducts, setCustomGeneralProducts] = useState([]);
  const [customContpaqiProducts, setCustomContpaqiProducts] = useState([]);
  const [customServices, setCustomServices] = useState([]);
  const [categoryTypeByName, setCategoryTypeByName] = useState({});

  const prevCustomCategoriesRef = useRef([]);

  useEffect(() => {
    prevCustomCategoriesRef.current = customCategories;
  }, [customCategories]);

  useEffect(() => {
    async function loadCategoriesFromAPI() {
      try {
        const { listProductsApi } = await import("../../../actionsAPI/products.api");
        const apiProducts = await listProductsApi();
        const apiCategories = apiProducts.map((p) => p.category);

        setCategoryTypeByName((prev) => {
          const next = { ...prev };
          apiProducts.forEach((product) => {
            const categoryKey = getCategoryTypeKey(product.category);
            const productType = inferProductType(product);
            if (!categoryKey) return;
            if (shouldReplaceCategoryType(next[categoryKey], productType)) {
              next[categoryKey] = productType;
            }
          });
          return next;
        });

        const apiServices = apiProducts.filter(
          (product) => inferProductType(product) === "SERVICE"
        );
        if (apiServices.length > 0) {
          setCustomServices((prev) => {
            let next = prev || [];
            apiServices.forEach((apiService) => {
              next = upsertCatalogItem(next, toCatalogItem(apiService));
            });
            return next;
          });
        }

        const apiPolicies = apiProducts.filter(
          (product) => inferProductType(product) === "POLICY"
        );
        if (apiPolicies.length > 0) {
          setCustomPolicies((prev) => {
            let next = prev || [];
            apiPolicies.forEach((apiPolicy) => {
              next = upsertCatalogItem(next, toCatalogItem(apiPolicy));
            });
            return next;
          });
        }

        const apiContpaqiProducts = apiProducts.filter(
          (product) => inferProductType(product) === "CONTPAQI"
        );
        if (apiContpaqiProducts.length > 0) {
          setCustomContpaqiProducts((prev) => {
            let next = prev || [];
            apiContpaqiProducts.forEach((apiProduct) => {
              next = upsertCatalogItem(next, toCatalogItem(apiProduct));
            });
            return next;
          });
        }

        const apiGeneralProducts = apiProducts.filter(
          (product) => inferProductType(product) === "PRODUCT"
        );
        if (apiGeneralProducts.length > 0) {
          setCustomGeneralProducts((prev) => {
            let next = prev || [];
            apiGeneralProducts.forEach((apiProduct) => {
              next = upsertCatalogItem(next, toCatalogItem(apiProduct));
            });
            return next;
          });
        }

        const allCategories = uniqueByNormalizedValue([
          ...apiCategories,
          ...prevCustomCategoriesRef.current,
        ]);
        setCustomCategories((prev) =>
          uniqueByNormalizedValue([...prev, ...allCategories])
        );
      } catch (error) {
        logger.error("Failed to load categories from API", error);
      }
    }

    loadCategoriesFromAPI();
  }, []);

  const builtInCategories = useMemo(() => createBuiltInCategories(CATALOG), []);
  const builtInProducts = useMemo(() => createBuiltInProducts(CATALOG), []);

  const availableCategories = useMemo(
    () => uniqueByNormalizedValue([...builtInCategories, ...customCategories]),
    [builtInCategories, customCategories]
  );

  useEffect(() => {
    async function fetchCategories() {
      try {
        const categories = await listCategoriesApi();
        setCustomCategories((prev) =>
          uniqueByNormalizedValue([...categories.map((category) => category.name), ...prev])
        );
        setCategoryTypeByName((prev) => {
          const next = { ...prev };
          categories.forEach((category) => {
            const key = getCategoryTypeKey(category.name);
            const type = normalizeCatalogProductType(category.product_type);
            if (key && type) next[key] = type;
          });
          return next;
        });
      } catch (error) {
        console.warn(
          "No se pudieron cargar categorías desde el servidor:",
          error.message
        );
      }
    }

    fetchCategories();
  }, []);

  const mergeCategories = (categories) => {
    setCustomCategories((prev) => uniqueByNormalizedValue([...categories, ...prev]));
  };

  const setCategoryType = (category, productType) => {
    setCategoryTypeByName((prev) => ({
      ...prev,
      [getCategoryTypeKey(category)]: productType,
    }));
  };

  const upsertProduct = (productType, item) => {
    if (productType === "SERVICE") {
      setCustomServices((prev) => upsertCatalogItem(prev, item));
    } else if (productType === "POLICY") {
      setCustomPolicies((prev) => upsertCatalogItem(prev, item));
    } else if (productType === "CONTPAQI") {
      setCustomContpaqiProducts((prev) => upsertCatalogItem(prev, item));
    } else {
      setCustomGeneralProducts((prev) => upsertCatalogItem(prev, item));
    }
  };

  return {
    availableCategories,
    builtInProducts,
    categoryTypeByName,
    customContpaqiProducts,
    customGeneralProducts,
    customPolicies,
    customServices,
    mergeCategories,
    setCategoryType,
    upsertProduct,
  };
}
