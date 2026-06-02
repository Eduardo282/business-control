# Refactorización Enterprise-Level: Business Control

## Resumen del Proyecto Analizado

Tu proyecto es un **monorepo** (pnpm workspaces) con:
- **Backend**: Express 5 + Apollo Server 5 (GraphQL) + MySQL + Socket.IO (~83 archivos fuente)
- **Frontend**: React 18 + Vite + TailwindCSS + TanStack Table (~50+ componentes/páginas)
- **Shared**: Lógica de pricing compartida (`quotePricingRules.js`)

La arquitectura ya tiene bases sólidas: **Resolver → Action → Repository**, middleware de seguridad (Helmet, HSTS, cookie hardening), migraciones SQL, sistema de chat modular en tiempo real, y descomposición parcial de componentes. Sin embargo, el análisis exhaustivo de los **130+ archivos fuente** revela **28+ problemas** que necesitan refactorización para alcanzar estándares de producción empresarial.

---

## Code Review: Problemas Detectados

### 🚨 SEGURIDAD CRÍTICA (6 problemas)

| # | Problema | Archivo | Impacto |
|---|----------|---------|---------|
| S1 | **Mutaciones de roles SIN autenticación** — `createRole` y `deleteRole` no tienen `requireRoles()`. Cualquier usuario (o no autenticado) puede crear/eliminar roles | [roles.mutation.js](file:///c:/Users/lalit/Documentos/BUSINESS-CONTROL/business-control/business-control/backend/src/graphql/resolvers/mutation/roles.mutation.js) L4-5 | **Escalación de privilegios** |
| S2 | **Contraseña maestra hardcodeada en frontend** — `"Tc3@N360!"` en texto plano en el bundle JS | [Register.jsx](file:///c:/Users/lalit/Documentos/BUSINESS-CONTROL/business-control/business-control/frontend/src/pages/auth/Register.jsx) | **Exposición de credenciales** |
| S3 | **XSS almacenado en templates HTML** — `business_name`, `full_name`, `notes` se interpolan directamente en HTML sin escape | [quotePdfTemplate.service.js](file:///c:/Users/lalit/Documentos/BUSINESS-CONTROL/business-control/business-control/backend/src/services/quotePdfTemplate.service.js) L30, 59, 121, 139, 183, 225 | **Ejecución de código arbitrario vía datos del usuario** |
| S4 | **Timing attack en verifyMasterPassword** — `password === MASTER_PASSWORD` con comparación directa | [auth.mutation.js](file:///c:/Users/lalit/Documentos/BUSINESS-CONTROL/business-control/business-control/backend/src/graphql/resolvers/mutation/auth.mutation.js) L26 | **Inferencia de contraseña** |
| S5 | **Queries sin autenticación** — `product(id)`, `products`, `searchProducts` no validan roles (accesible por cualquier usuario, incluyendo CONTACT_PORTAL) | [products.query.js](file:///c:/Users/lalit/Documentos/BUSINESS-CONTROL/business-control/business-control/backend/src/graphql/resolvers/query/products.query.js) L7-12, L24-26 | **Fuga de datos** |
| S6 | **SQL injection potencial en `updateClient`** — claves del objeto `data` interpoladas como nombres de columna sin sanitizar | [client.repository.js](file:///c:/Users/lalit/Documentos/BUSINESS-CONTROL/business-control/business-control/backend/src/repositories/client.repository.js) L84-96 | **Inyección SQL** |

### ⚠️ ARQUITECTURA Y DISEÑO (10 problemas)

| # | Problema | Archivos | Principio |
|---|----------|----------|-----------|
| A1 | **God Components** (1000+ líneas) | `Clients.jsx` (1170), `ClientDetail.jsx` (800+), `CreateQuote.jsx` (700+) | SRP |
| A2 | **God Hooks** (30+ variables de estado) | `useCreateQuote.js` (701), `usePolicies.js` (556) | SRP, KISS |
| A3 | **HTML template inline** (~470 líneas de HTML como string literal) | `useQuotePdf.js` (709) | SRP |
| A4 | **`determineStatus()` duplicada 3 veces** — Lógica idéntica de cálculo de estado de póliza | [listContactProducts.action.js](file:///c:/Users/lalit/Documentos/BUSINESS-CONTROL/business-control/business-control/backend/src/graphql/actions/contact_actions/listContactProducts.action.js) L46-70, [listAllPolicies.action.js](file:///c:/Users/lalit/Documentos/BUSINESS-CONTROL/business-control/business-control/backend/src/graphql/actions/policy_actions/listAllPolicies.action.js) L7-33, [listClientProducts.action.js](file:///c:/Users/lalit/Documentos/BUSINESS-CONTROL/business-control/business-control/backend/src/graphql/actions/client_actions/listClientProducts.action.js) | DRY |
| A5 | **`requireBackofficeRole` duplicada** — Middleware idéntico en 2 archivos de rutas en vez de reusar `role.middleware.js` | [clients.routes.js](file:///c:/Users/lalit/Documentos/BUSINESS-CONTROL/business-control/business-control/backend/src/routes/clients.routes.js) L10-21, [contacts.routes.js](file:///c:/Users/lalit/Documentos/BUSINESS-CONTROL/business-control/business-control/backend/src/routes/contacts.routes.js) L10-21 | DRY |
| A6 | **`normalizeProductType` duplicada** — Misma lógica en 2 archivos | `listContactProducts.action.js` L27-38, `productFulfillmentRegistry.service.js` L17-29 | DRY |
| A7 | **Notificaciones inconsistentes** — 5 archivos usan `Swal.fire()` directamente en vez del `notificationService` centralizado | Login, Register, PortalLogin, PortalLayout, MasterPasswordGate | Desacoplamiento |
| A8 | **Panel decorativo duplicado** — 8 declaraciones de gradiente idénticas copiadas en 4 archivos de auth | Login, Register, Roles, PortalLogin | DRY |
| A9 | **API files sin abstracción GraphQL** — Todos los `actionsAPI/*.api.js` repiten: `axiosClient.post("", { query }) + if (data.errors) throw` | 9 archivos API | DRY |
| A10 | **Código muerto** — `loginClient.action.js` importa `pool`, `comparePassword`, `signToken` pero solo lanza un error | [loginClient.action.js](file:///c:/Users/lalit/Documentos/BUSINESS-CONTROL/business-control/business-control/backend/src/graphql/actions/client_actions/loginClient.action.js) | KISS |

### 🔧 MANEJO DE ERRORES (4 problemas)

| # | Problema | Archivo |
|---|----------|---------|
| E1 | **Sin ErrorBoundary** — Cero componentes ErrorBoundary. Cualquier error de runtime crashea toda la app | Todo el frontend |
| E2 | **Fire-and-forget email sin tracking** — IIFE async sin retry ni notificación de fallo | [sendQuoteEmail.action.js](file:///c:/Users/lalit/Documentos/BUSINESS-CONTROL/business-control/business-control/backend/src/graphql/actions/quote_actions/sendQuoteEmail.action.js) L36 |
| E3 | **17 instancias de `console.error`** en frontend sin servicio de logging | Múltiples archivos |
| E4 | **Rating de chat sin validación numérica** — Solo valida `< 1 || > 5` pero no verifica que sea número | [conversation.handlers.js](file:///c:/Users/lalit/Documentos/BUSINESS-CONTROL/business-control/business-control/backend/src/chat/handlers/conversation.handlers.js) L97 |

### 🐌 RENDIMIENTO (5 problemas)

| # | Problema | Impacto |
|---|----------|---------|
| P1 | **N+1 queries en type resolvers** — `Quote.client`, `Quote.user`, `Quote.contact`, `Quote.items` disparan queries individuales. Sin DataLoader, listar 50 cotizaciones = 200+ queries | [types.js](file:///c:/Users/lalit/Documentos/BUSINESS-CONTROL/business-control/business-control/backend/src/graphql/resolvers/types.js) L58-73 |
| P2 | **Cero `React.memo()`** — Cell renderers pesados se recrean cada render | Todo el frontend |
| P3 | **Solo 4 archivos usan `useCallback`** — Handlers se recrean innecesariamente | Componentes con tablas |
| P4 | **Sin paginación en listing queries** — `listClients`, `listProducts`, `listQuotes` retornan TODOS los registros | Repositorios backend |
| P5 | **Eliminación secuencial** — `for` + `await` en vez de `Promise.all()` | `usePolicies.js:226` |

### 📋 PRÁCTICAS FALTANTES (5 problemas)

| # | Problema |
|---|----------|
| F1 | **`pnpm-lock.yaml` en `.gitignore`** — Rompe builds reproducibles |
| F2 | **CI pipeline es no-op** — Todos los tests se skipean |
| F3 | **Sin linter/formatter configurado** |
| F4 | **Dark mode con 400 líneas de `!important` overrides** |
| F5 | **`registerUserAction` sobrescribe usuarios existentes por rol** — Comportamiento inusual que podría ser bug de lógica de negocio |

---

## Propuesta de Cambios (Priorizado por Impacto)

> [!IMPORTANT]
> Cada fase es independiente y puede ejecutarse por separado. Recomiendo aprobar **Fases 1-2** primero (seguridad) y luego continuar con las demás.

---

### Fase 1: Seguridad Crítica — Autenticación y XSS (**S1, S2, S3, S4**)

#### [MODIFY] [roles.mutation.js](file:///c:/Users/lalit/Documentos/BUSINESS-CONTROL/business-control/business-control/backend/src/graphql/resolvers/mutation/roles.mutation.js)
- Agregar `requireRoles(ctx.user, ["ADMIN"])` a `createRole` y `deleteRole`

```diff
-export const createRole = (_, { name }) => createRoleAction({ name });
-export const deleteRole = (_, { id }) => deleteRoleAction({ id });
+export const createRole = (_, { name }, ctx) => {
+  requireRoles(ctx.user, ["ADMIN"]);
+  return createRoleAction({ name });
+};
+export const deleteRole = (_, { id }, ctx) => {
+  requireRoles(ctx.user, ["ADMIN"]);
+  return deleteRoleAction({ id });
+};
```

#### [MODIFY] [Register.jsx](file:///c:/Users/lalit/Documentos/BUSINESS-CONTROL/business-control/business-control/frontend/src/pages/auth/Register.jsx)
- Eliminar la contraseña hardcodeada `"Tc3@N360!"` — usar siempre `verifyMasterPasswordApi()` del servidor

#### [NEW] `backend/src/utils/htmlEscape.js`
- Función `escapeHtml(str)` que escapa `&`, `<`, `>`, `"`, `'`
- Aplicar en `quotePdfTemplate.service.js` a: `business_name`, `full_name`, `notes`, `email`, `address`, `folio`, `position_title`, `phone`, `rfc`, `message`

#### [MODIFY] [auth.mutation.js](file:///c:/Users/lalit/Documentos/BUSINESS-CONTROL/business-control/business-control/backend/src/graphql/resolvers/mutation/auth.mutation.js)
- Reemplazar `password === MASTER_PASSWORD` con `crypto.timingSafeEqual()`

```diff
+import { timingSafeEqual } from "node:crypto";
+
 export const verifyMasterPassword = async (_parent, { password }) => {
   const MASTER_PASSWORD = env.MASTER_PASSWORD;
   if (!MASTER_PASSWORD) {
     throw new Error("Error de configuración: MASTER_PASSWORD no está definida en el servidor.");
   }
-  return password === MASTER_PASSWORD;
+  const a = Buffer.from(String(password));
+  const b = Buffer.from(String(MASTER_PASSWORD));
+  if (a.length !== b.length) return false;
+  return timingSafeEqual(a, b);
 };
```

---

### Fase 2: Seguridad — Autorización y SQL (**S5, S6**)

#### [MODIFY] [products.query.js](file:///c:/Users/lalit/Documentos/BUSINESS-CONTROL/business-control/business-control/backend/src/graphql/resolvers/query/products.query.js)
- Agregar `requireRoles()` a `products`, `product`, `searchProducts` para usuarios no-portal

```diff
 export const products = async (_parent, { client_id }, ctx) => {
+  if (!ctx.user) throw new Error("No autenticado");
   if (ctx.user?.role === "CONTACT_PORTAL") {
     return listProductsAction({ client_id: ctx.user.clientId });
   }
+  requireRoles(ctx.user, ["ADMIN", "VENTAS", "SOPORTE"]);
   return listProductsAction({ client_id });
 };

 export const product = async (_parent, { id }, ctx) => {
+  if (!ctx.user) throw new Error("No autenticado");
   return getProductAction(id);
 };
```

#### [MODIFY] [client.repository.js](file:///c:/Users/lalit/Documentos/BUSINESS-CONTROL/business-control/business-control/backend/src/repositories/client.repository.js)
- Sanitizar claves en `updateClient()` — usar `escapeIdentifier()` (que ya existe en el mismo archivo)

```diff
 export async function updateClient(id, data, queryRunner = pool) {
+  const ALLOWED_COLUMNS = new Set([
+    "business_name", "rfc", "email1", "email2", "celular",
+    "telefono", "codigo_postal", "ciudad"
+  ]);
   const setClauses = [];
   const params = [];
   for (const [key, value] of Object.entries(data)) {
+    if (!ALLOWED_COLUMNS.has(key)) continue;
-    setClauses.push(`${key} = ?`);
+    setClauses.push(`${escapeIdentifier(key)} = ?`);
     params.push(value);
   }
```

---

### Fase 3: Infraestructura de Calidad (**E1, A7, A9, A10**)

#### [NEW] `frontend/src/components/ErrorBoundary.jsx`
- ErrorBoundary reutilizable con fallback UI y logging
- Wrappear rutas lazy-loaded en `routes.jsx`

#### [NEW] `frontend/src/hooks/useAuth.js`
- Custom hook `useAuth()` que encapsula `useContext(AuthContext)` con validación
- Reemplazar las 13+ instancias de `useContext(AuthContext)`

#### [NEW] `frontend/src/utils/graphqlClient.js`
- Abstraer el patrón repetido de GraphQL request + error handling:

```javascript
export async function gql(query, variables = {}) {
  const { data } = await axiosClient.post("", { query, variables });
  if (data.errors?.length) throw new Error(data.errors[0].message);
  return data.data;
}
```
- Simplifica todos los `actionsAPI/*.api.js` — elimina ~200 líneas de boilerplate

#### [MODIFY] Login.jsx, Register.jsx, PortalLogin.jsx, PortalLayout.jsx, MasterPasswordGate.jsx
- Migrar llamadas directas a `Swal.fire()` → `notificationService`

#### [DELETE] Imports muertos en [loginClient.action.js](file:///c:/Users/lalit/Documentos/BUSINESS-CONTROL/business-control/business-control/backend/src/graphql/actions/client_actions/loginClient.action.js)
- Eliminar imports de `pool`, `comparePassword`, `signToken` (código muerto)

---

### Fase 4: Eliminación de Duplicación — Backend (**A4, A5, A6**)

#### [NEW] `backend/src/utils/policyStatus.js`
- Extraer `determineStatus()` y `normalizeProductType()` como funciones compartidas
- Eliminar las 3 copias en `listContactProducts.action.js`, `listAllPolicies.action.js`, `listClientProducts.action.js`

```javascript
// backend/src/utils/policyStatus.js
export function determineStatus(storedStatus, expirationDate) {
  const normalized = String(storedStatus || "").trim().toUpperCase();
  if (normalized === "CANCELLED") return "CANCELLED";
  if (normalized === "EXPIRED") return "EXPIRED";
  if (!expirationDate) return normalized || "ACTIVE";

  const now = new Date();
  const exp = new Date(expirationDate);
  if (exp < now) return "EXPIRED";

  const diffDays = Math.ceil(Math.abs(exp - now) / (1000 * 60 * 60 * 24));
  return diffDays <= 5 ? "EXPIRING_SOON" : "ACTIVE";
}

export function normalizeProductType(row) {
  const raw = String(row.product_type || "").trim().toUpperCase();
  if (raw === "SERVICE" || raw === "POLICY") return raw;

  const source = `${row.product_name || ""} ${row.product_category || ""}`
    .toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  if (source.includes("poliza")) return "POLICY";
  if (source.includes("servicio")) return "SERVICE";
  return "PRODUCT";
}
```

#### [NEW] `backend/src/middlewares/requireBackofficeRole.middleware.js`
- Extraer el middleware duplicado de routes como middleware reutilizable Express
- Actualizar `clients.routes.js` y `contacts.routes.js` para importarlo

#### [NEW] `shared/validation.js`
- Mover regex de password y validaciones compartidas
- Usado por backend `registerUser.action.js` y frontend `Login.jsx`, `Register.jsx`

---

### Fase 5: Descomposición de Componentes Frontend (**A1, A2, A8**)

#### [MODIFY] [Clients.jsx](file:///c:/Users/lalit/Documentos/BUSINESS-CONTROL/business-control/business-control/frontend/src/pages/home/Clients.jsx) (1170 → ~300 líneas)
Extraer lógica a hooks y subcomponentes:
- **[NEW]** `clients/hooks/useClientsData.js` — Estado de datos, carga, columnas dinámicas, localStorage persistence
- **[NEW]** `clients/hooks/useClientsFilter.js` — Búsqueda, filtros, filter picker
- **[NEW]** `clients/hooks/useClientsExport.js` — Exportación PDF/Excel/template
- **[NEW]** `clients/ClientsToolbar.jsx` — Barra de herramientas (búsqueda, filtros, botones export)
- **[NEW]** `clients/ClientsTable.jsx` — Tabla con expand/collapse y paginación

#### [NEW] `frontend/src/components/ui/AuthDecorativePanel.jsx`
- Extraer el panel decorativo con burbujas 3D duplicado en 4 archivos
- Prop `variant` para variaciones de color

---

### Fase 6: Rendimiento (**P1, P2, P3, P5**)

#### [NEW] `backend/src/graphql/dataloaders/` — DataLoader para N+1
- Implementar DataLoader para `Quote.client`, `Quote.user`, `Quote.contact`, `QuoteItem.product`
- Instanciar per-request en el contexto de Apollo Server
- **Impacto**: Listar 50 cotizaciones pasa de ~200 queries a ~5 queries batched

#### Memoización estratégica (Frontend)
- `React.memo()` en cell renderers de tabla y subcomponentes de row detail
- `useCallback` en handlers de eventos en componentes con tablas
- Constantes de estilo extraídas fuera del render

#### [MODIFY] `usePolicies.js`
- Cambiar eliminación secuencial `for + await` a `Promise.all()`

---

### Fase 7: Infraestructura DevOps (**F1, F2**)

#### [MODIFY] [.gitignore](file:///c:/Users/lalit/Documentos/BUSINESS-CONTROL/business-control/business-control/.gitignore)
- Remover `pnpm-lock.yaml` del gitignore

#### [MODIFY] [pnpm-workspace.yaml](file:///c:/Users/lalit/Documentos/BUSINESS-CONTROL/business-control/business-control/pnpm-workspace.yaml)
- Agregar `shared` como workspace member

#### [MODIFY] `.github/workflows/playwright.yml`
- Agregar paso de unit tests: `pnpm test:unit`
- Configurar variables de entorno mínimas para E2E

---

### Fase 8: CSS Dark Mode y Accesibilidad (**F4**)

#### [MODIFY] [index.css](file:///c:/Users/lalit/Documentos/BUSINESS-CONTROL/business-control/business-control/frontend/src/styles/index.css)
- Reemplazar ~400 líneas de dark mode `!important` overrides con CSS custom properties
- Definir tokens semánticos: `--color-surface`, `--color-text-primary`, etc.

#### [MODIFY] [tailwind.config.js](file:///c:/Users/lalit/Documentos/BUSINESS-CONTROL/business-control/business-control/frontend/tailwind.config.js)
- Registrar colores hardcodeados como tokens del design system

#### Accesibilidad básica
- `role="alert"` en mensajes de error
- `aria-label` en botones con solo iconos
- `role="dialog"` en modales

---

## Open Questions

> [!IMPORTANT]
> 1. **¿Conservar idioma español en variables/funciones?** Tu codebase tiene una mezcla intencional: español para UI strings y algunos nombres de funciones, inglés para la estructura. ¿Prefieres mantener la convención actual o migrar todo a inglés?

> [!IMPORTANT]
> 2. **¿Agregar TypeScript?** Sin TypeScript ni PropTypes. Agregar TS sería la mejora de mantenibilidad más grande posible pero es una migración significativa. ¿Lo incluimos en este scope?

> [!IMPORTANT]
> 3. **Comportamiento de `registerUserAction`** — Actualmente, si el rol ya tiene un usuario asignado, **sobrescribe las credenciales** del usuario existente en vez de rechazar el registro. ¿Es intencional (cada rol tiene exactamente 1 usuario) o es un bug?

> [!IMPORTANT]
> 4. **¿Prioridad de tests?** ¿Incluimos setup de testing framework (Vitest + React Testing Library) en esta refactorización?

---

## Justificación Técnica

### ¿Por qué estos cambios hacen el código más mantenible y profesional?

1. **`requireRoles` en role mutations (S1)** → Sin esto, cualquier request GraphQL puede crear o eliminar roles. Es el equivalente a dejar la puerta de la bóveda abierta.

2. **`escapeHtml()` para templates (S3)** → Un cliente con `business_name: "<script>alert('xss')</script>"` ejecutaría JavaScript en el PDF/email. Con escape, se renderiza como texto inofensivo.

3. **`crypto.timingSafeEqual()` (S4)** → La comparación `===` revela información sobre la contraseña correcta a través del tiempo de respuesta. Un atacante sofisticado puede inferir caracteres midiendo microsegundos.

4. **DataLoader para N+1 (P1)** → Sin DataLoader, listar 50 cotizaciones dispara: 50 queries para clients + 50 para users + 50 para contacts + 50 para items = **200 queries**. Con DataLoader: 4 queries batched. Es la diferencia entre 200ms y 2000ms.

5. **`determineStatus()` compartida (A4)** → 3 copias idénticas de ~25 líneas cada una. Si cambias la lógica de "EXPIRING_SOON" a 7 días, tienes que encontrar y actualizar 3 archivos. Con una función compartida, un solo cambio.

6. **`gql()` helper (A9)** → Las 9 API files del frontend repiten el mismo patrón de 6 líneas. Una función de 4 líneas elimina ~200 líneas de código duplicado y centraliza el manejo de errores GraphQL.

7. **ErrorBoundary (E1)** → Sin él, un `TypeError` en un cell renderer de tabla crashea TODA la aplicación. Con ErrorBoundary, solo ese componente muestra un fallback y el resto sigue funcionando.

8. **CSS custom properties vs `!important` (F4)** → Las 400 líneas de overrides son una bomba de tiempo: cada nuevo componente con `bg-white` necesita un override manual. Con custom properties, dark mode funciona automáticamente para componentes nuevos.

---

## Verification Plan

### Automated Tests
```bash
# 1. Backend inicia sin errores
pnpm dev:backend

# 2. Frontend compila sin errores
pnpm --filter frontend build

# 3. Unit tests existentes pasan
pnpm test:unit  # 5 tests de quotePricingRules

# 4. Verificar que roles requieren autenticación
# (manual: intentar createRole sin token → debe fallar)
```

### Manual Verification
- Login/register/portal login funcionan correctamente
- Crear cotización y enviar por email (verificar que HTML no ejecuta scripts)
- Eliminar un rol como admin (debe funcionar) vs sin auth (debe rechazar)
- Dark mode se ve correcto después de cambios CSS
- Tabla de clientes: filtros, búsqueda, expand, exportación PDF/Excel
- Chat de soporte funciona end-to-end
