import axios from "axios";

const query = `
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
    const res = await axios.post("http://localhost:4000/graphql", { query });
    console.log("Success:", JSON.stringify(res.data, null, 2));
  } catch (error) {
    if (error.response) {
      console.log("Error Status:", error.response.status);
      console.log("Error Data:", JSON.stringify(error.response.data, null, 2));
    } else {
      console.error("Error:", error.message);
    }
  }
}

run();
