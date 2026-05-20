import { createClient } from "../../../repositories/client.repository.js";

export async function createClientAction({
  created_by_user_id,
  business_name,
  rfc,
  email1,
  email2,
  celular,
  telefono,
  codigo_postal,
  ciudad,
}) {
  const data = {
    created_by_user_id,
    business_name,
    rfc: rfc || null,
    email1: email1 || null,
    email2: email2 || null,
    celular: celular || null,
    telefono: telefono || null,
    codigo_postal: codigo_postal || null,
    ciudad: ciudad || null,
  };

  const insertId = await createClient(data);

  return {
    id: insertId,
    business_name,
    rfc: rfc || null,
    email1: email1 || null,
    email2: email2 || null,
    celular: celular || null,
    telefono: telefono || null,
    codigo_postal: codigo_postal || null,
    ciudad: ciudad || null,
  };
}
