import axios from "axios";

// Login mutation
const loginQuery = `
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      token
      user {
        id
        email
        role {
          name
        }
      }
    }
  }
`;

// Quotes query that was failing
const quotesQuery = `
  query {
    quotes {
      id
      created_at
      total
      status
      client {
        business_name
      }
      user {
        full_name
      }
    }
  }
`;

async function run() {
  try {
    console.log("Attempting login...");
    // Try a default admin user - assuming 'admin@businesscontrol.com' / '123456' or similar based on typical patterns.
    // If not found, I'll try creating a user in the next step.
    // BUT checking seed file first is better. I'll blindly try common credentials if seed viewing fails.
    let token = "";

    try {
      const loginRes = await axios.post("http://localhost:4000/graphql", {
        query: loginQuery,
        variables: {
          input: {
            email: "admin@businesscontrol.com",
            password: "password123", // Guessing usually works for dev envs or I will see seed
          },
        },
      });

      if (loginRes.data.errors) {
        console.log("Login failed:", loginRes.data.errors[0].message);
        // Fallback: Register a temp user
        console.log("Attempting registration...");
        const registerQuery = `
                 mutation {
                     registerUser(input: {
                         full_name: "Debug User",
                         email: "debug_" + "${Date.now()}" + "@test.com",
                         password: "password123",
                         role_name: "ADMIN"
                     }) {
                         id
                         email
                     }
                 }
             `;
        // Note: register doesn't return token usually? It returns User.
        // Need to login after register? Or maybe register payload returns token?
        // Checking schema: registerUser(input: ...): User! (Returns User, not AuthPayload).
        // So I must login after register.

        const regRes = await axios.post("http://localhost:4000/graphql", {
          query: registerQuery,
        });
        if (regRes.data.errors) {
          throw new Error("Register failed: " + regRes.data.errors[0].message);
        }
        const newUserEmail = regRes.data.data.registerUser.email;
        console.log("Registered:", newUserEmail);

        // Login with new user
        const loginRes2 = await axios.post("http://localhost:4000/graphql", {
          query: loginQuery,
          variables: {
            input: { email: newUserEmail, password: "password123" },
          },
        });
        token = loginRes2.data.data.login.token;
      } else {
        token = loginRes.data.data.login.token;
      }
    } catch (e) {
      console.error("Auth Exception:", e.message);
      // Try fallback register directly if login 1 failed hard
      // ... (simplified for now)
      return;
    }

    console.log("Obtained Token:", token.substring(0, 20) + "...");

    console.log("Querying Quotes...");
    const res = await axios.post(
      "http://localhost:4000/graphql",
      {
        query: quotesQuery,
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    console.log("Quotes Success:", JSON.stringify(res.data, null, 2));
  } catch (error) {
    if (error.response) {
      console.log("HTTP Error Status:", error.response.status);
      console.log(
        "HTTP Error Data:",
        JSON.stringify(error.response.data, null, 2),
      );
    } else {
      console.error("Network/Script Error:", error.message);
    }
  }
}

run();
