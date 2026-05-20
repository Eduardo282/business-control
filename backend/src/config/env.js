export const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: Number(process.env.PORT || 4000),
  JWT_SECRET: process.env.JWT_SECRET || "change-me",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",
  MYSQL_HOST: process.env.MYSQL_HOST || "localhost",
  MYSQL_PORT: Number(process.env.MYSQL_PORT || 3306),
  MYSQL_USER: process.env.MYSQL_USER || "root",
  MYSQL_PASSWORD: process.env.MYSQL_PASSWORD || "",
  MYSQL_DATABASE: process.env.MYSQL_DATABASE || "business_control",
  CORS_ORIGIN: process.env.CORS_ORIGIN || "http://localhost:5173",
  ZERO_BOUNCE_API_KEY: process.env.ZERO_BOUNCE_API_KEY || process.env.ZEROBOUNCE_API_KEY || "",
  LOG_LEVEL: process.env.LOG_LEVEL || "info",
  SMTP_HOST: process.env.SMTP_HOST || "smtp.gmail.com",
  SMTP_PORT: Number(process.env.SMTP_PORT || 465),
  SMTP_USER: process.env.SMTP_USER || "",
  SMTP_PASS: process.env.SMTP_PASS || "",
  MASTER_PASSWORD: process.env.MASTER_PASSWORD || "",
};

export function validateEnv() {
  const errors = [];
  const isProduction = env.NODE_ENV === "production";

  if (!Number.isFinite(env.PORT)) {
    errors.push("PORT must be a number");
  }

  if (!env.MYSQL_HOST) {
    errors.push("MYSQL_HOST is required");
  }

  if (!env.MYSQL_USER) {
    errors.push("MYSQL_USER is required");
  }

  if (!env.MYSQL_DATABASE) {
    errors.push("MYSQL_DATABASE is required");
  }

  if (isProduction) {
    if (!env.JWT_SECRET || env.JWT_SECRET === "change-me") {
      errors.push("JWT_SECRET must be set to a secure key in production");
    }
    if (!env.MASTER_PASSWORD) {
      errors.push("MASTER_PASSWORD must be defined in production");
    }
    if (!env.ZERO_BOUNCE_API_KEY) {
      errors.push("ZERO_BOUNCE_API_KEY (or ZEROBOUNCE_API_KEY) must be defined in production");
    }
    if (!env.SMTP_USER || !env.SMTP_PASS) {
      errors.push("SMTP credentials (SMTP_USER/SMTP_PASS) are required in production");
    }
  }

  if (errors.length) {
    const message = `Invalid environment configuration:\n- ${errors.join("\n- ")}`;
    throw new Error(message);
  }
}

