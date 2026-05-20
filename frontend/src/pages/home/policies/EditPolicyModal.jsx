import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { updateContactProductDatesApi } from "../../../actionsAPI/contacts.api";
import { notificationService } from "../../../services/notificationService";
import { X } from "@icons";

export default function EditPolicyModal({ isOpen, editingRow, onClose, onSaved }) {
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);

  // Helper to convert date to YYYY-MM-DD
  const toInputDate = (value) => {
    if (!value) return "";
    const date = new Date(value);
    if (isNaN(date.getTime())) return "";
    return date.toISOString().slice(0, 10);
  };

  useEffect(() => {
    if (!isOpen || !editingRow) {
      setForm(null);
      return;
    }

    setForm({
      id: editingRow.id,
      group: editingRow.group,
      policyIds: editingRow.policyIds || [],
      start_date: editingRow.start_date || "",
      expiration_date: editingRow.expiration_date || "",
      status: editingRow.status || "ACTIVE",
      selectedFolioId: editingRow.selectedFolioId || "ALL",
      license_key: editingRow.license_key || "",
    });
  }, [isOpen, editingRow]);

  if (!isOpen || !form) return null;

  const handleSelectChange = (e) => {
    const val = e.target.value;
    if (val === "ALL") {
      const sd = form.group.start_date ? toInputDate(form.group.start_date) : "";
      const ed = form.group.expiration_date ? toInputDate(form.group.expiration_date) : "";
      setForm(prev => ({
        ...prev,
        selectedFolioId: "ALL",
        policyIds: form.group.policyIds,
        start_date: sd,
        expiration_date: ed,
        status: form.group.status,
        license_key: "",
      }));
    } else {
      const p = form.group.items.find(i => String(i.id) === val);
      const sd = p.start_date ? toInputDate(p.start_date) : "";
      const ed = p.expiration_date ? toInputDate(p.expiration_date) : "";
      setForm(prev => ({
        ...prev,
        selectedFolioId: val,
        policyIds: [p.id],
        start_date: sd,
        expiration_date: ed,
        status: p.status,
        license_key: p.license_key || "",
      }));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Update each contact_product in the group
      for (const cpId of form.policyIds) {
        const licenseKey = form.selectedFolioId !== "ALL" ? form.license_key : undefined;
        await updateContactProductDatesApi(cpId, {
          start_date: form.start_date || null,
          expiration_date: form.expiration_date || null,
          status: form.status,
          license_key: licenseKey,
        });
      }

      notificationService.toast({ title: "¡Actualizado con éxito!", icon: "success" });
      onSaved();
      onClose();
    } catch (e) {
      notificationService.error("Error al actualizar", e.message);
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-black/45 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-dark-900 border border-zinc-200 dark:border-dark-700 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-zinc-100 dark:border-dark-800 bg-[#1a2b4c] dark:bg-dark-800 flex items-center justify-between">
          <div>
            <h3 className="text-white font-semibold text-base uppercase">Editar Vigencia / Estado</h3>
            <p className="text-[11px] text-zinc-300 dark:text-zinc-400 mt-1">
              {form.group?.product?.name} - {form.group?.client?.business_name}
            </p>
          </div>
          <button onClick={onClose} className="size-8 rounded-lg text-white hover:bg-white/10 flex items-center justify-center">
            <X size={16} />
          </button>
        </div>
        <div className="p-6 space-y-5">
          {form.group?.items?.length > 1 && (
            <div>
              <label className="text-xs text-zinc-500 dark:text-zinc-400 mb-1.5 block uppercase font-bold tracking-wider">¿Qué deseas editar?</label>
              <select
                value={form.selectedFolioId || "ALL"}
                onChange={handleSelectChange}
                className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-dark-700 bg-zinc-50 dark:bg-dark-800 text-sm font-medium text-zinc-800 dark:text-zinc-200 focus:ring-2 focus:ring-[#2277B4]/20 focus:border-[#2277B4] outline-none transition-all shadow-sm shadow-zinc-100 dark:shadow-none"
              >
                <option value="ALL">Todo el grupo ({form.group.count} pólizas)</option>
                {form.group.items.map(item => (
                  <option key={item.id} value={item.id}>Folio: {item.license_key || "Sin folio"}</option>
                ))}
              </select>
            </div>
          )}

          {form.selectedFolioId !== "ALL" && (
            <div>
              <label className="text-xs text-zinc-500 dark:text-zinc-400 mb-1.5 block uppercase font-bold tracking-wider">Folio / Licencia</label>
              <input
                type="text"
                value={form.license_key || ""}
                onChange={e => setForm(prev => ({ ...prev, license_key: e.target.value }))}
                placeholder="Sin folio"
                className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-dark-700 bg-white dark:bg-dark-900 text-sm text-zinc-800 dark:text-zinc-200 focus:ring-2 focus:ring-[#2277B4]/20 focus:border-[#2277B4] outline-none transition-all shadow-sm"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-zinc-500 dark:text-zinc-400 mb-1.5 block uppercase font-bold tracking-wider">Fecha Inicio</label>
              <input
                type="date"
                value={form.start_date}
                onChange={e => setForm(prev => ({ ...prev, start_date: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-dark-700 bg-white dark:bg-dark-900 text-sm text-zinc-800 dark:text-zinc-200 focus:ring-2 focus:ring-[#2277B4]/20 focus:border-[#2277B4] outline-none transition-all shadow-sm"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-500 dark:text-zinc-400 mb-1.5 block uppercase font-bold tracking-wider">Fecha Vencimiento</label>
              <input
                type="date"
                value={form.expiration_date}
                onChange={e => setForm(prev => ({ ...prev, expiration_date: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-dark-700 bg-white dark:bg-dark-900 text-sm text-zinc-800 dark:text-zinc-200 focus:ring-2 focus:ring-[#2277B4]/20 focus:border-[#2277B4] outline-none transition-all shadow-sm"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-zinc-500 dark:text-zinc-400 mb-1.5 block uppercase font-bold tracking-wider">Estado</label>
            <select
              value={form.status}
              onChange={e => setForm(prev => ({ ...prev, status: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-dark-700 bg-white dark:bg-dark-900 text-sm text-zinc-800 dark:text-zinc-200 focus:ring-2 focus:ring-[#2277B4]/20 focus:border-[#2277B4] outline-none transition-all shadow-sm"
            >
              <option value="ACTIVE">Activo</option>
              <option value="CANCELLED">Inactivo</option>
              <option value="EXPIRED">Vencido</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4">
            <button onClick={onClose} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-dark-800 transition-colors">
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#2277B4] hover:bg-[#1a5d8c] transition-all disabled:opacity-60 shadow-lg shadow-blue-500/20 active:scale-95"
            >
              {saving ? "Guardando..." : "Guardar Cambios"}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
