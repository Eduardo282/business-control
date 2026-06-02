export const PASSWORD_PATTERN =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{}|;:,.<>?/]).{8,}$/;

export const PASSWORD_REQUIREMENTS_MESSAGE =
  "Password must be at least 8 characters and include uppercase, lowercase, numbers, and special characters.";

export function isStrongPassword(password) {
  return PASSWORD_PATTERN.test(String(password || ""));
}
