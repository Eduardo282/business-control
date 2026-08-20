import LogoImg from "../assets/logo.png";

export const PDF_TABLE_MARGIN = 14;

const PDF_TABLE_HEADER_Y = 32;
const PDF_TABLE_BOTTOM_MARGIN = 17;

function getColumnCount(head, body) {
  const firstHeadRow = Array.isArray(head) ? head[0] : null;
  const firstBodyRow = Array.isArray(body) ? body[0] : null;
  return Math.max(
    Array.isArray(firstHeadRow) ? firstHeadRow.length : 0,
    Array.isArray(firstBodyRow) ? firstBodyRow.length : 0,
  );
}

function formatPdfMetadata({ exportedAt, recordCount, summary }) {
  const parts = [
    `Exportado: ${exportedAt.toLocaleString("es-MX")}`,
    `Registros: ${recordCount}`,
  ];

  const summaryParts = Array.isArray(summary) ? summary : [summary];
  summaryParts.filter(Boolean).forEach((value) => parts.push(String(value)));

  return parts.join("  |  ");
}

export function drawPdfTableHeader(
  doc,
  {
    title,
    recordCount,
    summary,
    exportedAt = new Date(),
    logo = LogoImg,
    margin = PDF_TABLE_MARGIN,
  },
) {
  const pageWidth = doc.internal.pageSize.getWidth();

  if (logo) {
    doc.addImage(logo, "PNG", pageWidth - 47, 7, 33, 19);
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(26, 43, 76);
  doc.text(title, margin, 15, { maxWidth: pageWidth - margin - 53 });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(92, 103, 117);
  doc.text(
    formatPdfMetadata({ exportedAt, recordCount, summary }),
    margin,
    23,
    { maxWidth: pageWidth - margin - 53 },
  );
}

export function addPdfPageFooters(
  doc,
  { margin = PDF_TABLE_MARGIN } = {},
) {
  const pageCount = doc.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);
    doc.setDrawColor(218, 225, 233);
    doc.setLineWidth(0.2);
    doc.line(margin, pageHeight - 11, pageWidth - margin, pageHeight - 11);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(108, 117, 128);
    doc.text(`Página ${page} de ${pageCount}`, pageWidth - margin, pageHeight - 6, {
      align: "right",
    });
  }
}

export function buildPdfTableOptions({
  doc,
  title,
  head,
  body,
  recordCount = body.length,
  summary,
  columnStyles = {},
  exportedAt = new Date(),
  logo = LogoImg,
  horizontalPageBreak,
  horizontalPageBreakRepeat = 0,
  tableOptions = {},
}) {
  const {
    alternateRowStyles,
    columnStyles: tableColumnStyles,
    didDrawPage,
    headStyles,
    margin: tableMargin,
    styles,
    ...tableOverrides
  } = tableOptions;
  const margin =
    typeof tableMargin === "number"
      ? tableMargin
      : {
          top: PDF_TABLE_HEADER_Y,
          right: PDF_TABLE_MARGIN,
          bottom: PDF_TABLE_BOTTOM_MARGIN,
          left: PDF_TABLE_MARGIN,
          ...tableMargin,
        };
  const shouldBreakHorizontally =
    horizontalPageBreak ?? getColumnCount(head, body) > 8;

  return {
    startY: PDF_TABLE_HEADER_Y,
    head,
    body,
    theme: "grid",
    showHead: "everyPage",
    rowPageBreak: "avoid",
    ...tableOverrides,
    margin,
    headStyles: {
      fillColor: [34, 119, 180],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8,
      minCellHeight: 9,
      valign: "middle",
      ...headStyles,
    },
    styles: {
      font: "helvetica",
      fontSize: 8,
      textColor: [52, 61, 72],
      cellPadding: { top: 2.5, right: 2, bottom: 2.5, left: 2 },
      lineColor: [211, 219, 229],
      lineWidth: 0.15,
      overflow: "linebreak",
      valign: "middle",
      ...styles,
    },
    alternateRowStyles: {
      fillColor: [247, 249, 252],
      ...alternateRowStyles,
    },
    columnStyles: {
      ...columnStyles,
      ...tableColumnStyles,
    },
    ...(shouldBreakHorizontally
      ? {
          horizontalPageBreak: true,
          horizontalPageBreakRepeat,
          horizontalPageBreakBehaviour: "afterAllRows",
        }
      : {}),
    didDrawPage: (hookData) => {
      didDrawPage?.(hookData);
      drawPdfTableHeader(doc, {
        title,
        recordCount,
        summary,
        exportedAt,
        logo,
        margin: typeof margin === "number" ? margin : margin.left,
      });
    },
  };
}

export async function exportPdfTable({
  title,
  filename,
  head,
  body,
  recordCount = body.length,
  summary,
  columnStyles,
  logo = LogoImg,
  horizontalPageBreak,
  horizontalPageBreakRepeat,
  tableOptions,
  documentOptions,
}) {
  const [{ default: jsPDF }, autoTableModule] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);
  const autoTable =
    autoTableModule.default || autoTableModule.autoTable || autoTableModule;
  const doc = new jsPDF({
    orientation: "landscape",
    format: "a4",
    ...documentOptions,
  });
  const exportedAt = new Date();

  autoTable(
    doc,
    buildPdfTableOptions({
      doc,
      title,
      head,
      body,
      recordCount,
      summary,
      columnStyles,
      exportedAt,
      logo,
      horizontalPageBreak,
      horizontalPageBreakRepeat,
      tableOptions,
    }),
  );

  addPdfPageFooters(doc);
  doc.save(filename);

  return doc;
}
