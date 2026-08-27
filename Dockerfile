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

# Copy package.json and package-lock.json
COPY package*.json ./

# Install standard dependencies AND explicitly install 'sharp'
RUN npm install --unsafe-perm && npm install sharp

# Copy the rest of your bot's files into the container
COPY . .

# Expose port 7860 for Hugging Face Spaces health check
EXPOSE 7860

# Start dummy web server on port 7860 to pass HF health checks,
# then start your bot using npm start
CMD node -e "require('http').createServer((req, res) => res.end('Bot is running!')).listen(7860);" & npm start
