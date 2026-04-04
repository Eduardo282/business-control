# Guia de API y Funciones

## 1. Interfaces expuestas

El proyecto expone dos tipos de interfaz:

- GraphQL en `http://localhost:4000/graphql`
- REST auxiliar en `http://localhost:4000/api/*`

Autenticacion:

- Backoffice: JWT con payload `{ userId, role }`
- Portal: JWT con payload `{ contactId, clientId, role: "CONTACT_PORTAL" }`

Header esperado:

```http
Authorization: Bearer <token>
```

## 2. Queries GraphQL

### 2.1 Autenticacion y roles

| Query | Parametros | Retorno | Acceso | Notas |
| --- | --- | --- | --- | --- |
| `me` | Sin parametros | `User \| null` | Token valido | Devuelve el usuario autenticado |
| `roles` | Sin parametros | `[Role!]!` | Publico | Se usa para poblar el formulario de registro |

### 2.2 Clientes y contactos

| Query | Parametros | Retorno | Acceso | Notas |
| --- | --- | --- | --- | --- |
| `clients` | Sin parametros | `[Client!]!` | `ADMIN`, `VENTAS` | Lista ordenada por `business_name` |
| `client` | `id: ID!` | `Client` | `ADMIN`, `VENTAS` | Incluye `contacts` via resolver de tipo |
| `searchClients` | `q: String!` | `[Client!]!` | `ADMIN`, `VENTAS` | Busca por razon social, RFC y correo principal |
| `contactsByClient` | `client_id: ID!` | `[Contact!]!` | `ADMIN`, `VENTAS` | Lista contactos activos/portal por cliente |
| `contact` | `id: ID!` | `Contact` | `ADMIN`, `VENTAS`, `CONTACT_PORTAL` | El contacto portal solo puede consultarse a si mismo |

### 2.3 Productos y politicas

| Query | Parametros | Retorno | Acceso | Notas |
| --- | --- | --- | --- | --- |
| `products` | `client_id: ID` | `[Product!]!` | Backoffice o portal | En portal se fuerza `clientId` del token |
| `portalProducts` | Sin parametros | `[PortalProduct!]!` | `CONTACT_PORTAL` | Catalogo visible para autoservicio |
| `product` | `id: ID!` | `Product` | Token valido | Incluye `price_history` |
| `searchProducts` | `q: String!`, `client_id: ID` | `[Product!]!` | Backoffice o portal | Filtra por nombre/categoria |
| `policies` | Sin parametros | `[ContactProduct!]!` | `ADMIN`, `VENTAS`, `SOPORTE` | Lista servicios/licencias con vigencia |

### 2.4 Cotizaciones

| Query | Parametros | Retorno | Acceso | Notas |
| --- | --- | --- | --- | --- |
| `quotes` | Sin parametros | `[Quote!]!` | `ADMIN`, `VENTAS`, `CONTACT_PORTAL` | Cambia el subconjunto segun el rol |
| `quote` | `id: ID!` | `Quote` | `ADMIN`, `VENTAS` | Devuelve detalle completo |
| `quotesByClient` | `client_id: ID!` | `[Quote!]!` | `ADMIN`, `VENTAS` | Historial por cliente |
| `pendingQuoteRequestsCount` | Sin parametros | `Int!` | `ADMIN`, `VENTAS` | Cuenta solicitudes `REQUESTED` |
| `unreadQuoteRequests` | Sin parametros | `[Quote!]!` | `ADMIN`, `VENTAS` | Notificaciones pendientes de leer |

## 3. Mutations GraphQL

### 3.1 Autenticacion

| Mutation | Parametros | Retorno | Acceso | Notas |
| --- | --- | --- | --- | --- |
| `login` | `input: LoginInput!` | `AuthPayload!` | Publico | Login de usuarios internos |
| `loginContact` | `email: String!`, `password: String!` | `LoginContactPayload!` | Publico | Login de portal |
| `registerUser` | `input: RegisterUserInput!` | `User!` | Publico | Crea o actualiza el usuario asociado a un rol |

### 3.2 Clientes

| Mutation | Parametros | Retorno | Acceso | Notas |
| --- | --- | --- | --- | --- |
| `createClient` | `input: CreateClientInput!` | `Client!` | `ADMIN`, `VENTAS` | Inserta cliente y registra `created_by_user_id` |
| `bulkCreateClients` | `inputs: [CreateClientInput!]!` | `[Client!]!` | `ADMIN`, `VENTAS` | Insercion por lotes |
| `updateClient` | `id: ID!`, `input: UpdateClientInput!` | `Client!` | `ADMIN`, `VENTAS` | Actualizacion parcial |
| `deleteClient` | `id: ID!` | `Boolean!` | `ADMIN`, `VENTAS` | Borra contactos y limpia historial de productos ligados |

### 3.3 Contactos y servicios

| Mutation | Parametros | Retorno | Acceso | Notas |
| --- | --- | --- | --- | --- |
| `createContact` | `input: CreateContactInput!` | `Contact!` | `ADMIN`, `VENTAS` | Inserta contacto |
| `bulkCreateContacts` | `inputs: [CreateContactInput!]!` | `[Contact!]!` | `ADMIN`, `VENTAS` | Insercion por lotes |
| `updateContact` | `id: ID!`, `input: UpdateContactInput!` | `Contact!` | `ADMIN`, `VENTAS` | Puede habilitar portal y enviar correo |
| `deleteContact` | `id: ID!` | `Boolean!` | `ADMIN`, `VENTAS` | Baja logica, no borrado fisico |
| `createContactProduct` | `input: CreateContactProductInput!` | `ContactProduct!` | `ADMIN`, `VENTAS` | Asigna servicio/licencia a contacto |
| `deleteContactProduct` | `id: ID!` | `Boolean!` | `ADMIN` | Elimina servicio asignado |

### 3.4 Productos

| Mutation | Parametros | Retorno | Acceso | Notas |
| --- | --- | --- | --- | --- |
| `createProduct` | `input: CreateProductInput!` | `Product!` | `ADMIN`, `VENTAS` | Inserta producto e historial inicial |
| `updateProduct` | `id: ID!`, `input: UpdateProductInput!` | `Product!` | `ADMIN`, `VENTAS` | Actualizacion parcial |
| `deleteProduct` | `id: ID!` | `Boolean!` | `ADMIN` | Borra historial y producto |
| `updateProductPrice` | `id: ID!`, `price: Float!` | `Product!` | `ADMIN`, `VENTAS` | Actualiza precio e inserta historial |
| `clearProductPriceHistory` | `product_id: ID!` | `Boolean!` | `ADMIN`, `VENTAS` | Limpia `product_price_history` |

### 3.5 Cotizaciones

| Mutation | Parametros | Retorno | Acceso | Notas |
| --- | --- | --- | --- | --- |
| `createQuote` | `input: CreateQuoteInput!` | `Quote!` | `ADMIN`, `VENTAS` | Crea cotizacion y servicios si hay contacto |
| `resolveQuoteRequest` | `requestId: ID!`, `input: CreateQuoteInput!` | `Quote!` | `ADMIN`, `VENTAS` | Convierte solicitud del portal a cotizacion operativa |
| `deleteQuote` | `id: ID!` | `Boolean!` | `ADMIN`, `VENTAS` | Borra registro de cotizacion |
| `markQuoteNotificationRead` | `id: ID!` | `Boolean!` | `ADMIN`, `VENTAS` | Marca la solicitud como leida |
| `sendQuoteEmail` | `quote_id: ID!`, `contact_email: String!`, `message: String!` | `SendEmailResponse!` | `ADMIN`, `VENTAS` | Valida email, genera PDF y envia correo |
| `toggleQuotePortal` | `id: ID!`, `access: Boolean!`, `contact_id: ID` | `Boolean` | `ADMIN`, `VENTAS` | Publica/oculta cotizacion en portal |
| `requestQuote` | `input: RequestQuoteInput!` | `Quote!` | `CONTACT_PORTAL` | Solicitud desde portal |

### 3.6 Roles

| Mutation | Parametros | Retorno | Acceso | Notas |
| --- | --- | --- | --- | --- |
| `createRole` | `name: String!` | `Role!` | Sin proteccion backend actual | Normaliza a mayusculas |
| `deleteRole` | `id: ID!` | `Boolean!` | Sin proteccion backend actual | Falla si hay usuarios ligados |

## 4. Endpoints REST

| Metodo | Ruta | Acceso | Descripcion | Respuesta |
| --- | --- | --- | --- | --- |
| `GET` | `/health` | Publico | Verifica disponibilidad del backend | `{ ok: true }` |
| `GET` | `/api/clients/dynamic` | `ADMIN`, `VENTAS` | Devuelve columnas visibles y filas de `clients` | `{ columns, rows }` |
| `POST` | `/api/clients/import-drive` | `ADMIN`, `VENTAS` | Importa clientes desde URL de Drive/Google Sheets | Reporte de importacion |

Payload REST de importacion:

```json
{
  "fileUrl": "https://docs.google.com/spreadsheets/d/FILE_ID/edit#gid=0"
}
```

Respuesta esperada:

```json
{
  "importedCount": 120,
  "skippedCount": 0,
  "totalRows": 120,
  "mappingMode": "name",
  "mappedColumns": ["business_name", "email1", "telefono"],
  "createdColumns": [],
  "ignoredHeaders": []
}
```

## 5. Modulos backend principales

### 5.1 Configuracion e infraestructura

| Modulo | Funcion / export | Parametros | Retorno | Descripcion |
| --- | --- | --- | --- | --- |
| `config/env.js` | `env` | N/A | Objeto | Centraliza `PORT`, JWT, MySQL, CORS y ZeroBounce |
| `config/db.js` | `pool` | N/A | `Pool` | Pool MySQL compartido |
| `middlewares/auth.middleware.js` | `authMiddleware(req, _res, next)` | Request Express | `void` | Extrae JWT y agrega `req.user` |
| `middlewares/role.middleware.js` | `requireRoles(ctxUser, allowedRoles)` | Usuario del contexto, lista de roles | `void` o error | Valida autenticacion y autorizacion |

### 5.2 Utilidades

| Modulo | Funcion | Parametros | Retorno | Descripcion |
| --- | --- | --- | --- | --- |
| `utils/jwt.js` | `signToken(payload)` | `object` | `string` | Firma JWT |
| `utils/jwt.js` | `verifyToken(token)` | `string` | `object` | Verifica JWT |
| `utils/password.js` | `hashPassword(plain)` | `string` | `Promise<string>` | Hash bcrypt |
| `utils/password.js` | `comparePassword(plain, hash)` | `string, string` | `Promise<boolean>` | Compara password vs hash |
| `utils/email.js` | `sendEmail(to, subject, text, html, attachments = [])` | Strings + adjuntos | `Promise<object>` | Envia correo o simula envio sin SMTP |
| `utils/zerobounce.js` | `verifyEmailWithZeroBounce(email)` | `string` | `Promise<object>` | Valida correo contra ZeroBounce |

### 5.3 Servicios especializados

| Modulo | Funcion | Parametros | Retorno | Descripcion |
| --- | --- | --- | --- | --- |
| `services/clientsDynamic.service.js` | `listClientsDynamicAction()` | Sin parametros | `{ columns, rows }` | Obtiene tabla dinamica de `clients` excluyendo campos ocultos |
| `services/clientsDynamic.service.js` | `importClientsFromDriveAction({ fileUrl, createdByUserId })` | URL + usuario creador | Reporte de importacion | Descarga Excel, mapea encabezados, crea columnas y carga datos |

### 5.4 Acciones de usuarios

| Funcion | Parametros | Retorno | Comportamiento |
| --- | --- | --- | --- |
| `loginAction({ email, password })` | Credenciales internas | `{ token, user }` | Valida usuario activo y firma JWT |
| `registerUserAction({ full_name, email, telefono, password, role_name })` | Datos de usuario | `User` | Crea o actualiza el usuario asociado al rol seleccionado |
| `meAction(userId)` | `number \| string` | `User \| null` | Devuelve usuario activo con rol |
| `loginContactAction({ email, password })` | Credenciales de portal | `{ token, contact }` | Requiere acceso portal y password hash cargado |

### 5.5 Acciones de clientes

| Funcion | Parametros | Retorno | Comportamiento |
| --- | --- | --- | --- |
| `createClientAction({ created_by_user_id, business_name, rfc, email1, email2, celular, telefono, codigo_postal, ciudad })` | Datos del cliente | `Client` | Inserta cliente |
| `bulkCreateClientsAction(created_by_user_id, clients)` | Usuario creador + array | `[Client]` | Insercion por batches de 100 |
| `listClientsAction()` | Sin parametros | `[Client]` | Lista clientes ordenados |
| `getClientAction(id)` | ID de cliente | `Client \| null` | Busca cliente por id |
| `searchClientsAction(q)` | Texto de busqueda | `[Client]` | Busca por nombre, RFC y email |
| `updateClientAction(id, input)` | ID + campos opcionales | `Client` | Actualizacion parcial |
| `deleteClientAction(id)` | ID | `boolean` | Transaccion con limpieza de contactos e historial de productos ligados |

### 5.6 Acciones de contactos y servicios

| Funcion | Parametros | Retorno | Comportamiento |
| --- | --- | --- | --- |
| `createContactAction({ client_id, full_name, email, phone, position_title })` | Datos de contacto | `Contact` | Inserta contacto |
| `bulkCreateContactsAction(contacts)` | Array de contactos | `[Contact]` | Insercion por batches de 100 |
| `listContactsByClientAction(client_id)` | ID de cliente | `[Contact]` | Lista y normaliza booleanos |
| `getContactAction(id)` | ID de contacto | `Contact` | Consulta directa |
| `updateContactAction(id, input)` | ID + campos opcionales | `Contact` | Actualiza datos, acceso portal y correo de bienvenida |
| `deleteContactAction(id)` | ID de contacto | `boolean` | Baja logica (`is_active = 0`) |
| `createContactProductAction({ contact_id, product_id, license_key, start_date, expiration_date })` | Asignacion de servicio | `ContactProduct` | Inserta servicio activo ligado a contacto |
| `deleteContactProductAction(id)` | ID del servicio | `boolean` | Elimina servicio |
| `listContactProductsAction(contact_id)` | ID de contacto | `[ContactProduct]` | Calcula estado `ACTIVE`, `EXPIRING_SOON` o `EXPIRED` |

### 5.7 Acciones de productos

| Funcion | Parametros | Retorno | Comportamiento |
| --- | --- | --- | --- |
| `createProductAction({ name, category, price, description, users_count, client_id })` | Datos del producto | `Product` | Inserta producto y primer registro de historial |
| `listProductsAction({ client_id } = {})` | Filtro opcional | `[Product]` | Devuelve productos globales o por cliente |
| `searchProductsAction(q, client_id)` | Texto + cliente opcional | `[Product]` | Busca por nombre y categoria |
| `getProductAction(id)` | ID | `Product \| null` | Hidrata historial de precios |
| `updateProductAction(id, input)` | ID + patch | `Product` | Actualizacion parcial |
| `updateProductPriceAction(id, newPrice)` | ID + nuevo precio | `Product` | Transaccion: actualiza precio e historial |
| `clearProductPriceHistoryAction(productId)` | ID de producto | `boolean` | Limpia historial |
| `deleteProductAction(id)` | ID | `boolean` | Elimina historial y producto |

### 5.8 Acciones de cotizaciones

| Funcion | Parametros | Retorno | Comportamiento |
| --- | --- | --- | --- |
| `createQuoteAction(input, user)` | `CreateQuoteInput`, usuario autenticado | `Quote` | Calcula totales, inserta quote/items y genera servicios si aplica |
| `requestQuoteAction(input, user)` | `RequestQuoteInput`, contacto portal | `Quote` | Inserta solicitud `REQUESTED` desde portal |
| `resolveQuoteRequestAction(requestId, input, user)` | ID solicitud + quote final + vendedor | `Quote` | Convierte solicitud a `PENDING` y genera servicios |
| `listQuotesAction()` | Sin parametros | `[Quote]` | Lista cotizaciones que no sean `REQUESTED` |
| `listQuotesByClientAction(client_id)` | ID cliente | `[Quote]` | Historial por cliente |
| `listQuotesByUserAction(user_id)` | ID usuario | `[Quote]` | Historial por vendedor |
| `listPortalQuotesAction(client_id)` | ID cliente | `[Quote]` | Solo cotizaciones publicadas en portal |
| `getQuoteAction(id)` | ID cotizacion | `Quote` | Consulta directa |
| `getQuoteItemsAction(quote_id)` | ID cotizacion | `[QuoteItem]` | Devuelve items |
| `sendQuoteEmailAction({ quote_id, contact_email, message })` | Datos de envio | `{ success, message }` | Valida email, genera PDF y envia correo |
| `toggleQuotePortalAction(id, access, contact_id)` | ID, bandera, contacto opcional | `boolean` | Publica/oculta en portal |
| `getUnreadQuoteRequestsAction()` | Sin parametros | `[Quote]` | Recupera solicitudes no leidas |
| `markQuoteNotificationReadAction(id)` | ID | `boolean` | Marca `notification_read = 1` |
| `deleteQuoteAction(id)` | ID | `boolean` | Elimina cotizacion |

### 5.9 Acciones de roles y politicas

| Funcion | Parametros | Retorno | Comportamiento |
| --- | --- | --- | --- |
| `listRolesAction()` | Sin parametros | `[Role]` | Lista roles |
| `createRoleAction({ name })` | Nombre | `Role` | Inserta rol en mayusculas |
| `deleteRoleAction({ id })` | ID de rol | `boolean` | Falla si hay usuarios asociados |
| `listAllPoliciesAction()` | Sin parametros | `[ContactProduct]` | Lista servicios/polizas con producto, cliente y contacto precargados |

## 6. Modulos frontend principales

### 6.1 Cliente HTTP

| Modulo | Export | Descripcion |
| --- | --- | --- |
| `actionsAPI/axiosClient.js` | `axiosClient` | Cliente HTTP principal; usa `bc_token` o `bc_portal_token` segun ruta |
| `actionsAPI/portalAxiosClient.js` | `portalAxiosClient` | Cliente dedicado al portal; solo usa `bc_portal_token` |

### 6.2 API helpers del backoffice

| Modulo | Funciones principales | Uso |
| --- | --- | --- |
| `auth.api.js` | `loginApi`, `meApi`, `registerUserApi` | Sesion y configuracion de usuarios |
| `clients.api.js` | `listClientsApi`, `getClientApi`, `searchClientsApi`, `createClientApi`, `updateClientApi`, `deleteClientApi`, `bulkCreateClientsApi`, `listClientsDynamicApi`, `importClientsFromDriveApi` | Gestion de clientes e importacion |
| `contacts.api.js` | `createContactApi`, `updateContactApi`, `deleteContactApi`, `listContactProductsApi`, `createContactProductApi`, `deleteContactProductApi`, `bulkCreateContactsApi` | Gestion de contactos y servicios |
| `products.api.js` | `listProductsApi`, `getProductApi`, `createProductApi`, `updateProductApi`, `updateProductPriceApi`, `searchProductsApi`, `deleteProductApi`, `clearProductPriceHistoryApi` | Catalogo de productos |
| `quotes.api.js` | `listQuotesApi`, `listQuotesByClientApi`, `getQuoteApi`, `createQuoteApi`, `resolveQuoteRequestApi`, `deleteQuoteApi`, `getPendingQuoteRequestsCountApi`, `getUnreadQuoteRequestsApi`, `markQuoteNotificationReadApi`, `sendQuoteEmailApi`, `toggleQuotePortalApi` | Cotizaciones y notificaciones |
| `roles.api.js` | `getRolesApi`, `createRoleApi`, `deleteRoleApi` | Mantenimiento de roles |

### 6.3 API helpers del portal

| Modulo | Funciones principales | Uso |
| --- | --- | --- |
| `portal.api.js` | `loginContactApi`, `getContactDataApi`, `listPortalQuotesApi`, `listPortalProductsApi`, `requestQuoteApi` | Sesion de contactos y autoservicio |

## 7. Snippets de uso

### 7.1 Login desde JavaScript

```js
import { loginApi } from "./src/actionsAPI/auth.api";

const session = await loginApi("admin@businesscontrol.com", "Admin123*");
localStorage.setItem("bc_token", session.token);
console.log(session.user.role.name);
```

### 7.2 Crear un cliente desde JavaScript

```js
import { createClientApi } from "./src/actionsAPI/clients.api";

const client = await createClientApi({
  business_name: "ACME SA de CV",
  rfc: "ACM010101AAA",
  email1: "compras@acme.com",
  telefono: "3331234567",
  codigo_postal: "44100",
  ciudad: "Guadalajara",
});

console.log(client.id);
```

### 7.3 Crear cotizacion desde GraphQL

```graphql
mutation CreateQuote($input: CreateQuoteInput!) {
  createQuote(input: $input) {
    id
    folio
    total
    status
  }
}
```

Variables:

```json
{
  "input": {
    "client_id": "1",
    "contact_id": "2",
    "folio": "COT-2026-001",
    "notes": "Propuesta anual",
    "items": [
      { "product_id": "10", "quantity": 3 },
      { "product_id": "12", "quantity": 1 }
    ]
  }
}
```

### 7.4 Solicitar cotizacion desde portal

```js
import { requestQuoteApi } from "./src/actionsAPI/portal.api";

await requestQuoteApi([
  { product_id: "10", quantity: 2 },
  { product_id: "12", quantity: 1 },
]);
```

### 7.5 Importar clientes desde Google Drive

```js
import { importClientsFromDriveApi } from "./src/actionsAPI/clients.api";

const report = await importClientsFromDriveApi(
  "https://docs.google.com/spreadsheets/d/FILE_ID/edit#gid=0",
);

console.log(report.importedCount, report.createdColumns);
```

## 8. Consideraciones funcionales importantes

- `registerUserAction` no crea multiples usuarios por rol; si ya existe uno para ese rol, actualiza sus credenciales.
- `quotes` cambia su comportamiento por rol:
  - `VENTAS`: solo sus cotizaciones
  - `CONTACT_PORTAL`: solo las publicadas para su cliente
  - `ADMIN`: todas las cotizaciones operativas
- `products(client_id)` devuelve productos globales y del cliente indicado.
- `updateContactAction` envia correo si recibe `portal_password` y el contacto tiene email.
- `sendEmail` puede trabajar en modo simulado si faltan credenciales SMTP.
- La importacion dinamica puede crear columnas nuevas en `clients`.

## 9. Riesgos tecnicos que afectan la API

- El esquema SQL base no refleja completamente todas las columnas usadas por el codigo actual.
- Existen dos nombres de variable para ZeroBounce (`ZERO_BOUNCE_API_KEY` y `ZEROBOUNCE_API_KEY`).
- La gestion de roles necesita endurecimiento backend.
- El envio de cotizaciones por correo depende de Puppeteer y recursos del sistema.
