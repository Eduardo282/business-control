import { requireRoles } from "../../../middlewares/role.middleware.js";
import { createClientAction } from "../../actions/client_actions/createClient.action.js";
import { bulkCreateClientsAction } from "../../actions/client_actions/bulkCreateClients.action.js";
import { updateClientAction } from "../../actions/client_actions/updateClient.action.js";
import { deleteClientAction } from "../../actions/client_actions/deleteClient.action.js";

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
