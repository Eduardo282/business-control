export async function exportRowsToExcel({ rows, sheetName, fileName }) {
  const XLSX = await import("xlsx");
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, fileName);
}

export async function exportTemplateToExcel({
  columns,
  sheetName,
  fileName,
  widths = [],
}) {
  const XLSX = await import("xlsx");
  const ws = XLSX.utils.aoa_to_sheet([columns]);
  if (widths.length) {
    ws["!cols"] = widths.map((wch) => ({ wch }));
  }
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, fileName);
}
