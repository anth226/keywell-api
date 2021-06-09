FROM node:14.16.1-alpine AS build
WORKDIR /app
COPY . .
RUN apk add --no-cache --virtual .gyp python make g++ \
    && npm ci \
    && apk del .gyp
RUN NODE_OPTIONS="--max-old-space-size=4096" NODE_ENV=production npm run build

FROM node:14.16.1-alpine
EXPOSE 4000
COPY --from=build /app/dist /app
COPY package.json package-lock.json app/
COPY graphql app/graphql
WORKDIR /app
RUN npm ci
CMD ["node", "--require", "dotenv/config", "server"]
