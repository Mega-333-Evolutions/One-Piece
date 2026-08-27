# Use the official Node.js 18 image (you can change to 20 if your bot requires it)
FROM node:18-slim

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json first to optimize caching
COPY package*.json ./

# Install your NPM dependencies
RUN npm install

# Copy the rest of your bot's files into the container
COPY . .

# Expose the port Hugging Face looks for
EXPOSE 7860

# Start a dummy web server on port 7860 to pass HF health checks,
# then start your bot using npm start
CMD node -e "require('http').createServer((req, res) => res.end('Bot is running!')).listen(7860);" & npm start
