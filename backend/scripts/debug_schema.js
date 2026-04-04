import "dotenv/config";
import fetch from "node-fetch";

const API_URL = "http://127.0.0.1:4000/graphql";

async function run() {
  const query = `
    query {
      __type(name: "Query") {
        fields {
          name
        }
      }
    }
  `;

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });

    const data = await res.json();
    const fields = data.data.__type.fields.map((f) => f.name);

    if (fields.includes("unreadQuoteRequests")) {
      console.log("SUCCESS: unreadQuoteRequests is in the schema.");
    } else {
      console.log("FAILURE: unreadQuoteRequests is NOT in the schema.");
      console.log("Available fields:", fields);
    }
  } catch (e) {
    console.error("Request failed", e);
  }
}

run();
