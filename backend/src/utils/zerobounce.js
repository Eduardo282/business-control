import axios from "axios";
import { logger } from "./logger.js";
import { env } from "../config/env.js";

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const MAX_CACHE_ENTRIES = 500;
const validationCache = new Map();

function getCachedValidation(email) {
  const cached = validationCache.get(email);
  if (!cached) return null;
  if (cached.expiresAt <= Date.now()) {
    validationCache.delete(email);
    return null;
  }
  return cached.value;
}

function cacheValidation(email, value) {
  if (validationCache.size >= MAX_CACHE_ENTRIES) {
    const oldestKey = validationCache.keys().next().value;
    validationCache.delete(oldestKey);
  }
  validationCache.set(email, {
    value,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
}

export const verifyEmailWithZeroBounce = async (email) => {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const cached = getCachedValidation(normalizedEmail);
  if (cached) return cached;

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
        email: normalizedEmail,
        ip_address: "",
      },
      timeout: 5000,
    });

    // ZeroBounce retorna { status: "valid" | "invalid" | ... }
    if (["valid", "invalid", "do_not_mail"].includes(response.data?.status)) {
      cacheValidation(normalizedEmail, response.data);
    }
    return response.data;
  } catch (error) {
    logger.warn(`ZeroBounce validation failed (graceful skip): ${error.message}`);
    // Graceful degradation: if ZeroBounce is slow/down, allow the email through
    return { status: "unknown", sub_status: "api_error_graceful" };
  }
};
