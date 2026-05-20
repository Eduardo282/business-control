import { updateClient, findClientById } from "../../../repositories/client.repository.js";

export async function updateClientAction(
  id,
  {
    business_name,
    rfc,
    email1,
    email2,
    celular,
    telefono,
    codigo_postal,
    ciudad,
  },
) {
  const data = {};

  if (business_name !== undefined) data.business_name = business_name;
  if (rfc !== undefined) data.rfc = rfc;
  if (email1 !== undefined) data.email1 = email1;
  if (email2 !== undefined) data.email2 = email2;
  if (celular !== undefined) data.celular = celular;
  if (telefono !== undefined) data.telefono = telefono;
  if (codigo_postal !== undefined) data.codigo_postal = codigo_postal;
  if (ciudad !== undefined) data.ciudad = ciudad;

  if (Object.keys(data).length > 0) {
    await updateClient(id, data);
  }

  return findClientById(id);
}
