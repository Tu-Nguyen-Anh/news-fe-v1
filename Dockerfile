# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci --frozen-lockfile

# Copy source code
COPY . .

# Build argument — can be overridden at build time
ARG VITE_API_BASE_URL=http://api.codedeohayduoc.io.vn/api/v1
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

# Build production bundle
RUN npm run build

# ── Stage 2: Serve with Nginx ──────────────────────────────────────────────────
FROM nginx:1.27-alpine

# Copy built assets
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
