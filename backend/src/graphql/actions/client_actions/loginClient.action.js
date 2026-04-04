import { pool } from "../../../config/db.js";
import { comparePassword } from "../../../utils/password.js";
import { signToken } from "../../../utils/jwt.js";

export async function loginClientAction({ rfc, password }) {
  throw new Error(
    "El acceso al portal por Cliente ha sido eliminado. Por favor utilice el acceso por Contacto.",
  );
}
