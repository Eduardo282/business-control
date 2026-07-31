import { describe, expect, it } from "vitest";
import {
  buildProductSuccessMessage,
  categoryMatches,
  createBuiltInCategories,
  createBuiltInProducts,
  getFormLabels,
  getProductTypeLabel,
  inferProductType,
  isServiceProductMode,
  normalizeCatalogProductType,
  normalizeServicePolicyCategory,
  sanitizeCategoryLabel,
  uniqueByNormalizedValue,
  upsertCatalogItem,
} from "./productHelpers";

describe("product category helpers", () => {
  it("sanitizes and normalizes category labels", () => {
    expect(sanitizeCategoryLabel("  Pólizas   anuales ")).toBe("Pólizas anuales");
    expect(normalizeServicePolicyCategory("  Pólizas   anuales ")).toBe(
      "polizas anuales"
    );
  });

  it("keeps the first label when removing normalized duplicates", () => {
    expect(
      uniqueByNormalizedValue([
        "Pólizas",
        " polizas ",
        "",
        "Servicios",
        "SERVICIOS",
      ])
    ).toEqual(["Pólizas", "Servicios"]);
  });

  it("matches exact and partially overlapping normalized categories", () => {
    expect(categoryMatches("Servicio", "Servicios empresariales")).toBe(true);
    expect(categoryMatches("Pólizas", "polizas")).toBe(true);
    expect(categoryMatches("Productos", "Servicios")).toBe(false);
    expect(categoryMatches("Productos", "")).toBe(true);
  });
});

describe("product type helpers", () => {
  it("normalizes supported API product types", () => {
    expect(normalizeCatalogProductType("contpaqi_product")).toBe("CONTPAQI");
    expect(normalizeCatalogProductType(" service ")).toBe("SERVICE");
    expect(normalizeCatalogProductType("unknown")).toBe("");
  });

  it("prefers explicit product types and preserves inference priority", () => {
    expect(
      inferProductType({
        name: "Servicio CONTPAQi",
        product_type: "PRODUCT",
      })
    ).toBe("PRODUCT");
    expect(inferProductType({ name: "Póliza de servicio CONTPAQi" })).toBe(
      "POLICY"
    );
    expect(inferProductType({ category: "Servicios" })).toBe("SERVICE");
    expect(inferProductType({ name: "CONTPAQi Nóminas" })).toBe("CONTPAQI");
  });

  it("upserts products by normalized name and category", () => {
    const existing = {
      id: "old",
      name: "Póliza anual",
      category: "Servicios",
    };
    const replacement = {
      id: "new",
      name: "poliza anual",
      category: " servicios ",
    };

    expect(upsertCatalogItem([existing], replacement)).toEqual([replacement]);
  });

  it("preserves success messages and returned folios by product type", () => {
    expect(
      buildProductSuccessMessage({
        productType: "PRODUCT",
        folio: "PRD-123",
      })
    ).toBe("Producto registrado correctamente. Folio: PRD-123.");

    expect(
      buildProductSuccessMessage({
        productType: "SERVICE",
        folio: "SRV-456",
      })
    ).toBe(
      "Servicio registrado en Productos y en Historial de Servicios y Pólizas. Folio: SRV-456."
    );

    expect(
      buildProductSuccessMessage({
        productType: "POLICY",
        folio: "",
      })
    ).toBe(
      "Póliza registrado en Productos y en Historial de Servicios y Pólizas."
    );
  });
});

describe("built-in catalog helpers", () => {
  const catalog = [
    {
      category: "Fallback",
      items: [
        {
          name: "First",
          category: "Contabilidad",
          price: 10,
          max_users: 2,
          description: "First product",
        },
        {
          name: "Second",
          category: "contabilidad",
          price: -5,
          max_users: 0,
        },
      ],
    },
  ];

  it("builds unique categories and normalized selector products", () => {
    expect(createBuiltInCategories(catalog)).toEqual(["Contabilidad"]);
    expect(createBuiltInProducts(catalog)).toEqual([
      {
        id: "catalog-First",
        name: "First",
        category: "Contabilidad",
        price: 10,
        max_users: 2,
        description: "First product",
        product_type: "CONTPAQI",
        isCustom: false,
      },
      {
        id: "catalog-Second",
        name: "Second",
        category: "contabilidad",
        price: 0,
        max_users: 30,
        description: "",
        product_type: "CONTPAQI",
        isCustom: false,
      },
    ]);
  });
});

describe("form mode helpers", () => {
  it("uses explicit modes before category and source inference", () => {
    expect(
      isServiceProductMode({
        activeFormMode: "PRODUCT",
        selectedCategoryType: "SERVICE",
        selectedSourceType: "SERVICE",
        category: "Servicios",
      })
    ).toBe(false);
    expect(
      isServiceProductMode({
        selectedSourceType: "SERVICE",
        category: "General",
      })
    ).toBe(true);
  });

  it("preserves the current labels for policies and services", () => {
    expect(
      getProductTypeLabel({
        activeFormMode: "POLICY",
        selectedCategoryType: "PRODUCT",
        category: "General",
      })
    ).toBe("Póliza");
    expect(
      getFormLabels({
        selectedCategoryType: "",
        isServiceMode: true,
        category: "Pólizas anuales",
      })
    ).toEqual({
      nameLabel: "NOMBRE DE LA PÓLIZA",
      button: "Registrar Póliza",
    });
  });
});
