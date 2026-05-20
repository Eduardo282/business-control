import axios from "axios";
import { logger } from "./logger.js";
import { env } from "../config/env.js";

export const verifyEmailWithZeroBounce = async (email) => {
  // Usar la variable de entorno para la clave API, fallback a vacío
  const apiKey = env.ZERO_BOUNCE_API_KEY;

  if (!apiKey) {
    logger.warn(
      "La clave API de ZeroBounce no está configurada. Implementa ZEROBOUNCE_API_KEY en backend .env"
    );
    return { status: "unknown", sub_status: "no_api_key_configured" };
  }

  try {
    const response = await axios.get("https://api.zerobounce.net/v2/validate", {
      params: {
        api_key: apiKey,
        email: email,
        ip_address: "", // Opcional
      },
    });

    // ZeroBounce retorna { status: "valid" | "invalid" | ... }
    return response.data;
  } catch (error) {
    logger.error("Error de verificación de ZeroBounce:", error.message);
    throw new Error("Error al verificar el correo electrónico con ZeroBounce");
  }
};
