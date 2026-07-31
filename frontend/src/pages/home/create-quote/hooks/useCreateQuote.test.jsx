import { act, render, renderHook, waitFor } from "@testing-library/react";
import {
  MemoryRouter,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getClientApi } from "../../../../actionsAPI/clients.api";
import {
  createQuoteApi,
  getQuoteApi,
  resolveQuoteRequestApi,
} from "../../../../actionsAPI/quotes.api";
import { usePersistedFormDraft } from "../../../../hooks/usePersistedFormDraft";
import { useCreateQuote } from "./useCreateQuote";

const draftPersistenceMock = vi.hoisted(() => {
  const apis = new Map();
  const persistCalls = [];
  const deleteCalls = [];

  return {
    persistCalls,
    deleteCalls,
    reset() {
      apis.clear();
      persistCalls.length = 0;
      deleteCalls.length = 0;
    },
    getApi(formKey, scopeKey) {
      const key = `${formKey}:${scopeKey}`;
      if (!apis.has(key)) {
        apis.set(key, {
          persistDraftNow: vi.fn(async (data) => {
            persistCalls.push({ formKey, scopeKey, data });
          }),
          deleteDraftNow: vi.fn(async () => {
            deleteCalls.push({ formKey, scopeKey });
          }),
        });
      }
      return apis.get(key);
    },
  };
});

vi.mock("../../../../actionsAPI/clients.api", () => ({
  searchClientsApi: vi.fn(),
  getClientApi: vi.fn(),
  listClientsApi: vi.fn(),
}));

vi.mock("../../../../actionsAPI/products.api", () => ({
  searchProductsApi: vi.fn(),
  listProductsApi: vi.fn(),
}));

vi.mock("../../../../actionsAPI/quotes.api", () => ({
  createQuoteApi: vi.fn(),
  getQuoteApi: vi.fn(),
  resolveQuoteRequestApi: vi.fn(),
}));

vi.mock("../../../../hooks/usePersistedFormDraft", () => ({
  usePersistedFormDraft: vi.fn(({ formKey, scopeKey }) => ({
    isDraftReady: true,
    readyScopeKey: scopeKey,
    isSavingDraft: false,
    ...draftPersistenceMock.getApi(formKey, scopeKey),
  })),
}));

vi.mock("../../../../services/notificationService", () => ({
  notificationService: {
    confirm: vi.fn(() => Promise.resolve(true)),
    error: vi.fn(),
  },
}));

const wrapper = ({ children }) => (
  <MemoryRouter initialEntries={["/cotizaciones/nueva"]}>
    {children}
  </MemoryRouter>
);

const createWrapper = (initialEntry) =>
  function TestWrapper({ children }) {
    return (
      <MemoryRouter initialEntries={[initialEntry]}>
        {children}
      </MemoryRouter>
    );
  };

function createDeferred() {
  let resolve;
  let reject;
  const promise = new Promise((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });

  return { promise, resolve, reject };
}

function createRequestQuote({
  id,
  clientId,
  contactId,
  folio,
  productId,
  productName,
}) {
  return {
    id,
    folio,
    status: "SOLICITADA",
    client: { id: clientId },
    contact: { id: contactId },
    items: [
      {
        product: {
          id: productId,
          folio: `PRD-${String(productId).padStart(6, "0")}`,
          name: productName,
        },
        unit_price: 100,
        quantity: 1,
        discount: 0,
        total: 100,
      },
    ],
  };
}

describe("useCreateQuote section resets", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    draftPersistenceMock.reset();
    window.localStorage.clear();
    getQuoteApi.mockResolvedValue(null);
  });

  it("resets client data without removing persisted products", async () => {
    const { result } = renderHook(() => useCreateQuote(vi.fn()), { wrapper });
    const client = {
      id: 10,
      business_name: "Cliente Uno",
      rfc: "RFC010101AA1",
      contacts: [{ id: 20, full_name: "Contacto" }],
    };
    const item = { tempId: "item-1", product_id: 30, name: "Producto" };

    act(() => {
      result.current.setSelectedClient(client);
      result.current.setSelectedContactId("20");
      result.current.setClientSearch("Cliente Uno");
      result.current.setItems([item]);
    });

    await act(async () => {
      await result.current.resetClientData();
    });

    expect(result.current.selectedClient).toBeNull();
    expect(result.current.selectedContactId).toBe("");
    expect(result.current.clientSearch).toBe("");
    expect(result.current.items).toEqual([item]);
    expect(draftPersistenceMock.persistCalls).toContainEqual(
      expect.objectContaining({
        formKey: "create-quote",
        scopeKey: "global",
        data: expect.objectContaining({
          selectedClient: null,
          selectedContactId: "",
          items: [item],
        }),
      }),
    );
  });

  it("resets products without removing persisted client data", async () => {
    const { result } = renderHook(() => useCreateQuote(vi.fn()), { wrapper });
    const client = {
      id: 10,
      business_name: "Cliente Uno",
      rfc: "RFC010101AA1",
      contacts: [],
    };

    act(() => {
      result.current.setSelectedClient(client);
      result.current.setClientSearch("Cliente Uno");
      result.current.setItems([
        { tempId: "item-1", product_id: 30, name: "Producto" },
      ]);
    });

    await act(async () => {
      await result.current.resetItemsData();
    });

    expect(result.current.items).toEqual([]);
    expect(result.current.selectedClient).toEqual(client);
    expect(draftPersistenceMock.persistCalls).toContainEqual(
      expect.objectContaining({
        data: expect.objectContaining({
          selectedClient: expect.objectContaining({ id: 10 }),
          items: [],
        }),
      }),
    );
  });

  it("persists portal quote requests in an isolated request draft", () => {
    renderHook(() => useCreateQuote(vi.fn()), {
      wrapper: createWrapper("/cotizaciones/nueva?request_id=55"),
    });

    expect(usePersistedFormDraft).toHaveBeenCalledWith(
      expect.objectContaining({
        formKey: "create-quote",
        scopeKey: "request:v2:55",
        enabled: true,
        saveEnabled: false,
      }),
    );
  });

  it("does not restore a stale request when opening the generic menu route", () => {
    window.localStorage.setItem(
      "business-control:create-quote:active-request-id",
      "55",
    );

    renderHook(() => useCreateQuote(vi.fn()), {
      wrapper: createWrapper("/cotizaciones/nueva"),
    });

    expect(usePersistedFormDraft).toHaveBeenCalledWith(
      expect.objectContaining({
        formKey: "create-quote",
        scopeKey: "global",
        enabled: true,
        saveEnabled: true,
      }),
    );
  });

  it("creates a normal quote after returning through the generic menu route", async () => {
    window.localStorage.setItem(
      "business-control:create-quote:active-request-id",
      "55",
    );
    createQuoteApi.mockResolvedValue({ id: 99 });
    const navigate = vi.fn();
    const { result } = renderHook(() => useCreateQuote(navigate), {
      wrapper: createWrapper("/cotizaciones/nueva"),
    });

    act(() => {
      result.current.setSelectedClient({
        id: 10,
        business_name: "Cliente Uno",
        contacts: [],
      });
      result.current.setItems([
        {
          tempId: "item-1",
          product_id: 30,
          name: "Producto",
          price: 100,
          quantity: 1,
          discount: 0,
          total: 100,
        },
      ]);
    });

    await act(async () => {
      await result.current.save();
    });

    expect(resolveQuoteRequestApi).not.toHaveBeenCalled();
    expect(createQuoteApi).toHaveBeenCalledWith(
      expect.objectContaining({ client_id: 10 }),
    );
    expect(draftPersistenceMock.deleteCalls).toContainEqual({
      formKey: "create-quote",
      scopeKey: "global",
    });
    expect(navigate).toHaveBeenCalledWith("/cotizaciones/99");
  });

  it("falls back to a new quote when the portal request was already processed", async () => {
    getQuoteApi.mockResolvedValue({
      id: 55,
      folio: "REQA123",
      status: "ACEPTADA",
      client: { id: 20 },
      contact: { id: 21 },
      items: [
        {
          product: {
            id: 40,
            folio: "PRD-000040",
            name: "Producto solicitado",
          },
          unit_price: 250,
          quantity: 2,
          discount: 0,
          total: 500,
        },
      ],
    });
    getClientApi.mockResolvedValue({
      id: 20,
      business_name: "Cliente de solicitud",
      contacts: [{ id: 21, full_name: "Contacto solicitado" }],
    });
    createQuoteApi.mockResolvedValue({ id: 99 });
    const navigate = vi.fn();

    const { result } = renderHook(() => useCreateQuote(navigate), {
      wrapper: createWrapper("/cotizaciones/nueva?request_id=55"),
    });

    await waitFor(() => {
      expect(result.current.selectedClient?.id).toBe(20);
      expect(result.current.items).toHaveLength(1);
      expect(result.current.folio).toBe("");
    });

    await act(async () => {
      await result.current.save();
    });

    expect(resolveQuoteRequestApi).not.toHaveBeenCalled();
    expect(createQuoteApi).toHaveBeenCalledWith(
      expect.objectContaining({
        client_id: 20,
        contact_id: 21,
        folio: expect.stringMatching(/^[A-Z]{4}\d{3}$/),
      }),
    );
    expect(createQuoteApi.mock.calls[0][0].folio).not.toBe("REQA123");
    expect(navigate).toHaveBeenCalledWith("/cotizaciones/99");
  });

  it("creates a new quote if a request becomes processed before saving", async () => {
    getQuoteApi.mockResolvedValue({
      id: 55,
      folio: "REQA123",
      status: "SOLICITADA",
      client: { id: 20 },
      contact: { id: 21 },
      items: [
        {
          product: {
            id: 40,
            folio: "PRD-000040",
            name: "Producto solicitado",
          },
          unit_price: 250,
          quantity: 2,
          discount: 0,
          total: 500,
        },
      ],
    });
    getClientApi.mockResolvedValue({
      id: 20,
      business_name: "Cliente de solicitud",
      contacts: [{ id: 21, full_name: "Contacto solicitado" }],
    });
    resolveQuoteRequestApi.mockRejectedValue(
      new Error("Solicitud no válida o ya procesada"),
    );
    createQuoteApi.mockResolvedValue({ id: 100 });
    const navigate = vi.fn();

    const { result } = renderHook(() => useCreateQuote(navigate), {
      wrapper: createWrapper("/cotizaciones/nueva?request_id=55"),
    });

    await waitFor(() => {
      expect(result.current.selectedClient?.id).toBe(20);
      expect(result.current.items).toHaveLength(1);
    });

    await act(async () => {
      await result.current.save();
    });

    expect(resolveQuoteRequestApi).toHaveBeenCalledWith(
      "55",
      expect.objectContaining({ client_id: 20 }),
    );
    expect(createQuoteApi).toHaveBeenCalledWith(
      expect.objectContaining({ client_id: 20 }),
    );
    expect(navigate).toHaveBeenCalledWith("/cotizaciones/100");
  });

  it("replaces an existing admin quote when opening a contact request", async () => {
    const requestedClient = {
      id: 20,
      business_name: "Cliente de solicitud",
      contacts: [{ id: 21, full_name: "Contacto solicitado" }],
    };
    getQuoteApi.mockResolvedValue({
      id: 55,
      folio: "REQA123",
      client: { id: 20 },
      contact: { id: 21 },
      items: [
        {
          product: {
            id: 40,
            folio: "PRD-000040",
            name: "Producto solicitado",
          },
          unit_price: 250,
          quantity: 2,
          discount: 0,
          total: 500,
        },
      ],
    });
    getClientApi.mockResolvedValue(requestedClient);

    let currentHook = null;
    let navigateRoute = null;

    function Harness() {
      navigateRoute = useNavigate();
      currentHook = useCreateQuote(navigateRoute);
      return null;
    }

    render(
      <MemoryRouter initialEntries={["/cotizaciones/nueva"]}>
        <Harness />
      </MemoryRouter>,
    );

    act(() => {
      currentHook.setSelectedClient({
        id: 10,
        business_name: "Cliente administrador",
        contacts: [],
      });
      currentHook.setClientSearch("Cliente administrador");
      currentHook.setItems([
        {
          tempId: "admin-item",
          product_id: 30,
          name: "Producto administrativo",
          price: 100,
          quantity: 1,
          discount: 0,
          total: 100,
        },
      ]);
    });

    await act(async () => {
      navigateRoute("/cotizaciones/nueva?request_id=55");
    });

    await waitFor(() => {
      expect(currentHook.selectedClient).toEqual(requestedClient);
      expect(currentHook.selectedContactId).toBe(21);
      expect(currentHook.items).toEqual([
        expect.objectContaining({
          product_id: 40,
          name: "Producto solicitado",
          quantity: 2,
          total: 500,
        }),
      ]);
    });

    expect(
      currentHook.items.some(
        (item) => item.name === "Producto administrativo",
      ),
    ).toBe(false);
    expect(getQuoteApi).toHaveBeenCalledWith("55");
  });

  it("keeps request B when request A resolves after navigation", async () => {
    const requestA = createDeferred();
    const requestB = createDeferred();
    const clientA = {
      id: 10,
      business_name: "Cliente A",
      contacts: [{ id: 11, full_name: "Contacto A" }],
    };
    const clientB = {
      id: 20,
      business_name: "Cliente B",
      contacts: [{ id: 21, full_name: "Contacto B" }],
    };

    getQuoteApi.mockImplementation((id) => {
      if (id === "101") return requestA.promise;
      if (id === "202") return requestB.promise;
      return Promise.resolve(null);
    });
    getClientApi.mockImplementation((id) =>
      Promise.resolve(id === 10 ? clientA : clientB),
    );

    let currentHook = null;
    let navigateRoute = null;

    function Harness() {
      navigateRoute = useNavigate();
      currentHook = useCreateQuote(navigateRoute);
      return null;
    }

    render(
      <MemoryRouter
        initialEntries={["/cotizaciones/nueva?request_id=101"]}
      >
        <Harness />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(getQuoteApi).toHaveBeenCalledWith("101");
    });

    await act(async () => {
      navigateRoute("/cotizaciones/nueva?request_id=202");
    });

    await waitFor(() => {
      expect(getQuoteApi).toHaveBeenCalledWith("202");
    });

    await act(async () => {
      requestB.resolve({
        id: 202,
        folio: "BBBB222",
        status: "SOLICITADA",
        client: { id: 20 },
        contact: { id: 21 },
        items: [
          {
            product: {
              id: 22,
              folio: "PRD-000022",
              name: "Producto B",
            },
            unit_price: 200,
            quantity: 2,
            discount: 0,
            total: 400,
          },
        ],
      });
      await requestB.promise;
    });

    await waitFor(() => {
      expect(currentHook.selectedClient).toEqual(clientB);
      expect(currentHook.folio).toBe("BBBB222");
      expect(currentHook.items).toEqual([
        expect.objectContaining({
          product_id: 22,
          name: "Producto B",
          total: 400,
        }),
      ]);
    });

    await act(async () => {
      requestA.resolve({
        id: 101,
        folio: "AAAA111",
        status: "SOLICITADA",
        client: { id: 10 },
        contact: { id: 11 },
        items: [
          {
            product: {
              id: 12,
              folio: "PRD-000012",
              name: "Producto A",
            },
            unit_price: 100,
            quantity: 1,
            discount: 0,
            total: 100,
          },
        ],
      });
      await requestA.promise;
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(getClientApi).not.toHaveBeenCalledWith(10);
    expect(currentHook.selectedClient).toEqual(clientB);
    expect(currentHook.folio).toBe("BBBB222");
    expect(currentHook.items).toEqual([
      expect.objectContaining({
        product_id: 22,
        name: "Producto B",
        total: 400,
      }),
    ]);
  });

  it("resets route state in layout and ignores a stale generic create", async () => {
    const staleCreate = createDeferred();
    const requestB = createDeferred();
    createQuoteApi.mockReturnValue(staleCreate.promise);
    getQuoteApi.mockImplementation((id) =>
      id === "202" ? requestB.promise : Promise.resolve(null),
    );

    let currentHook = null;
    let currentLocation = null;
    let navigateRoute = null;
    let savePromise = null;

    function Harness() {
      navigateRoute = useNavigate();
      currentLocation = useLocation();
      currentHook = useCreateQuote(navigateRoute);
      return null;
    }

    render(
      <MemoryRouter initialEntries={["/cotizaciones/nueva"]}>
        <Harness />
      </MemoryRouter>,
    );

    act(() => {
      currentHook.setSelectedClient({
        id: 10,
        business_name: "Cliente A",
        contacts: [],
      });
      currentHook.setItems([
        {
          tempId: "item-a",
          product_id: 30,
          name: "Producto A",
          price: 100,
          quantity: 1,
          discount: 0,
          total: 100,
        },
      ]);
    });

    act(() => {
      savePromise = currentHook.save();
    });

    expect(createQuoteApi).toHaveBeenCalledTimes(1);
    expect(currentHook.loading).toBe(true);

    act(() => {
      navigateRoute("/cotizaciones/nueva?request_id=202");
    });

    expect(currentLocation.search).toBe("?request_id=202");
    expect(currentHook.selectedClient).toBeNull();
    expect(currentHook.items).toEqual([]);
    expect(currentHook.loading).toBe(false);

    await act(async () => {
      staleCreate.resolve({ id: 100 });
      await savePromise;
    });

    expect(currentLocation.pathname).toBe("/cotizaciones/nueva");
    expect(currentLocation.search).toBe("?request_id=202");
    expect(currentHook.error).toBe("");
    expect(currentHook.loading).toBe(false);
    expect(draftPersistenceMock.deleteCalls).toEqual([]);

    await act(async () => {
      requestB.resolve(null);
      await requestB.promise;
    });
  });

  it("ignores a stale manual resolution success after navigating to request B", async () => {
    const staleResolution = createDeferred();
    const quotes = {
      101: createRequestQuote({
        id: 101,
        clientId: 10,
        contactId: 11,
        folio: "AAAA111",
        productId: 12,
        productName: "Producto A",
      }),
      202: createRequestQuote({
        id: 202,
        clientId: 20,
        contactId: 21,
        folio: "BBBB222",
        productId: 22,
        productName: "Producto B",
      }),
    };
    const clients = {
      10: {
        id: 10,
        business_name: "Cliente A",
        contacts: [{ id: 11, full_name: "Contacto A" }],
      },
      20: {
        id: 20,
        business_name: "Cliente B",
        contacts: [{ id: 21, full_name: "Contacto B" }],
      },
    };
    getQuoteApi.mockImplementation((id) => Promise.resolve(quotes[id]));
    getClientApi.mockImplementation((id) => Promise.resolve(clients[id]));
    resolveQuoteRequestApi.mockReturnValue(staleResolution.promise);

    let currentHook = null;
    let currentLocation = null;
    let navigateRoute = null;
    let savePromise = null;

    function Harness() {
      navigateRoute = useNavigate();
      currentLocation = useLocation();
      currentHook = useCreateQuote(navigateRoute);
      return null;
    }

    render(
      <MemoryRouter initialEntries={["/cotizaciones/nueva?request_id=101"]}>
        <Harness />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(currentHook.selectedClient).toEqual(clients[10]);
      expect(currentHook.items).toHaveLength(1);
    });

    act(() => {
      savePromise = currentHook.save();
    });
    expect(resolveQuoteRequestApi).toHaveBeenCalledWith(
      "101",
      expect.objectContaining({ client_id: 10 }),
    );

    await act(async () => {
      navigateRoute("/cotizaciones/nueva?request_id=202");
    });
    await waitFor(() => {
      expect(currentHook.selectedClient).toEqual(clients[20]);
      expect(currentHook.folio).toBe("BBBB222");
    });

    await act(async () => {
      staleResolution.resolve({ id: 101 });
      await savePromise;
    });

    expect(currentLocation.pathname).toBe("/cotizaciones/nueva");
    expect(currentLocation.search).toBe("?request_id=202");
    expect(currentHook.selectedClient).toEqual(clients[20]);
    expect(currentHook.error).toBe("");
    expect(currentHook.loading).toBe(false);
    expect(draftPersistenceMock.deleteCalls).toEqual([]);
  });

  it("does not fallback-create after a stale processed-request rejection", async () => {
    const staleResolution = createDeferred();
    const quotes = {
      101: createRequestQuote({
        id: 101,
        clientId: 10,
        contactId: 11,
        folio: "AAAA111",
        productId: 12,
        productName: "Producto A",
      }),
      202: createRequestQuote({
        id: 202,
        clientId: 20,
        contactId: 21,
        folio: "BBBB222",
        productId: 22,
        productName: "Producto B",
      }),
    };
    const clients = {
      10: {
        id: 10,
        business_name: "Cliente A",
        contacts: [{ id: 11, full_name: "Contacto A" }],
      },
      20: {
        id: 20,
        business_name: "Cliente B",
        contacts: [{ id: 21, full_name: "Contacto B" }],
      },
    };
    getQuoteApi.mockImplementation((id) => Promise.resolve(quotes[id]));
    getClientApi.mockImplementation((id) => Promise.resolve(clients[id]));
    resolveQuoteRequestApi.mockReturnValue(staleResolution.promise);

    let currentHook = null;
    let currentLocation = null;
    let navigateRoute = null;
    let savePromise = null;

    function Harness() {
      navigateRoute = useNavigate();
      currentLocation = useLocation();
      currentHook = useCreateQuote(navigateRoute);
      return null;
    }

    render(
      <MemoryRouter initialEntries={["/cotizaciones/nueva?request_id=101"]}>
        <Harness />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(currentHook.selectedClient).toEqual(clients[10]);
      expect(currentHook.items).toHaveLength(1);
    });

    act(() => {
      savePromise = currentHook.save();
    });
    expect(resolveQuoteRequestApi).toHaveBeenCalledWith(
      "101",
      expect.objectContaining({ client_id: 10 }),
    );

    await act(async () => {
      navigateRoute("/cotizaciones/nueva?request_id=202");
    });
    await waitFor(() => {
      expect(currentHook.selectedClient).toEqual(clients[20]);
      expect(currentHook.folio).toBe("BBBB222");
    });

    await act(async () => {
      staleResolution.reject(
        new Error("Solicitud no válida o ya procesada"),
      );
      await savePromise;
    });

    expect(createQuoteApi).not.toHaveBeenCalled();
    expect(currentLocation.pathname).toBe("/cotizaciones/nueva");
    expect(currentLocation.search).toBe("?request_id=202");
    expect(currentHook.selectedClient).toEqual(clients[20]);
    expect(currentHook.error).toBe("");
    expect(currentHook.loading).toBe(false);
    expect(draftPersistenceMock.deleteCalls).toEqual([]);
  });

  it("ignores a processed-request rejection after unmount", async () => {
    const pendingResolution = createDeferred();
    const quote = createRequestQuote({
      id: 101,
      clientId: 10,
      contactId: 11,
      folio: "AAAA111",
      productId: 12,
      productName: "Producto A",
    });
    const client = {
      id: 10,
      business_name: "Cliente A",
      contacts: [{ id: 11, full_name: "Contacto A" }],
    };
    const navigate = vi.fn();

    getQuoteApi.mockResolvedValue(quote);
    getClientApi.mockResolvedValue(client);
    resolveQuoteRequestApi.mockReturnValue(pendingResolution.promise);

    const { result, unmount } = renderHook(() => useCreateQuote(navigate), {
      wrapper: createWrapper("/cotizaciones/nueva?request_id=101"),
    });

    await waitFor(() => {
      expect(result.current.selectedClient).toEqual(client);
      expect(result.current.items).toHaveLength(1);
    });

    let savePromise;
    act(() => {
      savePromise = result.current.save();
    });
    expect(resolveQuoteRequestApi).toHaveBeenCalledWith(
      "101",
      expect.objectContaining({ client_id: 10 }),
    );

    unmount();
    await act(async () => {
      pendingResolution.reject(
        new Error("Solicitud no válida o ya procesada"),
      );
      await savePromise;
    });

    expect(createQuoteApi).not.toHaveBeenCalled();
    expect(draftPersistenceMock.deleteCalls).toEqual([]);
    expect(navigate).not.toHaveBeenCalled();
  });

  it("ignores an auto-resolution completion after unmount", async () => {
    const pendingResolution = createDeferred();
    const quote = createRequestQuote({
      id: 101,
      clientId: 10,
      contactId: 11,
      folio: "AAAA111",
      productId: 12,
      productName: "Producto A",
    });
    const client = {
      id: 10,
      business_name: "Cliente A",
      contacts: [{ id: 11, full_name: "Contacto A" }],
    };
    const navigate = vi.fn();

    getQuoteApi.mockResolvedValue(quote);
    getClientApi.mockResolvedValue(client);
    resolveQuoteRequestApi.mockReturnValue(pendingResolution.promise);

    const { unmount } = renderHook(() => useCreateQuote(navigate), {
      wrapper: createWrapper(
        "/cotizaciones/nueva?request_id=101&source=notification&auto_resolve=1",
      ),
    });

    await waitFor(() => {
      expect(resolveQuoteRequestApi).toHaveBeenCalledWith(
        "101",
        expect.objectContaining({ client_id: 10 }),
      );
    });
    const deleteCallCountBeforeUnmount = draftPersistenceMock.deleteCalls.length;

    unmount();
    await act(async () => {
      pendingResolution.resolve({ id: 101 });
      await pendingResolution.promise;
      await Promise.resolve();
    });

    expect(draftPersistenceMock.deleteCalls).toHaveLength(
      deleteCallCountBeforeUnmount,
    );
    expect(navigate).not.toHaveBeenCalled();
  });

  it("ignores stale auto-resolution when route context changes for the same request", async () => {
    const pendingResolution = createDeferred();
    const quote = createRequestQuote({
      id: 101,
      clientId: 10,
      contactId: 11,
      folio: "AAAA111",
      productId: 12,
      productName: "Producto A",
    });
    const client = {
      id: 10,
      business_name: "Cliente A",
      contacts: [{ id: 11, full_name: "Contacto A" }],
    };

    getQuoteApi.mockResolvedValue(quote);
    getClientApi.mockResolvedValue(client);
    resolveQuoteRequestApi.mockReturnValue(pendingResolution.promise);

    let currentHook = null;
    let currentLocation = null;
    let navigateRoute = null;

    function Harness() {
      navigateRoute = useNavigate();
      currentLocation = useLocation();
      currentHook = useCreateQuote(navigateRoute);
      return null;
    }

    render(
      <MemoryRouter
        initialEntries={[
          "/cotizaciones/nueva?request_id=101&source=notification&auto_resolve=1",
        ]}
      >
        <Harness />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(resolveQuoteRequestApi).toHaveBeenCalledWith(
        "101",
        expect.objectContaining({ client_id: 10 }),
      );
    });
    draftPersistenceMock.deleteCalls.length = 0;

    await act(async () => {
      navigateRoute("/cotizaciones/nueva?request_id=101");
    });

    await waitFor(() => {
      expect(currentLocation.search).toBe("?request_id=101");
      expect(currentHook.selectedClient).toEqual(client);
      expect(currentHook.loading).toBe(false);
      expect(getQuoteApi).toHaveBeenCalledTimes(2);
    });

    await act(async () => {
      pendingResolution.resolve({ id: 101 });
      await pendingResolution.promise;
      await Promise.resolve();
    });

    expect(currentLocation.pathname).toBe("/cotizaciones/nueva");
    expect(currentLocation.search).toBe("?request_id=101");
    expect(currentHook.selectedClient).toEqual(client);
    expect(currentHook.error).toBe("");
    expect(currentHook.loading).toBe(false);
    expect(draftPersistenceMock.deleteCalls).toEqual([]);
  });

  it("ignores a stale auto-resolution success after navigating to request B", async () => {
    const autoResolutionA = createDeferred();
    const quotes = {
      101: createRequestQuote({
        id: 101,
        clientId: 10,
        contactId: 11,
        folio: "AAAA111",
        productId: 12,
        productName: "Producto A",
      }),
      202: createRequestQuote({
        id: 202,
        clientId: 20,
        contactId: 21,
        folio: "BBBB222",
        productId: 22,
        productName: "Producto B",
      }),
    };
    const clients = {
      10: {
        id: 10,
        business_name: "Cliente A",
        contacts: [{ id: 11, full_name: "Contacto A" }],
      },
      20: {
        id: 20,
        business_name: "Cliente B",
        contacts: [{ id: 21, full_name: "Contacto B" }],
      },
    };

    getQuoteApi.mockImplementation((id) => Promise.resolve(quotes[id]));
    getClientApi.mockImplementation((id) => Promise.resolve(clients[id]));
    resolveQuoteRequestApi.mockImplementation((id) =>
      id === "101" ? autoResolutionA.promise : Promise.resolve(quotes[id]),
    );

    let currentHook = null;
    let currentLocation = null;
    let navigateRoute = null;

    function Harness() {
      navigateRoute = useNavigate();
      currentLocation = useLocation();
      currentHook = useCreateQuote(navigateRoute);
      return null;
    }

    render(
      <MemoryRouter
        initialEntries={[
          "/cotizaciones/nueva?request_id=101&source=notification&auto_resolve=1",
        ]}
      >
        <Harness />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(resolveQuoteRequestApi).toHaveBeenCalledWith(
        "101",
        expect.objectContaining({ client_id: 10 }),
      );
    });
    draftPersistenceMock.deleteCalls.length = 0;

    await act(async () => {
      navigateRoute("/cotizaciones/nueva?request_id=202");
    });

    await waitFor(() => {
      expect(currentHook.selectedClient).toEqual(clients[20]);
      expect(currentHook.folio).toBe("BBBB222");
      expect(currentHook.loading).toBe(false);
    });

    await act(async () => {
      autoResolutionA.resolve({ id: 101 });
      await autoResolutionA.promise;
      await Promise.resolve();
    });

    expect(currentLocation.pathname).toBe("/cotizaciones/nueva");
    expect(currentLocation.search).toBe("?request_id=202");
    expect(currentHook.selectedClient).toEqual(clients[20]);
    expect(currentHook.error).toBe("");
    expect(currentHook.loading).toBe(false);
    expect(draftPersistenceMock.deleteCalls).toEqual([]);
  });

  it("ignores a stale auto-resolution rejection after navigating to request B", async () => {
    const autoResolutionA = createDeferred();
    const quotes = {
      101: createRequestQuote({
        id: 101,
        clientId: 10,
        contactId: 11,
        folio: "AAAA111",
        productId: 12,
        productName: "Producto A",
      }),
      202: createRequestQuote({
        id: 202,
        clientId: 20,
        contactId: 21,
        folio: "BBBB222",
        productId: 22,
        productName: "Producto B",
      }),
    };
    const clients = {
      10: {
        id: 10,
        business_name: "Cliente A",
        contacts: [{ id: 11, full_name: "Contacto A" }],
      },
      20: {
        id: 20,
        business_name: "Cliente B",
        contacts: [{ id: 21, full_name: "Contacto B" }],
      },
    };

    getQuoteApi.mockImplementation((id) => Promise.resolve(quotes[id]));
    getClientApi.mockImplementation((id) => Promise.resolve(clients[id]));
    resolveQuoteRequestApi.mockImplementation((id) =>
      id === "101" ? autoResolutionA.promise : Promise.resolve(quotes[id]),
    );

    let currentHook = null;
    let currentLocation = null;
    let navigateRoute = null;

    function Harness() {
      navigateRoute = useNavigate();
      currentLocation = useLocation();
      currentHook = useCreateQuote(navigateRoute);
      return null;
    }

    render(
      <MemoryRouter
        initialEntries={[
          "/cotizaciones/nueva?request_id=101&source=notification&auto_resolve=1",
        ]}
      >
        <Harness />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(resolveQuoteRequestApi).toHaveBeenCalledWith(
        "101",
        expect.objectContaining({ client_id: 10 }),
      );
    });
    draftPersistenceMock.deleteCalls.length = 0;

    await act(async () => {
      navigateRoute("/cotizaciones/nueva?request_id=202");
    });

    await waitFor(() => {
      expect(currentHook.selectedClient).toEqual(clients[20]);
      expect(currentHook.folio).toBe("BBBB222");
      expect(currentHook.loading).toBe(false);
    });

    await act(async () => {
      autoResolutionA.reject(new Error("Auto-resolution A failed"));
      await autoResolutionA.promise.catch(() => undefined);
      await Promise.resolve();
    });

    expect(currentLocation.pathname).toBe("/cotizaciones/nueva");
    expect(currentLocation.search).toBe("?request_id=202");
    expect(currentHook.selectedClient).toEqual(clients[20]);
    expect(currentHook.error).toBe("");
    expect(currentHook.loading).toBe(false);
    expect(draftPersistenceMock.deleteCalls).toEqual([]);
  });

  it("reloads the original request and removes a stale draft opened from a notification", async () => {
    getQuoteApi.mockResolvedValue({
      id: 23,
      folio: "WUUK759",
      client: { id: 1 },
      contact: { id: 1 },
      items: [
        {
          product: {
            id: 8,
            folio: "PRD-000008",
            name: "CONTPAQ 2026 20",
          },
          unit_price: 400,
          quantity: 1,
          discount: 0,
          total: 400,
        },
      ],
    });
    getClientApi.mockResolvedValue({
      id: 1,
      business_name: "Bimbo",
      contacts: [
        { id: 1, full_name: "Eduardo Francisco Garcia" },
        { id: 2, full_name: "Adrian Ramirez" },
      ],
    });

    const { result } = renderHook(() => useCreateQuote(vi.fn()), {
      wrapper: createWrapper(
        "/cotizaciones/nueva?request_id=23&source=notification&request_reload=1",
      ),
    });

    expect(usePersistedFormDraft).toHaveBeenCalledWith(
      expect.objectContaining({
        scopeKey: "request:v2:23",
        loadEnabled: false,
        saveEnabled: false,
      }),
    );

    await waitFor(() => {
      expect(draftPersistenceMock.deleteCalls).toContainEqual({
        formKey: "create-quote",
        scopeKey: "request:v2:23",
      });
      expect(result.current.selectedContactId).toBe(1);
      expect(result.current.items).toEqual([
        expect.objectContaining({
          product_id: 8,
          name: "CONTPAQ 2026 20",
          quantity: 1,
          total: 400,
        }),
      ]);
    });
  });

  it("automatically resolves a portal quote request opened from a notification", async () => {
    getQuoteApi.mockResolvedValue({
      id: 23,
      folio: "WUUK759",
      status: "SOLICITADA",
      client: { id: 1 },
      contact: { id: 1 },
      items: [
        {
          product: {
            id: 8,
            folio: "PRD-000008",
            name: "CONTPAQi Contabiliza",
          },
          unit_price: 4390,
          quantity: 4,
          discount: 0,
          total: 17560,
        },
        {
          product: {
            id: 9,
            folio: "PRD-000009",
            name: "CONTPAQi Nóminas",
          },
          unit_price: 5590,
          quantity: 2,
          discount: 0,
          total: 11180,
        },
        {
          product: {
            id: 10,
            folio: "POL-000010",
            name: "Póliza de soporte anual",
          },
          unit_price: 1000,
          quantity: 1,
          discount: 0,
          total: 1000,
        },
      ],
    });
    getClientApi.mockResolvedValue({
      id: 1,
      business_name: "Textiles Atlas JDQS S.C.",
      contacts: [{ id: 1, full_name: "Eduardo Francisco Garcia" }],
    });
    resolveQuoteRequestApi.mockResolvedValue({
      id: 23,
      folio: "WUUK759",
      status: "PENDIENTE",
    });
    const navigate = vi.fn();

    renderHook(() => useCreateQuote(navigate), {
      wrapper: createWrapper(
        "/cotizaciones/nueva?request_id=23&source=notification&auto_resolve=1&request_reload=1",
      ),
    });

    await waitFor(() => {
      expect(resolveQuoteRequestApi).toHaveBeenCalledWith("23", {
        client_id: 1,
        contact_id: 1,
        notes: "Ninguna por el momento",
        folio: "WUUK759",
        items: [
          { product_id: 8, quantity: 4, unit_price: 4390, discount: 0 },
          { product_id: 9, quantity: 2, unit_price: 5590, discount: 0 },
          { product_id: 10, quantity: 1, unit_price: 1000, discount: 0 },
        ],
      });
    });
    expect(draftPersistenceMock.deleteCalls).toContainEqual({
      formKey: "create-quote",
      scopeKey: "request:v2:23",
    });
    expect(navigate).toHaveBeenCalledWith("/cotizaciones/23", {
      replace: true,
    });
  });
});
