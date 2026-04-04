import axios from "axios";

const query = `
  query {
    quotes {
      id
      client { business_name }
      user { full_name }
    }
  }
`;

async function run() {
  const configs = [
    {
      name: "No Slash, No Auth",
      url: "http://localhost:4000/graphql",
      headers: {},
    },
    {
      name: "Slash, No Auth",
      url: "http://localhost:4000/graphql/",
      headers: {},
    },
    {
      name: "No Slash, With Auth",
      url: "http://localhost:4000/graphql",
      headers: { Authorization: "Bearer test" },
    },
    {
      name: "Slash, With Auth",
      url: "http://localhost:4000/graphql/",
      headers: { Authorization: "Bearer test" },
    },
  ];

  for (const config of configs) {
    try {
      console.log(`\n--- Testing: ${config.name} ---`);
      const res = await axios.post(
        config.url,
        { query },
        { headers: config.headers },
      );
      console.log(`Status: ${res.status}`);
      if (res.data.errors) {
        console.log(
          "GraphQL Errors:",
          res.data.errors.map((e) => e.message),
        );
      } else {
        console.log("Success (No errors)");
      }
    } catch (error) {
      if (error.response) {
        console.log(`HTTP Error: ${error.response.status}`);
        console.log(
          "Error Body:",
          JSON.stringify(error.response.data, null, 2),
        );
      } else {
        console.error("Network Error:", error.message);
      }
    }
  }
}

run();
