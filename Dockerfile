FROM node:22-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# image penuh (devDeps sengaja dipertahankan): drizzle-kit + tsx dipakai saat
# DB_PUSH=true untuk push schema & seed ke database segar
FROM node:22-slim
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app ./
EXPOSE 3000
CMD sh -c "if [ \"$DB_PUSH\" = \"true\" ]; then npx drizzle-kit push && npx tsx scripts/seed.ts || echo 'DB push/seed gagal'; fi; npm run start"
