export const PASSWORD_PATTERN =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{}|;:,.<>?/]).{8,}$/;

export const PASSWORD_REQUIREMENTS_MESSAGE =
  "La contraseña debe tener al menos 8 caracteres, incluir mayúsculas, minúsculas, números y caracteres especiales.";

export function isStrongPassword(password) {
  return PASSWORD_PATTERN.test(String(password || ""));
}
