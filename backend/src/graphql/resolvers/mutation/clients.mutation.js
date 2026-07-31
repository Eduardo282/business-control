import { requireRoles } from "../../../middlewares/role.middleware.js";
import { createClientAction } from "../../../modules/clients/clientActions.js";
import { bulkCreateClientsAction } from "../../../modules/clients/clientActions.js";
import { updateClientAction } from "../../../modules/clients/clientActions.js";
import { deleteClientAction } from "../../../modules/clients/clientActions.js";

export const createClient = async (_parent, { input }, ctx) => {
  requireRoles(ctx.user, ["ADMIN", "VENTAS"]);

  const created = await createClientAction({
    created_by_user_id: ctx.user.userId,
    ...input,
    has_client_portal_access: Boolean(input.has_client_portal_access),
    portal_password: input.portal_password,
  });

  return created;
};

export const bulkCreateClients = async (_parent, { inputs }, ctx) => {
  requireRoles(ctx.user, ["ADMIN", "VENTAS"]);
  return bulkCreateClientsAction(ctx.user.userId, inputs);
};

export const updateClient = async (_parent, { id, input }, ctx) => {
  requireRoles(ctx.user, ["ADMIN", "VENTAS"]);
  return updateClientAction(id, input);
};

export const deleteClient = async (_parent, { id }, ctx) => {
  requireRoles(ctx.user, ["ADMIN", "VENTAS"]);
  return deleteClientAction(id);
};
