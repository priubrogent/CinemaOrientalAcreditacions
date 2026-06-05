FROM node:20-slim

WORKDIR /app

# Install dependencies for better-sqlite3
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./
COPY client/package*.json ./client/
COPY server/package*.json ./server/

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build client and server
RUN npm run build

# Create data directory for SQLite
RUN mkdir -p /app/data

EXPOSE 3001

CMD ["npm", "run", "start"]
