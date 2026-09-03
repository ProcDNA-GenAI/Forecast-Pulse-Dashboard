FROM node:20-alpine AS deps

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

FROM node:20-alpine AS builder

WORKDIR /app

ARG NEXT_PUBLIC_API_URL=/backend-api
ARG NEXT_PUBLIC_CHAT_DISEASE_AREA_NAME=CVD
ARG NEXT_PUBLIC_CHAT_DATASOURCE_NAME=

ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL} \
    NEXT_PUBLIC_CHAT_DISEASE_AREA_NAME=${NEXT_PUBLIC_CHAT_DISEASE_AREA_NAME} \
    NEXT_PUBLIC_CHAT_DATASOURCE_NAME=${NEXT_PUBLIC_CHAT_DATASOURCE_NAME} \
    NEXT_TELEMETRY_DISABLED=1

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    NEXT_PUBLIC_API_URL=/backend-api \
    PORT=3000 \
    HOSTNAME=0.0.0.0

COPY --from=builder --chown=node:node /app/public ./public
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static

EXPOSE 3000

USER node

CMD ["node", "server.js"]
