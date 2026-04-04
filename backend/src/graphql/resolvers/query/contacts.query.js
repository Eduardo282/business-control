import { requireRoles } from "../../../middlewares/role.middleware.js";
import { listContactsByClientAction } from "../../actions/contact_actions/listContactsByClient.action.js";
import { getContactAction } from "../../actions/contact_actions/getContact.action.js";

export const contactsByClient = async (_parent, { client_id }, ctx) => {
  requireRoles(ctx.user, ["ADMIN", "VENTAS"]);
  return listContactsByClientAction(client_id);
};

export const contact = async (_parent, { id }, ctx) => {
  const user = ctx.user;
  if (!user) throw new Error("Unauthenticated");

  // Admin/Sales pueden ver cualquier contacto
  // Verificar coincidencia de cadena (si el rol es una cadena) o coincidencia de objeto.nombre
  const roleName = typeof user.role === "string" ? user.role : user.role?.name;

  if (roleName === "ADMIN" || roleName === "VENTAS") {
    return getContactAction(id);
  }

  // Los usuarios del portal solo pueden verse a sí mismos
  if (user.role === "CONTACT_PORTAL") {
    if (String(user.contactId) !== String(id)) {
      throw new Error("Unauthorized");
    }
    return getContactAction(id);
  }

  throw new Error("Unauthorized");
};
