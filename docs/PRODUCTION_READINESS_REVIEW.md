# Production Readiness Review - Business Control

Fecha de revision: 2026-06-02

Alcance: revision estatica de frontend, backend, GraphQL, servicios, repositorios, shared, scripts de prueba y configuracion del monorepo. No se modifico codigo fuente de la aplicacion.

## Resumen ejecutivo

El proyecto ya tiene una base razonable para crecer: monorepo con `frontend`, `backend` y `shared`; una separacion parcial `Resolver -> Action -> Service/Repository`; reglas de pricing compartidas; middleware de seguridad; `ErrorBoundary`; escape HTML para templates de PDF backend; y algunas pruebas unitarias.

La mayor deuda actual no es que el sistema "no funcione", sino que varias pantallas y flujos concentran demasiadas responsabilidades. Para llevarlo a un nivel empresarial, el foco debe estar en:

- Reducir archivos y hooks gigantes en frontend.
- Estandarizar errores, validaciones y permisos en backend.
- Agregar paginacion y limites operativos a queries GraphQL.
- Limpiar configuracion del monorepo y archivos generados rastreados.
- Mover side effects pesados a servicios desacoplados y testeables.
- Subir cobertura automatizada en reglas de negocio, API y flujos criticos.

## Actualizacion de implementacion

Estado aplicado en esta iteracion:

- Backend: errores GraphQL tipados para autenticacion, autorizacion, input invalido y recursos no encontrados.
- Backend: scalar `DateTime` validado para evitar `Invalid Date` y `RangeError` no controlados.
- Backend: servidor separado parcialmente en `createApp` y `createApolloGraphqlServer`.
- Backend: paginacion base aplicada a listas principales de clientes, productos y cotizaciones.
- Backend: `SELECT *` eliminado de dataloaders, productos y cotizaciones principales.
- Backend: validacion de password reutiliza `shared/validation.js`.
- Frontend: cliente HTTP centralizado con `createApiClient`.
- Frontend: `graphqlClient` conserva `extensions.code`, `details` y la lista completa de errores GraphQL.
- Frontend: dominio puro de items de cotizacion conectado a `useCreateQuote`.
- Frontend: `Products.jsx` ya no usa imagenes externas aleatorias para avatars.
- Frontend: Vite usa rutas explicitas de workspace y `manualChunks` para separar librerias pesadas.
- Calidad: scripts raiz `test` y `build` agregados como comandos reales.
- Calidad: unitarias, integracion opt-in y build frontend verificados correctamente.

## Code Review

### 1. Riesgos altos

- `frontend/node_modules/.vite/deps/*` esta rastreado por Git. `git ls-files` muestra 52 archivos de `node_modules` versionados. Esto provoca diffs falsos, builds no reproducibles y ruido en PRs aunque `.gitignore` ya ignore `node_modules`.
- Hay multiples `pnpm-lock.yaml` y `pnpm-workspace.yaml`: raiz, `frontend` y `backend`. En un monorepo empresarial deberia existir un solo lockfile raiz y una unica configuracion clara de workspace.
- `package.json:9` define `test:integration` como `node --test backend/tests`. En este entorno falla con `MODULE_NOT_FOUND` antes de ejecutar el test. Deberia apuntar a `backend/tests/**/*.test.js` o delegar a `pnpm --dir backend test`.
- `backend/src/index.js:25-135` mezcla bootstrap, HTTPS, migraciones, seguridad, CORS, REST, GraphQL, Socket.IO y `listen`. Viola SRP y hace dificil probar el servidor sin levantarlo completo.
- `backend/src/graphql/schema.graphql:133-150` expone listas sin paginacion (`clients`, `products`, `quotes`, `unreadQuoteRequests`). A medida que crezca la base de datos, estas queries se volveran lentas y caras.
- El token principal se guarda en `localStorage` (`frontend/src/context/AuthContext.jsx:11`, `frontend/src/actionsAPI/axiosClient.js:9`). Para un estandar empresarial, conviene migrar a cookies `HttpOnly + Secure + SameSite`, o al menos encapsular storage y reducir superficie XSS.

### 2. Frontend: SRP, DRY y desacoplamiento

- Hay componentes/paginas demasiado grandes:
  - `frontend/src/pages/home/ClientDetail.jsx`: 1720 lineas.
  - `frontend/src/pages/home/RegistrarProducts.jsx`: 1100 lineas.
  - `frontend/src/pages/home/Clients.jsx`: 1044 lineas.
  - `frontend/src/pages/home/CreateQuote.jsx`: 998 lineas.
  - `frontend/src/pages/home/Products.jsx`: 968 lineas.
- `frontend/src/pages/home/create-quote/hooks/useCreateQuote.js:35` concentra busqueda, seleccion, item management, edicion, guardado, navegacion, portal auto-send, notificaciones y parsing de URL. Este hook deberia dividirse en dominio, adapters y UI state.
- `useCreateQuote.js:160` y `useCreateQuote.js:342` generan ids temporales con `Date.now() + Math.random()`. Para UI puede funcionar, pero produce colisiones teoricas y tests no deterministas. Usar `crypto.randomUUID()` o un generador inyectable.
- `frontend/src/pages/home/quotes/hooks/useQuotePdf.js:48-705` mezcla captura DOM, PDF, Word HTML, descarga, notificacion y formateo. Debe separarse en `quoteExport.service`, templates puros y hook de UI.
- `frontend/src/pages/home/Products.jsx:69-86` carga imagenes externas desde `loremflickr.com` por producto. Esto agrega dependencia de red externa, variabilidad visual y posible fuga de metadatos de catalogo. Preferir avatar local deterministico o assets propios.
- `Products.jsx:296`, `Products.jsx:312`, `Products.jsx:320`, `Products.jsx:517`, `Products.jsx:541` usan `Swal.fire` directo aunque existe `notificationService`. Esto acopla vistas a SweetAlert y dificulta cambiar UI de notificaciones.
- `frontend/src/actionsAPI/axiosClient.js` y `frontend/src/actionsAPI/portalAxiosClient.js` duplican cliente HTTP y logica de token. Conviene un `createApiClient({ tokenProvider })`.

### 3. Backend: errores, permisos y persistencia

- `backend/src/middlewares/role.middleware.js` lanza `Error` generico. En GraphQL conviene usar `GraphQLError` con `extensions.code` (`UNAUTHENTICATED`, `FORBIDDEN`, `BAD_USER_INPUT`) para que frontend pueda reaccionar sin parsear strings.
- Hay mezcla de mensajes de error en ingles y espanol (`Access denied`, `Unauthorized`, `No autorizado`). Definir catalogo de errores interno y traduccion de mensajes de UI.
- `backend/src/graphql/resolvers/index.js:10-23` acepta fechas con `new Date(value)` sin validar `Invalid Date`. Un valor invalido puede terminar como excepcion no controlada durante serialize.
- `backend/src/graphql/dataloaders/createLoaders.js:59`, `:104`, `:118` usa `SELECT *`. Aunque ya existe una implementacion de batch loader, conviene seleccionar columnas explicitas y evaluar el paquete oficial `dataloader`.
- `backend/src/services/clientsDynamic.service.js:209-237` puede agregar columnas a `clients` en runtime durante importaciones. Es potente, pero en produccion necesita feature flag, auditoria, backups y aprobacion operacional.
- `backend/src/utils/email.js` crea el transporter SMTP en cada envio. Mejor inicializarlo una vez por proceso y exponer un adapter inyectable.
- `backend/src/graphql/actions/quote_actions/sendQuoteEmail.action.js` devuelve `success: true` cuando el envio apenas fue iniciado. Para operacion empresarial, retornar estado `queued` con tracking persistente o esperar el resultado cuando el UX lo requiera.

### 4. DRY y validaciones

- `shared/validation.js:1-7` ya contiene `PASSWORD_PATTERN`, `PASSWORD_REQUIREMENTS_MESSAGE` e `isStrongPassword`, pero `backend/src/graphql/actions/user_actions/registerUser.action.js:9-10` todavia mantiene un `PASSWORD_REGEX` duplicado. Backend y frontend deben usar la misma validacion compartida.
- `quotePricingRules.js` esta bien ubicado en `shared`; este es el patron correcto para reglas de negocio que deben coincidir entre frontend y backend. Debe replicarse para validaciones de status, roles, fechas y formatos.
- La transformacion de errores GraphQL en `frontend/src/utils/graphqlClient.js:3-5` toma solo `data.errors[0].message`. Se pierden codigos, detalles y errores multiples.

### 5. Testing y calidad

- `pnpm.cmd test:unit` paso correctamente:

```text
tests 5
pass 5
fail 0
```

- `pnpm.cmd test:integration` fallo por configuracion del script raiz, no por logica de negocio:

```text
Error: Cannot find module '...\\backend\\tests'
Command failed with exit code 1.
```

- No hay scripts raiz visibles para lint, format, typecheck o build completo. Un pipeline minimo deberia ejecutar `lint`, `test:unit`, `test:integration` opt-in, `build:frontend` y E2E bajo variables de entorno.

## Codigo refactorizado propuesto

Estos bloques son propuestas listas para aplicar en una fase de refactor. No fueron aplicadas al repositorio.

### 1. Errores GraphQL con codigos estables

Archivo sugerido: `backend/src/errors/appErrors.js`

```js
import { GraphQLError } from "graphql";

export function unauthenticated(message = "No autenticado") {
  return new GraphQLError(message, {
    extensions: { code: "UNAUTHENTICATED" },
  });
}

export function forbidden(message = "No autorizado") {
  return new GraphQLError(message, {
    extensions: { code: "FORBIDDEN" },
  });
}

export function badUserInput(message, details = {}) {
  return new GraphQLError(message, {
    extensions: { code: "BAD_USER_INPUT", details },
  });
}
```

Uso sugerido en `backend/src/middlewares/role.middleware.js`:

```js
import { forbidden, unauthenticated } from "../errors/appErrors.js";

export function requireRoles(ctxUser, allowedRoles = []) {
  if (!ctxUser) throw unauthenticated();

  const isAllowed = allowedRoles.includes(ctxUser.role);
  if (!isAllowed) throw forbidden();
}
```

### 2. Bootstrap del servidor separado por responsabilidades

Archivo sugerido: `backend/src/server/createApp.js`

```js
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import clientsRoutes from "../routes/clients.routes.js";
import contactsRoutes from "../routes/contacts.routes.js";

export function createApp({ corsOrigin }) {
  const app = express();

  app.use(helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: process.env.NODE_ENV === "production" ? undefined : false,
    frameguard: { action: "deny" },
    hidePoweredBy: true,
    noSniff: true,
  }));

  app.use(cors({ origin: corsOrigin, credentials: true }));
  app.use(express.json({ limit: "50mb" }));
  app.use(authMiddleware);
  app.use("/api/clients", clientsRoutes);
  app.use("/api/contacts", contactsRoutes);
  app.get("/health", (_req, res) => res.json({ ok: true }));

  return app;
}
```

Archivo sugerido: `backend/src/server/createApolloGraphqlServer.js`

```js
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ApolloServer } from "@apollo/server";
import depthLimit from "graphql-depth-limit";
import resolvers from "../graphql/resolvers/index.js";

export function createApolloGraphqlServer() {
  const typeDefs = readFileSync(
    join(process.cwd(), "src/graphql/schema.graphql"),
    "utf8",
  );

  return new ApolloServer({
    typeDefs,
    resolvers,
    introspection: process.env.NODE_ENV !== "production",
    validationRules: [depthLimit(10)],
  });
}
```

### 3. Validacion de password sin duplicacion

Cambio sugerido en `backend/src/graphql/actions/user_actions/registerUser.action.js`:

```js
import {
  PASSWORD_REQUIREMENTS_MESSAGE,
  isStrongPassword,
} from "../../../../../shared/validation.js";

export async function registerUserAction(input) {
  const role = input.role_name?.trim().toUpperCase();
  const phone = input.telefono?.trim();

  if (!phone) {
    throw new Error("El telefono es requerido");
  }

  if (!isStrongPassword(input.password)) {
    throw new Error(PASSWORD_REQUIREMENTS_MESSAGE);
  }

  // Continuar con busqueda de rol, hash y persistencia.
}
```

### 4. Cliente HTTP reusable para backoffice y portal

Archivo sugerido: `frontend/src/services/createApiClient.js`

```js
import axios from "axios";

const graphqlBaseUrl = import.meta.env.VITE_API_URL || "http://localhost:4000/graphql";

export function createApiClient({ getToken }) {
  const client = axios.create({
    baseURL: graphqlBaseUrl,
    headers: { "Content-Type": "application/json" },
  });

  client.interceptors.request.use((config) => {
    const token = getToken?.();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  return client;
}
```

Archivo sugerido: `frontend/src/services/graphqlClient.js`

```js
export async function gql(client, query, variables = {}) {
  const { data } = await client.post("", { query, variables });

  if (!data.errors?.length) {
    return data.data;
  }

  const [firstError] = data.errors;
  const error = new Error(firstError.message || "GraphQL request failed");
  error.code = firstError.extensions?.code || "GRAPHQL_ERROR";
  error.details = firstError.extensions?.details;
  error.errors = data.errors;
  throw error;
}
```

### 5. Dominio puro para items de cotizacion

Archivo sugerido: `frontend/src/features/quotes/domain/quoteItems.js`

```js
import { calculateItemTotal, normalizeDiscount, roundMoney } from "@shared/quotePricingRules.js";

export function createQuoteItem(product, quantity = 1, idFactory = crypto.randomUUID) {
  const safeQuantity = Math.max(1, Number(quantity) || 1);
  const price = roundMoney(product.current_price);

  return {
    tempId: idFactory(),
    product_id: product.id,
    name: product.name,
    price,
    discount: 0,
    quantity: safeQuantity,
    total: calculateItemTotal(price, safeQuantity, 0),
  };
}

export function upsertQuoteItem(items, product, quantity = 1, idFactory) {
  const safeQuantity = Math.max(1, Number(quantity) || 1);
  const existing = items.find((item) => item.product_id === product.id);

  if (!existing) {
    return [...items, createQuoteItem(product, safeQuantity, idFactory)];
  }

  return items.map((item) => {
    if (item.product_id !== product.id) return item;

    const nextQuantity = item.quantity + safeQuantity;
    return {
      ...item,
      quantity: nextQuantity,
      total: calculateItemTotal(item.price, nextQuantity, item.discount),
    };
  });
}

export function updateQuoteItemDraft(item, patch) {
  const quantity = Math.max(1, Number.parseInt(patch.quantity ?? item.quantity, 10) || 1);
  const price = Math.max(0, roundMoney(patch.price ?? item.price));
  const discount = normalizeDiscount(patch.discount ?? item.discount);

  return {
    ...item,
    quantity,
    price,
    discount,
    total: calculateItemTotal(price, quantity, discount),
  };
}
```

### 6. Paginacion base para repositorios

Archivo sugerido: `backend/src/repositories/pagination.js`

```js
export function normalizePagination({ limit = 50, offset = 0 } = {}) {
  const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 100);
  const safeOffset = Math.max(Number(offset) || 0, 0);

  return { limit: safeLimit, offset: safeOffset };
}
```

Uso sugerido:

```js
import { normalizePagination } from "./pagination.js";

export async function listClients({ limit, offset } = {}, queryRunner = pool) {
  const page = normalizePagination({ limit, offset });

  const [rows] = await queryRunner.query(
    `SELECT id, business_name, rfc, email1, telefono, ciudad
     FROM clients
     ORDER BY business_name ASC
     LIMIT ? OFFSET ?`,
    [page.limit, page.offset],
  );

  return rows;
}
```

## Plan de implementacion recomendado

### Fase 1: Higiene y CI

- Sacar `frontend/node_modules/.vite/deps/*` del tracking de Git con `git rm --cached`.
- Mantener un solo `pnpm-lock.yaml` y un solo `pnpm-workspace.yaml` en la raiz.
- Corregir `test:integration`.
- Agregar scripts raiz: `lint`, `format`, `test`, `build`.
- Agregar ESLint + Prettier o Biome, y hacer que CI falle si hay errores.

### Fase 2: Backend production hardening

- Separar `backend/src/index.js` en `createApp`, `createHttpServer`, `createApolloGraphqlServer` y `startServer`.
- Introducir errores GraphQL tipados.
- Agregar paginacion a queries principales.
- Validar `DateTime` con errores controlados.
- Reemplazar `SELECT *` por columnas explicitas.
- Convertir envio de email async en job persistente o respuesta `queued` real.

### Fase 3: Frontend architecture

- Dividir paginas grandes por feature:
  - `features/products`
  - `features/clients`
  - `features/quotes`
  - `features/portal`
- Extraer dominio puro de cotizaciones desde `useCreateQuote`.
- Mover templates Word/PDF frontend fuera del hook `useQuotePdf`.
- Reemplazar `Swal.fire` directo por `notificationService`.
- Centralizar token storage y GraphQL client.

### Fase 4: Calidad empresarial

- Pruebas unitarias para dominio puro: cotizaciones, filtros, export, status, validaciones.
- Pruebas de integracion GraphQL con base de datos dedicada o contenedor.
- E2E minimo para login, crear cotizacion, publicar portal y solicitar cotizacion.
- Observabilidad: request id, structured logs, tracking persistente de emails, metricas de errores.

## Justificacion tecnica

- SRP: separar bootstrap, UI, dominio y side effects reduce el costo de cambio. Una pantalla ya no tendria que saber como se genera un PDF, como se valida un email o como se construye un payload GraphQL.
- DRY: mover password validation, token handling, GraphQL error handling y quote item logic a modulos compartidos evita divergencias entre frontend y backend.
- KISS: extraer funciones puras pequeñas elimina hooks con decenas de estados y reduce ramas condicionales dentro de componentes.
- SOLID: inyectar dependencias como `pricingService`, `idFactory`, `emailSender` o `tokenProvider` permite probar sin red, sin DOM y sin base de datos.
- Robustez: errores con codigo estable hacen que frontend pueda distinguir entre sesion expirada, permiso denegado, input invalido y fallo interno.
- Rendimiento: paginacion, columnas explicitas y cache batch controlada reducen carga de MySQL y payloads GraphQL.
- Operacion: limpiar lockfiles, node_modules rastreado y scripts de CI da builds reproducibles y reduce sorpresas en despliegue.

## Estado actual de verificacion

- `pnpm.cmd test:unit`: paso con 13 tests.
- `pnpm.cmd test:integration`: paso; el test de BD queda skippeado cuando `RUN_INTEGRATION_TESTS` no esta activo.
- `pnpm.cmd test`: paso como comando raiz compuesto.
- `pnpm.cmd build:frontend`: paso. En sandbox requirio ejecucion elevada porque Vite/esbuild necesitaba resolver dependencias fuera de las restricciones de lectura del proceso.
- Dev server local: no quedo levantado porque `Start-Process` falla en este entorno Windows por variables duplicadas `Path/PATH`; el build de produccion si valida que el frontend compila.
