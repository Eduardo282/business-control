import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  bulkCreateClientsApi,
  createClientApi,
  deleteClientApi,
  getClientApi,
  listClientActiveServicesApi,
  listClientsApi,
  searchClientsApi,
  updateClientApi,
} from "./clients.api";
import { gql } from "../utils/graphqlClient";

vi.mock("../utils/graphqlClient", () => ({
  gql: vi.fn(),
}));

describe("clients.api", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("listClientsApi fetches all clients", async () => {
    const mockClients = [
      { id: "1", business_name: "Empresa A", rfc: "ABC123456789" },
    ];
    gql.mockResolvedValueOnce({ clients: mockClients });

    const result = await listClientsApi();
    expect(result).toEqual(mockClients);
    expect(gql).toHaveBeenCalledWith(expect.stringContaining("query"));
  });

  it("getClientApi fetches client by id", async () => {
    const mockClient = { id: "1", business_name: "Empresa A", contacts: [] };
    gql.mockResolvedValueOnce({ client: mockClient });

    const result = await getClientApi("1");
    expect(result).toEqual(mockClient);
    expect(gql).toHaveBeenCalledWith(expect.stringContaining("query Client"), { id: "1" });
  });

  it("createClientApi creates a client", async () => {
    const input = { business_name: "Empresa B", rfc: "XYZ987654321" };
    const created = { id: "2", ...input };
    gql.mockResolvedValueOnce({ createClient: created });

    const result = await createClientApi(input);
    expect(result).toEqual(created);
  });

  it("updateClientApi updates client information", async () => {
    const input = { business_name: "Empresa A Modificada" };
    const updated = { id: "1", ...input };
    gql.mockResolvedValueOnce({ updateClient: updated });

    const result = await updateClientApi("1", input);
    expect(result).toEqual(updated);
  });

  it("deleteClientApi removes a client", async () => {
    gql.mockResolvedValueOnce({ deleteClient: true });

    const result = await deleteClientApi("1");
    expect(result).toBe(true);
  });

  it("listClientActiveServicesApi flattens contacts active services", async () => {
    gql.mockResolvedValueOnce({
      contactsByClient: [
        {
          id: "c1",
          full_name: "Juan Perez",
          active_services: [
            { id: "s1", license_key: "LIC-100", product: { name: "Contpaqi" } },
          ],
        },
      ],
    });

    const result = await listClientActiveServicesApi("1");
    expect(result).toEqual([
      {
        id: "s1",
        license_key: "LIC-100",
        product: { name: "Contpaqi" },
        contact_name: "Juan Perez",
      },
    ]);
  });
});
