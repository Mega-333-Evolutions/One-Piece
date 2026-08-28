# Use the official Node.js 18 image
FROM node:18-slim

# Install git and C++ build tools required for sharp and image processing
RUN apt-get update && apt-get install -y \
    git \
    python3 \
    make \
    g++ \
    libvips-dev \
    && rm -rf /var/lib/apt/lists/*

# Set the working directory inside the container
WORKDIR /app

# 1. COPY EVERYTHING FIRST
# This prevents your GitHub files from overwriting the installations below
COPY . .

# 2. Delete any accidentally copied node_modules (prevents OS conflicts)
RUN rm -rf node_modules

# 3. Install your standard dependencies
RUN npm install --unsafe-perm

# 4. Explicitly install the correct Linux version of sharp
RUN npm install sharp --platform=linux --arch=x64

# Expose port 7860 for Hugging Face Spaces health check
EXPOSE 7860

# Start dummy web server on port 7860 to pass HF health checks,
# then start your bot using npm start
CMD node -e "require('http').createServer((req, res) => res.end('Bot is running!')).listen(7860);" & npm start
