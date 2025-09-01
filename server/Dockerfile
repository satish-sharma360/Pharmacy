# Use Node.js image
FROM node:20

# Create app directory
WORKDIR /app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install --only=production

# Copy rest of backend files
COPY . .

# Expose port (e.g., 5000)
EXPOSE 5000

# Run backend
CMD ["npm", "start"]
