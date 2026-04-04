# Business Control — Backend

## Requisitos
- Node.js 18+
- MySQL 8+

## Setup
1) Crea tu DB usando `sql/init.sql`
2) Copia `.env.example` a `.env` y ajusta credenciales
3) Instala deps:
```bash
npm i
```
4) Dev:
```bash
npm run dev
```

GraphQL: `http://localhost:4000/graphql`
Health: `http://localhost:4000/health`

## Usuario inicial (ADMIN)
En `sql/init.sql` se crea un ADMIN por defecto:

- email: `admin@businesscontrol.com`
- password: `Admin123*`
