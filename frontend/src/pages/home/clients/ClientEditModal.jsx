import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "@icons";
import Input from "../../../components/ui/Input";
import { updateClientApi, updateClientDynamicApi } from "../../../actionsAPI/clients.api";
import { notificationService } from "../../../services/notificationService";

const STATIC_FIELDS = new Set([
  "business_name",
  "rfc",
  "email1",
  "email2",
  "celular",
  "telefono",
  "codigo_postal",
  "ciudad"
]);

const EXCLUDED_COLUMNS = new Set([
  "id",
  "created_at",
  "updated_at",
  "created_by_user_id",
  "portal_password_hash",
  "deleted_at"
]);

export default function ClientEditModal({ isOpen, onClose, client, onSuccess, dynamicColumns = [] }) {
  const [formData, setFormData] = useState({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (client) {
      const initialData = {};
      dynamicColumns.forEach((col) => {
        initialData[col.name] = client[col.name] || "";
      });
      // Ensure static fields are also captured if they aren't in dynamicColumns for some reason
      STATIC_FIELDS.forEach(field => {
        if (!(field in initialData)) {
          initialData[field] = client[field] || "";
        }
      });
      setFormData(initialData);
    }
  }, [client, dynamicColumns]);

  if (!isOpen || !client) return null;

  const handleChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const staticInput = {
        business_name: formData.business_name || "",
        rfc: formData.rfc || null,
        email1: formData.email1 || null,
        email2: formData.email2 || null,
        celular: formData.celular || null,
        telefono: formData.telefono || null,
        codigo_postal: formData.codigo_postal || null,
        ciudad: formData.ciudad || null,
      };

      const dynamicInput = {};
      for (const [key, value] of Object.entries(formData)) {
        if (!STATIC_FIELDS.has(key)) {
          dynamicInput[key] = value || null;
        }
      }

      await updateClientApi(client.id, staticInput);

      if (Object.keys(dynamicInput).length > 0) {
        await updateClientDynamicApi(client.id, dynamicInput);
      }

      notificationService.toast({ title: "Cliente actualizado con éxito", icon: "success" });
      onSuccess();
    } catch (err) {
      setError(err.message || "Error actualizando cliente");
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 bg-black/40 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-2xl dark:shadow-black/50 w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col border border-transparent dark:border-dark-700">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-100 dark:border-dark-700 bg-[#1a2b4c] dark:bg-blue-950 flex items-center justify-between">
          <h3 className="text-white dark:text-white text-xl font-semibold flex items-center gap-2">
            Editar Cliente
          </h3>
          <button
            onClick={onClose}
            className="size-8 flex items-center justify-center rounded-lg text-white dark:text-white hover:bg-white/10 dark:hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/40 dark:focus:ring-white/40"
          >
            <X size={16} />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto [scrollbar-width:thin] [scrollbar-color:#d4d4d8_transparent] dark:[scrollbar-color:#52525b_transparent]">
          {error && (
            <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-300 px-4 py-3 rounded-xl text-sm">
              ⚠️ {error}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4">
            {dynamicColumns
              .filter((col) => !EXCLUDED_COLUMNS.has(col.name))
              .map((col) => (
              <div key={col.name}>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  {col.label} {col.name === "business_name" ? "*" : ""}
                </label>
                <Input
                  type={col.name.includes("email") || col.name.includes("correo") ? "email" : col.name.includes("celular") || col.name.includes("telefono") ? "tel" : "text"}
                  required={col.name === "business_name"}
                  value={formData[col.name] || ""}
                  onChange={(e) => handleChange(col.name, e.target.value)}
                  placeholder={`Ej. ${col.label}`}
                  className="w-full px-4 py-3 rounded-xl border border-zinc-300 dark:border-dark-700 bg-white dark:bg-dark-900 text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#153465] dark:focus:ring-blue-400/40 focus:border-[#153465] dark:focus:border-blue-400 transition-colors"
                />
              </div>
            ))}
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-4 border-t border-zinc-100 dark:border-dark-700">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-3 text-zinc-600 dark:text-zinc-300 font-semibold rounded-xl hover:bg-zinc-100 dark:hover:bg-dark-700 transition-colors disabled:opacity-50 disabled:text-zinc-400 dark:disabled:text-zinc-600 disabled:hover:bg-transparent dark:disabled:hover:bg-transparent"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 bg-[#2277B4] dark:bg-blue-700 text-white dark:text-white font-bold rounded-xl transition-colors shadow-lg shadow-[#12528050] dark:shadow-black/30 hover:bg-[#125280] dark:hover:bg-blue-600 disabled:opacity-50 disabled:bg-zinc-300 disabled:text-zinc-500 dark:disabled:bg-dark-700 dark:disabled:text-zinc-500 disabled:hover:bg-zinc-300 dark:disabled:hover:bg-dark-700 flex items-center justify-center gap-2"
            >
              {loading && <span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              Guardar Cambios
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
