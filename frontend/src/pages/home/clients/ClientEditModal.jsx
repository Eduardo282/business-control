import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "@icons";
import Input from "../../../components/ui/Input";
import { updateClientApi } from "../../../actionsAPI/clients.api";
import { notificationService } from "../../../services/notificationService";

export default function ClientEditModal({ isOpen, onClose, client, onSuccess }) {
  const [business_name, setBusinessName] = useState("");
  const [rfc, setRfc] = useState("");
  const [email1, setEmail1] = useState("");
  const [email2, setEmail2] = useState("");
  const [celular, setCelular] = useState("");
  const [telefono, setTelefono] = useState("");
  const [codigo_postal, setCodigoPostal] = useState("");
  const [ciudad, setCiudad] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (client) {
      setBusinessName(client.business_name || "");
      setRfc(client.rfc || "");
      setEmail1(client.email1 || "");
      setEmail2(client.email2 || "");
      setCelular(client.celular || "");
      setTelefono(client.telefono || "");
      setCodigoPostal(client.codigo_postal || "");
      setCiudad(client.ciudad || "");
    }
  }, [client]);

  if (!isOpen || !client) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await updateClientApi(client.id, {
        business_name,
        rfc: rfc || null,
        email1: email1 || null,
        email2: email2 || null,
        celular: celular || null,
        telefono: telefono || null,
        codigo_postal: codigo_postal || null,
        ciudad: ciudad || null,
      });
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

          {/* Razón Social */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              Razón Social *
            </label>
            <Input
              type="text"
              required
              value={business_name}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="Nombre de la empresa"
              className="w-full px-4 py-3 rounded-xl border border-zinc-300 dark:border-dark-700 bg-white dark:bg-dark-900 text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#153465] dark:focus:ring-blue-400/40 focus:border-[#153465] dark:focus:border-blue-400 transition-colors"
            />
          </div>

          {/* RFC y Correo Principal */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                RFC
              </label>
              <Input
                type="text"
                value={rfc}
                onChange={(e) => setRfc(e.target.value)}
                placeholder="XAXX010101000"
                className="w-full px-4 py-3 rounded-xl border border-zinc-300 dark:border-dark-700 bg-white dark:bg-dark-900 text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#153465] dark:focus:ring-blue-400/40 focus:border-[#153465] dark:focus:border-blue-400 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Correo Principal
              </label>
              <Input
                type="email"
                value={email1}
                onChange={(e) => setEmail1(e.target.value)}
                placeholder="contacto@empresa.com"
                className="w-full px-4 py-3 rounded-xl border border-zinc-300 dark:border-dark-700 bg-white dark:bg-dark-900 text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#153465] dark:focus:ring-blue-400/40 focus:border-[#153465] dark:focus:border-blue-400 transition-colors"
              />
            </div>
          </div>

          {/* Correo Secundario */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              Correo Secundario
            </label>
            <Input
              type="email"
              value={email2}
              onChange={(e) => setEmail2(e.target.value)}
              placeholder="ventas@empresa.com"
              className="w-full px-4 py-3 rounded-xl border border-zinc-300 dark:border-dark-700 bg-white dark:bg-dark-900 text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#153465] dark:focus:ring-blue-400/40 focus:border-[#153465] dark:focus:border-blue-400 transition-colors"
            />
          </div>

          {/* Celular y Teléfono */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Celular
              </label>
              <Input
                type="tel"
                value={celular}
                onChange={(e) => setCelular(e.target.value)}
                placeholder="55 1234 5678"
                className="w-full px-4 py-3 rounded-xl border border-zinc-300 dark:border-dark-700 bg-white dark:bg-dark-900 text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#153465] dark:focus:ring-blue-400/40 focus:border-[#153465] dark:focus:border-blue-400 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Teléfono
              </label>
              <Input
                type="tel"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                placeholder="55 9876 5432"
                className="w-full px-4 py-3 rounded-xl border border-zinc-300 dark:border-dark-700 bg-white dark:bg-dark-900 text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#153465] dark:focus:ring-blue-400/40 focus:border-[#153465] dark:focus:border-blue-400 transition-colors"
              />
            </div>
          </div>

          {/* Código Postal y Ciudad */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Código Postal
              </label>
              <Input
                type="text"
                value={codigo_postal}
                onChange={(e) => setCodigoPostal(e.target.value)}
                placeholder="06600"
                className="w-full px-4 py-3 rounded-xl border border-zinc-300 dark:border-dark-700 bg-white dark:bg-dark-900 text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#153465] dark:focus:ring-blue-400/40 focus:border-[#153465] dark:focus:border-blue-400 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Ciudad
              </label>
              <Input
                type="text"
                value={ciudad}
                onChange={(e) => setCiudad(e.target.value)}
                placeholder="Ciudad de México"
                className="w-full px-4 py-3 rounded-xl border border-zinc-300 dark:border-dark-700 bg-white dark:bg-dark-900 text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#153465] dark:focus:ring-blue-400/40 focus:border-[#153465] dark:focus:border-blue-400 transition-colors"
              />
            </div>
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
