import { loginAction } from "../../actions/user_actions/login.action.js";
import { registerUserAction } from "../../actions/user_actions/registerUser.action.js";
import { loginContactAction } from "../../actions/contact_actions/loginContact.action.js";

export const login = async (_parent, { input }) => {
  return loginAction(input);
};

export const loginContact = async (_parent, { email, password }) => {
  return loginContactAction({ email, password });
};

// Registro público para auto-registro desde /register
export const registerUser = async (_parent, { input }) => {
  return registerUserAction(input);
};
