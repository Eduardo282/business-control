import { useCallback } from "react";
import { notificationService } from "../../../services/notificationService";
import { exportRowsToExcel } from "../../../utils/excelExport";
import { exportPdfTable } from "../../../utils/pdfTableExport";
import { buildProductsPdfTableData } from "./productHelpers";

export default function useProductExports(filteredProducts) {
  const handleExportPDF = useCallback(async () => {
    if (!filteredProducts.length) {
      notificationService.warning("Sin datos", "No hay productos para exportar.");
      return;
    }

    try {
      const pdfTableData = buildProductsPdfTableData(filteredProducts);

      await exportPdfTable({
        title: "Catálogo de productos y servicios",
        filename: "Productos_BusinessControl.pdf",
        head: pdfTableData.head,
        body: pdfTableData.body,
        recordCount: filteredProducts.length,
        summary: `Productos: ${pdfTableData.totalProducts}`,
        columnStyles: {
          0: { cellWidth: 27, fontStyle: "bold", textColor: [24, 94, 145] },
          1: { cellWidth: 45, fontStyle: "bold" },
          2: { cellWidth: 36 },
          3: { cellWidth: 21, halign: "center" },
          4: { cellWidth: 29, halign: "right" },
          5: { cellWidth: 30, halign: "center" },
          6: { cellWidth: "auto" },
        },
      });
    } catch (e) {
      notificationService.error("Error", e.message || "No se pudo generar el PDF.");
    }
  }, [filteredProducts]);

  const handleExportExcel = useCallback(async () => {
    if (!filteredProducts.length) {
      notificationService.warning("Sin datos", "No hay productos para exportar.");
      return;
    }

    try {
      const data = filteredProducts.map((p) => ({
        Folio: p.folio || "",
        Producto: p.name || "",
        Categoría: p.category || "",
        Precio: parseFloat(p.current_price || 0),
        "Límite Usuarios": parseInt(p.users_count || 0, 10),
        Descripción: p.description || "",
      }));

      await exportRowsToExcel({
        rows: data,
        sheetName: "Productos",
        fileName: "Productos_BusinessControl.xlsx",
      });
    } catch (e) {
      notificationService.error("Error", e.message || "No se pudo generar el Excel.");
    }
  }, [filteredProducts]);

  return {
    handleExportExcel,
    handleExportPDF,
  };
}
