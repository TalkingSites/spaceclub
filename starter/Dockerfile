# Production image for Coolify: builds the site, then serves it with SpaceClub's server
# (sign-in, saving and the real preview for Spacedash), which comes from the spaceclub package.
FROM docker.io/node:20-alpine

WORKDIR /app

COPY package.json ./
RUN npm install

COPY . .
RUN npm run build

ENV PORT=3000
EXPOSE 3000

CMD ["node", "node_modules/spaceclub/server/index.cjs"]
