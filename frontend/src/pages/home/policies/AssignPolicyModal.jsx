import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  createContactProductApi,
  listContactsByClientApi,
} from "../../../actionsAPI/contacts.api";
import { listClientsApi } from "../../../actionsAPI/clients.api";
import { notificationService } from "../../../services/notificationService";
import { X } from "@icons";

export default function AssignPolicyModal({ isOpen, onClose, target, onAssigned }) {
  const [clients, setClients] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    client_id: "",
    contact_id: "",
    license_key: "",
    start_date: "",
    expiration_date: "",
    status: "ACTIVE",
  });

  // Helper to convert date to YYYY-MM-DD
  const toInputDate = (value) => {
    if (!value) return "";
    const date = new Date(value);
    if (isNaN(date.getTime())) return "";
    return date.toISOString().slice(0, 10);
  };

  useEffect(() => {
    if (!isOpen || !target) return;

    const clientId = target.client?.id ? String(target.client.id) : "";
    const startDate = toInputDate(target.start_date) || new Date().toISOString().slice(0, 10);
    const expDate = toInputDate(target.expiration_date);

    setForm({
      client_id: clientId,
      contact_id: "",
      license_key: "",
      start_date: startDate,
      expiration_date: expDate,
      status: target.status || "ACTIVE",
    });

    setContacts([]);

    let canceled = false;
    setLoadingClients(true);
    listClientsApi()
      .then((res) => {
        if (!canceled) setClients(res || []);
      })
      .catch((e) => {
        if (!canceled) {
          notificationService.error("Error", e.message || "Error cargando clientes");
        }
      })
      .finally(() => {
        if (!canceled) setLoadingClients(false);
      });

    return () => {
      canceled = true;
    };
  }, [isOpen, target]);

  useEffect(() => {
    if (!isOpen || !form.client_id) {
      setContacts([]);
      return;
    }

    let canceled = false;
    setLoadingContacts(true);
    listContactsByClientApi(form.client_id)
      .then((res) => {
        if (!canceled) setContacts(res || []);
      })
      .catch((e) => {
        if (!canceled) {
          notificationService.error("Error", e.message || "Error cargando contactos");
        }
      })
      .finally(() => {
        if (!canceled) setLoadingContacts(false);
      });

    return () => {
      canceled = true;
    };
  }, [isOpen, form.client_id]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!target?.product?.id) return;
    if (!form.contact_id || !form.start_date || !form.expiration_date) {
      notificationService.info("Faltan datos", "Completa los campos obligatorios.");
      return;
    }

    setSaving(true);
    try {
      await createContactProductApi({
        contact_id: form.contact_id,
        product_id: target.product.id,
        license_key: form.license_key?.trim() || null,
        start_date: form.start_date,
        expiration_date: form.expiration_date,
        status: form.status || "ACTIVE",
      });
      notificationService.toast({ title: "Asignado con éxito", icon: "success" });
      onAssigned();
      onClose();
    } catch (e) {
      notificationService.error("Error al asignar", e.message);
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] bg-black/45 flex items-center justify-center p-4"
      onClick={onClose}>
      <div
        className="bg-white dark:bg-dark-900 border border-zinc-200 dark:border-dark-700 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-zinc-100 dark:border-dark-800 bg-[#1a2b4c] dark:bg-dark-800 flex items-center justify-between">
          <div>
            <h3 className="text-white font-semibold text-base uppercase">
              Asignar servicio/póliza
            </h3>
            <p className="text-[11px] text-zinc-300 dark:text-zinc-400 mt-1">
              {target?.product?.name || "Producto"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="size-8 rounded-lg text-white hover:bg-white/10 flex items-center justify-center">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-zinc-500 dark:text-zinc-400 mb-1 block">
                Servicio/Póliza
              </label>
              <input
                type="text"
                value={target?.product?.name || ""}
                disabled
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-dark-700 bg-zinc-50 dark:bg-dark-800 text-sm text-zinc-700 dark:text-zinc-300 disabled:opacity-75"
              />
            </div>

            <div>
              <label className="text-xs text-zinc-500 dark:text-zinc-400 mb-1 block">
                Cliente
              </label>
              {target?.client?.id ? (
                <input
                  type="text"
                  value={target?.client?.business_name || ""}
                  disabled
                  className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-dark-700 bg-zinc-50 dark:bg-dark-800 text-sm text-zinc-700 dark:text-zinc-300 disabled:opacity-75"
                />
              ) : (
                <select
                  value={form.client_id}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      client_id: e.target.value,
                      contact_id: "",
                    }))
                  }
                  className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-dark-700 bg-white dark:bg-dark-900 text-sm text-zinc-800 dark:text-zinc-200 focus:ring-2 focus:ring-[#2277B4]/30 focus:border-[#2277B4] outline-none"
                >
                  <option value="">
                    {loadingClients ? "Cargando..." : "Seleccionar..."}
                  </option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.business_name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="text-xs text-zinc-500 dark:text-zinc-400 mb-1 block">
                Contacto *
              </label>
              <select
                value={form.contact_id}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    contact_id: e.target.value,
                  }))
                }
                disabled={!form.client_id || loadingContacts}
                className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-dark-700 bg-white dark:bg-dark-900 text-sm text-zinc-800 dark:text-zinc-200 focus:ring-2 focus:ring-[#2277B4]/30 focus:border-[#2277B4] outline-none disabled:bg-zinc-100 dark:disabled:bg-dark-800"
                required>
                <option value="">
                  {loadingContacts ?
                    "Cargando contactos..."
                  : form.client_id ?
                    "Seleccionar..."
                  : "Selecciona un cliente"}
                </option>
                {contacts.map((contact) => (
                  <option key={contact.id} value={contact.id}>
                    {contact.full_name}
                  </option>
                ))}
              </select>
              {!loadingContacts &&
                form.client_id &&
                contacts.length === 0 && (
                  <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-1">
                    No hay contactos para este cliente.
                  </p>
                )}
            </div>

            <div>
              <label className="text-xs text-zinc-500 dark:text-zinc-400 mb-1 block">
                Licencia / Folio
              </label>
              <input
                type="text"
                value={form.license_key}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    license_key: e.target.value,
                  }))
                }
                placeholder="Opcional"
                className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-dark-700 bg-white dark:bg-dark-900 text-sm text-zinc-800 dark:text-zinc-200 focus:ring-2 focus:ring-[#2277B4]/30 focus:border-[#2277B4] outline-none"
              />
            </div>

            <div>
              <label className="text-xs text-zinc-500 dark:text-zinc-400 mb-1 block">
                Inicio *
              </label>
              <input
                type="date"
                value={form.start_date}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    start_date: e.target.value,
                  }))
                }
                required
                className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-dark-700 bg-white dark:bg-dark-900 text-sm text-zinc-800 dark:text-zinc-200 focus:ring-2 focus:ring-[#2277B4]/30 focus:border-[#2277B4] outline-none"
              />
            </div>

            <div>
              <label className="text-xs text-zinc-500 dark:text-zinc-400 mb-1 block">
                Vence *
              </label>
              <input
                type="date"
                value={form.expiration_date}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    expiration_date: e.target.value,
                  }))
                }
                required
                className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-dark-700 bg-white dark:bg-dark-900 text-sm text-zinc-800 dark:text-zinc-200 focus:ring-2 focus:ring-[#2277B4]/30 focus:border-[#2277B4] outline-none"
              />
            </div>

            <div>
              <label className="text-xs text-zinc-500 dark:text-zinc-400 mb-1 block">
                Estado
              </label>
              <select
                value={form.status}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    status: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-dark-700 bg-white dark:bg-dark-900 text-sm text-zinc-800 dark:text-zinc-200 focus:ring-2 focus:ring-[#2277B4]/30 focus:border-[#2277B4] outline-none"
              >
                <option value="ACTIVE">Activo</option>
                <option value="CANCELLED">Inactivo</option>
                <option value="EXPIRED">Vencido</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-dark-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-800 transition-colors disabled:opacity-60"
            >
              {saving ? "Asignando..." : "Asignar"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
