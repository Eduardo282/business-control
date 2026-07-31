import { describe, expect, it } from "vitest";
import {
  filterContacts,
  getContactColumnsFromView,
  getContactFilterOptions,
  getContactPrimaryColumns,
  getOrphanClientGeneralFieldName,
  isClientFieldFullWidth,
  resolveDetailHostColumn,
} from "./clientDetailHelpers";

describe("client detail layout helpers", () => {
  it("keeps address-like fields and the orphan compact field full width", () => {
    expect(isClientFieldFullWidth("shipping_address")).toBe(true);
    expect(
      getOrphanClientGeneralFieldName([
        { name: "business_name" },
        { name: "rfc" },
        { name: "email1" },
        { name: "telefono" },
      ]),
    ).toBe("telefono");
  });

  it("aligns detail columns by affinity and then by current load", () => {
    const primaryColumns = [
      { name: "full_name", label: "Nombre completo" },
      { name: "email", label: "Correo electrónico" },
    ];

    expect(
      resolveDetailHostColumn(
        { name: "secondary_email", label: "Correo secundario" },
        primaryColumns,
        { full_name: [], email: [] },
      ),
    ).toBe("email");
    expect(
      resolveDetailHostColumn(
        { name: "phone", label: "Teléfono" },
        primaryColumns,
        { full_name: [{ name: "department" }], email: [] },
      ),
    ).toBe("email");
  });
});

describe("client detail contact helpers", () => {
  const dynamicColumns = [
    { name: "id", label: "ID" },
    { name: "phone", label: "Phone" },
    { name: "email", label: "Email importado" },
    { name: "full_name", label: "Name" },
    { name: "department", label: "Departamento" },
  ];

  it("preserves imported ordering, appends remaining columns, and applies labels", () => {
    const columns = getContactColumnsFromView(
      dynamicColumns,
      ["full_name", "email"],
      { department: "Área" },
    );

    expect(columns.map((column) => column.name)).toEqual([
      "full_name",
      "email",
      "phone",
      "department",
    ]);
    expect(columns.map((column) => column.label)).toEqual([
      "Nombre completo",
      "Correo electrónico",
      "Teléfono",
      "Área",
    ]);
    expect(getContactPrimaryColumns(columns).map((column) => column.name)).toEqual(
      ["full_name", "email"],
    );
  });

  it("filters only active contacts across search and exact normalized filters", () => {
    const rows = [
      {
        id: 1,
        full_name: "José Pérez",
        email: "jose@example.com",
        position_title: "Dirección",
        is_active: true,
      },
      {
        id: 2,
        full_name: "Ana",
        email: "ana@example.com",
        position_title: "Ventas",
        is_active: false,
      },
      {
        id: 3,
        full_name: "Luis",
        email: "luis@example.com",
        position_title: "Ventas",
        is_active: true,
      },
    ];

    expect(
      filterContacts(
        rows,
        "jose",
        { position_title: "direccion" },
        dynamicColumns,
      ).map((contact) => contact.id),
    ).toEqual([1]);
    expect(
      filterContacts(rows, "", { position_title: "" }, dynamicColumns).map(
        (contact) => contact.id,
      ),
    ).toEqual([1, 3]);
  });

  it("deduplicates active filter options using normalized values", () => {
    expect(
      getContactFilterOptions(
        [
          { position_title: "Dirección", is_active: true },
          { position_title: "direccion", is_active: true },
          { position_title: "Ventas", is_active: false },
        ],
        "position_title",
      ),
    ).toEqual(["Dirección"]);
  });
});
