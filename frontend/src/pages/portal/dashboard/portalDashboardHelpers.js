export const fmtDate = (d) => {
  if (!d) return "";
  try {
    return new Date(d).toLocaleDateString("es-MX");
  } catch {
    return "";
  }
};

export function getProductTypeLabel(service) {
  const explicit = String(
    service?.product_type || service?.product?.product_type || "",
  )
    .trim()
    .toUpperCase();

  if (explicit === "CONTPAQI") return "CONTPAQi";
  if (explicit === "SERVICE") return "Servicio";
  if (explicit === "POLICY") return "Póliza de servicio";
  if (explicit === "PRODUCT") return "Producto / Licencia";

  const source = `${service?.product?.name || ""} ${service?.product?.category || ""}`
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  if (source.includes("poliza")) return "Póliza de servicio";
  if (source.includes("servicio")) return "Servicio";
  if (source.includes("contpaqi")) return "CONTPAQi";

  return "Producto / Licencia";
}

export function groupServicesByName(services, selectedServiceByGroup = {}) {
  const normalize = (s = "") =>
    String(s).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

  const groups = new Map();
  services.forEach((svc) => {
    const key = normalize(svc.product?.name) || `svc-${svc.id}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(svc);
  });

  return Array.from(groups.entries()).map(([key, items]) => {
    const sorted = [...items].sort((a, b) =>
      String(a.product?.folio || "").localeCompare(String(b.product?.folio || ""), "es", { sensitivity: "base" }),
    );
    const selectedId = selectedServiceByGroup[key];
    const selected =
      sorted.find((s) => String(s.id) === String(selectedId)) || sorted[0];

    const uniqueFolios = new Set(sorted.map((s) => s.product?.folio || ""));
    return {
      ...selected,
      _groupKey: key,
      _groupCount: sorted.length,
      _groupItems: sorted,
      _uniqueFoliosCount: uniqueFolios.size,
    };
  });
}
