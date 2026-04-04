import * as auth from "./auth.query.js";
import * as roles from "./roles.query.js";
import * as clients from "./clients.query.js";
import * as contacts from "./contacts.query.js";
import * as products from "./products.query.js";
import * as quotes from "./quotes.query.js";
import * as policies from "./policies.query.js";

export default {
  ...auth,
  ...roles,
  ...clients,
  ...contacts,
  ...products,
  ...quotes,
  ...policies,
};
