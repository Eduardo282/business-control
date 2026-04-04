import { axiosClient } from "./axiosClient";

export async function getRolesApi() {
  const query = `
    query {
      roles { id name }
    }
  `;

  const { data } = await axiosClient.post("", { query });
  if (data.errors?.length) throw new Error(data.errors[0].message);
  return data.data.roles;
}

export async function createRoleApi(name) {
  const query = `
    mutation CreateRole($name: String!) {
      createRole(name: $name) { id name }
    }
  `;

  const { data } = await axiosClient.post("", {
    query,
    variables: { name },
  });

  if (data.errors?.length) throw new Error(data.errors[0].message);
  return data.data.createRole;
}

export async function deleteRoleApi(id) {
  const query = `
    mutation DeleteRole($id: ID!) {
      deleteRole(id: $id)
    }
  `;

  const { data } = await axiosClient.post("", {
    query,
    variables: { id },
  });

  if (data.errors?.length) throw new Error(data.errors[0].message);
  return data.data.deleteRole;
}
