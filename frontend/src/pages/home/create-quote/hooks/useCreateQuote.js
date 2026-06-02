import { useState, useEffect, useMemo } from "react";
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
  toggleQuotePortalApi,
} from "../../../../actionsAPI/quotes.api";
import { logger } from "../../../../services/logger";
import {
  normalizeDiscount,
  calculateItemTotal,
  calculateQuotePricing,
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

const MAX_CLIENT_RESULTS_IN_MODAL = 50;
const roundCurrency = roundMoney;
const clampDiscount = normalizeDiscount;

export function useCreateQuote(navigate) {
  const [searchParams] = useSearchParams();

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

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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

  const loadRequest = async (id) => {
    try {
      const quote = await getQuoteApi(id);
      if (quote) {
        await loadClient(quote.client.id, quote.contact?.id);

        if (quote.items && quote.items.length > 0) {
          const loadedItems = quote.items.map((item) => {
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
              name: item.product.name,
              price: baseUnitPrice,
              discount,
              quantity,
              total:
                Number(item.total) ||
                calculateItemTotal(baseUnitPrice, quantity, discount),
            };
          });
          setItems(loadedItems);
        }
      }
    } catch (e) {
      setError("Error cargando la solicitud de cotización: " + e.message);
    }
  };

  const loadClient = async (id, contactIdToSelect = null) => {
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
  };

  // Cargar cliente desde URL si existe
  useEffect(() => {
    const clientId = searchParams.get("client_id");
    const requestId = searchParams.get("request_id");

    if (requestId) {
      loadRequest(requestId);
    } else if (clientId) {
      loadClient(clientId);
    }
  }, [searchParams]);

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

    setLoading(true);
    setError("");
    try {
      const requestId = searchParams.get("request_id");
      const payload = {
        client_id: selectedClient.id,
        contact_id: selectedContactId || undefined,
        items: items.map((i) => {
          const discount = clampDiscount(i.discount || 0);

          return {
            product_id: i.product_id,
            quantity: i.quantity,
            unit_price: Number(i.price) || 0,
            discount,
          };
        }),
        notes: "Ninguna por el momento",
        folio: folio || undefined,
      };

      let savedQuote = null;
      if (requestId) {
        savedQuote = await resolveQuoteRequestApi(requestId, payload);
      } else {
        savedQuote = await createQuoteApi(payload);
      }
      setShowPreviewModal(false);

      if (savedQuote?.id) {
        if (portalAutoContactId) {
          try {
            await toggleQuotePortalApi(
              savedQuote.id,
              true,
              portalAutoContactId,
            );
          } catch (portalError) {
            logger.error(
              "No se pudo enviar automaticamente al portal:",
              portalError,
            );
          }
        }

        navigate(`/cotizaciones/${savedQuote.id}`);
        return;
      }

      throw new Error(
        "La cotización se generó, pero no se pudo abrir la vista final.",
      );
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const startNewQuote = () => {
    const fixedClientId = searchParams.get("client_id");
    const hadRequest = Boolean(searchParams.get("request_id"));

    setGeneratedQuote(null);
    setLoading(false);
    setError("");
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

  const portalAutoContactId = useMemo(() => {
    const clientContacts = selectedClient?.contacts || [];
    if (!clientContacts.length) return null;

    const explicitlySelectedContact = clientContacts.find(
      (contact) => String(contact.id) === String(selectedContactId),
    );

    if (explicitlySelectedContact?.has_portal_access) {
      return explicitlySelectedContact.id;
    }

    const firstPortalEnabledContact = clientContacts.find((contact) =>
      Boolean(contact?.has_portal_access),
    );

    return firstPortalEnabledContact?.id || null;
  }, [selectedClient, selectedContactId]);

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
    folio,
    setFolio,
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
    portalAutoContactId,
    visibleClientResults,
  };
}
