import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Card from "../../../components/ui/Card";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import {
  Package,
  Sparkles,
  Library,
  ChevronDown,
} from "@icons";
import { CATALOG } from "./constants";
import {
  listProductsApi,
  createProductApi,
  deleteProductApi,
} from "../../../actionsAPI/products.api";
import { ServicesSection } from "./ServicesSection";
import { IVA_RATE } from "@shared/quotePricingRules.js";
import { notificationService } from "../../../services/notificationService";
import { logger } from "../../../services/logger";

export const ClientProductsTab = ({ clientId, contacts, productsList }) => {
  const [products, setProducts] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: "",
    category: "Licencia de Software",
    price: 0,
    users_count: 0,
    description: "",
  });

  const load = () => {
    setLoading(true);
    listProductsApi(clientId)
      .then((res) => {
        // Filtrar para mostrar solo los productos EXCLUSIVOS de este cliente
        setProducts(res.filter((p) => p.client_id == clientId));
        setLoading(false);
      })
      .catch((e) => {
        logger.error("Error loading products", e);
        setLoading(false);
      });
  };

  useEffect(() => {
    if (clientId) load();
  }, [clientId]);

  const handleTemplateSelect = (e) => {
    const val = e.target.value;
    if (!val) return;
    const [catIdx, itemIdx] = val.split("-");
    const item = CATALOG[catIdx].items[itemIdx];
    const category = CATALOG[catIdx].category;

    if (item) {
      setNewProduct({
        ...newProduct,
        name: item.name,
        category: category,
        price: 0,
        description: item.description || "",
        users_count: 0,
      });
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await createProductApi({ ...newProduct, client_id: clientId });
      setIsCreating(false);
      setNewProduct({
        name: "",
        category: "Licencia de Software",
        price: 0,
        users_count: 0,
        description: "",
      });
      notificationService.success("Producto registrado", "El producto exclusivo se registró correctamente.");
      load();
    } catch (e) {
      notificationService.error("Error", e.message || "No se pudo registrar el producto.");
    }
  };

  const handleDelete = async (id) => {
    const confirmed = await notificationService.confirm({
      title: "¿Eliminar producto?",
      text: "Esta acción eliminará de forma permanente el producto exclusivo del catálogo.",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });
    if (!confirmed) return;

    try {
      await deleteProductApi(id);
      notificationService.success("Producto eliminado", "El producto fue eliminado del catálogo.");
      load();
    } catch (e) {
      notificationService.error("Error", e.message || "No se pudo eliminar el producto.");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <Card>
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-semibold text-light-text-primary dark:text-white flex items-center gap-2">
            <span className="text-light-accent dark:text-primary-400">
              <Package size={20} />
            </span>{" "}
            Productos Exclusivos
          </h3>
          <Button size="sm" onClick={() => setIsCreating(!isCreating)}>
            + Nuevo Producto
          </Button>
        </div>

        {isCreating && (
          <form onSubmit={handleCreate} className="mb-6 animate-fade-in">
            <div className="p-6 rounded-xl glass-panel shadow-xl">
              <h4 className="flex items-center gap-2 font-bold text-light-text-primary dark:text-white mb-4">
                <span className="text-lg">
                  <Sparkles size={20} />
                </span>{" "}
                Nuevo Producto
                <span className="text-xs font-normal text-light-text-secondary dark:text-zinc-400 ml-2">
                  Registra un nuevo item en el inventario/catálogo.
                </span>
              </h4>

              {/* Rapid Catalog */}
              <div className="mb-6">
                <label className="text-xs font-bold text-light-accent dark:text-primary-400 uppercase mb-2 flex items-center gap-1">
                  <span className="text-lg">
                    <Library size={20} />
                  </span>{" "}
                  Catálogo Rápido
                </label>
                <div className="relative">
                  <select
                    className="w-full pl-4 pr-10 py-3 rounded-xl bg-light-bg dark:bg-zinc-950/50 border border-light-border dark:border-white/10 text-light-text-primary dark:text-zinc-300 focus:ring-1 focus:ring-light-accent dark:focus:ring-primary-500 outline-none appearance-none transition-all cursor-pointer hover:bg-light-bg/80 dark:hover:bg-zinc-900"
                    onChange={handleTemplateSelect}
                    defaultValue="">
                    <option value="">-- Seleccionar plantilla --</option>
                    {CATALOG.map((cat, catIdx) => (
                      <optgroup
                        key={cat.category}
                        label={cat.category}
                        className="bg-light-card dark:bg-zinc-900 text-light-text-primary dark:text-zinc-300 font-semibold">
                        {cat.items.map((item, itemIdx) => (
                          <option
                            key={item.name}
                            value={`${catIdx}-${itemIdx}`}
                            className="bg-light-bg dark:bg-zinc-800 text-light-text-secondary dark:text-zinc-400 font-normal">
                            {item.name}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-light-text-secondary dark:text-zinc-500">
                    <ChevronDown size={16} />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <Input
                  label="NOMBRE DEL PRODUCTO"
                  placeholder="Ej. Contabilidad 2024"
                  value={newProduct.name}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, name: e.target.value })
                  }
                  required
                />
                <Input
                  label="CATEGORÍA"
                  placeholder="Ej. Licencias"
                  value={newProduct.category}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, category: e.target.value })
                  }
                  required
                />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Input
                      label="PRECIO (MXN)"
                      type="number"
                      placeholder="0.00"
                      value={newProduct.price}
                      onChange={(e) =>
                        setNewProduct({ ...newProduct, price: e.target.value })
                      }
                      required
                    />
                    {newProduct.price && !isNaN(newProduct.price) && (
                      <div className="text-[10px] text-light-accent dark:text-primary-400 mt-1 font-mono text-right">
                        + IVA: $
                        {(parseFloat(newProduct.price) * IVA_RATE).toFixed(2)}
                      </div>
                    )}
                  </div>
                  <Input
                    label="USUARIOS (OP)"
                    type="number"
                    placeholder="1"
                    value={newProduct.users_count}
                    onChange={(e) =>
                      setNewProduct({
                        ...newProduct,
                        users_count: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-light-text-secondary dark:text-zinc-400">
                    Descripción
                  </label>
                  <textarea
                    className="w-full bg-light-bg/50 dark:bg-zinc-950/30 border border-light-border dark:border-white/10 rounded-lg p-3 text-sm text-light-text-primary dark:text-zinc-200 outline-none focus:ring-1 focus:ring-light-accent dark:focus:ring-primary-500 min-h-[100px]"
                    placeholder="Detalles técnicos…"
                    value={newProduct.description}
                    onChange={(e) =>
                      setNewProduct({
                        ...newProduct,
                        description: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-light-border dark:border-white/5">
                <Button
                  type="submit"
                  className="px-8 justify-center bg-light-accent dark:bg-primary-600 hover:bg-light-accent/90 dark:hover:bg-primary-500">
                  Registrar Producto
                </Button>
              </div>
            </div>
          </form>
        )}

        <div className="space-y-2">
          {products.map((p) => (
            <div
              key={p.id}
              className="flex justify-between items-center p-3 rounded-lg glass-panel hover:border-light-accent/30 dark:hover:border-white/20 transition-all">
              <div>
                <div className="font-bold text-light-text-primary dark:text-zinc-200">
                  {p.name}
                </div>
                <div className="text-xs text-light-text-secondary dark:text-zinc-400">
                  {p.category} • $
                  {(parseFloat(p.current_price) || 0).toLocaleString("es-MX", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Link
                  to={`/productos/${p.id}`}
                  className="text-xs bg-light-bg dark:bg-zinc-800 hover:bg-light-bg/80 dark:hover:bg-zinc-700 text-light-accent dark:text-primary-400 px-3 py-1.5 rounded-lg transition-colors border border-light-border dark:border-white/5">
                  Ver detalles
                </Link>
                <button
                  onClick={() => handleDelete(p.id)}
                  className="text-light-error dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 px-2"
                  title="Eliminar producto">
                  🗑️
                </button>
              </div>
            </div>
          ))}
          {products.length === 0 && !loading && (
            <p className="text-light-text-secondary dark:text-zinc-500 text-sm text-center py-4">
              No hay productos exclusivos registrados.
            </p>
          )}
        </div>
      </Card>

      {/* Sección de Servicios Activos */}
      <ServicesSection
        clientId={clientId}
        contacts={contacts}
        productsList={productsList}
      />
    </div>
  );
};
