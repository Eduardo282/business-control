import { useCallback } from "react";

import {
  exportRowsToExcel,
  exportTemplateToExcel,
} from "../../../utils/excelExport";
import { exportPdfTable } from "../../../utils/pdfTableExport";
import { notificationService } from "../../../services/notificationService";
import { CLIENT_TEMPLATE_COLUMNS } from "./clientConstants";
import { hasValue } from "./clientTableHelpers";

export default function useClientExports(getExportContext) {
  const exportPdf = useCallback(async () => {
    const { exportColumns, exportRows } = getExportContext();

    if (!exportRows.length) {
      notificationService.info("Sin datos", "No hay clientes para exportar.");
      return;
    }

    try {
      await exportPdfTable({
        title: "Clientes",
        filename: `Clientes_${new Date().toISOString().slice(0, 10)}.pdf`,
        head: [exportColumns.map((column) => column.label.toUpperCase())],
        body: exportRows.map((row) =>
          exportColumns.map((column) => {
            const rawValue = row?.[column.name];
            return hasValue(rawValue) ? String(rawValue) : "—";
          }),
        ),
        recordCount: exportRows.length,
      });
    } catch (error) {
      notificationService.error(
        "Error",
        error.message || "No se pudo generar el PDF.",
      );
    }
  }, [getExportContext]);

  const exportExcel = useCallback(async () => {
    const { exportColumns, exportRows } = getExportContext();

    if (!exportRows.length) {
      notificationService.info("Sin datos", "No hay clientes para exportar.");
      return;
    }

    try {
      const rows = exportRows.map((row) => {
        const nextRow = {};

        exportColumns.forEach((column) => {
          const rawValue = row?.[column.name];
          nextRow[column.label] = hasValue(rawValue) ? rawValue : "";
        });

        return nextRow;
      });

      await exportRowsToExcel({
        rows,
        sheetName: "Clientes",
        fileName: `Clientes_${new Date().toISOString().slice(0, 10)}.xlsx`,
      });
    } catch (error) {
      notificationService.error(
        "Error",
        error.message || "No se pudo generar el Excel.",
      );
    }
  }, [getExportContext]);

  const downloadTemplate = useCallback(async () => {
    try {
      const { exportColumns } = getExportContext();
      const columnLabels = exportColumns.map((col) => col.label);

      await exportTemplateToExcel({
        columns: columnLabels,
        sheetName: "Plantilla Clientes",
        fileName: "Plantilla_Clientes.xlsx",
        widths: columnLabels.map(() => 20),
      });
    } catch (error) {
      notificationService.error(
        "Error",
        error.message || "No se pudo generar la plantilla de Excel.",
      );
    }
  }, [getExportContext]);

  return {
    downloadTemplate,
    exportExcel,
    exportPdf,
  };
}
