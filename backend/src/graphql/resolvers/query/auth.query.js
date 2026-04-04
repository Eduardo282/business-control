import { meAction } from '../../actions/user_actions/me.action.js';

export const me = async (_parent, _args, ctx) => {
  if (!ctx.user) return null;
  return meAction(ctx.user.userId);
};
