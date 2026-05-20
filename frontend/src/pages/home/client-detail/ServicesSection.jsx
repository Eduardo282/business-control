import { useState, useEffect } from "react";
import Card from "../../../components/ui/Card";
import { Tag, UserPlus, Trash2 } from "@icons";
import { listClientActiveServicesApi } from "../../../actionsAPI/clients.api";
import {
  createContactProductApi,
  deleteContactProductApi,
} from "../../../actionsAPI/contacts.api";
import { notificationService } from "../../../services/notificationService";

export const ServicesSection = ({ clientId, contacts = [], productsList = [] }) => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [serviceForm, setServiceForm] = useState({
    contact_id: "",
    product_id: "",
    license_key: "",
    expiration_date: "",
  });

  const loadServices = () => {
    setLoading(true);
    listClientActiveServicesApi(clientId)
      .then((res) => {
        setServices(res);
        setLoading(false);
      })
      .catch((e) => {
        console.error(e);
        setLoading(false);
      });
  };

  useEffect(() => {
    if (clientId) {
      loadServices();
    }
  }, [clientId]);

  const handleAddService = async (e) => {
    e.preventDefault();
    if (
      !serviceForm.contact_id ||
      !serviceForm.product_id ||
      !serviceForm.expiration_date
    ) {
      notificationService.warning("Campos requeridos", "Por favor completa los campos requeridos.");
      return;
    }
    try {
      await createContactProductApi({
        contact_id: serviceForm.contact_id,
        product_id: serviceForm.product_id,
        license_key: serviceForm.license_key || null,
        expiration_date: serviceForm.expiration_date,
        start_date: new Date().toISOString().split("T")[0],
      });
      setServiceForm({
        contact_id: "",
        product_id: "",
        license_key: "",
        expiration_date: "",
      });
      notificationService.success("Servicio asignado", "El servicio se asignó correctamente.");
      loadServices();
    } catch (e) {
      notificationService.error("Error", e.message || "No se pudo asignar el servicio.");
    }
  };

  const handleDeleteService = async (id) => {
    const confirmed = await notificationService.confirm({
      title: "¿Eliminar este servicio?",
      text: "Esta acción desasignará el servicio del contacto.",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });
    if (!confirmed) return;

    try {
      await deleteContactProductApi(id);
      notificationService.success("Servicio eliminado", "El servicio fue eliminado correctamente.");
      loadServices();
    } catch (e) {
      notificationService.error("Error", e.message || "No se pudo eliminar el servicio.");
    }
  };

  return (
    <Card>
      <h3 className="font-semibold text-light-text-primary dark:text-white mb-6 flex items-center gap-2">
        <span className="text-accent-400">
          <Tag size={20} />
        </span>{" "}
        Servicios Activos
      </h3>

      {/* Formulario para agregar servicio */}
      <form
        onSubmit={handleAddService}
        className="mb-6 p-4 rounded-xl bg-zinc-50 border border-zinc-200">
        <h4 className="text-sm font-semibold text-zinc-700 mb-3 flex items-center gap-2">
          <UserPlus size={16} /> Asignar Nuevo Servicio
        </h4>
        <div className="grid grid-cols-12 gap-3">
          <div className="col-span-3">
            <label className="text-xs text-zinc-500 mb-1 block">
              Contacto *
            </label>
            <select
              className="w-full px-3 py-2 rounded-lg border border-zinc-300 bg-white text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-black"
              value={serviceForm.contact_id}
              onChange={(e) =>
                setServiceForm({ ...serviceForm, contact_id: e.target.value })
              }
              required>
              <option value="">Seleccionar...</option>
              {contacts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.full_name}
                </option>
              ))}
            </select>
          </div>
          <div className="col-span-3">
            <label className="text-xs text-zinc-500 mb-1 block">
              Producto *
            </label>
            <select
              className="w-full px-3 py-2 rounded-lg border border-zinc-300 bg-white text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-black"
              value={serviceForm.product_id}
              onChange={(e) =>
                setServiceForm({ ...serviceForm, product_id: e.target.value })
              }
              required>
              <option value="">Seleccionar...</option>
              {productsList.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div className="col-span-2">
            <label className="text-xs text-zinc-500 mb-1 block">
              Licencia / Serial
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 rounded-lg border border-zinc-300 bg-white text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-black"
              placeholder="Opcional"
              value={serviceForm.license_key}
              onChange={(e) =>
                setServiceForm({ ...serviceForm, license_key: e.target.value })
              }
            />
          </div>
          <div className="col-span-2">
            <label className="text-xs text-zinc-500 mb-1 block">
              Vencimiento *
            </label>
            <input
              type="date"
              className="w-full px-3 py-2 rounded-lg border border-zinc-300 bg-white text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-black"
              value={serviceForm.expiration_date}
              onChange={(e) =>
                setServiceForm({
                  ...serviceForm,
                  expiration_date: e.target.value,
                })
              }
              required
            />
          </div>
          <div className="col-span-2 flex items-end">
            <button
              type="submit"
              className="w-full px-4 py-2 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors text-sm">
              Asignar
            </button>
          </div>
        </div>
      </form>

      {loading ?
        <div className="text-center py-8 text-zinc-500">
          Cargando servicios...
        </div>
      : <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-200">
                <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-600 uppercase">
                  Producto
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-600 uppercase">
                  Contacto
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-600 uppercase">
                  Licencia
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-600 uppercase">
                  Vence
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-600 uppercase">
                  Estado
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-600 uppercase">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {services.map((s) => (
                <tr
                  key={s.id}
                  className="hover:bg-blue-50/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-zinc-800">
                    {s.product.name}
                  </td>
                  <td className="px-4 py-3 text-zinc-600">{s.contact_name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-zinc-500">
                    {s.license_key || "—"}
                  </td>
                  <td className="px-4 py-3 text-zinc-600">
                    {new Date(s.expiration_date).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-bold ${
                        s.status === "ACTIVE" ?
                          "bg-emerald-100 text-emerald-600"
                        : s.status === "CANCELLED" ?
                          "bg-zinc-100 text-zinc-600"
                        : s.status === "EXPIRING_SOON" ?
                          "bg-amber-100 text-amber-600"
                        : "bg-red-100 text-red-500"
                      }`}>
                      {s.status === "ACTIVE" ?
                        "Activo"
                      : s.status === "CANCELLED" ?
                        "Inactivo"
                      : s.status === "EXPIRING_SOON" ?
                        "Por vencer"
                      : "Vencido"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleDeleteService(s.id)}
                      className="text-red-500 hover:text-red-700 text-sm font-medium flex items-center gap-1"
                      title="Eliminar">
                      <Trash2 size={16} /> Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {services.length === 0 && (
            <div className="py-12 text-center">
              <div className="flex justify-center mb-2 opacity-20">
                <Tag size={36} />
              </div>
              <p className="text-sm text-zinc-500">
                No hay servicios asignados a este cliente.
              </p>
            </div>
          )}
        </div>
      }
    </Card>
  );
};
