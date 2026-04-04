import { Router } from "express";
import {
  importContactsFromDriveAction,
  listContactsDynamicByClientAction,
  updateContactDynamicAction,
} from "../services/contactsDynamic.service.js";

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

router.get(
  "/client/:clientId/dynamic",
  requireBackofficeRole,
  async (req, res) => {
    try {
      const data = await listContactsDynamicByClientAction({
        clientId: req.params.clientId,
      });
      return res.json(data);
    } catch (error) {
      return res.status(400).json({
        message:
          error.message || "No se pudo obtener la tabla dinámica de contactos.",
      });
    }
  },
);

router.put("/:id/dynamic", requireBackofficeRole, async (req, res) => {
  try {
    const payload =
      req.body && typeof req.body === "object" && !Array.isArray(req.body) ?
        req.body
      : {};

    const contact = await updateContactDynamicAction({
      id: req.params.id,
      input: payload,
    });

    return res.json(contact);
  } catch (error) {
    return res.status(400).json({
      message: error.message || "No se pudo actualizar el contacto.",
    });
  }
});

router.post("/import-drive", requireBackofficeRole, async (req, res) => {
  try {
    const { fileUrl, clientId } = req.body || {};
    const report = await importContactsFromDriveAction({
      fileUrl,
      clientId,
    });

    return res.json(report);
  } catch (error) {
    return res.status(400).json({
      message: error.message || "No se pudo importar el archivo desde Drive.",
    });
  }
});

export default router;
