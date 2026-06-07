/* eslint-disable no-console */

export const logger = {
  error(message, error) {
    if (import.meta.env.DEV) {
      console.error(message, error);
    } else {
      // En producción deberías usar un servicio como Sentry, Datadog o LogRocket.
      // O al menos hacer un console.error normal para que quede registrado en los logs del navegador.
      console.error("[PROD ERROR]", message, error);
    }
  },
  warn(message, data) {
    if (import.meta.env.DEV) {
      console.warn(message, data);
    }
  },
  info(message, data) {
    if (import.meta.env.DEV) {
      console.info(message, data);
    }
  }
};