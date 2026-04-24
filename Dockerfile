# Use a Node.js base image
FROM node:20-alpine

# Set working directory
WORKDIR /app

COPY package.json ./
COPY package-lock.json ./

RUN npm install --only=production

COPY . .

RUN npm run build

EXPOSE 5300

CMD ["npm", "run", "start:api"]
