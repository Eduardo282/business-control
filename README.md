# Business Control

Business Control es una plataforma full stack para administracion comercial y operativa. Centraliza clientes, contactos, catalogo de productos, cotizaciones, servicios/licencias activas y un portal de cliente para autoservicio.

La solucion resuelve tres problemas principales:

- Evita la dispersion de informacion entre hojas de calculo, correos y seguimiento manual.
- Permite operar un backoffice con roles separados para administracion, ventas y soporte.
- Expone un portal para contactos del cliente donde pueden consultar servicios vigentes y solicitar nuevas cotizaciones.

## Alcance funcional

El proyecto esta dividido en dos superficies:

- `frontend/`: backoffice y portal del cliente construidos con React.
- `backend/`: API GraphQL + endpoints REST auxiliares sobre Express y MySQL.

Los modulos principales del sistema son:

- Autenticacion de usuarios internos por rol.
- Registro/configuracion de usuarios por rol.
- Administracion de clientes y contactos.
- Catalogo de productos globales o asociados a un cliente.
- Cotizaciones con items, historial y envio por correo.
- Politicas/servicios activos por contacto con fechas de vigencia.
- Portal del cliente para ver servicios y solicitar cotizaciones.
- Importacion dinamica de clientes desde Google Drive/Excel.

## Stack Tecnologico

| Capa | Tecnologia | Uso principal |
| --- | --- | --- |
| Frontend | React 18 + Vite 5 | UI del backoffice y portal |
| Routing | React Router DOM 6 | Rutas protegidas y layouts |
| HTTP | Axios | Consumo de GraphQL y REST |
| UI | Tailwind CSS + Lucide React + SweetAlert2 | Estilos, iconografia y feedback |
| Tablas | TanStack React Table | Catalogo y listados paginados |
| Backend | Node.js + Express 4 | Servidor HTTP y middleware |
| API | Apollo Server 4 + GraphQL 16 | API principal del sistema |
| BD | MySQL 8 + mysql2/promise | Persistencia relacional |
| Seguridad | JWT + bcryptjs | Sesiones y hash de contrasenas |
| Integraciones | Nodemailer, ZeroBounce, Puppeteer, XLSX, Axios | Correo, validacion email, PDF e importacion |

## Arquitectura General

El flujo principal es:

1. El frontend obtiene un JWT mediante `login` o `loginContact`.
2. `axiosClient` o `portalAxiosClient` adjunta el token en `Authorization: Bearer`.
3. Express ejecuta `authMiddleware`, decodifica el token y agrega `req.user`.
4. Apollo expone `req.user` al contexto GraphQL.
5. Los resolvers validan roles y delegan la logica a acciones o servicios.
6. Las acciones interactuan con MySQL y, segun el caso, con email, PDF o importacion de archivos.

Documentacion complementaria:

- [Manual de arquitectura](docs/ARCHITECTURE.md)
- [Guia de API y funciones](docs/FUNCTIONS_GUIDE.md)

## Requisitos

- Node.js 18 o superior
- npm 9 o superior
- MySQL 8 o superior
- Acceso a internet si se usaran:
  - ZeroBounce
  - descarga de archivos desde Google Drive
  - envio real de correos SMTP
  - descarga de Chromium para Puppeteer en instalaciones limpias

## Guia de Instalacion

### 1. Base de datos

Ejecuta el script base:

```sql
SOURCE backend/sql/init.sql;
```

Despues aplica las migraciones existentes:

```sql
SOURCE backend/migrations/add_roles_table.sql;
SOURCE backend/migrations/add_user_phone.sql;
SOURCE backend/migrations/add_client_fields.sql;
SOURCE backend/migrations/add_product_expiration.sql;
```

Usuario inicial creado por `init.sql`:

- Email: `admin@businesscontrol.com`
- Password: `Admin123*`

### 2. Configurar backend

Archivo: `backend/.env`

Ejemplo recomendado:

```env
PORT=4000
JWT_SECRET=super-secret-change-me
JWT_EXPIRES_IN=7d

MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=tu_password
MYSQL_DATABASE=business_control

CORS_ORIGIN=http://localhost:5173

SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=tu_correo@dominio.com
SMTP_PASS=tu_password_o_app_password

ZERO_BOUNCE_API_KEY=
ZEROBOUNCE_API_KEY=
```

Nota importante:

- El codigo usa `ZERO_BOUNCE_API_KEY` en `config/env.js` y `ZEROBOUNCE_API_KEY` en `utils/zerobounce.js`. Mientras no se unifique el nombre, conviene definir ambas variables.

Instalacion y arranque:

```bash
cd backend
npm install
npm run dev
```

Endpoints locales:

- GraphQL: `http://localhost:4000/graphql`
- Health check: `http://localhost:4000/health`
- REST clientes dinamicos: `http://localhost:4000/api/clients/*`

### 3. Configurar frontend

Archivo: `frontend/.env`

```env
VITE_API_URL=http://localhost:4000/graphql
```

Instalacion y arranque:

```bash
cd frontend
npm install
npm run dev
```

URL local:

- Frontend: `http://localhost:5173`

## Snippets de Inicializacion

### Arranque rapido del proyecto

```bash
# Terminal 1
cd backend
npm install
npm run dev

# Terminal 2
cd frontend
npm install
npm run dev
```

### Login del backoffice por GraphQL

```bash
curl -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -d "{\"query\":\"mutation Login($input: LoginInput!) { login(input: $input) { token user { id full_name email role { name } } } }\",\"variables\":{\"input\":{\"email\":\"admin@businesscontrol.com\",\"password\":\"Admin123*\"}}}"
```

### Crear un cliente por GraphQL

```bash
curl -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_TOKEN" \
  -d "{\"query\":\"mutation CreateClient($input: CreateClientInput!) { createClient(input: $input) { id business_name rfc email1 ciudad } }\",\"variables\":{\"input\":{\"business_name\":\"ACME SA de CV\",\"rfc\":\"ACM010101AAA\",\"email1\":\"compras@acme.com\",\"telefono\":\"3331234567\",\"codigo_postal\":\"44100\",\"ciudad\":\"Guadalajara\"}}}"
```

### Consumir helpers del frontend

```js
import { loginApi } from "./src/actionsAPI/auth.api";
import { listClientsApi } from "./src/actionsAPI/clients.api";

const session = await loginApi("admin@businesscontrol.com", "Admin123*");
localStorage.setItem("bc_token", session.token);

const clients = await listClientsApi();
console.log(clients);
```

## Consideraciones Tecnicas Relevantes

### Seguridad

- El backend autentica mediante JWT y hash bcrypt.
- El frontend del backoffice guarda el token en `localStorage`; el portal usa `sessionStorage`.
- El endpoint de registro esta protegido en frontend por una contrasena maestra hardcodeada en `MasterPasswordGate`, no por una politica backend.
- Las mutaciones de roles (`createRole`, `deleteRole`) no validan permisos en backend actualmente.

### Manejo de errores

- GraphQL devuelve errores lanzados desde acciones/resolvers con `throw new Error(...)`.
- `authMiddleware` invalida silenciosamente tokens corruptos y deja `req.user = null`.
- El envio de correo puede trabajar en modo simulado si faltan credenciales SMTP.
- La importacion desde Drive devuelve reportes de mapeo, columnas creadas y filas procesadas.

### Escalabilidad

- El acceso a datos esta centralizado en acciones, lo que facilita refactor a servicios mas robustos.
- Existen varios resolvers con consultas adicionales por relacion; a volumen alto convendria introducir batching o DataLoader.
- El polling de notificaciones en el backoffice ocurre cada 10 segundos.
- La generacion de PDF y envio de email ocurre sin cola asyncrona; para alto volumen conviene moverlo a jobs en background.
- El esquema de BD del codigo ha evolucionado mas rapido que los scripts SQL base; revisar el manual de arquitectura antes de un despliegue limpio.

## Estructura de Documentacion

- [`README.md`](README.md): onboarding tecnico y puesta en marcha.
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md): arquitectura, flujo de datos, carpetas y riesgos tecnicos.
- [`docs/FUNCTIONS_GUIDE.md`](docs/FUNCTIONS_GUIDE.md): API GraphQL/REST, funciones principales y snippets de consumo.
