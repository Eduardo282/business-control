import Swal from "sweetalert2";
import {
  buildContactExportContext,
  downloadContactsTemplate,
  exportContactsToExcel,
  exportContactsToPdf,
} from "./contactExcel";

function warnNoExportRows() {
  return Swal.fire({
    title: "Sin datos",
    text: "No hay contactos para exportar.",
    icon: "info",
    showConfirmButton: false,
    timer: 2000,
    timerProgressBar: true,
  });
}

function showExportError(message) {
  return Swal.fire({
    title: "Error",
    text: message,
    icon: "error",
    showConfirmButton: false,
    timer: 2000,
    timerProgressBar: true,
  });
}

export function useContactExport({ contactColumnsFromView, contactsTable }) {
  const getContactExportContext = () =>
    buildContactExportContext(contactColumnsFromView, contactsTable);

  const handleExportContactsPDF = async () => {
    const context = getContactExportContext();

    if (!context.exportRows.length) {
      await warnNoExportRows();
      return;
    }

    try {
      await exportContactsToPdf(context);
    } catch (e) {
      await showExportError(e.message || "No se pudo generar el PDF.");
    }
  };

  const handleExportContactsExcel = async () => {
    const context = getContactExportContext();

    if (!context.exportRows.length) {
      await warnNoExportRows();
      return;
    }

    try {
      await exportContactsToExcel(context);
    } catch (e) {
      await showExportError(e.message || "No se pudo generar el Excel.");
    }
  };

  const handleDownloadContactsTemplate = async () => {
    try {
      await downloadContactsTemplate();
    } catch (e) {
      await showExportError(
        e.message || "No se pudo generar la plantilla de Excel.",
      );
    }
  };

  return {
    handleExportContactsPDF,
    handleExportContactsExcel,
    handleDownloadContactsTemplate,
  };
}
