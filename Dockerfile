FROM node:20.11.1-alpine

RUN npm install -g pnpm

WORKDIR /app

COPY . .

RUN pnpm install && pnpm build

CMD node dist/server.js

EXPOSE 3333