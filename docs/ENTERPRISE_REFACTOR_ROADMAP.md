# Enterprise Refactor Roadmap - Business Control

Fecha de revision: 2026-06-02  
Alcance: revision estatica y verificacion basica de `frontend`, `backend`, `shared`, GraphQL, Express, React, servicios, repositorios, scripts y build.  
Regla aplicada: no se modifico codigo fuente de la aplicacion. Este documento es la entrega accionable.

## Resumen ejecutivo

El proyecto ya esta en un punto sano para evolucionar: tiene monorepo, separacion parcial `Resolver -> Action -> Service/Repository`, reglas de pricing compartidas, GraphQL con permisos por rol, `DateTime` validado, paginacion base, DataLoader casero, `ErrorBoundary`, cliente HTTP centralizado y scripts reales de test/build.

El salto a estandar empresarial no requiere reescribir todo. La prioridad es reducir acoplamiento y tamano de unidades, estandarizar errores, consolidar importaciones dinamicas, proteger mejor sesion/autenticacion y robustecer observabilidad/CI.

## Estado de verificacion

- `pnpm.cmd test`: pasa.
- Unitarias: 13 tests pasan.
- Integracion backend: 1 test queda skippeado porque `RUN_INTEGRATION_TESTS` no esta activo.
- `pnpm.cmd run build:frontend`: pasa fuera del sandbox. El primer intento fallo por permisos del entorno Windows/sandbox, no por error confirmado del proyecto.
- No se dejo corriendo ningun servidor local.

## Code Review

### Problemas principales detectados

- Componentes demasiado grandes y con multiples responsabilidades:
  - `frontend/src/pages/home/ClientDetail.jsx`: 1720 lineas.
  - `frontend/src/pages/home/RegistrarProducts.jsx`: 1100 lineas.
  - `frontend/src/pages/home/Clients.jsx`: 1044 lineas.
  - `frontend/src/pages/home/CreateQuote.jsx`: 998 lineas.
  - `frontend/src/pages/home/Products.jsx`: 909 lineas.
- Hooks con exceso de responsabilidades:
  - `frontend/src/pages/home/create-quote/hooks/useCreateQuote.js`: mezcla busqueda, seleccion, totales, UI state, timers, navegacion, guardado y envio a portal.
  - `frontend/src/pages/home/quotes/hooks/useQuotePdf.js`: mezcla DOM capture, PDF, Word HTML, descarga, notificaciones y formateo.
  - `frontend/src/pages/home/policies/usePolicies.js`: mezcla fetching, transformacion, filtros, exportacion PDF/Excel y UI feedback.
- Polling duplicado y agresivo:
  - `frontend/src/components/layout/Topbar.jsx:53` consulta notificaciones cada 2 segundos.
  - `frontend/src/components/layout/Sidebar.jsx:72` consulta conteos cada 2 segundos.
  - Esto deberia moverse a un hook compartido, pausar con pestaña oculta y eventualmente reemplazarse por Socket.IO o GraphQL subscription.
- Sesion en storage del navegador:
  - `frontend/src/context/AuthContext.jsx:11`
  - `frontend/src/actionsAPI/axiosClient.js:11`
  - `frontend/src/actionsAPI/axiosClient.js:13`
  - Para produccion empresarial, el token de backoffice deberia migrar a cookie `HttpOnly + Secure + SameSite` o, como minimo, quedar encapsulado tras un `tokenStorage` auditable.
- Manejo de errores todavia inconsistente:
  - Ya existen `backend/src/errors/appErrors.js` y errores GraphQL tipados, pero muchas acciones siguen lanzando `Error` generico.
  - REST responde manualmente en cada ruta (`backend/src/routes/clients.routes.js`, `backend/src/routes/contacts.routes.js`) en lugar de usar `asyncHandler` + middleware central de errores.
- SQL y reglas de persistencia duplicadas:
  - Clientes/contactos dinamicos repiten normalizacion, mapeo, insercion por batches, `ALTER TABLE`, backfill y metadatos.
  - `backend/src/repositories/client.repository.js` y `backend/src/repositories/contact.repository.js` tienen funciones casi equivalentes para columnas dinamicas.
- Riesgo operativo por `ALTER TABLE` en runtime:
  - `backend/src/repositories/client.repository.js:325`
  - `backend/src/repositories/contact.repository.js:323`
  - Esto puede bloquear tablas en MySQL y debe ejecutarse con feature flag, auditoria, backups y permisos administrativos.
- Queries con `SELECT *` aun presentes:
  - `backend/src/repositories/role.repository.js:12`
  - `backend/src/repositories/role.repository.js:22`
  - `backend/src/services/quoteRepository.service.js:16`
  - `backend/src/services/quoteRepository.service.js:21`
  - `backend/src/services/quoteRepository.service.js:26`
  - `backend/src/services/quoteRepository.service.js:38`
  - `backend/src/chat/chat.service.js:128`
  - `backend/src/chat/chat.service.js:135`
- Eliminaciones fisicas de datos sensibles:
  - `backend/src/repositories/product.repository.js:141-143`
  - `backend/src/repositories/client.repository.js:123`
  - `backend/src/repositories/contact.repository.js:125`
  - Para trazabilidad empresarial, preferir soft delete, auditoria y restricciones FK claras.
- `express.json({ limit: "50mb" })` es alto para toda la app:
  - `backend/src/server/createApp.js:55`
  - Deberia limitarse por ruta especifica cuando se sube base64/PDF/Excel.
- El envio de email de cotizacion queda en tarea fire-and-forget:
  - `backend/src/graphql/actions/quote_actions/sendQuoteEmail.action.js`
  - Retorna `success: true` cuando el envio apenas inicio. En produccion conviene registrar job, estado, tracking y reintentos.
- `package.json` tiene scripts `lint` y `format` que no ejecutan herramientas reales:
  - Hoy imprimen mensajes. Para CI empresarial deben fallar si hay problemas.

### Fortalezas actuales

- `backend/src/server/createApp.js` y `backend/src/server/createApolloGraphqlServer.js` ya separan parte del bootstrap.
- `backend/src/errors/appErrors.js` ya define errores GraphQL con codigos estables.
- `backend/src/graphql/resolvers/index.js` valida `DateTime` y evita `Invalid Date`.
- `backend/src/graphql/dataloaders/createLoaders.js` reduce N+1 en relaciones importantes.
- `shared/quotePricingRules.js` concentra reglas de pricing compartidas entre frontend/backend.
- `frontend/src/services/createApiClient.js` evita duplicar configuracion de Axios.
- `frontend/src/utils/graphqlClient.js` conserva `extensions.code`, `details` y lista de errores.
- `backend/src/utils/email.js` ya usa transporter SMTP singleton lazy.
- `frontend/vite.config.js` ya separa chunks pesados como `xlsx`, `pdf-export`, `canvas-export`, `alerts` y `table-vendor`.

## Que cambiar primero

### Prioridad 1: Bajo riesgo, alto impacto

- Activar lint/format real con ESLint + Prettier o Biome.
- Crear middleware REST centralizado de errores.
- Reemplazar `SELECT *` por columnas explicitas.
- Extraer `tokenStorage` en frontend.
- Extraer polling compartido para notificaciones/conteos.
- Documentar que `RUN_INTEGRATION_TESTS=true` requiere BD preparada.

### Prioridad 2: Refactor funcional

- Dividir `ClientDetail.jsx`, `Clients.jsx`, `CreateQuote.jsx` y `RegistrarProducts.jsx` por feature.
- Separar `useCreateQuote` en dominio, data hooks y UI controller.
- Separar `useQuotePdf` en `quoteExport.service`, templates puros y hook de UI.
- Unificar importacion dinamica de clientes/contactos con un servicio configurable.
- Convertir errores de dominio a clases/codigos estables.

### Prioridad 3: Arquitectura empresarial

- Migrar sesion de backoffice a cookies `HttpOnly`.
- Sustituir email fire-and-forget por job persistente con estados `queued`, `processing`, `sent`, `failed`.
- Agregar auditoria para login, permisos, importaciones, `ALTER TABLE`, eliminaciones y envio de emails.
- Mover polling a Socket.IO/eventos server-side.
- Agregar OpenTelemetry o logging estructurado con request id.

## Codigo refactorizado propuesto

> Estos bloques son propuestas listas para aplicar manualmente. No fueron aplicados al repositorio.

### 1. Middleware REST centralizado

Archivo sugerido: `backend/src/errors/httpErrors.js`

```js
export class HttpError extends Error {
  constructor(statusCode, message, details = undefined) {
    super(message);
    this.name = "HttpError";
    this.statusCode = statusCode;
    this.details = details;
  }
}

export function badRequest(message, details) {
  return new HttpError(400, message, details);
}

export function unauthorized(message = "No autenticado") {
  return new HttpError(401, message);
}

export function forbidden(message = "No autorizado") {
  return new HttpError(403, message);
}
```

Archivo sugerido: `backend/src/middlewares/error.middleware.js`

```js
import { logger } from "../utils/logger.js";

export function asyncHandler(handler) {
  return async (req, res, next) => {
    try {
      await handler(req, res, next);
    } catch (error) {
      next(error);
    }
  };
}

export function errorMiddleware(error, req, res, _next) {
  const statusCode = error.statusCode || 500;
  const isOperational = statusCode < 500;

  if (!isOperational) {
    logger.error("Unhandled HTTP error", {
      path: req.originalUrl,
      method: req.method,
      error: error.message,
      stack: error.stack,
    });
  }

  return res.status(statusCode).json({
    message: isOperational ? error.message : "Error interno del servidor",
    details: error.details,
  });
}
```

Uso sugerido en rutas:

```js
import { Router } from "express";
import { asyncHandler } from "../middlewares/error.middleware.js";
import { requireBackofficeRole } from "../middlewares/requireBackofficeRole.middleware.js";
import { listClientsDynamicAction } from "../services/clientsDynamic.service.js";

const router = Router();

router.get(
  "/dynamic",
  requireBackofficeRole,
  asyncHandler(async (_req, res) => {
    const data = await listClientsDynamicAction();
    return res.json(data);
  }),
);

export default router;
```

Cambio requerido en `createApp`:

```js
import { errorMiddleware } from "../middlewares/error.middleware.js";

// Registrar despues de rutas REST y GraphQL.
app.use(errorMiddleware);
```

### 2. Caso de uso inyectable para crear cotizaciones

Problema actual: `createQuote.action.js` ya permite inyectar `pricingService`, pero sigue acoplado a repositorios concretos, reloj y generacion de folio.

Archivo sugerido: `backend/src/graphql/actions/quote_actions/createQuote.action.js`

```js
import {
  createQuoteWithItems,
  fetchProductsForQuote,
} from "../../../repositories/quote.repository.js";
import {
  createQuoteActor,
  createQuoteDraft,
} from "../../../services/quoteDraft.service.js";
import { quotePricingService } from "../../../services/quotePricing.service.js";

function createDefaultFolio(idGenerator) {
  return `COT-GEN-${idGenerator().slice(0, 8).toUpperCase()}`;
}

export function buildCreateQuoteUseCase({
  quoteRepository,
  pricingService,
  idGenerator = () => crypto.randomUUID().replace(/-/g, ""),
  clock = () => new Date(),
}) {
  return async function createQuoteFromDraft({ quoteDraft, actor }) {
    const productIds = quoteDraft.items.map((item) => item.product_id);
    const products = await quoteRepository.fetchProductsForQuote(productIds);

    const pricing = pricingService.calculate({
      items: quoteDraft.items,
      products,
    });

    const folio = quoteDraft.folio || createDefaultFolio(idGenerator);

    const quoteId = await quoteRepository.createQuoteWithItems({
      folio,
      client_id: quoteDraft.client_id,
      contact_id: quoteDraft.contact_id,
      user_id: actor.user_id,
      total: pricing.total,
      notes: quoteDraft.notes,
      items: pricing.items,
    });

    return {
      id: quoteId,
      folio,
      client_id: quoteDraft.client_id,
      user_id: actor.user_id,
      total: pricing.total,
      subtotal: pricing.subtotal,
      iva: pricing.iva,
      status: "PENDING",
      notes: quoteDraft.notes,
      created_at: clock(),
    };
  };
}

const createQuoteUseCase = buildCreateQuoteUseCase({
  quoteRepository: {
    fetchProductsForQuote,
    createQuoteWithItems,
  },
  pricingService: quotePricingService,
});

export const createQuoteAction = async (input, user) => {
  const quoteDraft = createQuoteDraft(input);
  const actor = createQuoteActor(user);

  return createQuoteUseCase({ quoteDraft, actor });
};
```

Beneficio: el caso de uso se prueba con repositorios falsos, reloj falso e id deterministico, sin MySQL.

### 3. Token storage desacoplado en frontend

Archivo sugerido: `frontend/src/services/tokenStorage.js`

```js
const BACKOFFICE_TOKEN_KEY = "bc_token";
const PORTAL_TOKEN_KEY = "bc_portal_token";

export const tokenStorage = {
  getBackofficeToken() {
    return localStorage.getItem(BACKOFFICE_TOKEN_KEY);
  },

  setBackofficeToken(token) {
    localStorage.setItem(BACKOFFICE_TOKEN_KEY, token);
  },

  clearBackofficeToken() {
    localStorage.removeItem(BACKOFFICE_TOKEN_KEY);
  },

  getPortalToken() {
    return sessionStorage.getItem(PORTAL_TOKEN_KEY);
  },

  setPortalToken(token) {
    sessionStorage.setItem(PORTAL_TOKEN_KEY, token);
  },

  clearPortalToken() {
    sessionStorage.removeItem(PORTAL_TOKEN_KEY);
  },
};
```

Uso sugerido en `axiosClient.js`:

```js
import { createApiClient } from "../services/createApiClient";
import { tokenStorage } from "../services/tokenStorage";

export const axiosClient = createApiClient({
  getToken: () => {
    const isPortalRoute = window.location.pathname.startsWith("/portal");
    return isPortalRoute
      ? tokenStorage.getPortalToken()
      : tokenStorage.getBackofficeToken();
  },
});
```

Siguiente paso empresarial: reemplazar el almacenamiento del backoffice por cookies `HttpOnly` y dejar `tokenStorage` como adaptador de compatibilidad temporal.

### 4. Polling compartido y pausado por visibilidad

Archivo sugerido: `frontend/src/hooks/usePolling.js`

```js
import { useEffect, useRef } from "react";

export function usePolling(callback, intervalMs, { enabled = true } = {}) {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled || !intervalMs) return undefined;

    let disposed = false;
    let timeoutId;

    const run = async () => {
      if (disposed) return;

      // Evita gastar red y bateria cuando la pestaña no esta activa.
      if (document.visibilityState === "visible") {
        await callbackRef.current();
      }

      timeoutId = window.setTimeout(run, intervalMs);
    };

    run();

    return () => {
      disposed = true;
      window.clearTimeout(timeoutId);
    };
  }, [enabled, intervalMs]);
}
```

Uso sugerido en `Topbar.jsx`:

```js
usePolling(fetchNotifications, 10_000, {
  enabled: Boolean(user),
});
```

Esto elimina polling duplicado cada 2 segundos y reduce carga del backend.

### 5. Servicio generico para importaciones tabulares

Problema actual: clientes y contactos dinamicos comparten gran parte del flujo. Conviene parametrizar lo que cambia.

Archivo sugerido: `backend/src/services/tabularImport.service.js`

```js
export function createTabularImportService(config) {
  return async function importRows({ fileUrl, context }) {
    if (!fileUrl) {
      throw new Error("Debes proporcionar la URL del archivo de Drive.");
    }

    await config.validateContext?.(context);

    const fileBuffer = await config.downloadFile(fileUrl);
    const { headers, rows: rawRows } = config.parseFile(fileBuffer);
    const columnsMeta = await config.getColumnsMeta();
    const mapping = config.mapHeaders(headers, columnsMeta);

    if (!Object.keys(mapping.mapped).length) {
      throw new Error(config.emptyMappingMessage);
    }

    const preparedRows = rawRows
      .map((row, index) =>
        config.prepareRow({
          row,
          rowNumber: index + 2,
          mappedHeaders: mapping.mapped,
          columnsMeta,
          context,
        }),
      )
      .filter(Boolean);

    if (!preparedRows.length) {
      throw new Error("No hubo filas validas para importar.");
    }

    const insertedCount = await config.insertRows(preparedRows);

    return {
      importedCount: insertedCount,
      totalRows: rawRows.length,
      mappingMode: mapping.mappingMode,
      mappedColumns: [...new Set(Object.values(mapping.mapped))],
      ignoredHeaders: mapping.unmatched,
    };
  };
}
```

Uso sugerido para clientes:

```js
export const importClientsFromDriveAction = createTabularImportService({
  downloadFile: downloadExcelBuffer,
  parseFile: parseExcelBuffer,
  getColumnsMeta: getClientsTableColumns,
  mapHeaders: (headers, columnsMeta) =>
    getHeaderToColumnMap(headers, getInsertableColumns(columnsMeta), {
      orderedHeaders: headers,
    }),
  prepareRow: prepareClientRow,
  insertRows: insertPreparedClientRows,
  emptyMappingMessage:
    "No se pudo mapear ninguna columna del Excel a la tabla clients.",
  validateContext({ createdByUserId }) {
    if (!createdByUserId) throw new Error("Usuario no autenticado.");
  },
});
```

Comentario importante: `ALTER TABLE` deberia quedar fuera del flujo automatico por defecto. Primero reportar columnas faltantes; luego aplicar cambios con aprobacion administrativa o migracion controlada.

### 6. Separar exportacion de cotizacion del hook UI

Archivo sugerido: `frontend/src/features/quotes/services/quoteExport.service.js`

```js
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export async function captureQuoteAsPdfBlob(node, options = {}) {
  if (!node) {
    throw new Error("No se pudo obtener la vista de la cotizacion.");
  }

  const canvas = await html2canvas(node, {
    scale: options.scale || 2,
    useCORS: true,
    backgroundColor: "#ffffff",
  });

  const imageData = canvas.toDataURL("image/png");
  const pdf = new jsPDF("p", "mm", "a4");
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const imageHeight = (canvas.height * pageWidth) / canvas.width;

  // Maneja contenido mas alto que una pagina sin que el hook sepa de PDF internals.
  let remainingHeight = imageHeight;
  let y = 0;

  pdf.addImage(imageData, "PNG", 0, y, pageWidth, imageHeight);
  remainingHeight -= pageHeight;

  while (remainingHeight > 0) {
    y -= pageHeight;
    pdf.addPage();
    pdf.addImage(imageData, "PNG", 0, y, pageWidth, imageHeight);
    remainingHeight -= pageHeight;
  }

  return pdf.output("blob");
}
```

Uso sugerido en un hook delgado:

```js
export function useQuoteExport({ notificationService }) {
  return async function exportPdf(node, filename) {
    try {
      const blob = await captureQuoteAsPdfBlob(node);
      downloadBlob(blob, filename);
    } catch (error) {
      notificationService.error(
        "Error",
        error.message || "No se pudo exportar el PDF.",
      );
    }
  };
}
```

### 7. Errores de dominio con codigos estables

Archivo sugerido: `backend/src/errors/domainErrors.js`

```js
export class DomainError extends Error {
  constructor(code, message, details = undefined) {
    super(message);
    this.name = "DomainError";
    this.code = code;
    this.details = details;
  }
}

export function invalidQuoteStatus(status) {
  return new DomainError("INVALID_QUOTE_STATUS", "Estado no valido", {
    status,
  });
}

export function quoteNotFound(id) {
  return new DomainError("QUOTE_NOT_FOUND", "Cotizacion no encontrada", {
    id,
  });
}
```

Adaptador GraphQL sugerido:

```js
import { GraphQLError } from "graphql";
import { DomainError } from "./domainErrors.js";

export function toGraphQLError(error) {
  if (error instanceof DomainError) {
    return new GraphQLError(error.message, {
      extensions: {
        code: error.code,
        details: error.details,
      },
    });
  }

  return error;
}
```

El objetivo no es envolver todo por envolver. Es evitar que frontend tenga que parsear mensajes humanos para decidir comportamiento.

## Estructura de carpetas sugerida

```text
frontend/src/
  features/
    clients/
      api/
      components/
      hooks/
      domain/
    quotes/
      api/
      components/
      hooks/
      services/
      domain/
    products/
    portal/
  shared/
    hooks/
    ui/
    services/

backend/src/
  modules/
    clients/
      client.repository.js
      client.service.js
      client.resolver.js
    quotes/
      quote.repository.js
      createQuote.usecase.js
      quote.resolver.js
  infrastructure/
    db/
    email/
    pdf/
    logger/
  server/
  errors/
```

No es obligatorio mover todo de golpe. Empieza por features nuevas o archivos con mas cambios.

## Checklist de implementacion

### Frontend

- Dividir `ClientDetail.jsx` en `ClientHeader`, `ClientContactsTab`, `ClientServicesTab`, `ClientPortalAccessModal`, hooks de carga y hooks de exportacion.
- Dividir `Clients.jsx` en tabla, filtros, bulk import/export y modal de edicion.
- Dividir `CreateQuote.jsx` en `QuoteItemsTable`, `ProductSearchModal`, `ClientSearchModal`, `QuoteTotals`, `QuoteActions`.
- Reducir `useCreateQuote` a orquestacion de UI; mover reglas a `features/quotes/domain`.
- Mover PDF/Word a servicios sin React.
- Cambiar `alert(...)` en `ProductDetail.jsx` por `notificationService`.
- Reemplazar `setInterval` directo por `usePolling`.
- Encapsular `localStorage/sessionStorage`.

### Backend

- Agregar `asyncHandler` y `errorMiddleware`.
- Convertir `Error` genericos frecuentes a `DomainError`.
- Cambiar `SELECT *` a columnas explicitas.
- Bajar `express.json` global a 1-2 MB y subir limite solo en rutas que lo requieran.
- Convertir importacion con `ALTER TABLE` en flujo controlado: preview -> approve -> migrate/import.
- Extraer servicio generico para importaciones tabulares.
- Agregar `requestId` al contexto GraphQL y logs.
- Persistir estado del envio de correos.

### CI/CD

- Reemplazar scripts placeholder:
  - `lint`: ESLint o Biome.
  - `format`: Prettier/Biome check.
- Agregar `test:all`: unitarias + integracion opt-in + build.
- Agregar presupuesto de bundle para chunks pesados (`xlsx`, `pdf-export`, `canvas-export`).
- Ejecutar E2E solo con `E2E_BASE_URL`, `E2E_ADMIN_EMAIL`, `E2E_ADMIN_PASSWORD`.

## Justificacion tecnica

- SRP: dividir componentes y hooks grandes reduce cambios colaterales. Una pantalla no deberia saber como renderizar PDF, descargar Excel, autenticar, calcular precios y navegar al mismo tiempo.
- DIP: casos de uso con repositorios/servicios inyectables permiten pruebas rapidas sin MySQL, SMTP, Puppeteer ni DOM.
- DRY: clientes/contactos dinamicos comparten el mismo problema de importacion; una abstraccion configurable reduce bugs duplicados.
- KISS: hooks pequeños y funciones puras son mas faciles de leer que condicionales largos con multiples estados y efectos.
- Clean Code: early returns y errores tipados reemplazan ramas anidadas y mensajes string-dependientes.
- Robustez: middleware central de errores evita respuestas REST inconsistentes y mejora logs.
- Seguridad: encapsular token storage abre camino a cookies `HttpOnly`, reduce superficie XSS y concentra cambios futuros.
- Rendimiento: menos polling, payloads SQL explicitos, limites de body y jobs async evitan carga innecesaria.
- Operacion: `ALTER TABLE` runtime, emails fire-and-forget y deletes fisicos necesitan auditoria para cumplir estandares empresariales.

## Criterio de terminado recomendado

Un refactor de produccion deberia considerarse completo cuando:

- `pnpm.cmd test` pasa.
- `pnpm.cmd run build:frontend` pasa.
- `lint` y `format` ejecutan herramientas reales.
- Las pantallas principales ya no superan 500 lineas por archivo salvo excepcion justificada.
- Los flujos criticos tienen pruebas unitarias de dominio.
- Los errores API tienen codigos estables.
- Importaciones dinamicas tienen preview, auditoria y control de esquema.
- El envio de correos tiene tracking persistente y reintentos.
