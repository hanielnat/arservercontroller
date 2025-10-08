FROM node:20-alpine AS base

RUN corepack enable pnpm && corepack prepare pnpm@latest --activate

WORKDIR /app

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./

RUN pnpm install --frozen-lockfile

COPY . .

EXPOSE 3000

CMD ["pnpm", "dev", "--host", ${FRONTEND_HOST}, "--port", ${FRONTEND_PORT}]
