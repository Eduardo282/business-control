import "dotenv/config";
import { pool } from "../src/config/db.js";

async function seedContpaqiProducts() {
  console.log("Sembrando catálogo CONTPAQi...");

  const products = [
    // Contabilidad y Finanzas
    {
      name: "CONTPAQi Contabilidad (Desktop)",
      category: "Contabilidad y Finanzas",
      price: 4590.0,
      users_count: 1,
    },
    {
      name: "CONTPAQi Contabiliza (Nube)",
      category: "Contabilidad y Finanzas",
      price: 3890.0,
      users_count: 1,
    },
    {
      name: "CONTPAQi Bancos (Desktop)",
      category: "Contabilidad y Finanzas",
      price: 3590.0,
      users_count: 1,
    },
    {
      name: "CONTPAQi Analiza (Nube)",
      category: "Contabilidad y Finanzas",
      price: 2990.0,
      users_count: 1,
    },

    // Nóminas y Recursos Humanos
    {
      name: "CONTPAQi Nóminas (Desktop)",
      category: "Nóminas y Recursos Humanos",
      price: 4890.0,
      users_count: 1,
    },
    {
      name: "CONTPAQi Personia (Nube)",
      category: "Nóminas y Recursos Humanos",
      price: 3290.0,
      users_count: 1,
    },
    {
      name: "CONTPAQi Evalúa 035",
      category: "Nóminas y Recursos Humanos",
      price: 2500.0,
      users_count: 1,
    },
    {
      name: "CONTPAQi Colabora",
      category: "Nóminas y Recursos Humanos",
      price: 1500.0,
      users_count: 1,
    },

    // Comercial y Ventas
    {
      name: "CONTPAQi Comercial (Start, Pro y Premium)",
      category: "Comercial y Ventas",
      price: 5290.0,
      users_count: 1,
    },
    {
      name: "CONTPAQi Factura Electrónica",
      category: "Comercial y Ventas",
      price: 2890.0,
      users_count: 1,
    },
    {
      name: "CONTPAQi Vende (Nube)",
      category: "Comercial y Ventas",
      price: 2190.0,
      users_count: 1,
    },
    {
      name: "CONTPAQi Cobra",
      category: "Comercial y Ventas",
      price: 1890.0,
      users_count: 1,
    },

    // Herramientas de Productividad y Nube
    {
      name: "CONTPAQi XML en Línea+",
      category: "Herramientas de Productividad y Nube",
      price: 1990.0,
      users_count: 1,
    },
    {
      name: "CONTPAQi Escritorio Virtual",
      category: "Herramientas de Productividad y Nube",
      price: 890.0,
      users_count: 1,
    },
    {
      name: "CONTPAQi Respaldos",
      category: "Herramientas de Productividad y Nube",
      price: 1290.0,
      users_count: 1,
    },
  ];

  try {
    for (const p of products) {
      // Verificar si existe
      const [existing] = await pool.query(
        "SELECT id FROM products WHERE name = ?",
        [p.name]
      );
      if (existing.length === 0) {
        console.log(`Creando ${p.name}...`);
        await pool.query(
          "INSERT INTO products (name, category, current_price, description, users_count, client_id) VALUES (?, ?, ?, ?, ?, NULL)",
          [
            p.name,
            p.category,
            p.price,
            "Licencia oficial CONTPAQi",
            p.users_count,
          ]
        );
      } else {
        console.log(`Actualizando ${p.name}...`);
        // Asegurar que sea una plantilla (client_id NULL) y actualizar categoría para agrupación
        await pool.query(
          "UPDATE products SET category = ?, current_price = ?, client_id = NULL WHERE name = ?",
          [p.category, p.price, p.name]
        );
      }
    }
    console.log("Siembra completada.");
    process.exit(0);
  } catch (err) {
    console.error("Siembra fallida:", err);
    process.exit(1);
  }
}

seedContpaqiProducts();
