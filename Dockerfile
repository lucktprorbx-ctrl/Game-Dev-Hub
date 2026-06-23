FROM node:20-alpine

RUN apk add --no-cache bash

WORKDIR /app

RUN npm install -g pnpm@10

COPY . .

RUN pnpm install --frozen-lockfile

RUN pnpm --filter @workspace/api-server run build

EXPOSE 5000 8080

CMD ["bash", "scripts/docker-start.sh"]
