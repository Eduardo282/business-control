import {
  useCallback,
  useState,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
} from "react";
import { useSearchParams } from "react-router-dom";
import {
  searchClientsApi,
  getClientApi,
  listClientsApi,
} from "../../../../actionsAPI/clients.api";
import {
  searchProductsApi,
  listProductsApi,
} from "../../../../actionsAPI/products.api";
import {
  createQuoteApi,
  getQuoteApi,
  resolveQuoteRequestApi,
} from "../../../../actionsAPI/quotes.api";
import { usePersistedFormDraft } from "../../../../hooks/usePersistedFormDraft";
import {
  normalizeDiscount,
  calculateItemTotal,
  roundMoney,
} from "@shared/quotePricingRules.js";
import { notificationService } from "../../../../services/notificationService";
import {
  formatCurrency,
  normalizeSearchText,
} from "../../../../utils/formatters";
import {
  createQuoteItemId,
  updateQuoteItemDraft,
  upsertQuoteItem,
} from "../../../../features/quotes/domain/quoteItems.js";
import {
  buildCreateQuotePayload,
  isMeaningfulQuoteDraft,
  resolveQuoteDraftScope,
  resolveQuoteFolioDraft,
} from "../../../../features/quotes/domain/quoteDraft.js";

const MAX_CLIENT_RESULTS_IN_MODAL = 50;
const roundCurrency = roundMoney;
const clampDiscount = normalizeDiscount;

function isProcessedRequestError(error) {
  return String(error?.message || error || "").includes(
    "Solicitud no válida o ya procesada",
  );
}

export function useCreateQuote(navigate) {
  const [searchParams] = useSearchParams();
  const urlRequestId = searchParams.get("request_id");
  const fixedClientId = searchParams.get("client_id");
  const requestSource = searchParams.get("source");
  const shouldAutoResolvePortalRequest =
    Boolean(urlRequestId) &&
    requestSource === "notification" &&
    searchParams.get("auto_resolve") === "1";
  const requestReloadToken = searchParams.get("request_reload");
  const shouldReloadRequestFromSource =
    Boolean(urlRequestId) && requestSource === "notification";
  const requestId = urlRequestId || "";
  const routeContext = searchParams.toString();
  const isMountedRef = useRef(true);
  const activeRequestIdRef = useRef(requestId);
  const activeRouteContextRef = useRef(routeContext);
  useLayoutEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      activeRequestIdRef.current = null;
      activeRouteContextRef.current = null;
    };
  }, []);
  useLayoutEffect(() => {
    activeRequestIdRef.current = requestId;
    activeRouteContextRef.current = routeContext;
  }, [requestId, routeContext]);
  const isActiveRequest = useCallback(
    (id, initiatingRouteContext) =>
      isMountedRef.current &&
      activeRequestIdRef.current === id &&
      activeRouteContextRef.current === initiatingRouteContext,
    [],
  );
  const [resolvableRequestId, setResolvableRequestId] = useState("");

  // Seleccion de cliente
  const [clientSearch, setClientSearch] = useState("");
  const [clientResults, setClientResults] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedContactId, setSelectedContactId] = useState("");
  const [showClientModal, setShowClientModal] = useState(false);
  const [isClientSearching, setIsClientSearching] = useState(false);

  // Items
  const [items, setItems] = useState([]);

  // Busqueda de productos
  const [prodSearch, setProdSearch] = useState("");
  const [prodResults, setProdResults] = useState([]);
  const [isProductSearching, setIsProductSearching] = useState(false);
  const [selectedProductToAdd, setSelectedProductToAdd] = useState(null);
  const [qtyToAdd, setQtyToAdd] = useState(1);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [folio, setFolio] = useState("");
  const [justAdded, setJustAdded] = useState(null);
  const [generatedQuote, setGeneratedQuote] = useState(null);
  const [editingItemDraft, setEditingItemDraft] = useState(null);

  const [loading, setLoading] = useState(shouldAutoResolvePortalRequest);
  const [error, setError] = useState("");
  const [isDraftPersistenceSuspended, setIsDraftPersistenceSuspended] =
    useState(false);

  // Tabla de items: filtro y ordenamiento
  const [tableFilter, setTableFilter] = useState("");
  const [tableSorting, setTableSorting] = useState([]);
  const [showTableFilters, setShowTableFilters] = useState(false);
  const [tableFilters, setTableFilters] = useState({
    product: "",
    discount: "",
    price: "",
  });
  const [activeTableFilterPickerField, setActiveTableFilterPickerField] =
    useState(null);
  const [tableFilterPickerSearch, setTableFilterPickerSearch] = useState("");

  const activeTableFilterCount = Object.values(tableFilters).filter(
    (v) => v.trim() !== "",
  ).length;

  const openTableFilterPicker = (fieldName) => {
    setActiveTableFilterPickerField(fieldName);
    setTableFilterPickerSearch("");
  };

  const closeTableFilterPicker = () => {
    setActiveTableFilterPickerField(null);
    setTableFilterPickerSearch("");
  };

  const applyTableFilterValue = (value) => {
    if (!activeTableFilterPickerField) return;
    setTableFilters((prev) => ({
      ...prev,
      [activeTableFilterPickerField]: value,
    }));
    closeTableFilterPicker();
  };

  const clearTableFilters = () => {
    setTableFilters({ product: "", discount: "", price: "" });
    closeTableFilterPicker();
  };

  const tableFilterPickerOptions = useMemo(() => {
    if (!activeTableFilterPickerField) return [];

    const values = items
      .map((item) => {
        if (activeTableFilterPickerField === "product") return item.name || "";
        if (activeTableFilterPickerField === "discount") {
          return `${Number(item.discount || 0).toFixed(2)}%`;
        }
        if (activeTableFilterPickerField === "price") {
          return `$${formatCurrency(item.price)}`;
        }
        return "";
      })
      .filter((value) => String(value).trim() !== "");

    return Array.from(new Set(values));
  }, [activeTableFilterPickerField, items]);

  const visibleTableFilterPickerOptions = useMemo(() => {
    const search = normalizeSearchText(tableFilterPickerSearch);
    if (!search) return tableFilterPickerOptions;

    return tableFilterPickerOptions.filter((value) =>
      normalizeSearchText(value).includes(search),
    );
  }, [tableFilterPickerOptions, tableFilterPickerSearch]);

  const quoteDraftScope = resolveQuoteDraftScope({
    requestId,
    clientId: fixedClientId,
  });
  const loadedRequestDraftIdRef = useRef(null);
  const loadingRequestIdRef = useRef(null);
  const [initializedRequestId, setInitializedRequestId] = useState("");

  useLayoutEffect(() => {
    loadedRequestDraftIdRef.current = null;
    loadingRequestIdRef.current = null;
    setInitializedRequestId("");
    setClientSearch("");
    setClientResults([]);
    setSelectedClient(null);
    setSelectedContactId("");
    setItems([]);
    setFolio("");
    setResolvableRequestId("");
    setError("");
    setLoading(shouldAutoResolvePortalRequest);
    setIsDraftPersistenceSuspended(false);
  }, [
    requestReloadToken,
    shouldAutoResolvePortalRequest,
    urlRequestId,
  ]);
  const quoteDraftData = useMemo(
    () => ({
      clientSearch,
      selectedClient:
        selectedClient ?
          {
            id: selectedClient.id,
            business_name: selectedClient.business_name,
            rfc: selectedClient.rfc,
            contacts: selectedClient.contacts || [],
          }
        : null,
      selectedContactId,
      items,
      folio,
    }),
    [clientSearch, selectedClient, selectedContactId, items, folio],
  );

  const {
    isDraftReady,
    readyScopeKey,
    persistDraftNow,
    deleteDraftNow,
  } = usePersistedFormDraft({
    formKey: "create-quote",
    scopeKey: quoteDraftScope,
    data: quoteDraftData,
    enabled: true,
    loadEnabled: !shouldReloadRequestFromSource,
    saveEnabled:
      !loading &&
      !isDraftPersistenceSuspended &&
      (!requestId || initializedRequestId === requestId),
    isMeaningfulDraft: isMeaningfulQuoteDraft,
    onDraftLoaded: (draft) => {
      if (requestId) {
        loadedRequestDraftIdRef.current = requestId;
        setInitializedRequestId(requestId);
      }

      if (draft?.selectedClient) {
        setSelectedClient(draft.selectedClient);
        setClientSearch(draft.clientSearch || draft.selectedClient.business_name || "");
      } else if (draft?.clientSearch) {
        setClientSearch(draft.clientSearch);
      }

      if (draft?.selectedContactId) {
        setSelectedContactId(draft.selectedContactId);
      }

      if (Array.isArray(draft?.items)) {
        setItems(
          draft.items.map((item) => ({
            ...item,
            tempId: item.tempId || createQuoteItemId(),
            discount: clampDiscount(item.discount || 0),
            quantity: Math.max(1, Number(item.quantity) || 1),
            price: Math.max(0, Number(item.price) || 0),
            total:
              Number(item.total) ||
              calculateItemTotal(item.price, item.quantity, item.discount),
          })),
        );
      }

      if (draft?.folio) {
        setFolio(String(draft.folio).toUpperCase());
      }
    },
  });

  const persistResetDraft = async (nextDraft) => {
    try {
      await persistDraftNow(nextDraft);
    } catch (draftError) {
      notificationService.error(
        "Error",
        draftError.message || "No se pudo actualizar el borrador.",
      );
    }
  };

  const resetClientData = async () => {
    const confirmed = await notificationService.confirm({
      title: "¿Restablecer los datos del cliente?",
      text: "Se eliminará el cliente y contacto guardados en este borrador.",
      confirmButtonText: "Sí, restablecer",
      cancelButtonText: "Cancelar",
    });
    if (!confirmed) return;

    setClientSearch("");
    setClientResults([]);
    setSelectedClient(null);
    setSelectedContactId("");
    setShowClientModal(false);
    setError("");

    await persistResetDraft({
      ...quoteDraftData,
      clientSearch: "",
      selectedClient: null,
      selectedContactId: "",
    });
  };

  const resetItemsData = async () => {
    const confirmed = await notificationService.confirm({
      title: "¿Restablecer los productos agregados?",
      text: "Se eliminarán todos los productos guardados en la tabla.",
      confirmButtonText: "Sí, restablecer",
      cancelButtonText: "Cancelar",
    });
    if (!confirmed) return;

    setItems([]);
    setProdSearch("");
    setProdResults([]);
    setSelectedProductToAdd(null);
    setQtyToAdd(1);
    setShowProductModal(false);
    setEditingItemDraft(null);
    setTableFilter("");
    setTableSorting([]);
    setShowTableFilters(false);
    setTableFilters({ product: "", discount: "", price: "" });
    closeTableFilterPicker();
    setError("");

    await persistResetDraft({
      ...quoteDraftData,
      items: [],
    });
  };

  const loadRequest = useCallback(async (id, initiatingRouteContext) => {
    const isCurrentLoad = () =>
      isActiveRequest(id, initiatingRouteContext);

    try {
      const quote = await getQuoteApi(id);
      if (!isCurrentLoad()) return false;
      if (!quote?.client?.id) return false;

      const client = await getClientApi(quote.client.id);
      if (!isCurrentLoad()) return false;
      const isResolvableRequest = quote.status === "SOLICITADA";

      const loadedItems = (quote.items || []).map((item) => {
        const discount = clampDiscount(item.discount || 0);
        const discountedUnitPrice = Number(item.unit_price) || 0;
        const rawBaseUnitPrice = Number(item.base_unit_price);
        const basePriceFromStoredField =
          Number.isFinite(rawBaseUnitPrice) && rawBaseUnitPrice > 0 ?
            rawBaseUnitPrice
          : null;

        const basePriceFromDiscount =
          discount > 0 && discount < 100 ?
            roundCurrency(discountedUnitPrice / (1 - discount / 100))
          : discountedUnitPrice;

        const baseUnitPrice =
          basePriceFromStoredField || basePriceFromDiscount || 0;
        const quantity = Number(item.quantity) || 1;

        return {
          tempId: createQuoteItemId(),
          product_id: item.product.id,
          folio: item.product.folio || "",
          name: item.product.name,
          price: baseUnitPrice,
          discount,
          quantity,
          total:
            Number(item.total) ||
            calculateItemTotal(baseUnitPrice, quantity, discount),
        };
      });

      setFolio(isResolvableRequest ? quote.folio || "" : "");
      setResolvableRequestId(isResolvableRequest ? String(id) : "");
      setSelectedClient(client);
      setClientSearch(client.business_name);
      setSelectedContactId(
        quote.contact?.id ||
          client.contacts?.[0]?.id ||
          "",
      );
      setItems(loadedItems);

      if (shouldAutoResolvePortalRequest) {
        if (!isResolvableRequest) {
          navigate(`/cotizaciones/${id}`, { replace: true });
          return false;
        }

        const contactId = quote.contact?.id || client.contacts?.[0]?.id || "";
        const payload = buildCreateQuotePayload({
          client,
          contactId,
          items: loadedItems,
          folio: resolveQuoteFolioDraft(quote.folio),
        });

        setLoading(true);
        setError("");
        try {
          const savedQuote = await resolveQuoteRequestApi(id, payload);
          if (!isCurrentLoad()) return false;

          await deleteDraftNow();
          if (!isCurrentLoad()) return false;

          setIsDraftPersistenceSuspended(true);
          navigate(`/cotizaciones/${savedQuote?.id || id}`, { replace: true });
          return false;
        } catch (requestError) {
          if (!isCurrentLoad()) return false;

          if (isProcessedRequestError(requestError)) {
            navigate(`/cotizaciones/${id}`, { replace: true });
            return false;
          }
          setError(requestError.message || "No se pudo generar la cotización.");
          return true;
        } finally {
          if (isCurrentLoad()) {
            setLoading(false);
          }
        }
      }

      return true;
    } catch (e) {
      if (!isCurrentLoad()) return false;

      setError("Error cargando la solicitud de cotización: " + e.message);
      return false;
    }
  }, [
    deleteDraftNow,
    isActiveRequest,
    navigate,
    setClientSearch,
    setError,
    setFolio,
    setIsDraftPersistenceSuspended,
    setItems,
    setLoading,
    setResolvableRequestId,
    setSelectedClient,
    setSelectedContactId,
    shouldAutoResolvePortalRequest,
  ]);

  const loadClient = useCallback(async (id, contactIdToSelect = null) => {
    try {
      const client = await getClientApi(id);
      if (client) {
        setSelectedClient(client);
        setClientSearch(client.business_name);
        
        if (contactIdToSelect) {
          setSelectedContactId(contactIdToSelect);
        } else if (client.contacts?.length > 0) {
          setSelectedContactId(client.contacts[0].id);
        } else {
          setSelectedContactId("");
        }
      }
    } catch (e) {
      notificationService.error("Error", "Error cargando cliente: " + e.message);
    }
  }, [
    setClientSearch,
    setSelectedClient,
    setSelectedContactId,
  ]);

  // Cargar la solicitud original solo cuando no existe un borrador persistido.
  useEffect(() => {
    if (requestId) {
      if (
        isDraftReady &&
        readyScopeKey === quoteDraftScope &&
        loadedRequestDraftIdRef.current !== requestId &&
        !(
          loadingRequestIdRef.current?.requestId === requestId &&
          loadingRequestIdRef.current?.routeContext === routeContext
        )
      ) {
        const initiatingRequestId = requestId;
        const initiatingRouteContext = routeContext;
        const loadIdentity = {
          requestId: initiatingRequestId,
          routeContext: initiatingRouteContext,
        };
        loadingRequestIdRef.current = loadIdentity;

        const loadSelectedRequest = async () => {
          if (shouldReloadRequestFromSource) {
            try {
              await deleteDraftNow();
            } catch {
              // A stale draft must never prevent loading the original request.
            }
          }
          if (!isActiveRequest(initiatingRequestId, initiatingRouteContext)) {
            return false;
          }
          return loadRequest(initiatingRequestId, initiatingRouteContext);
        };

        loadSelectedRequest().then((loaded) => {
          if (
            !isActiveRequest(initiatingRequestId, initiatingRouteContext)
          ) {
            return;
          }

          if (loadingRequestIdRef.current === loadIdentity) {
            loadingRequestIdRef.current = null;
          }
          if (loaded) {
            setInitializedRequestId(initiatingRequestId);
          }
        });
      }
    } else if (fixedClientId) {
      loadClient(fixedClientId);
    }
  }, [
    fixedClientId,
    isActiveRequest,
    isDraftReady,
    deleteDraftNow,
    loadClient,
    loadRequest,
    quoteDraftScope,
    readyScopeKey,
    requestReloadToken,
    requestId,
    routeContext,
    shouldReloadRequestFromSource,
  ]);

  // Efecto de búsqueda de cliente
  useEffect(() => {
    let cancelled = false;

    if (!showClientModal) {
      setIsClientSearching(false);
      return () => {
        cancelled = true;
      };
    }

    const query = clientSearch.trim();
    const delay = query ? 300 : 0;

    const timer = setTimeout(async () => {
      if (selectedClient) {
        if (!cancelled) {
          setClientResults([]);
          setIsClientSearching(false);
        }
        return;
      }

      if (!cancelled) setIsClientSearching(true);

      try {
        const res =
          query ? await searchClientsApi(query) : await listClientsApi();
        if (!cancelled) {
          setClientResults(Array.isArray(res) ? res : []);
        }
      } catch {
        if (!cancelled) setClientResults([]);
      } finally {
        if (!cancelled) setIsClientSearching(false);
      }
    }, delay);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [clientSearch, selectedClient, showClientModal]);

  // Búsqueda de productos en modal
  useEffect(() => {
    let cancelled = false;

    if (!showProductModal) {
      setIsProductSearching(false);
      return () => {
        cancelled = true;
      };
    }

    const query = prodSearch.trim();
    const delay = query ? 250 : 0;

    const timer = setTimeout(async () => {
      if (selectedProductToAdd) {
        if (!cancelled) {
          setProdResults([]);
          setIsProductSearching(false);
        }
        return;
      }

      if (!cancelled) setIsProductSearching(true);

      try {
        const clientId = selectedClient ? selectedClient.id : null;
        const res =
          query ?
            await searchProductsApi(query, clientId)
          : await listProductsApi(clientId);
        if (!cancelled) {
          setProdResults(Array.isArray(res) ? res : []);
        }
      } catch {
        if (!cancelled) setProdResults([]);
      } finally {
        if (!cancelled) setIsProductSearching(false);
      }
    }, delay);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [prodSearch, selectedProductToAdd, selectedClient, showProductModal]);

  const selectClient = async (c) => {
    setClientSearch(c.business_name);
    setClientResults([]);
    setShowClientModal(false);
    try {
      const fullClient = await getClientApi(c.id);
      setSelectedClient(fullClient);
      if (fullClient.contacts?.length > 0) {
        setSelectedContactId(fullClient.contacts[0].id);
      } else {
        setSelectedContactId("");
      }
    } catch {
      setSelectedClient(c);
    }
  };

  const selectProduct = (p) => {
    setSelectedProductToAdd(p);
    setProdSearch(p.name);
    setProdResults([]);
  };

  const addItemDirectly = (p) => {
    setItems((prev) => upsertQuoteItem(prev, p, 1));
    setJustAdded(p.id);
    setTimeout(() => setJustAdded(null), 1200);
  };

  const removeItemDirectly = (p) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.product_id === p.id);
      if (!existing) return prev;
      if (existing.quantity === 1) {
        return prev.filter((i) => i.product_id !== p.id);
      }
      return prev.map((i) =>
        i.product_id === p.id ?
          {
            ...i,
            quantity: i.quantity - 1,
            total: calculateItemTotal(i.price, i.quantity - 1, i.discount),
          }
        : i,
      );
    });
  };

  const closeProductModal = () => {
    setShowProductModal(false);
    setProdSearch("");
    setProdResults([]);
    setIsProductSearching(false);
    setSelectedProductToAdd(null);
  };

  const addItem = () => {
    if (!selectedProductToAdd) return;
    const qty = Math.max(1, Number(qtyToAdd) || 1);
    setItems((prev) => upsertQuoteItem(prev, selectedProductToAdd, qty));
    setSelectedProductToAdd(null);
    setProdSearch("");
    setQtyToAdd(1);
  };

  const openEditItem = (item) => {
    setEditingItemDraft({
      tempId: item.tempId,
      name: item.name,
      quantity: Math.max(1, Number(item.quantity) || 1),
      price: Math.max(0, Number(item.price) || 0),
      discount: clampDiscount(item.discount || 0),
    });
  };

  const updateEditingItemField = (field, value) => {
    setEditingItemDraft((prev) => {
      if (!prev) return prev;

      if (field === "quantity") {
        const parsed = Number.parseInt(value, 10);
        return {
          ...prev,
          quantity: Number.isFinite(parsed) ? Math.max(1, parsed) : 1,
        };
      }

      if (field === "price") {
        const parsed = Number.parseFloat(value);
        return {
          ...prev,
          price: Number.isFinite(parsed) ? Math.max(0, parsed) : 0,
        };
      }

      if (field === "discount") {
        return {
          ...prev,
          discount: clampDiscount(value),
        };
      }

      return prev;
    });
  };

  const applyItemEdit = () => {
    if (!editingItemDraft) return;

    const quantity = Math.max(
      1,
      Number.parseInt(editingItemDraft.quantity, 10) || 1,
    );
    const price = Math.max(0, roundCurrency(editingItemDraft.price));
    const discount = clampDiscount(editingItemDraft.discount || 0);

    setItems((prev) =>
      prev.map((item) =>
        item.tempId === editingItemDraft.tempId
          ? updateQuoteItemDraft(item, { quantity, price, discount })
          : item,
      ),
    );

    setEditingItemDraft(null);
  };

  const removeItem = (tempId) => {
    setItems((prev) => prev.filter((i) => i.tempId !== tempId));
    setEditingItemDraft((prev) => (prev?.tempId === tempId ? null : prev));
  };

  const save = async () => {
    if (!selectedClient) return setError("Selecciona un cliente");
    if (items.length === 0) return setError("Agrega al menos un producto");

    const saveRouteContext = activeRouteContextRef.current;
    const isCurrentSaveRoute = () =>
      isMountedRef.current &&
      activeRouteContextRef.current === saveRouteContext;

    setLoading(true);
    setError("");
    try {
      const finalQuoteFolio = ensureQuoteFolio();
      const payload = buildCreateQuotePayload({
        client: selectedClient,
        contactId: selectedContactId,
        items,
        folio: finalQuoteFolio,
      });

      let savedQuote = null;
      const shouldResolveRequest =
        requestId && String(resolvableRequestId) === String(requestId);
      if (shouldResolveRequest) {
        try {
          savedQuote = await resolveQuoteRequestApi(requestId, payload);
          if (!isCurrentSaveRoute()) return;
        } catch (requestError) {
          if (!isCurrentSaveRoute()) return;
          if (!isProcessedRequestError(requestError)) throw requestError;
          if (!isCurrentSaveRoute()) return;
          savedQuote = await createQuoteApi(payload);
          if (!isCurrentSaveRoute()) return;
        }
      } else {
        if (!isCurrentSaveRoute()) return;
        savedQuote = await createQuoteApi(payload);
        if (!isCurrentSaveRoute()) return;
      }

      if (!isCurrentSaveRoute()) return;
      setShowPreviewModal(false);

      if (savedQuote?.id) {
        if (!isCurrentSaveRoute()) return;
        await deleteDraftNow();
        if (!isCurrentSaveRoute()) return;
        setIsDraftPersistenceSuspended(true);
        if (!isCurrentSaveRoute()) return;
        navigate(`/cotizaciones/${savedQuote.id}`);
        return;
      }

      if (!isCurrentSaveRoute()) return;
      throw new Error(
        "La cotización se generó, pero no se pudo abrir la vista final.",
      );
    } catch (e) {
      if (!isCurrentSaveRoute()) return;
      setError(e.message);
    } finally {
      if (isCurrentSaveRoute()) {
        setLoading(false);
      }
    }
  };

  const startNewQuote = () => {
    const hadRequest = Boolean(requestId);

    setGeneratedQuote(null);
    setLoading(false);
    setError("");
    setIsDraftPersistenceSuspended(false);
    setItems([]);
    setProdSearch("");
    setProdResults([]);
    setIsProductSearching(false);
    setSelectedProductToAdd(null);
    setQtyToAdd(1);
    setShowPreviewModal(false);
    setShowProductModal(false);
    setShowClientModal(false);
    setFolio("");
    setResolvableRequestId("");
    setJustAdded(null);
    setTableFilter("");
    setTableSorting([]);

    if (!fixedClientId) {
      setSelectedClient(null);
      setSelectedContactId("");
      setClientSearch("");
      setClientResults([]);
      return;
    }

    if (selectedClient?.contacts?.length > 0) {
      setSelectedContactId(selectedClient.contacts[0].id);
    } else {
      setSelectedContactId("");
    }

    if (hadRequest) {
      navigate(`/cotizaciones/nueva?client_id=${fixedClientId}`, {
        replace: true,
      });
    }
  };

  const selectedContact = useMemo(() => {
    if (!selectedClient?.contacts?.length || !selectedContactId) return null;
    return (
      selectedClient.contacts.find(
        (contact) => String(contact.id) === String(selectedContactId),
      ) || null
    );
  }, [selectedClient, selectedContactId]);

  const quoteFolio = String(folio || "").trim();

  const ensureQuoteFolio = () => {
    const nextFolio = resolveQuoteFolioDraft(quoteFolio);
    setFolio(nextFolio);
    return nextFolio;
  };

  const visibleClientResults = useMemo(
    () => clientResults.slice(0, MAX_CLIENT_RESULTS_IN_MODAL),
    [clientResults],
  );

  return {
    clientSearch,
    setClientSearch,
    clientResults,
    selectedClient,
    setSelectedClient,
    selectedContactId,
    setSelectedContactId,
    showClientModal,
    setShowClientModal,
    isClientSearching,
    items,
    setItems,
    prodSearch,
    setProdSearch,
    prodResults,
    isProductSearching,
    selectedProductToAdd,
    qtyToAdd,
    setQtyToAdd,
    showProductModal,
    setShowProductModal,
    showPreviewModal,
    setShowPreviewModal,
    folio: quoteFolio,
    setFolio,
    ensureQuoteFolio,
    justAdded,
    generatedQuote,
    setGeneratedQuote,
    editingItemDraft,
    setEditingItemDraft,
    loading,
    error,
    setError,
    tableFilter,
    setTableFilter,
    tableSorting,
    setTableSorting,
    showTableFilters,
    setShowTableFilters,
    tableFilters,
    activeTableFilterPickerField,
    tableFilterPickerSearch,
    setTableFilterPickerSearch,
    activeTableFilterCount,
    openTableFilterPicker,
    closeTableFilterPicker,
    applyTableFilterValue,
    clearTableFilters,
    tableFilterPickerOptions,
    visibleTableFilterPickerOptions,
    selectClient,
    selectProduct,
    addItemDirectly,
    removeItemDirectly,
    closeProductModal,
    addItem,
    openEditItem,
    updateEditingItemField,
    applyItemEdit,
    removeItem,
    save,
    startNewQuote,
    selectedContact,
    visibleClientResults,
    resetClientData,
    resetItemsData,
  };
}
