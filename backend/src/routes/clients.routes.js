import { Router } from "express";
import {
  importClientsFromDriveAction,
  listClientsDynamicAction,
  updateClientDynamicAction,
} from "../services/clientsDynamic.service.js";

const router = Router();

function requireBackofficeRole(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ message: "No autenticado" });
  }

  const allowedRoles = new Set(["ADMIN", "VENTAS"]);
  if (!allowedRoles.has(req.user.role)) {
    return res.status(403).json({ message: "No autorizado" });
  }

  return next();
}

router.get("/dynamic", requireBackofficeRole, async (_req, res) => {
  try {
    const data = await listClientsDynamicAction();
    return res.json(data);
  } catch (error) {
    return res.status(500).json({
      message:
        error.message || "No se pudo obtener la tabla dinámica de clientes.",
    });
  }
});

router.put("/:id/dynamic", requireBackofficeRole, async (req, res) => {
  try {
    const payload =
      req.body && typeof req.body === "object" && !Array.isArray(req.body) ?
        req.body
      : {};

    const client = await updateClientDynamicAction({
      id: req.params.id,
      input: payload,
    });

    return res.json(client);
  } catch (error) {
    return res.status(400).json({
      message: error.message || "No se pudo actualizar el cliente.",
    });
  }
});

router.post("/import-drive", requireBackofficeRole, async (req, res) => {
  try {
    const { fileUrl } = req.body || {};
    const report = await importClientsFromDriveAction({
      fileUrl,
      createdByUserId: req.user.userId,
    });

    return res.json(report);
  } catch (error) {
    return res.status(400).json({
      message: error.message || "No se pudo importar el archivo desde Drive.",
    });
  }
});

export default router;
