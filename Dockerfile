FROM node:18-slim

WORKDIR /app

COPY server/package*.json ./

RUN npm install --only=production

COPY /server .

EXPOSE 8080

CMD ["node", "index.js"]
