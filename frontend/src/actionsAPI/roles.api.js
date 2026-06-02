import { gql } from "../utils/graphqlClient";

export async function getRolesApi() {
  const query = `
    query {
      roles { id name }
    }
  `;

  const data = await gql(query);
  return data.roles;
}

export async function createRoleApi(name) {
  const query = `
    mutation CreateRole($name: String!) {
      createRole(name: $name) { id name }
    }
  `;

  const data = await gql(query, { name });
  return data.createRole;
}

export async function deleteRoleApi(id) {
  const query = `
    mutation DeleteRole($id: ID!) {
      deleteRole(id: $id)
    }
  `;

  const data = await gql(query, { id });
  return data.deleteRole;
}
