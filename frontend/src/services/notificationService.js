import Swal from "sweetalert2";

/**
 * Servicio centralizado para notificaciones y alertas en el frontend.
 * Abstrae SweetAlert2 proporcionando una API limpia y colores consistentes con la marca (Indigo).
 */
export const notificationService = {
  /**
   * Muestra una alerta de éxito.
   * @param {string} title
   * @param {string} [text]
   */
  success(title, text = "") {
    return Swal.fire({
      title,
      text,
      icon: "success",
      confirmButtonColor: "#4f46e5", // Indigo-600
    });
  },

  /**
   * Muestra una alerta de error.
   * @param {string} title
   * @param {string} [text]
   */
  error(title, text = "") {
    return Swal.fire({
      title,
      text,
      icon: "error",
      confirmButtonColor: "#4f46e5",
    });
  },

  /**
   * Muestra una alerta informativa.
   * @param {string} title
   * @param {string} [text]
   */
  info(title, text = "") {
    return Swal.fire({
      title,
      text,
      icon: "info",
      confirmButtonColor: "#4f46e5",
    });
  },

  /**
   * Muestra una alerta de advertencia.
   * @param {string} title
   * @param {string} [text]
   */
  warning(title, text = "") {
    return Swal.fire({
      title,
      text,
      icon: "warning",
      confirmButtonColor: "#4f46e5",
    });
  },

  passwordPrompt(options) {
    return Swal.fire({
      input: "password",
      showCancelButton: true,
      allowOutsideClick: false,
      allowEscapeKey: false,
      confirmButtonColor: "#162A42",
      cancelButtonColor: "#9ca3af",
      inputValidator: (value) => {
        if (!value) return "Please enter the master password.";
      },
      ...options,
    });
  },

  /**
   * Muestra un cuadro de confirmación (Modal).
   * @param {object} options
   * @param {string} options.title
   * @param {string} [options.text]
   * @param {string} [options.confirmButtonText]
   * @param {string} [options.cancelButtonText]
   * @param {string} [options.icon]
   * @returns {Promise<boolean>} Retorna true si el usuario confirma la acción.
   */
  async confirm({
    title,
    text = "",
    confirmButtonText = "Aceptar",
    cancelButtonText = "Cancelar",
    icon = "warning",
  }) {
    const result = await Swal.fire({
      title,
      text,
      icon,
      showCancelButton: true,
      confirmButtonColor: "#4f46e5", // Indigo-600
      cancelButtonColor: "#ef4444", // Red-500
      confirmButtonText,
      cancelButtonText,
    });
    return !!result.isConfirmed;
  },

  /**
   * Muestra una pequeña notificación flotante (Toast) autolimpiable.
   * @param {object} options
   * @param {string} options.title
   * @param {'success'|'error'|'warning'|'info'} [options.icon]
   * @param {'top'|'top-start'|'top-end'|'bottom'|'bottom-start'|'bottom-end'} [options.position]
   * @param {number} [options.timer]
   */
  toast({ title, icon = "success", position = "top-end", timer = 3000 }) {
    const Toast = Swal.mixin({
      toast: true,
      position,
      showConfirmButton: false,
      timer,
      timerProgressBar: true,
      didOpen: (toast) => {
        toast.addEventListener("mouseenter", Swal.stopTimer);
        toast.addEventListener("mouseleave", Swal.resumeTimer);
      },
    });
    return Toast.fire({
      icon,
      title,
    });
  },

  close() {
    Swal.close();
  },
};
