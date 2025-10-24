FROM node:18-alpine

# Install required dependencies
RUN apk add --no-cache \
    git \
    curl \
    jq \
    bash

# Create app directory
WORKDIR /app

# Copy action files
COPY package*.json ./
COPY src/ ./src/

# Install dependencies
RUN npm ci --only=production

# Copy entrypoint script
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Set entrypoint
ENTRYPOINT ["/entrypoint.sh"]