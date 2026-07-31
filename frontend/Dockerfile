# ============================================
# Frontend — Vite + React → Nginx
# ============================================

# --- Stage 1: Build ---
FROM node:22-slim AS builder

RUN corepack enable && corepack prepare pnpm@11.1.1 --activate

WORKDIR /app

# Copy workspace root files needed for pnpm install
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY frontend/package.json ./frontend/
COPY shared/package.json ./shared/
COPY backend/package.json ./backend/

# Install dependencies for frontend and shared only
RUN pnpm install --frozen-lockfile --filter frontend... --filter shared...

# Copy source code
COPY shared/ ./shared/
COPY frontend/ ./frontend/

# Build the frontend
# The API URL is injected at build time via ARG
ARG VITE_API_URL=http://localhost:4000/graphql
ENV VITE_API_URL=$VITE_API_URL

RUN pnpm --dir frontend build

# --- Stage 2: Serve with Nginx ---
FROM nginx:1.27-alpine AS runner

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom nginx config
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from builder stage
COPY --from=builder /app/frontend/dist /usr/share/nginx/html

# Non-root nginx (optional, nginx alpine runs as nginx user by default)
EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
    CMD wget -qO- http://localhost:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
