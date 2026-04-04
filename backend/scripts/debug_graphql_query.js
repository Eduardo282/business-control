import "dotenv/config";
import fetch from "node-fetch";

const API_URL = "http://127.0.0.1:4000/graphql";

// Login as the user presumably used in the screenshot (anita aquino).
// Since I don't have her password, I'll use a known demo user 'ventas@businesscontrol.com'.
// If 'anita' is 'admin', I might need admin creds. Let's try 'ventas' first as they have access.
// If 'ventas' works, then 'anita' should work if she has the role.

async function run() {
  // 1. Login
  const loginQuery = `
    mutation {
      login(input: { email: "ventas@businesscontrol.com", password: "Password123*" }) {
        token
      }
    }
  `;

  try {
    const loginRes = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: loginQuery }),
    });
    const loginData = await loginRes.json();

    if (loginData.errors) {
      console.error("Login Error:", JSON.stringify(loginData.errors, null, 2));
      return;
    }

    const token = loginData.data.login.token;
    console.log("Got token");

    // 2. Query unread quotes
    const notifQuery = `
      query {
        unreadQuoteRequests {
          id
          contact_id
          contact {
            full_name
          }
          client {
            business_name
          }
        }
      }
    `;

    const queryRes = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ query: notifQuery }),
    });

    const queryData = await queryRes.json();
    console.log("Query Result:", JSON.stringify(queryData, null, 2));
  } catch (e) {
    console.error("Request failed", e);
  }
}

run();
