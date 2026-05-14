import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  flexRender,
} from "@tanstack/react-table";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import {
  searchClientsApi,
  getClientApi,
  listClientsApi,
} from "../../actionsAPI/clients.api";
import {
  searchProductsApi,
  listProductsApi,
} from "../../actionsAPI/products.api";
import {
  createQuoteApi,
  getQuoteApi,
  resolveQuoteRequestApi,
  toggleQuotePortalApi,
} from "../../actionsAPI/quotes.api";
import {
  Building2,
  BadgeDollarSign,
  Edit2,
  ShoppingBag,
  Trash2,
  X,
  ShoppingCart,
  Plus,
  Search,
  SlidersHorizontal,
  ChevronUp,
  ChevronDown,
  Minus,
  CheckCircle2,
  ArrowLeft,
} from "@icons";

const IVA_RATE = 0.16;
const MAX_CLIENT_RESULTS_IN_MODAL = 80;
const MAX_PRODUCT_RESULTS_IN_MODAL = 120;

function roundCurrency(value) {
  return Math.round((Number(value) || 0) * 100) / 100;
}

function clampDiscount(value) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return 0;
  if (numericValue < 0) return 0;
  if (numericValue > 100) return 100;
  return numericValue;
}

function calculateDiscountedUnitPrice(price, discount = 0) {
  const safePrice = Number(price) || 0;
  const safeDiscount = clampDiscount(discount);
  return roundCurrency(safePrice * (1 - safeDiscount / 100));
}

function calculateItemTotal(price, quantity, discount = 0) {
  const safeQty = Math.max(1, Number(quantity) || 1);
  return roundCurrency(calculateDiscountedUnitPrice(price, discount) * safeQty);
}

function formatCurrency(value) {
  return (Number(value) || 0).toLocaleString("es-MX", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function normalizeSearchText(value) {
  return (value || "")
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function formatDateTime(value) {
  const parsed = value ? new Date(value) : new Date();
  if (Number.isNaN(parsed.getTime())) return "-";
  return parsed.toLocaleString("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function getQuoteStatusLabel(status) {
  const safeStatus = String(status || "").toUpperCase();
  if (safeStatus === "PENDING") return "Pendiente";
  if (safeStatus === "REQUESTED") return "Solicitada";
  if (safeStatus === "APPROVED") return "Aprobada";
  if (safeStatus === "REJECTED") return "Rechazada";
  return status || "Pendiente";
}

const DiscountInputCell = ({ item, setItems }) => {
  const [localDiscount, setLocalDiscount] = useState(item.discount ?? 0);

  useEffect(() => {
    setLocalDiscount(item.discount ?? 0);
  }, [item.discount]);

  const commitChange = (value) => {
    const nextDiscount = clampDiscount(value);
    setLocalDiscount(nextDiscount);
    setItems((prev) =>
      prev.map((i) =>
        i.tempId === item.tempId ?
          {
            ...i,
            discount: nextDiscount,
            total: calculateItemTotal(i.price, i.quantity, nextDiscount),
          }
        : i,
      ),
    );
  };

  return (
    <input
      type="number"
      min="0"
      max="100"
      step="0.01"
      value={localDiscount}
      onChange={(e) => setLocalDiscount(e.target.value)}
      onBlur={(e) => commitChange(e.target.value)}
      className="w-20 px-2 py-1 rounded-md border border-light-border dark:border-dark-700 bg-white dark:bg-dark-900 text-xs font-mono text-right text-[#125280] dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-[#2277B4]"
      style={{ colorScheme: "dark light" }}
    />
  );
};

export default function CreateQuote() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fixedClientId = searchParams.get("client_id");

  // Seleccion de cliente
  const [clientSearch, setClientSearch] = useState("");
  const [clientResults, setClientResults] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedContactId, setSelectedContactId] = useState("");
  const [showClientModal, setShowClientModal] = useState(false);
  const [isClientSearching, setIsClientSearching] = useState(false);

  // Items
  const [items, setItems] = useState([]); // { tempId, product_id, name, quantity, price, discount, total }

  // Busqueda de productos
  const [prodSearch, setProdSearch] = useState("");
  const [prodResults, setProdResults] = useState([]);
  const [isProductSearching, setIsProductSearching] = useState(false);
  const [selectedProductToAdd, setSelectedProductToAdd] = useState(null);
  const [qtyToAdd, setQtyToAdd] = useState(1);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [folio, setFolio] = useState("");
  const [justAdded, setJustAdded] = useState(null); // id del producto recien agregado
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

  const tableFilterFieldLabels = {
    product: "Producto",
    discount: "Descuento",
    price: "Precio",
  };

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

    const uniqueValues = new Map();

    items.forEach((item) => {
      let value = "";

      if (activeTableFilterPickerField === "product") {
        value = item.name || "";
      } else if (activeTableFilterPickerField === "discount") {
        value = `${Number(item.discount || 0).toFixed(2)}%`;
      } else if (activeTableFilterPickerField === "price") {
        value = `$${formatCurrency(item.price)}`;
      }

      const normalized = normalizeSearchText(value);
      if (!normalized || uniqueValues.has(normalized)) return;
      uniqueValues.set(normalized, value);
    });

    return Array.from(uniqueValues.values()).sort((a, b) =>
      a.localeCompare(b, "es", { sensitivity: "base" }),
    );
  }, [items, activeTableFilterPickerField]);

  const visibleTableFilterPickerOptions = useMemo(() => {
    const s = normalizeSearchText(tableFilterPickerSearch);
    if (!s) return tableFilterPickerOptions;

    return tableFilterPickerOptions.filter((value) =>
      normalizeSearchText(value).includes(s),
    );
  }, [tableFilterPickerSearch, tableFilterPickerOptions]);

  const filteredItemsByFieldFilters = useMemo(() => {
    const hasFieldFilters = Object.values(tableFilters).some(
      (v) => v.trim() !== "",
    );
    if (!hasFieldFilters) return items;

    return items.filter((item) => {
      const productValue = item.name || "";
      const discountValue = `${Number(item.discount || 0).toFixed(2)}%`;
      const priceValue = `$${formatCurrency(item.price)}`;

      return (
        (!tableFilters.product ||
          normalizeSearchText(productValue).includes(
            normalizeSearchText(tableFilters.product),
          )) &&
        (!tableFilters.discount ||
          normalizeSearchText(discountValue) ===
            normalizeSearchText(tableFilters.discount)) &&
        (!tableFilters.price ||
          normalizeSearchText(priceValue) ===
            normalizeSearchText(tableFilters.price))
      );
    });
  }, [items, tableFilters]);
  const itemsColumns = useMemo(
    () => [
      {
        id: "idx",
        header: "#",
        cell: ({ row }) => (
          <span className="font-mono text-xs text-light-text-secondary dark:text-zinc-500 opacity-50">
            {row.index + 1}
          </span>
        ),
        enableSorting: false,
      },
      {
        accessorKey: "name",
        header: "Producto",
        cell: ({ getValue }) => (
          <span className="font-medium text-light-text-primary dark:text-zinc-100">
            {getValue()}
          </span>
        ),
      },
      {
        accessorKey: "quantity",
        header: "Cant",
        cell: ({ row }) => (
          <div className="flex items-center justify-center gap-1">
            <span className=" px-2 py-0.5 rounded text-xs font-mono font-bold min-w-[28px] text-center text-black dark:text-zinc-100">
              {row.original.quantity}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "price",
        header: "Precio Unit. (MXN)",
        cell: ({ getValue }) => (
          <span className="font-mono text-light-text-secondary dark:text-zinc-300">
            $
            {Number(getValue()).toLocaleString("es-MX", {
              minimumFractionDigits: 2,
            })}
          </span>
        ),
      },
      {
        accessorKey: "discount",
        header: "Desc. %",
        cell: ({ row }) => (
          <DiscountInputCell item={row.original} setItems={setItems} />
        ),
      },
      {
        accessorKey: "total",
        header: "Importe",
        cell: ({ getValue }) => (
          <span className="font-mono font-semibold text-light-text-primary dark:text-zinc-100">
            $
            {Number(getValue()).toLocaleString("es-MX", {
              minimumFractionDigits: 2,
            })}
          </span>
        ),
      },
      {
        id: "totalIva",
        header: "Total + IVA",
        accessorFn: (row) => row.total * 1.16,
        cell: ({ getValue }) => (
          <span className="font-mono font-bold text-[#1B4733] dark:text-emerald-400">
            $
            {Number(getValue()).toLocaleString("es-MX", {
              minimumFractionDigits: 2,
            })}
          </span>
        ),
      },
      {
        id: "actions",
        header: "Acciones",
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-1.5">
            <button
              onClick={() => openEditItem(row.original)}
              className="size-7 flex items-center justify-center rounded-lg text-[#2277B4] dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/20 transition-all"
              title="Editar producto">
              <Edit2 size={13} />
            </button>
            <button
              onClick={() => removeItem(row.original.tempId)}
              className="size-7 flex items-center justify-center rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/20 transition-all"
              title="Eliminar item">
              <Trash2 size={13} />
            </button>
          </div>
        ),
      },
    ],
    [items],
  );

  const itemsTable = useReactTable({
    data: filteredItemsByFieldFilters,
    columns: itemsColumns,
    state: { sorting: tableSorting, globalFilter: tableFilter },
    onSortingChange: setTableSorting,
    onGlobalFilterChange: setTableFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    globalFilterFn: (row, _colId, filterValue) => {
      const q = normalizeSearchText(filterValue);
      if (!q) return true;

      const original = row.original;
      const totalIva = (Number(original.total) || 0) * IVA_RATE;

      return [
        original.name,
        original.quantity,
        original.price,
        original.discount,
        original.total,
        totalIva,
        `$${formatCurrency(original.price)}`,
        `$${formatCurrency(original.total)}`,
        `$${formatCurrency(totalIva)}`,
      ].some((value) => normalizeSearchText(value).includes(q));
    },
    initialState: { pagination: { pageSize: 10 } },
  });

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

  const loadRequest = async (id) => {
    try {
      const quote = await getQuoteApi(id);
      if (quote) {
        // Cargar Cliente y preseleccionar el contacto de la solicitud
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
              tempId: Date.now() + Math.random(),
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
      console.error("Error cargando solicitud", e);
      setError("Error cargando la solicitud de cotización");
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
      console.error("Error cargando cliente por param", e);
    }
  };

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
      } catch (e) {
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

  // Búsqueda de productos en modal (carga inicial + filtro por texto)
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
      } catch (e) {
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
    // Fetch full client details (including contacts)
    try {
      const fullClient = await getClientApi(c.id);
      setSelectedClient(fullClient);
      if (fullClient.contacts?.length > 0) {
        setSelectedContactId(fullClient.contacts[0].id);
      } else {
        setSelectedContactId("");
      }
    } catch (e) {
      console.error("Error fetching full client details", e);
      setSelectedClient(c);
    }
  };

  const selectProduct = (p) => {
    setSelectedProductToAdd(p);
    setProdSearch(p.name);
    setProdResults([]);
  };

  // Agrega un producto desde el modal directamente (qty = 1) sin cerrar el modal
  const addItemDirectly = (p) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.product_id === p.id);
      if (existing) {
        return prev.map((i) =>
          i.product_id === p.id ?
            {
              ...i,
              quantity: i.quantity + 1,
              total: calculateItemTotal(i.price, i.quantity + 1, i.discount),
            }
          : i,
        );
      }
      return [
        ...prev,
        {
          tempId: Date.now() + Math.random(),
          product_id: p.id,
          name: p.name,
          price: Number(p.current_price),
          discount: 0,
          quantity: 1,
          total: calculateItemTotal(Number(p.current_price), 1, 0),
        },
      ];
    });
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
    setItems((prev) => {
      const existing = prev.find(
        (i) => i.product_id === selectedProductToAdd.id,
      );
      if (existing) {
        return prev.map((i) =>
          i.product_id === selectedProductToAdd.id ?
            {
              ...i,
              quantity: i.quantity + qty,
              total: calculateItemTotal(i.price, i.quantity + qty, i.discount),
            }
          : i,
        );
      }
      return [
        ...prev,
        {
          tempId: Date.now(),
          product_id: selectedProductToAdd.id,
          name: selectedProductToAdd.name,
          price: Number(selectedProductToAdd.current_price),
          discount: 0,
          quantity: qty,
          total: calculateItemTotal(
            Number(selectedProductToAdd.current_price),
            qty,
            0,
          ),
        },
      ];
    });
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
        item.tempId === editingItemDraft.tempId ?
          {
            ...item,
            quantity,
            price,
            discount,
            total: calculateItemTotal(price, quantity, discount),
          }
        : item,
      ),
    );

    setEditingItemDraft(null);
  };

  const removeItem = (tempId) => {
    setItems((prev) => prev.filter((i) => i.tempId !== tempId));
    setEditingItemDraft((prev) => (prev?.tempId === tempId ? null : prev));
  };

  const grossSubtotal = roundCurrency(
    items.reduce(
      (sum, item) =>
        sum + (Number(item.price) || 0) * (Number(item.quantity) || 0),
      0,
    ),
  );

  const totalDiscount = roundCurrency(
    items.reduce(
      (sum, item) =>
        sum +
        ((Number(item.price) || 0) *
          (Number(item.quantity) || 0) *
          clampDiscount(item.discount || 0)) /
          100,
      0,
    ),
  );

  const grandTotal = roundCurrency(
    items.reduce((sum, item) => sum + (Number(item.total) || 0), 0),
  );
  const ivaTotal = roundCurrency(grandTotal * IVA_RATE);
  const totalWithIva = roundCurrency(grandTotal + ivaTotal);

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

  const productSearchColumns = useMemo(
    () => [
      {
        accessorKey: "name",
        header: "Producto",
        cell: ({ row: { original: p } }) => (
          <div>
            <div className="font-bold text-light-text-primary dark:text-zinc-100 text-base flex items-center gap-2">
              {p.name}
              {p._groupCount > 1 && (
                <span className="bg-blue-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-white shadow-sm">
                  x{p._groupCount}
                </span>
              )}
            </div>
            <div className="text-xs text-light-text-secondary dark:text-zinc-400 mt-0.5">
              {p.category}
            </div>
            {p.description && (
              <div className="text-xs text-light-text-secondary dark:text-zinc-500 mt-1 line-clamp-1">
                {p.description}
              </div>
            )}
          </div>
        ),
      },
      {
        accessorKey: "current_price",
        header: "Precio",
        cell: ({ row: { original: p } }) => (
          <div className="text-right">
            <div className="font-mono text-[#1B4733] dark:text-emerald-400 font-bold text-base">
              $
              {Number(p.current_price).toLocaleString("es-MX", {
                minimumFractionDigits: 2,
              })}
            </div>
            <div className="text-[10px] text-light-text-secondary dark:text-zinc-400 text-right mt-0.5">
              + IVA
            </div>
          </div>
        ),
      },
      {
        id: "actions",
        header: "Acciones",
        cell: ({ row: { original: p } }) => {
          const added = justAdded === p.id;
          const currentItem = items.find((i) => i.product_id === p.id);
          const qty = currentItem ? currentItem.quantity : 0;

          return (
            <div className="flex justify-end">
              <div
                className={`flex items-center rounded-lg overflow-hidden font-semibold border shadow-sm ${
                  added ?
                    "border-emerald-400/60"
                  : "border-[#2277B4]/35"
                }`}>
                <button
                  onClick={() => addItemDirectly(p)}
                  className={`h-8 w-8 flex items-center justify-center transition-colors text-white ${
                    added ?
                      "bg-emerald-500 hover:bg-emerald-600"
                    : "bg-[#2277B4] hover:bg-[#125280]"
                  }`}>
                  {added ?
                    <CheckCircle2 size={14} />
                  : <Plus size={14} />}
                </button>
                <div
                  className={`h-8 min-w-[72px] px-2 flex items-center justify-center leading-none text-white border-x whitespace-nowrap ${
                    added ?
                      "bg-emerald-500 border-emerald-400/70"
                    : "bg-[#2277B4] border-[#7fb8de]/70"
                  }`}>
                  {qty > 0 ?
                    <span className="text-xs font-medium">
                      {qty} en lista
                    </span>
                  : <span className="text-xs">Agregar</span>}
                </div>
                <button
                  onClick={() => removeItemDirectly(p)}
                  disabled={qty === 0}
                  className={`h-8 w-8 flex items-center justify-center transition-colors text-white disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-500 ${
                    added ?
                      "bg-emerald-500 hover:bg-emerald-600"
                    : "bg-[#2277B4] hover:bg-[#125280]"
                  }`}>
                  <Minus size={14} />
                </button>
              </div>
            </div>
          );
        },
      },
    ],
    [items, justAdded],
  );

  const groupedProdResults = useMemo(() => {
    const map = new Map();
    prodResults.forEach((p) => {
      const nName = String(p.name || "").trim().toLowerCase();
      const nCat = String(p.category || "").trim().toLowerCase();
      const key = `${nName}|${nCat}`;
      if (!map.has(key)) {
        map.set(key, { ...p, _groupCount: 1 });
      } else {
        map.get(key)._groupCount += 1;
      }
    });
    return Array.from(map.values());
  }, [prodResults]);

  const productSearchTable = useReactTable({
    data: groupedProdResults,
    columns: productSearchColumns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

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
            console.error(
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

  if (generatedQuote) {
    return (
      <div className="space-y-6 animate-fade-in pb-16">
        <section className="relative overflow-hidden rounded-[28px] border border-[#1A4577]/20 bg-gradient-to-r from-[#0E2B56] via-[#154782] to-[#123A72] px-6 md:px-8 py-7 md:py-8 text-white shadow-[0_28px_90px_rgba(8,28,64,0.35)]">
          <div className="absolute -top-16 -right-10 size-56 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -bottom-20 left-8 size-72 rounded-full bg-cyan-300/10 blur-3xl" />

          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-2xl bg-white/15 ring-1 ring-white/25">
                <CheckCircle2 size={30} />
              </div>
              <div>
                <p className="text-sm font-semibold text-blue-100/95 tracking-wide uppercase">
                  Cotización confirmada
                </p>
                <h1 className="text-2xl md:text-3xl font-semibold tracking-tight mt-1">
                  Cotización generada exitosamente
                </h1>
                <p className="text-sm text-blue-100/90 mt-2 max-w-2xl">
                  La interfaz de captura fue reemplazada por el documento final
                  para revisión y siguientes acciones.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 rounded-2xl bg-white/10 ring-1 ring-white/20 p-3 min-w-[270px]">
              <div className="rounded-xl bg-white/10 px-3 py-2">
                <p className="text-[10px] uppercase tracking-widest text-blue-100/80 font-semibold">
                  Folio
                </p>
                <p className="text-sm font-mono font-bold text-white truncate">
                  {generatedQuote.folio}
                </p>
              </div>
              <div className="rounded-xl bg-white/10 px-3 py-2">
                <p className="text-[10px] uppercase tracking-widest text-blue-100/80 font-semibold">
                  Estado
                </p>
                <p className="text-sm font-bold text-white">
                  {getQuoteStatusLabel(generatedQuote.status)}
                </p>
              </div>
              <div className="rounded-xl bg-white/10 px-3 py-2 col-span-2">
                <p className="text-[10px] uppercase tracking-widest text-blue-100/80 font-semibold">
                  Fecha de generación
                </p>
                <p className="text-sm font-semibold text-white">
                  {formatDateTime(generatedQuote.created_at)}
                </p>
              </div>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm p-5">
                <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Building2 size={15} /> Cliente
                </h3>
                <p className="text-2xl font-bold text-zinc-800 leading-tight">
                  {generatedQuote.client.business_name}
                </p>
                <p className="text-sm text-zinc-500 font-mono mt-1">
                  {generatedQuote.client.rfc}
                </p>
              </div>

              <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm p-5">
                <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-4">
                  Contacto
                </h3>
                {generatedQuote.contact ?
                  <>
                    <p className="text-xl font-bold text-zinc-800 leading-tight">
                      {generatedQuote.contact.full_name}
                    </p>
                    <p className="text-xs text-zinc-500 mt-1">
                      {generatedQuote.contact.position_title}
                    </p>
                    <div className="mt-3 pt-3 border-t border-zinc-100 space-y-1">
                      <p className="text-sm text-zinc-700 break-all">
                        {generatedQuote.contact.email}
                      </p>
                      <p className="text-sm text-zinc-700">
                        {generatedQuote.contact.phone}
                      </p>
                    </div>
                  </>
                : <div className="min-h-[110px] flex items-center">
                    <p className="text-sm text-zinc-500 font-medium">
                      Sin contacto asignado.
                    </p>
                  </div>
                }
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-zinc-100 bg-zinc-50 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-zinc-700 uppercase tracking-wider">
                    Partidas cotizadas
                  </p>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    {generatedQuote.items.reduce(
                      (acc, item) => acc + item.quantity,
                      0,
                    )}{" "}
                    productos en total
                  </p>
                </div>
                <div className="px-3 py-1.5 rounded-lg bg-white border border-zinc-200 text-xs font-semibold text-zinc-600">
                  {generatedQuote.items.length} partida(s)
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[760px]">
                  <thead className="bg-white border-b border-zinc-100 text-xs uppercase tracking-wider text-zinc-500">
                    <tr>
                      <th className="px-5 py-3 text-left">Producto</th>
                      <th className="px-4 py-3 text-right">Cantidad</th>
                      <th className="px-4 py-3 text-right">Unitario</th>
                      <th className="px-4 py-3 text-right">Desc.</th>
                      <th className="px-4 py-3 text-right">Unitario c/desc</th>
                      <th className="px-5 py-3 text-right">Importe</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {generatedQuote.items.map((item, index) => (
                      <tr key={item.tempId || `${item.name}-${index}`}>
                        <td className="px-5 py-3.5">
                          <p className="font-semibold text-zinc-800">
                            {item.name}
                          </p>
                        </td>
                        <td className="px-4 py-3.5 text-right font-mono text-zinc-700">
                          {item.quantity}
                        </td>
                        <td className="px-4 py-3.5 text-right font-mono text-zinc-700">
                          ${formatCurrency(item.unit_price)}
                        </td>
                        <td className="px-4 py-3.5 text-right font-mono text-zinc-700">
                          {clampDiscount(item.discount).toLocaleString(
                            "es-MX",
                            {
                              maximumFractionDigits: 2,
                            },
                          )}
                          %
                        </td>
                        <td className="px-4 py-3.5 text-right font-mono text-[#2277B4] font-semibold">
                          ${formatCurrency(item.discounted_unit_price)}
                        </td>
                        <td className="px-5 py-3.5 text-right font-mono font-bold text-zinc-800">
                          ${formatCurrency(item.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="xl:col-span-1">
            <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm p-5 xl:sticky xl:top-24">
              <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <BadgeDollarSign size={16} /> Resumen financiero
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm text-zinc-500 font-medium">
                  <span>Subtotal bruto</span>
                  <span className="font-mono text-zinc-800">
                    ${formatCurrency(generatedQuote.grossSubtotal)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm text-zinc-500 font-medium">
                  <span>Descuento</span>
                  <span className="font-mono text-rose-600">
                    -${formatCurrency(generatedQuote.totalDiscount)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm text-zinc-500 font-medium">
                  <span>Subtotal neto</span>
                  <span className="font-mono text-zinc-800">
                    ${formatCurrency(generatedQuote.grandTotal)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm text-zinc-500 font-medium">
                  <span>IVA (16%)</span>
                  <span className="font-mono text-zinc-800">
                    ${formatCurrency(generatedQuote.ivaTotal)}
                  </span>
                </div>
                <div className="pt-3 border-t border-zinc-100 flex items-center justify-between">
                  <span className="text-base font-bold text-zinc-800">
                    Total Neto
                  </span>
                  <span className="text-2xl font-bold text-[#1a2b4c] font-mono tracking-tight">
                    ${formatCurrency(generatedQuote.totalWithIva)}
                  </span>
                </div>
              </div>

              <div className="mt-4 p-3 rounded-2xl bg-[#F6FAFF] border border-[#D9E9FA] text-xs text-zinc-600 leading-relaxed">
                Este documento ya fue registrado y se encuentra listo para
                seguimiento comercial.
              </div>
            </div>
          </div>
        </div>

        <section className="bg-white border border-zinc-200 rounded-2xl shadow-sm p-4 md:p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <p className="text-sm text-zinc-600">
            Cotización generada por un total de
            <span className="font-bold text-zinc-800">
              {" "}
              ${formatCurrency(generatedQuote.totalWithIva)}
            </span>
            .
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {generatedQuote.id && (
              <button
                onClick={() => navigate(`/cotizaciones/${generatedQuote.id}`)}
                className="px-4 py-2 rounded-xl border border-zinc-300 text-zinc-700 hover:bg-zinc-100 font-semibold transition-colors">
                Ver detalle
              </button>
            )}
            <button
              onClick={() => navigate("/cotizaciones/historial")}
              className="px-4 py-2 rounded-xl border border-zinc-300 text-zinc-700 hover:bg-zinc-100 font-semibold transition-colors">
              Ir al historial
            </button>
            <button
              onClick={startNewQuote}
              className="px-5 py-2 rounded-xl bg-[#2277B4] hover:bg-[#125280] text-white font-bold transition-colors">
              Nueva cotización
            </button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      {error && (
        <div className="text-sm text-light-error dark:text-red-400 bg-light-error/10 dark:bg-red-500/10 p-3 rounded-xl border border-light-error/20 dark:border-red-500/20 animate-fade-in">
          {error}
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Columna izquierda: Cliente y Totales */}
        <div className="lg:col-span-1 space-y-6">
          {!fixedClientId && (
            <Card className="border-2 border-zinc-200 shadow-sm !overflow-visible z-30">
              <div className="flex justify-between items-center gap-2">
                <div className="flex justify-center items-center">
                  <div className="p-2 rounded-lg text-black">
                    <Building2 size={24} />
                  </div>
                  <h3 className="font-semibold text-lg text-light-text-primary dark:text-zinc-100">
                    Datos del Cliente
                  </h3>
                </div>
              </div>

              <div className="relative z-20">
                <div
                  className={`w-full relative rounded-xl border ${
                    selectedClient ? " " : (
                      "bg-white border-zinc-200 hover:border-[#2277B4]"
                    )
                  }`}>
                  {selectedClient ?
                    <div
                      onClick={() => {
                        setSelectedClient(null);
                        setClientSearch("");
                        setClientResults([]);
                      }}
                      className="w-full px-3 py-2 text-left cursor-pointer text-[#1B4733] dark:text-emerald-400 font-medium">
                      {selectedClient.business_name}
                    </div>
                  : <div className="relative">
                      <Input
                        value={clientSearch}
                        onFocus={() => setShowClientModal(true)}
                        onChange={(e) => {
                          setClientSearch(e.target.value);
                          setSelectedClient(null);
                          setShowClientModal(true);
                        }}
                        placeholder="Escribe para buscar un cliente…"
                        className="w-full border-none shadow-none focus:ring-0 text-zinc-700 dark:text-zinc-200 bg-transparent"
                        style={{ paddingRight: "2.25rem" }}
                      />
                      <Search
                        size={14}
                        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-light-text-secondary dark:text-zinc-400"
                      />
                    </div>
                  }
                </div>
              </div>

              {selectedClient && (
                <>
                  <div className="mt-4 p-3 rounded-xl animate-fade-in">
                    <div className="text-xs text-emerald-600 font-bold uppercase mb-1">
                      Cliente Seleccionado
                    </div>
                    <div className="text-sm text-light-text-primary dark:text-zinc-100 font-medium">
                      {selectedClient.business_name}
                    </div>
                    <div className="text-xs text-zinc-500 mt-0.5">
                      {selectedClient.rfc}
                    </div>
                  </div>

                  {selectedClient.contacts?.length > 0 && (
                    <div className="mt-4 relative animate-fade-in">
                      <label className="text-xs font-semibold text-light-text-secondary dark:text-zinc-400 mb-1.5 block">
                        Contacto para cotización
                      </label>
                      <select
                        value={selectedContactId}
                        onChange={(e) => setSelectedContactId(e.target.value)}
                        className="w-full p-3 rounded-xl bg-white dark:bg-dark-900 border border-light-border dark:border-dark-700 focus:border-[#1a2b4c] dark:focus:border-[#2277B4] focus:ring-1 focus:ring-[#1a2b4c] dark:focus:ring-[#2277B4] text-light-text-primary dark:text-zinc-100 text-sm outline-none transition-all">
                        <option value="">-- Sin asignar --</option>
                        {selectedClient.contacts.map((contact) => (
                          <option key={contact.id} value={contact.id} className="dark:bg-dark-900 dark:text-zinc-100">
                            {contact.full_name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </>
              )}
            </Card>
          )}

          {fixedClientId && selectedClient && (
            <Card className="border-2 border-zinc-200 shadow-sm !overflow-visible z-30">
              <div className="flex justify-between items-center gap-2">
                <div className="flex justify-center items-center"> 
                  <div className="p-2 rounded-lg text-black">
                    <Building2 size={24} />
                  </div>
                  <h3 className="font-semibold text-lg text-light-text-primary dark:text-zinc-100">
                    Datos del Cliente
                  </h3>
                </div>
              </div>

              <div className="mt-4 p-3 rounded-xl animate-fade-in">
                <div className="text-xs text-emerald-600 font-bold uppercase mb-1">
                  Cliente Vinculado
                </div>
                <div className="text-sm text-light-text-primary dark:text-zinc-100 font-medium">
                  {selectedClient.business_name}
                </div>
                <div className="text-xs text-zinc-500 mt-0.5">
                  {selectedClient.rfc || "Sin RFC"}
                </div>
              </div>

              {selectedClient.contacts?.length > 0 ?
                <div className="mt-4 relative animate-fade-in">
                  <label className="text-xs font-semibold text-light-text-secondary dark:text-zinc-400 mb-1.5 block">
                    Contacto para cotización
                  </label>
                  <select
                    value={selectedContactId}
                    onChange={(e) => setSelectedContactId(e.target.value)}
                    className="w-full p-3 rounded-xl bg-white dark:bg-dark-900 border border-light-border dark:border-dark-700 focus:border-[#1a2b4c] dark:focus:border-[#2277B4] focus:ring-1 focus:ring-[#1a2b4c] dark:focus:ring-[#2277B4] text-light-text-primary dark:text-zinc-100 text-sm outline-none transition-all">
                    <option value="">-- Sin asignar --</option>
                    {selectedClient.contacts.map((contact) => (
                      <option key={contact.id} value={contact.id} className="dark:bg-dark-900 dark:text-zinc-100">
                        {contact.full_name}
                      </option>
                    ))}
                  </select>
                </div>
              : <div className="mt-4 p-3 rounded-xl border border-amber-200 dark:border-amber-700/50 bg-amber-50 dark:bg-amber-900/20 text-amber-900 dark:text-amber-200 text-sm">
                  Este cliente no tiene contactos registrados. Agrégalo desde
                  Gestionar cliente y vuelve a esta cotización.
                </div>
              }
            </Card>
          )}

          <Card
            className={`sticky top-24${!selectedClient || items.length === 0 ? "opacity-40 pointer-events-none select-none grayscale" : "transition-all duration-500"}`}>
            <button
              onClick={() => {
                const homoclave =
                  (selectedClient?.rfc || "GEN")
                    .replace(/[^A-Z0-9]/gi, "")
                    .slice(-3)
                    .toUpperCase() || "GEN";
                const random = Math.random()
                  .toString(36)
                  .substring(2, 8)
                  .toUpperCase();
                setFolio(`COT-${homoclave}-${random}`);
                setShowPreviewModal(true);
              }}
              disabled={loading || !selectedClient || items.length === 0}
              className="w-full justify-center py-4 bg-[#2277B4] hover:bg-[#125280] shadow-lg shadow-[#12528050] text-white rounded-xl font-bold text-lg">
              {loading ? "Procesando…" : "Ver Vista Previa"}
            </button>
          </Card>
        </div>

        {/* Columna derecha: Partidas */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="!overflow-visible z-30">
            <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg text-black mb-1">
                  <ShoppingBag size={24} />
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-light-text-primary dark:text-zinc-100">
                    Agregar Productos o Servicios
                  </h3>
                </div>
              </div>
              <div className="flex items-center gap-4 text-right">
                <button
                  variant="ghost"
                  onClick={() => navigate("/cotizaciones/historial")}
                  className="inline-flex items-center gap-1.5 whitespace-nowrap px-4 py-2 rounded-xl text-sm font-semibold text-black dark:text-zinc-100 hover:text-zinc-700 dark:hover:text-zinc-300 border border-transparent transition-all">
                  <ArrowLeft size={16} /> Regresar a historial
                </button>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-3 items-end p-4 rounded-xl dark:border-white/5">
              <div className="flex-1 w-full relative z-10"> 
                <label className="text-xs font-semibold text-light-text-secondary dark:text-zinc-400 mb-1.5 block">
                  Producto
                </label>
                <div className="relative">
                  <Input
                    value={prodSearch}
                    onFocus={() => setShowProductModal(true)}
                    onChange={(e) => {
                      setProdSearch(e.target.value);
                      setSelectedProductToAdd(null);
                      setShowProductModal(true);
                    }}
                    placeholder="Buscar producto o servicio…"
                    className="glass-input bg-light-bg dark:!bg-black/30 text-light-text-primary dark:text-white border-light-border dark:border-white/10"
                    style={{ paddingRight: "2.25rem" }}
                  />
                  <Search
                    size={14}
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-light-text-secondary"
                  />
                </div>
              </div>

              <div className="flex-1 w-full relative">
                <label className="text-xs font-semibold text-light-text-secondary dark:text-zinc-400 mb-1.5 block">
                  Filtrar en la tabla
                </label>
                <div className="relative">
                  <Search
                    size={13}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-light-text-secondary dark:text-zinc-400"
                  />
                  <input
                    type="text"
                    placeholder="Filtrar productos agregados…"
                    value={tableFilter}
                    onChange={(e) => setTableFilter(e.target.value)}
                    className="pl-3 pr-8 py-2.5 text-sm rounded-xl border border-light-border dark:border-white/10 bg-white dark:bg-black/30 focus:outline-none focus:ring-1 focus:ring-[#2277B4] w-full text-black dark:text-white transition-colors"
                  />
                </div>
              </div>
            </div>
          </Card>

          {activeTableFilterPickerField &&
            createPortal(
              <div
                className="fixed inset-0 z-[9999] bg-black/45 flex items-center justify-center p-4"
                onClick={closeTableFilterPicker}>
                <div
                  className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
                  onClick={(e) => e.stopPropagation()}>
                  <div className="px-5 py-4 border-b border-zinc-100 bg-[#1a2b4c] flex items-center justify-between">
                    <div>
                      <h3 className="text-white font-semibold text-base uppercase">
                        Filtrar por{" "}
                        {tableFilterFieldLabels[activeTableFilterPickerField]}
                      </h3>
                      <p className="text-[11px] text-zinc-300 mt-1">
                        Selecciona o busca un valor
                      </p>
                    </div>
                    <button
                      onClick={closeTableFilterPicker}
                      className="size-8 rounded-lg text-white hover:bg-white/10 flex items-center justify-center">
                      <X size={16} />
                    </button>
                  </div>

                  <div className="p-4 space-y-3">
                    <div className="flex items-center gap-2 bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2">
                      <Search size={15} className="text-zinc-500" />
                      <input
                        value={tableFilterPickerSearch}
                        onChange={(e) =>
                          setTableFilterPickerSearch(e.target.value)
                        }
                        placeholder="Buscar valor…"
                        className="w-full bg-transparent text-sm text-zinc-800 placeholder:text-zinc-400 focus:outline-none"
                      />
                    </div>

                    <div className="h-72 overflow-y-auto rounded-lg border border-zinc-100 divide-y divide-zinc-100">
                      {visibleTableFilterPickerOptions.length > 0 ?
                        visibleTableFilterPickerOptions.map((value) => {
                          const isSelected =
                            normalizeSearchText(
                              tableFilters[activeTableFilterPickerField],
                            ) === normalizeSearchText(value);

                          return (
                            <button
                              key={`${activeTableFilterPickerField}_${value}`}
                              onClick={() => applyTableFilterValue(value)}
                              className={`w-full px-3 py-2 text-left text-sm transition-colors ${
                                isSelected ?
                                  "bg-[#2277B4]/10 text-[#125280] font-semibold"
                                : "text-zinc-700 hover:bg-zinc-50"
                              }`}>
                              {value}
                            </button>
                          );
                        })
                      : <div className="px-3 py-4 text-sm text-zinc-500 text-center">
                          No hay valores para mostrar.
                        </div>
                      }
                    </div>
                  </div>
                </div>
              </div>,
              document.body,
            )}

          {/* Tabla TanStack */}
          <div
            className={`glass-panel overflow-hidden rounded-xl border border-light-border dark:border-white/10 ${!selectedClient || items.length === 0 ? "opacity-40 pointer-events-none select-none grayscale relative" : "transition-all duration-500"}`}>
            {(!selectedClient || items.length === 0) && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-zinc-50/50 dark:bg-zinc-900/50 backdrop-blur-[2px]">
                <div className="p-3 bg-white dark:bg-zinc-800 rounded-full shadow-lg mb-3">
                  <BadgeDollarSign size={32} className="text-zinc-400" />
                </div>
                <p className="text-zinc-600 dark:text-zinc-200 font-semibold max-w-sm text-center px-4">
                  Agrega "Datos del Cliente y Agrega Productos" para habilitar.
                </p>
              </div>
            )}
            {/* Contador */}
            {items.length > 0 && (
              <div className="flex items-center justify-between gap-2 px-4 pt-3 pb-1 flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() =>
                      setShowTableFilters((prev) => {
                        const next = !prev;
                        if (!next) closeTableFilterPicker();
                        return next;
                      })
                    }
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-semibold border transition-colors whitespace-nowrap ${
                      showTableFilters || activeTableFilterCount > 0 ?
                        "bg-[#2277B4] text-white border-[#2277B4]"
                      : "bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-100"
                    }`}>
                    <SlidersHorizontal size={12} /> Filtros
                    {activeTableFilterCount > 0 && (
                      <span className="ml-0.5 bg-white text-[#1a2b4c] text-[10px] font-bold rounded-full size-4 flex items-center justify-center leading-none">
                        {activeTableFilterCount}
                      </span>
                    )}
                  </button>

                  {showTableFilters &&
                    [
                      { id: "product", label: "Producto" },
                      { id: "discount", label: "Descuento" },
                      { id: "price", label: "Precio" },
                    ].map((button) => {
                      const selectedValue = String(
                        tableFilters[button.id] || "",
                      );

                      return (
                        <button
                          key={button.id}
                          onClick={() => openTableFilterPicker(button.id)}
                          className={`inline-flex items-center gap-2 px-3 py-1 rounded-md text-[11px] border transition-colors whitespace-nowrap ${
                            selectedValue ?
                              "bg-[#2277B4] text-white border-[#2277B4]"
                            : "bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-100"
                          }`}>
                          <span className="uppercase font-bold tracking-wide">
                            {button.label}
                          </span>
                        </button>
                      );
                    })}

                  {showTableFilters && activeTableFilterCount > 0 && (
                    <button
                      onClick={clearTableFilters}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium text-red-600 hover:bg-red-50 border border-red-100 transition-colors">
                      <X size={12} /> Limpiar
                    </button>
                  )}
                </div>

                <span className="text-xs text-light-text-secondary">
                  Pág. {itemsTable.getState().pagination.pageIndex + 1} de{" "}
                  {Math.max(1, itemsTable.getPageCount())}
                </span>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-light-bg/50 dark:bg-dark-800 uppercase text-xs font-bold text-[#2277B4] dark:text-blue-400 tracking-wider">
                  {itemsTable.getHeaderGroups().map((hg) => (
                    <tr key={hg.id}>
                      {hg.headers.map((header) => (
                        <th
                          key={header.id}
                          onClick={header.column.getToggleSortingHandler()}
                          className={`p-3 whitespace-nowrap select-none ${
                            header.id === "totalIva" ?
                              "text-right text-[#1B4733]"
                            : header.id === "quantity" ? "text-center"
                            : (
                              ["price", "discount", "total"].includes(header.id)
                            ) ?
                              "text-right"
                            : header.id === "actions" ? "w-28 text-right"
                            : ""
                          } ${
                            header.column.getCanSort() ?
                              "cursor-pointer hover:bg-zinc-100 transition-colors"
                            : ""
                          }`}>
                          <span className="inline-flex items-center gap-1">
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                            {header.column.getIsSorted() === "asc" && (
                              <ChevronUp size={11} />
                            )}
                            {header.column.getIsSorted() === "desc" && (
                              <ChevronDown size={11} />
                            )}
                          </span>
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody className="divide-y divide-light-border">
                  {itemsTable.getRowModel().rows.length > 0 ?
                    itemsTable.getRowModel().rows.map((row) => (
                      <tr
                        key={row.id}
                        className="hover:bg-light-bg/50 transition-colors group animate-fade-in">
                        {row.getVisibleCells().map((cell) => (
                          <td
                            key={cell.id}
                            className={`p-3 ${
                              cell.column.id === "totalIva" ? "text-right"
                              : cell.column.id === "quantity" ? "text-center"
                              : (
                                ["price", "discount", "total"].includes(
                                  cell.column.id,
                                )
                              ) ?
                                "text-right"
                              : cell.column.id === "actions" ? "text-right"
                              : ""
                            }`}>
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext(),
                            )}
                          </td>
                        ))}
                      </tr>
                    ))
                  : <tr>
                      <td colSpan="8" className="py-16 text-center">
                        <div className="flex justify-center mb-3 opacity-20">
                          <ShoppingCart size={40} />
                        </div>
                        <p className="text-light-text-secondary text-sm font-medium">
                          {items.length === 0 ?
                            "No se han agregado productos a la cotización."
                          : "Sin resultados para el filtro aplicado."}
                        </p>
                        {items.length === 0 && (
                          <p className="text-light-text-secondary text-xs mt-1">
                            Utiliza el formulario de arriba para añadir items.
                          </p>
                        )}
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            {items.length > 0 && (
              <div className="px-4 py-3 border-t border-light-border dark:border-dark-700 bg-white dark:bg-dark-800 flex items-center justify-between gap-3 flex-wrap">
                <label className="text-sm text-light-text-secondary dark:text-zinc-400 flex items-center gap-2">
                  Mostrar
                  <select
                    value={itemsTable.getState().pagination.pageSize}
                    onChange={(e) => {
                      itemsTable.setPageSize(Number(e.target.value));
                      itemsTable.setPageIndex(0);
                    }}
                    className="px-2 py-1 rounded-lg text-sm text-[#1a2b4c] dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#153465] dark:focus:ring-blue-500 bg-[#fff] dark:bg-dark-900 border border-light-border dark:border-dark-700">
                    {[10, 25, 50, 100].map((size) => (
                      <option key={size} value={size} className="dark:bg-dark-900 dark:text-zinc-100">
                        {size}
                      </option>
                    ))}
                  </select>
                  por página
                </label>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => itemsTable.setPageIndex(0)}
                    disabled={!itemsTable.getCanPreviousPage()}
                    className="px-2 py-1 text-sm font-medium text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-white/5 rounded-lg hover:bg-zinc-200 dark:hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                    ««
                  </button>
                  <button
                    onClick={() => itemsTable.previousPage()}
                    disabled={!itemsTable.getCanPreviousPage()}
                    className="px-3 py-1 text-sm font-medium text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-white/5 rounded-lg hover:bg-zinc-200 dark:hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                    Anterior
                  </button>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400 mx-2">
                    Pág. {itemsTable.getState().pagination.pageIndex + 1} de {itemsTable.getPageCount()}
                  </span>
                  <button
                    onClick={() => itemsTable.nextPage()}
                    disabled={!itemsTable.getCanNextPage()}
                    className="px-3 py-1 text-sm font-medium text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-white/5 rounded-lg hover:bg-zinc-200 dark:hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                    Siguiente
                  </button>
                  <button
                    onClick={() =>
                      itemsTable.setPageIndex(itemsTable.getPageCount() - 1)
                    }
                    disabled={!itemsTable.getCanNextPage()}
                    className="px-2 py-1 text-sm font-medium text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-white/5 rounded-lg hover:bg-zinc-200 dark:hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                    »»
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {editingItemDraft &&
        createPortal(
          <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-zinc-100 bg-[#1a2b4c] flex items-center justify-between">
                <div>
                  <h3 className="text-white font-semibold text-base uppercase">
                    Editar producto
                  </h3>
                  <p className="text-[11px] text-zinc-300 mt-1">
                    Ajusta cantidad, precio unitario o descuento.
                  </p>
                </div>
                <button
                  onClick={() => setEditingItemDraft(null)}
                  className="size-8 rounded-lg text-white hover:bg-white/10 flex items-center justify-center transition-colors">
                  <X size={16} />
                </button>
              </div>

              <div className="p-5 space-y-4">
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 block mb-1.5">
                    Producto
                  </label>
                  <div className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50 text-sm text-zinc-700">
                    {editingItemDraft.name}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 block mb-1.5">
                      Cant.
                    </label>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={editingItemDraft.quantity}
                      onChange={(e) =>
                        updateEditingItemField("quantity", e.target.value)
                      }
                      className="w-full px-3 py-2 rounded-xl border border-zinc-200 bg-white text-sm text-zinc-800 focus:outline-none focus:ring-1 focus:ring-[#2277B4]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 block mb-1.5">
                      Precio
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={editingItemDraft.price}
                      onChange={(e) =>
                        updateEditingItemField("price", e.target.value)
                      }
                      className="w-full px-3 py-2 rounded-xl border border-zinc-200 bg-white text-sm text-zinc-800 focus:outline-none focus:ring-1 focus:ring-[#2277B4]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 block mb-1.5">
                      Desc. %
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={editingItemDraft.discount}
                      onChange={(e) =>
                        updateEditingItemField("discount", e.target.value)
                      }
                      className="w-full px-3 py-2 rounded-xl border border-zinc-200 bg-white text-sm text-zinc-800 focus:outline-none focus:ring-1 focus:ring-[#2277B4]"
                    />
                  </div>
                </div>

                <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-3 space-y-1">
                  <div className="flex items-center justify-between text-xs text-zinc-600">
                    <span>Importe</span>
                    <span className="font-mono font-semibold text-zinc-800">
                      $
                      {formatCurrency(
                        calculateItemTotal(
                          editingItemDraft.price,
                          editingItemDraft.quantity,
                          editingItemDraft.discount,
                        ),
                      )}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-zinc-600">
                    <span>Total + IVA</span>
                    <span className="font-mono font-bold text-[#1B4733]">
                      $
                      {formatCurrency(
                        roundCurrency(
                          calculateItemTotal(
                            editingItemDraft.price,
                            editingItemDraft.quantity,
                            editingItemDraft.discount,
                          ) * IVA_RATE,
                        ) +
                          calculateItemTotal(
                            editingItemDraft.price,
                            editingItemDraft.quantity,
                            editingItemDraft.discount,
                          ),
                      )}
                    </span>
                  </div>
                </div>
              </div>

              <div className="px-5 py-4 border-t border-zinc-100 flex items-center justify-end gap-2">
                <button
                  onClick={() => setEditingItemDraft(null)}
                  className="px-4 py-2 rounded-xl text-zinc-600 hover:bg-zinc-100 transition-colors">
                  Cancelar
                </button>
                <button
                  onClick={applyItemEdit}
                  className="px-4 py-2 rounded-xl bg-[#2277B4] hover:bg-[#125280] text-white font-semibold transition-colors">
                  Guardar cambios
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* Modal de Búsqueda de Clientes */}
      {showClientModal &&
        createPortal(
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl h-[85vh] overflow-hidden flex flex-col">
              <div className="px-6 py-4 border-b border-zinc-100 dark:border-white/10 flex items-center justify-between bg-[#1a2b4c]">
                <div>
                  <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                    Buscar Cliente
                  </h2>
                  <p className="text-sm text-zinc-300 mt-1">
                    Selecciona el cliente para la cotización
                  </p>
                </div>
                <button
                  onClick={() => setShowClientModal(false)}
                  className="size-8 flex items-center justify-center rounded-lg text-white hover:bg-white/20 transition-colors">
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 flex-1 overflow-y-auto">
                <div className="mb-4 relative">
                  <Search
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400"
                    size={18}
                  />
                  <input
                    type="text"
                    value={clientSearch}
                    onChange={(e) => {
                      setClientSearch(e.target.value);
                      setSelectedClient(null);
                    }}
                    placeholder="Escribe el nombre del cliente o RFC…"
                    className="w-full pl-4 pr-10 py-3 rounded-xl border border-zinc-200 bg-zinc-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2277B4]/50 transition-all text-zinc-700"
                    autoFocus
                  />
                </div>

                <div className="space-y-2 mt-4">
                  {isClientSearching ?
                    <div className="text-center py-10 text-zinc-400">
                      <Search
                        size={40}
                        className="mx-auto mb-3 opacity-20 animate-spin"
                      />
                      Buscando clientes...
                    </div>
                  : visibleClientResults.length > 0 ?
                    <>
                      {visibleClientResults.map((c) => (
                        <div
                          key={c.id}
                          onClick={() => selectClient(c)}
                          className="p-4 rounded-xl border border-zinc-100 hover:border-[#2277B4]/50 hover:bg-blue-50/30 cursor-pointer transition-all flex justify-between items-center group">
                          <div>
                            <div className="font-bold text-zinc-800 group-hover:text-[#2277B4] transition-colors">
                              {c.business_name}
                            </div>
                            <div className="text-xs text-zinc-500 mt-1 flex items-center gap-3">
                              <span className="bg-zinc-100 px-2 py-0.5 rounded text-zinc-600 font-mono">
                                RFC: {c.rfc || "N/A"}
                              </span>
                              <span>ID: {String(c.id).substring(0, 8)}</span>
                            </div>
                          </div>
                          <button className="px-4 py-1.5 text-sm font-semibold rounded-lg bg-zinc-100 text-zinc-600 group-hover:bg-[#2277B4] group-hover:text-white transition-all">
                            Seleccionar
                          </button>
                        </div>
                      ))}

                      {clientResults.length > visibleClientResults.length && (
                        <div className="mt-2 px-3 py-2 rounded-lg bg-blue-50 text-xs text-[#125280]">
                          {visibleClientResults.length} de{" "}
                          {clientResults.length} resultados. Sigue escribiendo
                          para acotar la búsqueda.
                        </div>
                      )}
                    </>
                  : clientSearch.trim().length > 0 ?
                    <div className="text-center py-10 text-zinc-400">
                      <Building2
                        size={40}
                        className="mx-auto mb-3 opacity-20"
                      />
                      No se encontraron clientes con "{clientSearch}"
                    </div>
                  : <div className="text-center py-10 text-zinc-400">
                      <Search size={40} className="mx-auto mb-3 opacity-20" />
                      No hay clientes disponibles
                    </div>
                  }
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* Modal de Búsqueda de Productos */}
      {showProductModal &&
        createPortal(
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-dark-900 rounded-2xl shadow-2xl w-full max-w-4xl h-[85vh] overflow-hidden flex flex-col">
              {/* Header del modal */}
              <div className="px-6 py-4 border-b border-zinc-100 dark:border-white/10 flex items-center justify-between bg-[#1a2b4c]">
                <div>
                  <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                    Buscar Productos
                  </h2>
                  <p className="text-sm text-zinc-300 mt-1">
                    Selecciona productos para agregar a la cotización
                  </p>
                </div>
                <button
                  onClick={closeProductModal}
                  className="size-8 flex items-center justify-center rounded-lg text-white hover:bg-white/20 transition-colors">
                  <X size={18} />
                </button>
              </div>

              {/* Body del modal */}
              <div className="p-6 flex-1 flex flex-col overflow-hidden">
                {/* Buscador sincronizado */}
                <div className="mb-4 relative shrink-0">
                  <Input
                    value={prodSearch}
                    onChange={(e) => {
                      setProdSearch(e.target.value);
                      setSelectedProductToAdd(null);
                    }}
                    placeholder="Buscar producto por nombre o categoría…"
                    className="w-full glass-input bg-light-bg dark:!bg-black/30 text-light-text-primary dark:text-white border-light-border dark:border-white/10"
                    style={{ paddingRight: "2.5rem" }}
                    autoFocus
                  />
                  <Search
                    size={18}
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-light-text-secondary"
                  />
                </div>

                {/* Lista de resultados (Tabla paginada) */}
                <div className="bg-white dark:bg-dark-800 rounded-xl dark:border-white/10 flex-1 flex flex-col min-h-0 overflow-hidden">
                  <div className="flex-1 overflow-auto relative">
                    <table className="w-full text-left text-sm table-fixed">
                      <thead className="sticky top-0 z-10">
                        {productSearchTable.getHeaderGroups().map((hg) => (
                          <tr key={hg.id} className="bg-zinc-50/95 dark:bg-dark-800/95 backdrop-blur-sm border-b border-light-border dark:border-dark-700 shadow-sm">
                            {hg.headers.map((header) => (
                              <th
                                key={header.id}
                                className={`px-4 py-3 text-[11px] font-bold text-light-text-secondary uppercase tracking-wider ${
                                  header.id === "current_price" ? "text-right w-28 sm:w-32" :
                                  header.id === "actions" ? "text-right w-36 sm:w-40" : "w-full"
                                }`}>
                                {flexRender(
                                  header.column.columnDef.header,
                                  header.getContext(),
                                )}
                              </th>
                            ))}
                          </tr>
                        ))}
                      </thead>
                      <tbody className="divide-y divide-light-border">
                        {isProductSearching ? (
                          <tr>
                            <td colSpan="3" className="py-12 text-center">
                              <Search size={48} className="mx-auto mb-3 opacity-20 animate-spin" />
                              <p className="text-light-text-secondary dark:text-zinc-400 font-medium">
                                Buscando productos...
                              </p>
                            </td>
                          </tr>
                        ) : productSearchTable.getRowModel().rows.length > 0 ? (
                          productSearchTable.getRowModel().rows.map((row) => (
                            <tr key={row.id} className="hover:bg-light-bg/50 dark:hover:bg-white/5 transition-colors">
                              {row.getVisibleCells().map((cell) => (
                                <td
                                  key={cell.id}
                                  className={`p-4 ${
                                    cell.column.id === "current_price" ? "text-right" : ""
                                  }`}>
                                  {flexRender(
                                    cell.column.columnDef.cell,
                                    cell.getContext(),
                                  )}
                                </td>
                              ))}
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="3" className="py-12 text-center">
                              <div className="flex justify-center mb-3 opacity-20">
                                <ShoppingBag size={48} />
                              </div>
                              <p className="text-light-text-secondary dark:text-zinc-400 font-medium">
                                {prodSearch.trim().length > 0
                                  ? `No se encontraron productos con "${prodSearch}"`
                                  : "No hay productos disponibles."}
                              </p>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Controles de Paginación */}
                  {!isProductSearching && prodResults.length > 0 && (
                    <div className="px-4 py-3 border-t border-light-border dark:border-dark-700 bg-white dark:bg-dark-800 flex items-center justify-between gap-3 flex-wrap shrink-0">
                      <label className="text-sm text-light-text-secondary dark:text-zinc-400 flex items-center gap-2">
                        Mostrar
                        <select
                          value={productSearchTable.getState().pagination.pageSize}
                          onChange={(e) => {
                            productSearchTable.setPageSize(Number(e.target.value));
                            productSearchTable.setPageIndex(0);
                          }}
                          className="px-2 py-1 rounded-lg text-sm text-[#1a2b4c] dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#153465] dark:focus:ring-blue-500 bg-[#fff] dark:bg-dark-900 border border-light-border dark:border-dark-700">
                          {[5, 10, 25, 50].map((size) => (
                            <option key={size} value={size} className="dark:bg-dark-900 dark:text-zinc-100">
                              {size}
                            </option>
                          ))}
                        </select>
                        por página
                      </label>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => productSearchTable.setPageIndex(0)}
                          disabled={!productSearchTable.getCanPreviousPage()}
                          className="px-2 py-1 text-sm font-medium text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-white/5 rounded-lg hover:bg-zinc-200 dark:hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                          ««
                        </button>
                        <button
                          onClick={() => productSearchTable.previousPage()}
                          disabled={!productSearchTable.getCanPreviousPage()}
                          className="px-3 py-1 text-sm font-medium text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-white/5 rounded-lg hover:bg-zinc-200 dark:hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                          Anterior
                        </button>
                        <span className="text-xs text-zinc-500 dark:text-zinc-400 mx-2">
                          Pág. {productSearchTable.getState().pagination.pageIndex + 1} de {productSearchTable.getPageCount()}
                        </span>
                        <button
                          onClick={() => productSearchTable.nextPage()}
                          disabled={!productSearchTable.getCanNextPage()}
                          className="px-3 py-1 text-sm font-medium text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-white/5 rounded-lg hover:bg-zinc-200 dark:hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                          Siguiente
                        </button>
                        <button
                          onClick={() =>
                            productSearchTable.setPageIndex(productSearchTable.getPageCount() - 1)
                          }
                          disabled={!productSearchTable.getCanNextPage()}
                          className="px-2 py-1 text-sm font-medium text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-white/5 rounded-lg hover:bg-zinc-200 dark:hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                          »»
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-zinc-100 dark:border-dark-700 flex justify-between items-center bg-zinc-50 dark:bg-dark-900">
                <p className="text-xs text-light-text-secondary dark:text-zinc-400">
                  {prodResults.length > 0 && (
                    <span>{prodResults.length} producto(s) encontrado(s)</span>
                  )}
                </p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={closeProductModal}
                    className="px-4 py-2 rounded-xl bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 text-zinc-800 dark:text-white font-semibold transition-colors">
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {showPreviewModal &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-950/65 backdrop-blur-md p-4 animate-fade-in">
            <div className="w-full max-w-5xl max-h-[92vh] overflow-hidden rounded-3xl bg-white dark:bg-dark-900 shadow-[0_30px_120px_rgba(8,20,45,0.45)] flex flex-col">
              {/* Header Modal */}
              <div className="px-6 md:px-7 py-4 border-b border-white/20 flex items-center justify-between bg-gradient-to-r from-[#102445] via-[#0F2B5A] to-[#0A1F43] text-white">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/10 rounded-xl ring-1 ring-white/20">
                    <BadgeDollarSign size={24} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold tracking-tight">
                      Vista Previa de Cotización
                    </h2>
                    <p className="text-xs text-blue-100/90 font-medium mt-0.5">
                      Resumen total y confirmación
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowPreviewModal(false)}
                  className="size-9 flex items-center justify-center rounded-xl hover:bg-white/20 ring-1 ring-white/20 transition-all">
                  <X size={20} />
                </button>
              </div>

              {/* Content ModaL */}
              <div className="flex-1 overflow-y-auto px-6 md:px-7 py-6 bg-gradient-to-b from-zinc-100/70 via-white to-zinc-50 dark:from-dark-900 dark:via-dark-800 dark:to-dark-900">
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                  <div className="xl:col-span-2 space-y-6">
                    <div className="grid md:grid-cols-2 gap-4">
                      {/* Info Cliente */}
                      <div className="bg-white dark:bg-dark-800 p-5 rounded-2xl border border-zinc-200/80 dark:border-dark-700 shadow-sm">
                        <h3 className="text-sm font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                          <Building2 size={16} /> Cliente
                        </h3>
                        <div className="space-y-1">
                          <p className="text-2xl xl:text-3xl leading-tight font-bold text-zinc-800 dark:text-zinc-100">
                            {selectedClient?.business_name}
                          </p>
                          <p className="text-sm text-zinc-500 dark:text-zinc-400 font-mono">
                            {selectedClient?.rfc || "Sin RFC"}
                          </p>
                          {folio && (
                            <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-dark-700">
                              <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-0.5">
                                Folio
                              </p>
                              <p className="text-sm font-mono font-bold text-[#2277B4] dark:text-blue-400 tracking-widest">
                                {folio}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Info Contacto */}
                      <div className="bg-white dark:bg-dark-800 p-5 rounded-2xl border border-zinc-200/80 dark:border-dark-700 shadow-sm">
                        <h3 className="text-sm font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-4">
                          Contacto
                        </h3>
                        {selectedContact ?
                          <div className="space-y-1">
                            <p className="text-xl leading-tight font-bold text-zinc-800 dark:text-zinc-100">
                              {selectedContact.full_name}
                            </p>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">
                              {selectedContact.position_title || "Sin puesto"}
                            </p>
                            <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-dark-700 space-y-1">
                              <p className="text-sm text-zinc-700 dark:text-zinc-300 break-all">
                                {selectedContact.email || "Sin correo"}
                              </p>
                              <p className="text-sm text-zinc-700 dark:text-zinc-300">
                                {selectedContact.phone || "Sin telefono"}
                              </p>
                            </div>
                          </div>
                        : <div className="h-full min-h-[112px] flex items-center">
                            <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">
                              Sin contacto asignado para esta cotizacion.
                            </p>
                          </div>
                        }
                      </div>

                      {/* Desglose */}
                      <div className="md:col-span-2 bg-white dark:bg-dark-800 p-5 rounded-2xl border border-zinc-200/80 dark:border-dark-700 shadow-sm flex flex-col justify-center">
                        <h3 className="text-sm font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                          Productos
                        </h3>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm text-zinc-500 dark:text-zinc-400 font-medium gap-3">
                            <span>Productos en total:</span>
                            <span className="text-zinc-800 dark:text-zinc-100 font-bold whitespace-nowrap">
                              {items.reduce(
                                (acc, item) => acc + item.quantity,
                                0,
                              )}{" "}
                              productos
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Lista compacta de items */}
                    <div className="bg-white dark:bg-dark-800 border border-zinc-200/80 dark:border-dark-700 rounded-2xl shadow-sm overflow-hidden">
                      <div className="px-5 py-3 bg-zinc-50 dark:bg-dark-900 border-b border-zinc-100 dark:border-dark-700 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider flex items-center justify-between">
                        <span>Productos Cotizados</span>
                      </div>
                      <div className="max-h-[42vh] overflow-y-auto divide-y divide-zinc-100 dark:divide-dark-700">
                        {items.map((i, index) => (
                          <div
                            key={i.tempId}
                            className="flex justify-between items-start gap-4 px-5 py-3.5 hover:bg-zinc-50/80 dark:hover:bg-white/5 transition-colors">
                            <div className="flex items-start gap-3 min-w-0">
                              <span className="size-6 mt-0.5 inline-flex items-center justify-center rounded-full bg-zinc-100 dark:bg-dark-700 text-zinc-500 dark:text-zinc-300 font-mono text-xs shrink-0">
                                {index + 1}
                              </span>
                              <div className="min-w-0">
                                <p className="text-sm font-bold text-zinc-800 dark:text-zinc-100 truncate">
                                  {i.name}
                                </p>
                                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                                  {i.quantity} uds x $
                                  {i.price.toLocaleString("es-MX", {
                                    minimumFractionDigits: 2,
                                  })}
                                  {clampDiscount(i.discount || 0) > 0 &&
                                    ` · Desc ${clampDiscount(
                                      i.discount || 0,
                                    ).toLocaleString("es-MX", {
                                      maximumFractionDigits: 2,
                                    })}%`}
                                </p>
                                {clampDiscount(i.discount || 0) > 0 && (
                                  <p className="text-[11px] text-[#2277B4] dark:text-blue-400 mt-0.5 font-medium">
                                    Unitario c/desc: $
                                    {calculateDiscountedUnitPrice(
                                      i.price,
                                      i.discount || 0,
                                    ).toLocaleString("es-MX", {
                                      minimumFractionDigits: 2,
                                    })}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-[10px] uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-0.5">
                                Importe
                              </p>
                              <p className="text-sm font-bold text-zinc-800 dark:text-zinc-100 font-mono">
                                $
                                {i.total.toLocaleString("es-MX", {
                                  minimumFractionDigits: 2,
                                })}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Final Total */}
                  <div className="xl:col-span-1">
                    <div className="bg-white dark:bg-dark-800 p-5 rounded-2xl border border-zinc-200/80 dark:border-dark-700 shadow-sm xl:sticky xl:top-1">
                      <h3 className="text-sm font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-4">
                        Resumen financiero
                      </h3>
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm text-zinc-500 dark:text-zinc-400 font-medium">
                          <span>Subtotal bruto</span>
                          <span className="font-mono text-zinc-800 dark:text-zinc-100">
                            $
                            {(grossSubtotal || 0).toLocaleString("es-MX", {
                              minimumFractionDigits: 2,
                            })}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm text-zinc-500 dark:text-zinc-400 font-medium">
                          <span>Descuento</span>
                          <span className="font-mono text-rose-600 dark:text-rose-400">
                            -$
                            {(totalDiscount || 0).toLocaleString("es-MX", {
                              minimumFractionDigits: 2,
                            })}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm text-zinc-500 dark:text-zinc-400 font-medium">
                          <span>Subtotal neto</span>
                          <span className="font-mono text-zinc-800 dark:text-zinc-100">
                            $
                            {(grandTotal || 0).toLocaleString("es-MX", {
                              minimumFractionDigits: 2,
                            })}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm text-zinc-500 dark:text-zinc-400 font-medium">
                          <span>IVA (16%)</span>
                          <span className="font-mono text-zinc-800 dark:text-zinc-100">
                            $
                            {(ivaTotal || 0).toLocaleString("es-MX", {
                              minimumFractionDigits: 2,
                            })}
                          </span>
                        </div>
                        <div className="flex justify-between items-center pt-3 border-t border-zinc-100 dark:border-dark-700">
                          <span className="font-bold text-zinc-800 dark:text-zinc-100 text-base">
                            Total Neto
                          </span>
                          <span className="font-bold text-2xl text-[#1a2b4c] dark:text-emerald-400 font-mono tracking-tight">
                            $
                            {(totalWithIva || 0).toLocaleString("es-MX", {
                              minimumFractionDigits: 2,
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer con acciones */}
              <div className="px-6 md:px-7 py-4 bg-white/95 dark:bg-dark-900 border-t border-zinc-200 dark:border-dark-700 flex justify-between items-center gap-3">
                <button
                  onClick={() => setShowPreviewModal(false)}
                  className="px-6 py-2.5 rounded-xl text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-dark-800 font-bold transition-all">
                  Volver a editar
                </button>
                <button
                  onClick={save}
                  disabled={loading}
                  className="px-8 py-3 bg-[#2277B4] hover:bg-[#125280] shadow-lg shadow-[#2277B430] text-white rounded-xl font-bold text-base transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                  {loading ? "Procesando…" : "Confirmar y Generar Cotización"}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
