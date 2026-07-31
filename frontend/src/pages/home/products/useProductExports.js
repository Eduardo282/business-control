import { useCallback } from "react";
import LogoImg from "../../../assets/logo.png";
import { notificationService } from "../../../services/notificationService";
import { exportRowsToExcel } from "../../../utils/excelExport";
import { buildProductsPdfTableData } from "./productHelpers";

export default function useProductExports(filteredProducts) {
  const handleExportPDF = useCallback(async () => {
    try {
      const [{ default: jsPDF }, autoTableModule] = await Promise.all([
        import("jspdf"),
        import("jspdf-autotable"),
      ]);
      const autoTable = autoTableModule.default || autoTableModule.autoTable;
      const doc = new jsPDF();

      // Page 1: Logo and Title
      doc.addImage(LogoImg, "PNG", 15, 12, 50, 38);

      doc.setFontSize(22);
      doc.setTextColor(26, 43, 76);
      doc.text("Catálogo de Productos", 15, 62);

      doc.setFontSize(12);
      doc.setTextColor(100, 100, 100);
      doc.text(
        `Fecha de exportación: ${new Date().toLocaleDateString()}`,
        15,
        72,
      );
      const pdfTableData = buildProductsPdfTableData(filteredProducts);
      doc.text(`Total de registros: ${filteredProducts.length}`, 15, 80);
      doc.text(`Total de productos: ${pdfTableData.totalProducts}`, 15, 88);

      // Page 2: Table
      doc.addPage();

      autoTable(doc, {
        startY: 15,
        head: pdfTableData.head,
        body: pdfTableData.body,
        theme: "grid",
        headStyles: { fillColor: [34, 119, 180] },
        styles: { fontSize: 9, cellPadding: 3 },
        columnStyles: {
          6: { cellWidth: 60 },
        },
      });

      doc.save("Productos_BusinessControl.pdf");
    } catch (e) {
      notificationService.error("Error", e.message || "No se pudo generar el PDF.");
    }
  }, [filteredProducts]);

  const handleExportExcel = useCallback(async () => {
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
