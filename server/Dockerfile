FROM node:22-alpine

WORKDIR /app

ENV NODE_ENV=production

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY . .

# Runtime directory for generated PDF reports / uploaded files.
RUN mkdir -p storage

EXPOSE 5000

CMD ["node", "server.js"]