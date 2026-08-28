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

# Start dummy web server and run the bot directly (bypassing preload.js)
# Start dummy web server, start bot, and keep container alive for 60s after a crash to read the logs
CMD node -e "require('http').createServer((req, res) => res.end('Bot is running!')).listen(7860);" & node index.js ; sleep 60
