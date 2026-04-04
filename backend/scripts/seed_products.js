import "dotenv/config";
import { pool } from "../src/config/db.js";

async function seedProducts() {
  console.log("Sembrando productos de demostración...");

  const products = [
    {
      name: "Licencia Anual ERP",
      category: "Licencias",
      price: 12000.0,
      description:
        "Acceso completo al sistema ERP por 1 año. Incluye soporte estándar.",
      users_count: 5,
    },
    {
      name: "Póliza de Soporte Premium",
      category: "Servicios",
      price: 5000.0,
      description: "Soporte 24/7 y tiempo de respuesta < 2 horas.",
      users_count: 0,
    },
    {
      name: "Módulo de Facturación",
      category: "Add-ons",
      price: 3500.0,
      description: "Timbrado ilimitado.",
      users_count: 0,
    },
    {
      name: "Instalación en Sitio",
      category: "Servicios",
      price: 2500.0,
      description: "Visita técnica para configuración de servidores.",
      users_count: 0,
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
          "INSERT INTO products (name, category, current_price, description, users_count) VALUES (?, ?, ?, ?, ?)",
          [p.name, p.category, p.price, p.description, p.users_count]
        );
      } else {
        console.log(`Saltando ${p.name} (ya existe)`);
      }
    }
    console.log("Siembra completada.");
    process.exit(0);
  } catch (err) {
    console.error("Siembra fallida:", err);
    process.exit(1);
  }
}

seedProducts();
