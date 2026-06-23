FROM node:20-alpine

WORKDIR /app

RUN npm install -g pnpm@10

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./

COPY lib/db/package.json ./lib/db/
COPY lib/api-spec/package.json ./lib/api-spec/
COPY lib/api-client-react/package.json ./lib/api-client-react/
COPY lib/api-zod/package.json ./lib/api-zod/
COPY artifacts/api-server/package.json ./artifacts/api-server/
COPY artifacts/dashboard/package.json ./artifacts/dashboard/
COPY scripts/package.json ./scripts/

RUN pnpm install

COPY . .

RUN pnpm --filter @workspace/db run push || true
RUN pnpm --filter @workspace/api-server run build

EXPOSE 5000 8080

CMD ["bash", "scripts/start-dev.sh"]
