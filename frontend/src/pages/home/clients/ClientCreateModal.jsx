import React, { useState } from "react";
import { createPortal } from "react-dom";
import { X } from "@icons";
import { createClientApi } from "../../../actionsAPI/clients.api";
import { notificationService } from "../../../services/notificationService";

export default function ClientCreateModal({ isOpen, onClose, onSuccess }) {
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

  if (!isOpen) return null;

  const resetForm = () => {
    setBusinessName("");
    setRfc("");
    setEmail1("");
    setEmail2("");
    setCelular("");
    setTelefono("");
    setCodigoPostal("");
    setCiudad("");
    setError("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await createClientApi({
        business_name,
        rfc: rfc || null,
        email1: email1 || null,
        email2: email2 || null,
        celular: celular || null,
        telefono: telefono || null,
        codigo_postal: codigo_postal || null,
        ciudad: ciudad || null,
      });
      notificationService.toast({ title: "Cliente registrado con éxito", icon: "success" });
      resetForm();
      onSuccess();
    } catch (err) {
      setError(err.message || "Error creando cliente");
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header del modal */}
        <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between bg-[#1a2b4c]">
          <h3 className="text-lg font-semibold text-white">
            Nuevo Cliente
          </h3>
          <button
            onClick={handleClose}
            className="size-8 flex items-center justify-center rounded-lg text-[#fff] transition-colors hover:bg-white/10"
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
            <input
              type="text"
              value={business_name}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="Ej. Empresa SA de CV"
              className="w-full px-4 py-3 rounded-xl border border-zinc-300 bg-white text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#153465]"
              required
              autoFocus
            />
          </div>

          {/* RFC y Correo Principal */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-2">
                RFC
              </label>
              <input
                type="text"
                value={rfc}
                onChange={(e) => setRfc(e.target.value)}
                placeholder="XAXX010101000"
                className="w-full px-4 py-3 rounded-xl border border-zinc-300 bg-white text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#153465]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-2">
                Correo Principal
              </label>
              <input
                type="email"
                value={email1}
                onChange={(e) => setEmail1(e.target.value)}
                placeholder="contacto@empresa.com"
                className="w-full px-4 py-3 rounded-xl border border-zinc-300 bg-white text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#153465]"
              />
            </div>
          </div>

          {/* Correo Secundario */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">
              Correo Secundario
            </label>
            <input
              type="email"
              value={email2}
              onChange={(e) => setEmail2(e.target.value)}
              placeholder="ventas@empresa.com"
              className="w-full px-4 py-3 rounded-xl border border-zinc-300 bg-white text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#153465]"
            />
          </div>

          {/* Celular y Teléfono */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-2">
                Celular
              </label>
              <input
                type="tel"
                value={celular}
                onChange={(e) => setCelular(e.target.value)}
                placeholder="55 1234 5678"
                className="w-full px-4 py-3 rounded-xl border border-zinc-300 bg-white text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#153465]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-2">
                Teléfono
              </label>
              <input
                type="tel"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                placeholder="55 9876 5432"
                className="w-full px-4 py-3 rounded-xl border border-zinc-300 bg-white text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#153465]"
              />
            </div>
          </div>

          {/* Código Postal y Ciudad */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-2">
                Código Postal
              </label>
              <input
                type="text"
                value={codigo_postal}
                onChange={(e) => setCodigoPostal(e.target.value)}
                placeholder="06600"
                className="w-full px-4 py-3 rounded-xl border border-zinc-300 bg-white text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#153465]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-2">
                Ciudad
              </label>
              <input
                type="text"
                value={ciudad}
                onChange={(e) => setCiudad(e.target.value)}
                placeholder="Ciudad de México"
                className="w-full px-4 py-3 rounded-xl border border-zinc-300 bg-white text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#153465]"
              />
            </div>
          </div>

          {/* Botones del modal */}
          <div className="flex gap-3 pt-4 border-t border-zinc-100">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="flex-1 py-3 text-zinc-600 font-semibold rounded-xl hover:bg-zinc-50 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 bg-[#2277B4] text-white font-semibold rounded-xl hover:bg-[#125280] transition-colors shadow-lg shadow-[#2277B4]/30 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              Registrar Cliente
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
