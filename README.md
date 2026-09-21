# Business Control

[![Quality Gate](https://github.com/Eduardo282/business-control/actions/workflows/playwright.yml/badge.svg)](https://github.com/Eduardo282/business-control/actions/workflows/playwright.yml)

Business Control es una aplicación web para administrar clientes, contactos, productos, cotizaciones y ventas desde un backoffice, con un portal independiente para los contactos de cada cliente. El sistema centraliza el ciclo comercial, desde el registro del catálogo y la creación de una cotización hasta su respuesta en el portal, la generación de la venta y el soporte posterior.

El repositorio es un monorepo de `pnpm` compuesto por una aplicación React, una API Node.js con GraphQL y REST, reglas de negocio compartidas y una base de datos MySQL.

## Vista rápida

| Componente   | Responsabilidad                                       | Puerto local                             |
| ------------ | ----------------------------------------------------- | ---------------------------------------- |
| Frontend     | Backoffice y portal de contactos                      | `5173`                                   |
| Backend      | GraphQL, REST, autenticación, PDF, correo y Socket.IO | `4000`                                   |
| MySQL        | Persistencia principal                                | `3306` local o `3307` con Docker Compose |
| GraphQL      | Endpoint principal de la API                          | `http://localhost:4000/graphql`          |
| Health check | Estado básico del backend                             | `http://localhost:4000/health`           |

## Funcionalidades principales

### Backoffice

- Autenticación con JWT y acceso por roles `ADMIN`, `VENTAS` y `SOPORTE`.
- Registro, edición, consulta y desactivación lógica de clientes y contactos.
- Importación masiva y columnas dinámicas para información de clientes y contactos.
- Catálogo de productos, servicios, categorías, precios e historial de cambios.
- Creación de cotizaciones con productos, cantidades, descuentos, impuestos y reglas de precios compartidas.
- Generación y envío de cotizaciones por correo electrónico.
- Historial y seguimiento del estado de las cotizaciones.
- Registro de cotizaciones aceptadas y generación de ventas.
- Consulta del detalle de ventas y sus partidas.
- Exportación de tablas a PDF y Excel.
- Borradores persistentes para formularios de trabajo.
- Chat de soporte en tiempo real con los contactos del portal.

### Portal de contactos

- Inicio de sesión independiente para contactos autorizados.
- Panel con productos, servicios, cotizaciones y actividad reciente.
- Consulta y respuesta de cotizaciones.
- Consulta de ventas generadas a partir de cotizaciones aceptadas.
- Catálogo de productos y servicios disponibles.
- Chat de soporte en tiempo real.
- Recuperación de contraseña y ajustes de cuenta.

## Stack tecnológico

| Área            | Tecnologías principales                                                      |
| --------------- | ---------------------------------------------------------------------------- |
| Frontend        | React 18, Vite 5, React Router, TanStack Query, TanStack Table, Tailwind CSS |
| Backend         | Node.js, Express 5, Apollo Server 5, GraphQL, Socket.IO                      |
| Datos           | MySQL 8, `mysql2`, migraciones SQL versionadas                               |
| Seguridad       | JWT, bcryptjs, Helmet, CORS y protección de rutas por roles                  |
| Documentos      | Puppeteer, jsPDF, jsPDF-AutoTable, ExcelJS y SheetJS                         |
| Integraciones   | Nodemailer y validación de correo con ZeroBounce, obligatoria en producción  |
| Calidad         | ESLint, Vitest, Node Test Runner, Playwright y GitHub Actions                |
| Infraestructura | pnpm workspaces, Docker Compose y Nginx                                      |

## Arquitectura actual

Business Control funciona como un **monolito modular**: frontend, backend y base de datos se despliegan como componentes separados, pero pertenecen al mismo producto y repositorio. La modularización está en progreso; existen módulos por dominio junto con carpetas horizontales heredadas. Por eso el proyecto no se presenta como una implementación completa de Clean Architecture o arquitectura hexagonal.

```text
React / Vite
    |
    |-- GraphQL -----------------------> Apollo resolvers
    |                                      |
    |                                      v
    |                                módulos / acciones
    |                                      |
    |-- REST (clientes y contactos) --> rutas / servicios
                                           |
                                           v
                                  repositorios / MySQL

Portal y backoffice <------ Socket.IO ------> soporte en tiempo real
```

Las reglas de cálculo que deben coincidir entre frontend y backend viven en `shared/`, evitando que una cotización se calcule de forma diferente en cada lado.

## Estructura del repositorio

```text
business-control/
|-- frontend/                 # Aplicación React: backoffice y portal
|   |-- src/actionsAPI/       # Operaciones GraphQL y REST
|   |-- src/components/       # Componentes reutilizables y controles de acceso
|   |-- src/features/         # Módulos frontend en proceso de consolidación
|   |-- src/pages/home/       # Pantallas del backoffice
|   |-- src/pages/portal/     # Pantallas del portal de contactos
|   |-- src/services/         # Clientes y servicios transversales
|   `-- src/utils/            # Exportaciones, formato y utilidades
|-- backend/
|   |-- src/graphql/          # Schema, resolvers, policies y DataLoaders
|   |-- src/modules/          # Casos de uso agrupados por dominio
|   |-- src/repositories/     # Persistencia MySQL
|   |-- src/routes/           # Endpoints REST de clientes y contactos
|   |-- src/services/         # PDF, correo e integraciones
|   |-- src/chat/             # Gateway Socket.IO
|   |-- src/migrations/       # Ejecutor de migraciones
|   `-- sql/                  # Baseline, migraciones y datos de demostración
|-- shared/                   # Reglas de precios y validaciones compartidas
|-- tests/                    # Pruebas end-to-end con Playwright
|-- docs/                     # Manual técnico extendido
|-- docker-compose.yml        # MySQL, backend y frontend
`-- .github/workflows/        # Quality Gate de CI
```

## Inicio rápido con Docker

Docker Compose reúne MySQL, backend y frontend en un solo entorno.

### Requisitos

- Docker Desktop con Docker Compose.
- Puertos disponibles: `80`, `4000` y `3307`, o sus equivalentes configurados.

> [!IMPORTANT]
> El `baseline.sql` actual combina algunas columnas `client_id NOT NULL` con claves foráneas `ON DELETE SET NULL`. MySQL rechaza esa combinación al crear una base vacía. El entorno Docker funciona con un volumen compatible ya inicializado, pero el bootstrap desde cero requiere corregir primero el baseline. Esta limitación se documenta para no presentar la instalación limpia como reproducible mientras siga pendiente.

### 1. Preparar las variables

PowerShell:

```powershell
Copy-Item .env.docker .env
```

Bash:

```bash
cp .env.docker .env
```

Antes de iniciar, edita `.env` y reemplaza las claves y contraseñas de ejemplo. En especial, configura valores seguros para `MYSQL_ROOT_PASSWORD`, `JWT_SECRET` y `MASTER_PASSWORD`.

### 2. Construir e iniciar

```bash
docker compose up -d --build
```

Cuando el volumen está vacío, MySQL intenta crear el esquema desde `backend/sql/baseline.sql`; ten en cuenta la limitación indicada arriba. El backend ejecuta las migraciones pendientes porque el contenedor define `RUN_MIGRATIONS=true`.

Servicios disponibles con los puertos predeterminados:

- Aplicación: `http://localhost`
- GraphQL: `http://localhost:4000/graphql`
- Health check: `http://localhost:4000/health`
- MySQL desde el host: `localhost:3307`

### 3. Cargar datos de demostración (opcional)

`backend/sql/seeds.sql` contiene usuarios y datos de demostración. Debe utilizarse solamente en entornos locales o de prueba.

PowerShell:

```powershell
Get-Content -Raw .\backend\sql\seeds.sql | docker compose exec -T db sh -c 'mysql -uroot -p"$MYSQL_ROOT_PASSWORD" "$MYSQL_DATABASE"'
```

Bash:

```bash
docker compose exec -T db sh -c 'mysql -uroot -p"$MYSQL_ROOT_PASSWORD" "$MYSQL_DATABASE"' < backend/sql/seeds.sql
```

Las cuentas de demostración están documentadas dentro del archivo de seeds. No deben conservarse en un despliegue real.

### Comandos útiles de Docker

```bash
docker compose ps
docker compose logs -f backend
docker compose down
```

`docker compose down -v` elimina también el volumen y todos los datos de MySQL. Utilízalo solamente cuando realmente quieras reiniciar la base de datos.

## Desarrollo local

### Requisitos

- Node.js 22 o superior. La imagen Docker usa Node 22 y CI usa Node 24.
- pnpm `11.1.1`.
- MySQL 8, local o mediante el servicio `db` de Docker Compose.

### 1. Instalar dependencias

```bash
corepack enable
corepack prepare pnpm@11.1.1 --activate
pnpm install --frozen-lockfile
```

### 2. Configurar el backend

PowerShell:

```powershell
Copy-Item backend/.env.example backend/.env
```

Bash:

```bash
cp backend/.env.example backend/.env
```

Configuración mínima para usar la base de datos de Docker en desarrollo:

```dotenv
PORT=4000
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3307
MYSQL_USER=root
MYSQL_PASSWORD=<tu_contrasena>
MYSQL_DATABASE=business_control
JWT_SECRET=<una_clave_larga_y_aleatoria>
JWT_EXPIRES_IN=7d
MASTER_PASSWORD=<contrasena_maestra_local>
CORS_ORIGIN=http://localhost:5173
RUN_MIGRATIONS=true
```

Para correo y validación de direcciones agrega, cuando correspondan, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` y `ZEROBOUNCE_API_KEY`.

### 3. Configurar el frontend

PowerShell:

```powershell
Copy-Item frontend/.env.example frontend/.env
```

Bash:

```bash
cp frontend/.env.example frontend/.env
```

```dotenv
VITE_API_URL=http://localhost:4000/graphql
```

`VITE_API_URL` se incorpora durante la compilación del frontend. Si cambia, reinicia Vite o vuelve a construir la aplicación.

### 4. Preparar la base de datos

Para utilizar solamente MySQL desde Docker:

```bash
docker compose up -d db
```

Con una base MySQL que ya tenga un esquema compatible, configura la conexión y ejecuta las migraciones pendientes:

```bash
pnpm --dir backend migrate
```

La tabla `schema_migrations` registra cada archivo aplicado desde `backend/sql/migrations/`.

No importes el baseline actual en una base vacía sin resolver antes la incompatibilidad descrita en [Solución de problemas](#mysql-rechaza-el-baseline-en-una-base-vacía).

### 5. Iniciar frontend y backend

Terminal 1:

```bash
pnpm dev:backend
```

Terminal 2:

```bash
pnpm dev:frontend
```

Abre `http://localhost:5173`. El backend quedará disponible en `http://localhost:4000`.

## Variables de entorno

### Backend

| Variable                        | Uso                                               | Requerida                  |
| ------------------------------- | ------------------------------------------------- | -------------------------- |
| `PORT`                          | Puerto HTTP/HTTPS del backend                     | No, usa `4000`             |
| `MYSQL_HOST`                    | Host de MySQL                                     | Sí                         |
| `MYSQL_PORT`                    | Puerto de MySQL                                   | No, usa `3306`             |
| `MYSQL_USER`                    | Usuario de MySQL                                  | Sí                         |
| `MYSQL_PASSWORD`                | Contraseña de MySQL                               | Según el servidor          |
| `MYSQL_DATABASE`                | Base de datos principal                           | Sí                         |
| `JWT_SECRET`                    | Firma de tokens del sistema                       | Sí en producción           |
| `JWT_EXPIRES_IN`                | Vigencia de los tokens                            | No, usa `7d`               |
| `MASTER_PASSWORD`               | Acceso protegido a registro y gestión sensible    | Sí en producción           |
| `CORS_ORIGIN`                   | Origen permitido para el frontend                 | Sí                         |
| `RUN_MIGRATIONS`                | Ejecuta migraciones al iniciar cuando vale `true` | No                         |
| `SMTP_HOST`, `SMTP_PORT`        | Servidor de correo                                | Para envío de correo       |
| `SMTP_USER`, `SMTP_PASS`        | Credenciales SMTP                                 | Sí en producción           |
| `ZEROBOUNCE_API_KEY`            | Validación externa de correos                     | Sí en producción           |
| `LOG_LEVEL`                     | Nivel del logger                                  | No, usa `info`             |
| `SSL_KEY_PATH`, `SSL_CERT_PATH` | TLS directo desde Node                            | Solo si Node termina HTTPS |
| `ALLOW_UNSECURE_HTTP`           | Permite HTTP de producción detrás de un proxy TLS | Solo en ese escenario      |

El backend también acepta `ZERO_BOUNCE_API_KEY` como alias de `ZEROBOUNCE_API_KEY`.

### Frontend

| Variable       | Uso                                                                            |
| -------------- | ------------------------------------------------------------------------------ |
| `VITE_API_URL` | URL completa del endpoint GraphQL, por ejemplo `http://localhost:4000/graphql` |

### Docker Compose

`DB_EXTERNAL_PORT`, `BACKEND_PORT` y `FRONTEND_PORT` permiten cambiar los puertos publicados. `MYSQL_ROOT_PASSWORD`, `MYSQL_DATABASE`, `JWT_SECRET`, `MASTER_PASSWORD`, SMTP y CORS se inyectan a sus contenedores correspondientes.

## Scripts disponibles

Ejecuta estos comandos desde la raíz del repositorio.

| Comando                    | Descripción                                        |
| -------------------------- | -------------------------------------------------- |
| `pnpm dev:frontend`        | Inicia Vite en modo desarrollo                     |
| `pnpm dev:backend`         | Inicia el backend con Nodemon                      |
| `pnpm build`               | Genera el build de producción del frontend         |
| `pnpm lint`                | Ejecuta ESLint en el repositorio                   |
| `pnpm test`                | Ejecuta pruebas compartidas, frontend y backend    |
| `pnpm test:unit`           | Pruebas de reglas compartidas con Node Test Runner |
| `pnpm test:frontend`       | Pruebas frontend con Vitest y jsdom                |
| `pnpm test:integration`    | Suite del backend                                  |
| `pnpm test:integration:db` | Integración explícita contra MySQL de prueba       |
| `pnpm test:e2e`            | Pruebas Playwright                                 |
| `pnpm test:coverage`       | Cobertura frontend en `coverage/frontend/`         |
| `pnpm test:ci`             | Unitarias, frontend, backend y build               |

Las pruebas E2E pueden iniciar sus propios servidores configurando `PLAYWRIGHT_START_SERVERS=true`. Consulta `playwright.config.js` para las variables de base de datos y URLs de prueba.

## Base de datos

La persistencia se organiza alrededor de estos grupos:

- Usuarios, roles y borradores.
- Clientes, columnas dinámicas y contactos.
- Productos, categorías, precios e historial de actualizaciones.
- Cotizaciones, partidas y estados de respuesta.
- Ventas y partidas de venta.
- Productos asignados, servicios y pólizas.
- Conversaciones y mensajes de soporte.

Archivos principales:

- `backend/sql/baseline.sql`: esquema inicial; actualmente tiene una incompatibilidad documentada más abajo.
- `backend/sql/migrations/`: cambios incrementales versionados.
- `backend/sql/seeds.sql`: datos de demostración para desarrollo.

No edites una base compartida manualmente para simular una migración. Agrega un archivo SQL nuevo y ejecuta `pnpm --dir backend migrate`.

## API e integraciones

- **GraphQL:** interfaz principal para autenticación, roles, productos, categorías, cotizaciones, ventas, clientes, contactos y borradores.
- **REST:** operaciones dinámicas de clientes y contactos bajo `/api/clients` y `/api/contacts`.
- **Socket.IO:** conversaciones de soporte en tiempo real.
- **PDF:** cotizaciones renderizadas en backend con Puppeteer y reportes tabulares generados en frontend con jsPDF.
- **Excel:** exportaciones con ExcelJS e importaciones con SheetJS.
- **Correo:** envío SMTP con Nodemailer y validación con ZeroBounce; ambos requieren credenciales en producción.

El contrato GraphQL completo está en [`backend/src/graphql/schema.graphql`](backend/src/graphql/schema.graphql).

## Seguridad

El proyecto incluye JWT, hash de contraseñas con bcrypt, autorización por roles, políticas para recursos, middleware de autenticación, Helmet, CORS configurable, cookies endurecidas cuando se utilizan y bloqueo de HTTP plano en producción salvo que exista un proxy HTTPS.

Antes de desplegar:

1. Sustituye todas las credenciales y claves de demostración.
2. Usa un `JWT_SECRET` largo y aleatorio.
3. Configura HTTPS directo o mediante un proxy inverso.
4. Restringe `CORS_ORIGIN` al dominio real.
5. No cargues `backend/sql/seeds.sql` en producción.
6. Mantén `.env` fuera del control de versiones.

Estas medidas reducen riesgos, pero no sustituyen una auditoría de seguridad del entorno final.

## Calidad y CI

El workflow [`Quality Gate`](.github/workflows/playwright.yml) se ejecuta en pushes y pull requests hacia `main` o `master`.

La canalización valida:

1. Instalación reproducible con `pnpm install --frozen-lockfile`.
2. ESLint.
3. Pruebas compartidas y frontend.
4. Cobertura con Vitest.
5. MySQL de integración.
6. Pruebas backend.
7. Build de producción.
8. Smoke tests E2E con Playwright y Chromium.

## Solución de problemas

### Vite muestra `504 Outdated Optimize Dep`

Ocurre cuando cambian dependencias mientras el servidor sigue abierto. Detén Vite, limpia su caché y vuelve a iniciarlo:

```powershell
Remove-Item -Recurse -Force frontend/node_modules/.vite
pnpm --dir frontend dev --force
```

### El backend no conecta con MySQL

- Usa `MYSQL_PORT=3307` si el backend corre en el host y MySQL está en Docker.
- Usa `MYSQL_HOST=db` y `MYSQL_PORT=3306` solamente dentro de Docker Compose.
- Verifica `docker compose ps` y `http://localhost:4000/health`.

### MySQL rechaza el baseline en una base vacía

El baseline actual define algunas columnas `client_id` como `NOT NULL` y, al mismo tiempo, configura sus claves foráneas con `ON DELETE SET NULL`. MySQL no permite esa combinación, por lo que una inicialización completamente nueva puede detenerse antes de ejecutar las migraciones.

La corrección pendiente consiste en alinear esas columnas con las relaciones definidas en `backend/sql/migrations/022_soft_delete_clients.sql` y volver a validar el bootstrap sobre un volumen vacío. No se recomienda resolverlo con cambios manuales en una base compartida.

### El PDF no encuentra Chromium

Docker ya incluye Chromium. En ejecución local, configura `PUPPETEER_EXECUTABLE_PATH` si Puppeteer no puede localizar un navegador compatible.

### Los correos no se envían

Revisa las variables SMTP y las restricciones del proveedor. En producción, el backend exige credenciales SMTP válidas.

## Documentación adicional

- [`docs/MANUAL_COMPLETO.md`](docs/MANUAL_COMPLETO.md): recorrido técnico y funcional extendido.
- [`backend/src/graphql/schema.graphql`](backend/src/graphql/schema.graphql): contrato GraphQL.
- [`backend/sql/baseline.sql`](backend/sql/baseline.sql): esquema de base de datos.
- [`playwright.config.js`](playwright.config.js): configuración E2E.
- [`vitest.config.js`](vitest.config.js): pruebas y cobertura frontend.

## Estado del proyecto

Business Control está en desarrollo activo. Cuenta con flujos funcionales de backoffice y portal, pruebas automatizadas, CI y despliegue reproducible con Docker. La arquitectura se está consolidando gradualmente por dominios; los cambios nuevos deben respetar los módulos existentes, mantener las reglas de negocio compartidas y evitar reescrituras masivas sin cobertura.
