import { requireRoles } from "../../../middlewares/role.middleware.js";
import { notFound } from "../../../errors/appErrors.js";
import { listClientsAction } from "../../../modules/clients/clientActions.js";
import { getClientAction } from "../../../modules/clients/clientActions.js";
import { searchClientsAction } from "../../../modules/clients/clientActions.js";


export const clients = async (_parent, { limit, offset }, ctx) => {
  requireRoles(ctx.user, ["ADMIN", "VENTAS"]);
  return listClientsAction({ limit, offset });
};

export const client = async (_parent, { id }, ctx) => {
  // Restringido a Admin/Ventas. Los contactos acceden a los datos a través de 'meContact' o resolutores de contacto directos.
  requireRoles(ctx.user, ["ADMIN", "VENTAS"]);
  const found = await getClientAction(id);
  if (!found) throw notFound("Cliente no encontrado");
  return found;
};

export const searchClients = async (_parent, { q }, ctx) => {
  requireRoles(ctx.user, ["ADMIN", "VENTAS"]);
  if (!q?.trim()) return [];
  return searchClientsAction(q);
};
