import "dotenv/config";
import { pool } from "../src/config/db.js";
import { listContactProductsAction } from "../src/graphql/actions/contact_actions/listContactProducts.action.js";

async function debugList() {
  try {
    const contactId = 9;
    console.log("Listando polizas para contacto:", contactId);
    const list = await listContactProductsAction(contactId);
    console.log("Resultado:", list);
  } catch (e) {
    console.error(e);
  }
  process.exit();
}
debugList();
