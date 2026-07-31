import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  deleteProductApi,
  getProductApi,
  updateProductApi,
  updateProductPriceApi,
} from "../../../actionsAPI/products.api";
import { notificationService } from "../../../services/notificationService";
import { CATALOG } from "../RegistrarProducts";

export default function useProductDetailController() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Modo de edición
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});

  // Actualización de precio
  const [newPrice, setNewPrice] = useState("");
  const [updatingPrice, setUpdatingPrice] = useState(false);

  // Paginación y filtro de historial
  const [globalFilter, setGlobalFilter] = useState("");
  const [selectedHistoryDate, setSelectedHistoryDate] = useState(null);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 3 });
  const [updatePagination, setUpdatePagination] = useState({ pageIndex: 0, pageSize: 3 });

  const load = useCallback(async () => {
    setError("");
    setLoading(true);
    try {
      const p = await getProductApi(id);
      setProduct(p);
      setEditForm({
        name: p.name,
        category: p.category,
        users_count: p.users_count || 0,
        description: p.description || "",
      });
    } catch (e) {
      setError(e.message || "Error cargando producto");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const handlePriceStep = useCallback((direction) => {
    const current = Number.parseFloat(newPrice || "0");
    const safeCurrent = Number.isFinite(current) ? current : 0;
    const next = Math.max(0, safeCurrent + direction * 0.01);
    setNewPrice(next.toFixed(2));
  }, [newPrice]);

  const handleHistoryDateChange = useCallback((date) => {
    setSelectedHistoryDate(date);
    if (!date) {
      setGlobalFilter("");
      return;
    }
    setGlobalFilter(date.toLocaleDateString());
  }, []);

  const currentMaxUsers = useMemo(() => {
    if (!editForm.name) return 30;
    for (const cat of CATALOG) {
      if (cat.items) {
        for (const item of cat.items) {
          if (item.name === editForm.name && item.max_users) {
            return item.max_users;
          }
        }
      }
    }
    return 30;
  }, [editForm.name]);

  const handleUpdate = useCallback(async (e) => {
    e.preventDefault();
    try {
      const updated = await updateProductApi(id, editForm);
      setProduct((prev) => ({ ...prev, ...updated }));
      setIsEditing(false);
    } catch (err) {
      alert(err.message);
    }
  }, [id, editForm]);

  const handlePriceUpdate = useCallback(async () => {
    if (!newPrice) return;
    setUpdatingPrice(true);
    try {
      const updated = await updateProductPriceApi(id, newPrice);
      setProduct((prev) => ({ ...prev, ...updated }));
      setNewPrice("");
    } catch (err) {
      alert(err.message);
    } finally {
      setUpdatingPrice(false);
    }
  }, [id, newPrice]);

  const handleDelete = useCallback(async () => {
    const confirmed = await notificationService.confirm({
      title: "¿Estás seguro?",
      text: "Se eliminará este producto permanentemente.",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });

    if (!confirmed) return;

    try {
      await deleteProductApi(id);
      notificationService.toast({ title: "¡Producto eliminado exitosamente!", icon: "success" });
      navigate("/productos");
    } catch (err) {
      notificationService.error("Error", err.message || "Error al eliminar producto.");
    }
  }, [id, navigate]);

  return {
    currentMaxUsers,
    editForm,
    error,
    globalFilter,
    handleDelete,
    handleHistoryDateChange,
    handlePriceStep,
    handlePriceUpdate,
    handleUpdate,
    id,
    isEditing,
    loading,
    newPrice,
    pagination,
    product,
    selectedHistoryDate,
    setEditForm,
    setGlobalFilter,
    setIsEditing,
    setNewPrice,
    setPagination,
    setSelectedHistoryDate,
    setUpdatePagination,
    updatePagination,
    updatingPrice,
  };
}
