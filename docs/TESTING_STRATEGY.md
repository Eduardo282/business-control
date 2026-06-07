# Business Control Testing Strategy

This project uses a layered testing strategy so quality can be demonstrated at business-flow level, not only with isolated assertions.

## Quality layers

### 1. Unit and domain tests

Fast tests for pure business rules.

```bash
pnpm run test:unit
```

Current coverage:

- Quote item calculations.
- Quote pricing rules.
- Quote folio rules.
- Product type normalization.

### 2. Frontend component tests

React component tests run with Vitest, JSDOM and Testing Library.

```bash
pnpm run test:frontend
pnpm run test:coverage
```

Coverage HTML output:

```text
coverage/frontend/index.html
```

The current frontend coverage gate is intentionally scoped to the critical product-source selector. New critical UI modules should be added to `vitest.config.js` as they receive tests.

### 3. Backend integration tests

GraphQL/backend tests that can write to a real isolated MySQL database.

Default run skips destructive database tests:

```bash
pnpm --dir backend test
```

To run database integration tests:

```bash
$env:RUN_INTEGRATION_TESTS="true"
pnpm --dir backend test
```

Expected test database environment:

```bash
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=root
MYSQL_DATABASE=business_control_test
```

### 4. End-to-End tests with Playwright

Playwright validates complete user flows through the real UI, backend and database.

```bash
pnpm run test:e2e
```

For the visual presentation mode:

```bash
$env:E2E_BASE_URL="http://127.0.0.1:5173"
$env:E2E_ADMIN_EMAIL="admin@businesscontrol.com"
$env:E2E_ADMIN_PASSWORD="Admin123*"
$env:E2E_REGISTER_PRODUCTS="true"
pnpm run test:e2e:demo
```

If you want Playwright to start backend and frontend automatically:

```bash
$env:PLAYWRIGHT_START_SERVERS="true"
```

Open the HTML report:

```bash
pnpm exec playwright show-report
```

Open a trace:

```bash
pnpm exec playwright show-trace test-results/**/trace.zip
```

## CI quality gate

GitHub Actions runs:

1. dependency install,
2. MySQL test database setup,
3. shared unit tests,
4. frontend component tests,
5. backend integration tests,
6. frontend coverage report,
7. frontend production build,
8. Playwright E2E smoke tests,
9. artifact upload for Playwright and coverage reports.

Workflow:

```text
.github/workflows/playwright.yml
```

## Presentation script

1. Show the GitHub Actions pipeline in green.
2. Open the frontend coverage HTML report.
3. Run Playwright UI Mode:

```bash
pnpm run test:e2e:ui
```

4. Open the product registration trace and show the automated user:
   - logs in,
   - opens product registration,
   - creates a category,
   - registers a service,
   - verifies it appears in the product catalog.

The key message is:

> The critical business flow is protected from UI to MySQL, and every pull request must pass the same quality gate.

## Isolated MySQL integration and real E2E

Use this layer when you want to prove the complete business flow against MySQL without touching your local development database.

### Database integration

```bash
pnpm run test:integration:db
```

What it does:

- creates/uses `business_control_test` by default;
- refuses to reset a database unless its name starts with `test_` or ends with `_test`;
- rebuilds a minimal schema for products, clients, contacts, quotes and portal visibility;
- verifies product registration → quote creation → quote registration → contact portal visibility.

### Real Playwright E2E

```bash
pnpm run test:e2e:real
```

What it does:

- starts the backend against `business_control_test`;
- starts the frontend against that backend;
- creates a real product and quote through GraphQL;
- proves the quote is hidden before registration;
- registers the quote;
- logs into the contact portal UI and verifies the quote, quote folio and product folio are visible.

This command writes only to the isolated test database. Do not use `ALLOW_NON_TEST_DATABASE=true` unless you intentionally know what you are doing.
