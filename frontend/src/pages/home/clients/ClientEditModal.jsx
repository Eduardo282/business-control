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
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-100 bg-[#1a2b4c] flex items-center justify-between">
          <h3 className="text-white text-xl font-semibold flex items-center gap-2">
            Editar Cliente
          </h3>
          <button
            onClick={onClose}
            className="size-8 flex items-center justify-center rounded-lg text-white hover:bg-white/10"
          >
            <X size={16} />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
              ⚠️ {error}
            </div>
          )}

          {/* Razón Social */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">
              Razón Social *
            </label>
            <Input
              type="text"
              required
              value={business_name}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="Nombre de la empresa"
              className="w-full px-4 py-3 rounded-xl border border-zinc-300 bg-white text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#E4EAF1]"
            />
          </div>

          {/* RFC y Correo Principal */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-2">
                RFC
              </label>
              <Input
                type="text"
                value={rfc}
                onChange={(e) => setRfc(e.target.value)}
                placeholder="XAXX010101000"
                className="w-full px-4 py-3 rounded-xl border border-zinc-300 bg-white text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#E4EAF1]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-2">
                Correo Principal
              </label>
              <Input
                type="email"
                value={email1}
                onChange={(e) => setEmail1(e.target.value)}
                placeholder="contacto@empresa.com"
                className="w-full px-4 py-3 rounded-xl border border-zinc-300 bg-white text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#E4EAF1]"
              />
            </div>
          </div>

          {/* Correo Secundario */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">
              Correo Secundario
            </label>
            <Input
              type="email"
              value={email2}
              onChange={(e) => setEmail2(e.target.value)}
              placeholder="ventas@empresa.com"
              className="w-full px-4 py-3 rounded-xl border border-zinc-300 bg-white text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#E4EAF1]"
            />
          </div>

          {/* Celular y Teléfono */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-2">
                Celular
              </label>
              <Input
                type="tel"
                value={celular}
                onChange={(e) => setCelular(e.target.value)}
                placeholder="55 1234 5678"
                className="w-full px-4 py-3 rounded-xl border border-zinc-300 bg-white text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#E4EAF1]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-2">
                Teléfono
              </label>
              <Input
                type="tel"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                placeholder="55 9876 5432"
                className="w-full px-4 py-3 rounded-xl border border-zinc-300 bg-white text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#E4EAF1]"
              />
            </div>
          </div>

          {/* Código Postal y Ciudad */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-2">
                Código Postal
              </label>
              <Input
                type="text"
                value={codigo_postal}
                onChange={(e) => setCodigoPostal(e.target.value)}
                placeholder="06600"
                className="w-full px-4 py-3 rounded-xl border border-zinc-300 bg-white text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#E4EAF1]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-2">
                Ciudad
              </label>
              <Input
                type="text"
                value={ciudad}
                onChange={(e) => setCiudad(e.target.value)}
                placeholder="Ciudad de México"
                className="w-full px-4 py-3 rounded-xl border border-zinc-300 bg-white text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#E4EAF1]"
              />
            </div>
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-4 border-t border-zinc-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-3 text-zinc-600 font-semibold rounded-xl hover:bg-zinc-100 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 bg-[#2277B4] text-white font-bold rounded-xl transition-colors shadow-lg shadow-[#12528050] hover:bg-[#125280] disabled:opacity-50 flex items-center justify-center gap-2"
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
