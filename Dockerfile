# =========================
# Stage 1: Build
# =========================
FROM node:20-bullseye AS builder
WORKDIR /app

# Copy package files and install all dependencies (including dev for build + Prisma)
COPY package*.json tsconfig.json ./
RUN npm install

# Copy Prisma schema and source code
COPY prisma ./prisma
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# =========================
# Stage 2: Production
# =========================
FROM node:20-bullseye AS runner
WORKDIR /app

# Copy only production dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy built files
COPY --from=builder /app/dist ./dist

# Copy Prisma client files needed at runtime
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Set environment variables for Cloud Run
ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080

# Start the server
CMD ["node", "dist/server.js"]
