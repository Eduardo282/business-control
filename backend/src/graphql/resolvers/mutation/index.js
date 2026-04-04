import * as auth from "./auth.mutation.js";
import * as clients from "./clients.mutation.js";
import * as contacts from "./contacts.mutation.js";
import * as products from "./products.mutation.js";
import * as quotes from "./quotes.mutation.js";
import * as roles from "./roles.mutation.js";

export default {
  ...auth,
  ...clients,
  ...contacts,
  ...products,
  ...quotes,
  ...roles,
};
