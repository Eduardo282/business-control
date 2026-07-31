# ============================================
# Backend — Node.js + Apollo GraphQL + Puppeteer
# ============================================

# --- Stage 1: Dependencies ---
FROM node:22-slim AS deps

# Puppeteer needs these system libraries for Chromium
RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium \
    fonts-liberation \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    xdg-utils \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Tell Puppeteer to use the system Chromium instead of downloading its own
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Enable pnpm via corepack
RUN corepack enable && corepack prepare pnpm@11.1.1 --activate

WORKDIR /app

# Copy workspace root files needed for pnpm install
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY backend/package.json ./backend/
COPY shared/package.json ./shared/
# Frontend package.json needed because it's declared in pnpm-workspace
COPY frontend/package.json ./frontend/

# Install dependencies for backend and shared only
RUN pnpm install --frozen-lockfile --filter backend... --filter shared...

# --- Stage 2: Production image ---
FROM node:22-slim AS runner

RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium \
    fonts-liberation \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    xdg-utils \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV NODE_ENV=production

RUN corepack enable && corepack prepare pnpm@11.1.1 --activate

# Create non-root user for security
RUN groupadd --gid 1001 appuser && \
    useradd --uid 1001 --gid 1001 --create-home appuser

WORKDIR /app

# Copy dependency artifacts from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/backend/node_modules ./backend/node_modules
COPY --from=deps /app/pnpm-workspace.yaml ./
COPY --from=deps /app/package.json ./

# Copy source code
COPY shared/ ./shared/
COPY backend/ ./backend/

# Remove dev files not needed in production
RUN rm -rf backend/tests backend/.env backend/.env.example

# Switch to non-root user
USER appuser

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
    CMD node -e "fetch('http://localhost:4000/graphql',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({query:'{__typename}'})}).then(r=>{if(!r.ok)throw Error();process.exit(0)}).catch(()=>process.exit(1))"

CMD ["node", "backend/src/index.js"]
