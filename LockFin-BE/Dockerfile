# ================================
# Stage 1: Build
# ================================
FROM node:22-alpine AS builder

WORKDIR /app

# Install deps first (layer cache)
COPY package*.json ./
RUN npm ci

# Copy source & build
COPY . .
RUN npm run build

# ================================
# Stage 2: Production
# ================================
FROM node:22-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

# Only production dependencies
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy built output
COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["node", "dist/main"]
