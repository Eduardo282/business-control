import { useRef, useState } from "react";
import { flushSync } from "react-dom";
import Swal from "sweetalert2";
import {
  bulkCreateContactsApi,
  importContactsFromDriveApi,
} from "../../../actionsAPI/contacts.api";
import { parseContactWorkbook } from "./contactExcel";

const BULK_CONTACT_CHUNK_SIZE = 200;

export function useContactBulkImport({
  clientId,
  onImported,
  onDriveMapping,
  contactsExcelViewStorageKey,
}) {
  const [showBulkContactModal, setShowBulkContactModal] = useState(false);
  const [bulkContactData, setBulkContactData] = useState([]);
  const [bulkContactErrors, setBulkContactErrors] = useState([]);
  const [bulkContactUploading, setBulkContactUploading] = useState(false);
  const [bulkContactDriveImporting, setBulkContactDriveImporting] =
    useState(false);
  const [bulkContactDriveUrl, setBulkContactDriveUrl] = useState("");
  const [bulkContactResult, setBulkContactResult] = useState(null);
  const bulkContactFileRef = useRef(null);

  const fireBulkContactModalAlert = (options) =>
    Swal.fire({
      ...options,
      didOpen: () => {
        const container = Swal.getContainer();
        if (container) {
          container.style.zIndex = "11000";
        }

        if (typeof options.didOpen === "function") {
          options.didOpen();
        }
      },
    });

  const resetBulkContactModal = () => {
    setBulkContactData([]);
    setBulkContactErrors([]);
    setBulkContactResult(null);
    setBulkContactDriveUrl("");
  };

  const openBulkContactModal = () => {
    resetBulkContactModal();
    setShowBulkContactModal(true);
  };

  const handleBulkContactFile = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setBulkContactResult(null);
    setBulkContactErrors([]);

    const reader = new FileReader();
    reader.onload = async (readerEvent) => {
      try {
        const result = await parseContactWorkbook(readerEvent.target.result);
        setBulkContactData(result.contacts);
        setBulkContactErrors(result.errors);
      } catch {
        setBulkContactData([]);
        setBulkContactErrors([
          "No se pudo leer el archivo. Verifica que sea un Excel válido (.xlsx / .xls).",
        ]);
      }
    };
    reader.readAsArrayBuffer(file);
    event.target.value = "";
  };

  const executeBulkContactUpload = async () => {
    setBulkContactUploading(true);
    setBulkContactResult(null);
    try {
      const inputs = bulkContactData.map(({ _row, ...rest }) => ({
        client_id: clientId,
        full_name: rest.full_name,
        email: rest.email || null,
        phone: rest.phone || null,
        position_title: rest.position_title || null,
      }));

      let totalCreated = 0;
      for (let i = 0; i < inputs.length; i += BULK_CONTACT_CHUNK_SIZE) {
        const chunk = inputs.slice(i, i + BULK_CONTACT_CHUNK_SIZE);
        const created = await bulkCreateContactsApi(chunk);
        totalCreated += created.length;
      }

      setBulkContactResult({ success: true, count: totalCreated });
      flushSync(() => {
        setShowBulkContactModal(false);
      });
      await fireBulkContactModalAlert({
        title: "Importacion completada",
        text: `Se importaron ${totalCreated} contactos exitosamente.`,
        icon: "success",
        confirmButtonColor: "#2277B4",
        timer: 2200,
        timerProgressBar: true,
        showConfirmButton: false,
        allowOutsideClick: false,
      });
      setBulkContactData([]);
      await onImported?.();
    } catch (err) {
      setBulkContactResult({
        success: false,
        message: err.message || "Error en la carga masiva.",
      });
      fireBulkContactModalAlert({
        title: "Error",
        text: err.message || "Error en la carga masiva.",
        icon: "error",
        confirmButtonColor: "#d33",
      });
    } finally {
      setBulkContactUploading(false);
    }
  };

  const executeBulkContactDriveImport = async () => {
    const fileUrl = bulkContactDriveUrl.trim();
    if (!fileUrl) {
      setBulkContactResult({
        success: false,
        message: "Debes ingresar la URL del archivo en Google Drive.",
      });
      fireBulkContactModalAlert({
        title: "Falta la URL",
        text: "Debes ingresar la URL del archivo en Google Drive.",
        icon: "warning",
        confirmButtonColor: "#2277B4",
      });
      return;
    }

    setBulkContactDriveImporting(true);
    setBulkContactResult(null);
    try {
      const report = await importContactsFromDriveApi({
        fileUrl,
        clientId,
      });

      const mappedHeadersByColumn = report.mappedHeadersByColumn || {};
      const mappedColumnNames = Object.keys(mappedHeadersByColumn);
      if (mappedColumnNames.length) {
        onDriveMapping?.({
          columnLabelOverrides: mappedHeadersByColumn,
          excelViewColumns: mappedColumnNames,
        });
        localStorage.setItem(
          contactsExcelViewStorageKey,
          JSON.stringify({
            columnLabelOverrides: mappedHeadersByColumn,
            excelViewColumns: mappedColumnNames,
          }),
        );
      }

      setBulkContactResult({
        success: true,
        count: report.importedCount,
        skippedCount: report.skippedCount,
        details: report,
      });
      flushSync(() => {
        setShowBulkContactModal(false);
      });
      await fireBulkContactModalAlert({
        title: "Importacion completada",
        text:
          report.skippedCount > 0 ?
            `Se importaron ${report.importedCount} contactos. Se omitieron ${report.skippedCount} filas.`
          : `Se importaron ${report.importedCount} contactos exitosamente.`,
        icon: "success",
        confirmButtonColor: "#2277B4",
        timer: 2200,
        timerProgressBar: true,
        showConfirmButton: false,
        allowOutsideClick: false,
      });
      await onImported?.();
    } catch (err) {
      setBulkContactResult({
        success: false,
        message: err.message || "Error importando archivo desde Drive.",
      });
      fireBulkContactModalAlert({
        title: "Error",
        text: err.message || "Error importando archivo desde Drive.",
        icon: "error",
        confirmButtonColor: "#d33",
      });
    } finally {
      setBulkContactDriveImporting(false);
    }
  };

  return {
    showBulkContactModal,
    setShowBulkContactModal,
    bulkContactData,
    bulkContactErrors,
    bulkContactUploading,
    bulkContactDriveImporting,
    bulkContactDriveUrl,
    setBulkContactDriveUrl,
    bulkContactResult,
    bulkContactFileRef,
    openBulkContactModal,
    handleBulkContactFile,
    executeBulkContactUpload,
    executeBulkContactDriveImport,
  };
}
