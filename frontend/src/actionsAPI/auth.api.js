import { gql } from "../utils/graphqlClient";

export async function loginApi(email, password) {
  const query = `
    mutation Login($input: LoginInput!) {
      login(input: $input) {
        token
        user { id full_name email role { id name } }
      }
    }
  `;

  const data = await gql(query, { input: { email, password } });
  return data.login;
}

export async function meApi() {
  const query = `
  query { me { id full_name email role { id name } } }
  `;
  const data = await gql(query);
  return data.me;
}

export async function verifyMasterPasswordApi(password) {
  const query = `
    mutation VerifyMasterPassword($password: String!) {
      verifyMasterPassword(password: $password)
    }
  `;
  const data = await gql(query, { password });
  return data.verifyMasterPassword;
}

export async function registerUserApi(
  full_name,
  email,
  telefono,
  password,
  role_name,
) {
  const query = `
    mutation RegisterUser($input: RegisterUserInput!) {
      registerUser(input: $input) {
        id full_name email role { id name }
      }
    }
  `;

  const data = await gql(query, {
    input: { full_name, email, telefono, password, role_name },
  });
  return data.registerUser;
}
