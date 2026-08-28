# 1. UPGRADE TO NODE 20
FROM node:20-slim

# Install git and C++ build tools required for sharp
RUN apt-get update && apt-get install -y \
    git \
    python3 \
    make \
    g++ \
    libvips-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy everything
COPY . .

# Delete existing node_modules and lock files to prevent OS mismatches
RUN rm -rf node_modules package-lock.json yarn.lock

# Install standard dependencies
RUN npm install --unsafe-perm

# Explicitly install sharp for the Linux container
RUN npm install sharp

EXPOSE 7860

# Start dummy web server AND bypass flash.js to run the bot directly
CMD node -e "require('http').createServer((req, res) => res.end('Bot is running!')).listen(7860);" & node --loader ./preload.js index.js
