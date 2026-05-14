import { axiosClient } from "./axiosClient";

export async function loginApi(email, password) {
  const query = `
    mutation Login($input: LoginInput!) {
      login(input: $input) {
        token
        user { id full_name email role { id name } }
      }
    }
  `;

  const { data } = await axiosClient.post("", {
    query,
    variables: { input: { email, password } },
  });

  if (data.errors?.length) throw new Error(data.errors[0].message);
  return data.data.login;
}

export async function meApi() {
  const query = `
  query { me { id full_name email role { id name } } }
  `;
  const { data } = await axiosClient.post("", { query });
  if (data.errors?.length) throw new Error(data.errors[0].message);
  return data.data.me;
}

export async function verifyMasterPasswordApi(password) {
  const query = `
    mutation VerifyMasterPassword($password: String!) {
      verifyMasterPassword(password: $password)
    }
  `;
  const { data } = await axiosClient.post("", {
    query,
    variables: { password },
  });
  if (data.errors?.length) throw new Error(data.errors[0].message);
  return data.data.verifyMasterPassword;
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

  const { data } = await axiosClient.post("", {
    query,
    variables: { input: { full_name, email, telefono, password, role_name } },
  });

  if (data.errors?.length) throw new Error(data.errors[0].message);
  return data.data.registerUser;
}
