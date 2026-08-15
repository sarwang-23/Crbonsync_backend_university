FROM node:20-alpine AS builder

WORKDIR /app

# Install openssl for Prisma
RUN apk add --no-cache openssl

COPY package*.json ./
COPY tsconfig.json ./
COPY prisma ./prisma/

RUN npm ci

COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build TypeScript code
RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app

# Install openssl for Prisma
RUN apk add --no-cache openssl

COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy generated Prisma client from builder
COPY --from=builder /app/src/generated ./src/generated

# Copy built code from builder
COPY --from=builder /app/dist ./dist

# Copy prisma schema for migrations
COPY --from=builder /app/prisma ./prisma

EXPOSE 5000

# Run migrations and start the server
CMD ["npm", "run", "start:prod"]
