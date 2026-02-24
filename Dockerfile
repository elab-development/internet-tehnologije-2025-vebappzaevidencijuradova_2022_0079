FROM node:22-alpine

# Instaliramo openssl jer je potreban za Prisma klijent na Alpine Linuxu
RUN apk add --no-cache openssl

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm install

COPY . .

RUN npx prisma generate
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]