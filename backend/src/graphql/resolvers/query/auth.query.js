import { meAction } from "../../../modules/users/userActions.js";

export const me = async (_parent, _args, ctx) => {
  if (!ctx.user) return null;
  return meAction(ctx.user.userId);
};
