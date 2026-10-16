FROM node:24-alpine
WORKDIR /app

ENV NODE_ENV=production

COPY . .
RUN npm ci --include=dev && npm run build # --include=dev, weil NODE_ENV=production npm sonst die Build-Werkzeuge auslässt.

EXPOSE 3333
CMD ["npm", "start"]
