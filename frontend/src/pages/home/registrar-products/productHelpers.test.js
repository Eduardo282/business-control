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
  normalizeServiceCategory,
  sanitizeCategoryLabel,
  uniqueByNormalizedValue,
  upsertCatalogItem,
} from "./productHelpers";

describe("product category helpers", () => {
  it("sanitizes and normalizes category labels", () => {
    expect(sanitizeCategoryLabel("  Asesorías   anuales ")).toBe("Asesorías anuales");
    expect(normalizeServiceCategory("  Asesorías   anuales ")).toBe(
      "asesorias anuales"
    );
  });

  it("keeps the first label when removing normalized duplicates", () => {
    expect(
      uniqueByNormalizedValue([
        "Asesorías",
        " asesorias ",
        "",
        "Servicios",
        "SERVICIOS",
      ])
    ).toEqual(["Asesorías", "Servicios"]);
  });

  it("matches exact and partially overlapping normalized categories", () => {
    expect(categoryMatches("Servicio", "Servicios empresariales")).toBe(true);
    expect(categoryMatches("Asesorías", "asesorias")).toBe(true);
    expect(categoryMatches("Productos", "Servicios")).toBe(false);
    expect(categoryMatches("Productos", "")).toBe(true);
  });
});

describe("product type helpers", () => {
  it("normalizes supported API product types", () => {
    expect(normalizeCatalogProductType("contpaqi_product")).toBe("CONTPAQI");
    expect(normalizeCatalogProductType(" service ")).toBe("SERVICE");
    expect(normalizeCatalogProductType("POLICY")).toBe("");
    expect(normalizeCatalogProductType("unknown")).toBe("");
  });

  it("prefers explicit product types and preserves inference priority", () => {
    expect(
      inferProductType({
        name: "Servicio CONTPAQi",
        product_type: "PRODUCT",
      })
    ).toBe("PRODUCT");
    expect(inferProductType({ name: "Servicio CONTPAQi" })).toBe(
      "SERVICE"
    );
    expect(inferProductType({ category: "Servicios" })).toBe("SERVICE");
    expect(inferProductType({ name: "CONTPAQi Nóminas" })).toBe("CONTPAQI");
  });

  it("upserts products by normalized name and category", () => {
    const existing = {
      id: "old",
      name: "Asesoría anual",
      category: "Servicios",
    };
    const replacement = {
      id: "new",
      name: "asesoria anual",
      category: " servicios ",
    };

    expect(upsertCatalogItem([existing], replacement)).toEqual([replacement]);
  });

  it("preserves success messages for the remaining product types", () => {
    expect(
      buildProductSuccessMessage({
        productType: "PRODUCT",
        folio: "PRD-123",
      })
    ).toBe("Producto registrado correctamente.");

    expect(
      buildProductSuccessMessage({
        productType: "SERVICE",
        folio: "SRV-456",
      })
    ).toBe(
      "Servicio registrado correctamente."
    );

    expect(
      buildProductSuccessMessage({
        productType: "CONTPAQI",
        folio: "",
      })
    ).toBe(
      "Producto CONTPAQi registrado correctamente."
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

  it("preserves the current labels for services", () => {
    expect(
      getProductTypeLabel({
        activeFormMode: "SERVICE",
        selectedCategoryType: "PRODUCT",
        category: "General",
      })
    ).toBe("Servicio");
    expect(
      getFormLabels({
        selectedCategoryType: "",
        isServiceMode: true,
        category: "Servicios anuales",
      })
    ).toEqual({
      nameLabel: "NOMBRE DEL SERVICIO",
      button: "Registrar Servicio",
    });
  });
});
