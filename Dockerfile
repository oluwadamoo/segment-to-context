# Use a Node.js base image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
# Using npm ci for reproducible builds and better performance
COPY package.json ./
COPY package-lock.json ./

# Install production dependencies
RUN npm ci --only=production

# Copy the rest of the application code
COPY . .

# Build the application (as per api/README.md)
RUN npm run build

# Expose the port the API listens on (as per APP_PORT in api/README.md)
EXPOSE 5300

# Command to start the API service (as per api/README.md)
CMD ["npm", "run", "start:api"]
