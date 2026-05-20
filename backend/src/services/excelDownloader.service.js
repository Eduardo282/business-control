/**
 * ExcelDownloader — Responsabilidad Única: descargar archivos Excel desde URLs (Google Drive, Sheets, etc).
 * No sabe nada de base de datos, mapeo de columnas ni importación.
 */
import axios from "axios";

/**
 * Extrae el ID de archivo de una URL de Google Drive.
 * @param {string} fileUrl
 * @returns {string|null}
 */
export function parseDriveFileId(fileUrl) {
  const patterns = [/\/file\/d\/([^/]+)/i, /[?&]id=([^&]+)/i, /\/d\/([^/]+)/i];

  for (const pattern of patterns) {
    const match = String(fileUrl).match(pattern);
    if (match?.[1]) return match[1];
  }

  return null;
}

/**
 * Construye las URLs candidatas de descarga para un archivo de Drive/Sheets.
 * @param {string} fileUrl — URL original del archivo
 * @returns {string[]} URLs candidatas para intentar la descarga
 */
export function buildDriveDownloadUrls(fileUrl) {
  const url = String(fileUrl || "").trim();
  if (!url) return [];

  const urls = [];
  if (/^https?:\/\//i.test(url)) urls.push(url);

  const isGoogleSheetUrl = /docs\.google\.com\/spreadsheets\//i.test(url);
  if (isGoogleSheetUrl) {
    const fileId = parseDriveFileId(url);
    if (fileId) {
      urls.unshift(
        `https://docs.google.com/spreadsheets/d/${fileId}/export?format=xlsx`,
      );
      urls.unshift(
        `https://docs.google.com/spreadsheets/d/${fileId}/export?format=xlsx&gid=0`,
      );
    }
  }

  if (url.includes("drive.google.com")) {
    const fileId = parseDriveFileId(url);
    if (fileId) {
      urls.unshift(`https://drive.google.com/uc?export=download&id=${fileId}`);
      urls.push(`https://drive.google.com/uc?id=${fileId}&export=download`);
    }
  }

  return [...new Set(urls)];
}

/**
 * Descarga un archivo Excel desde una URL remota y retorna su Buffer.
 * @param {string} fileUrl — URL del archivo (Google Drive, Sheets u otra)
 * @returns {Promise<Buffer>}
 * @throws {Error} Si no se puede descargar el archivo
 */
export async function downloadExcelBuffer(fileUrl) {
  const candidates = buildDriveDownloadUrls(fileUrl);
  if (!candidates.length) {
    throw new Error(
      "URL de archivo inválida. Usa una URL http(s) de Google Drive.",
    );
  }

  let lastStatus = null;
  for (const candidate of candidates) {
    try {
      const response = await axios.get(candidate, {
        responseType: "arraybuffer",
        timeout: 45000,
        maxRedirects: 5,
        validateStatus: () => true,
      });

      lastStatus = response.status;
      if (response.status >= 200 && response.status < 300) {
        return Buffer.from(response.data);
      }
    } catch {
      // Try next candidate URL.
    }
  }

  throw new Error(
    `No se pudo descargar el archivo de Drive (status: ${lastStatus || "N/A"}). Verifica permisos de compartición y URL.`,
  );
}
