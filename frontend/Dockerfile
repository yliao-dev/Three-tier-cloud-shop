FROM node:20-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json to leverage Docker layer caching
COPY package*.json ./

RUN npm ci

# Copy the rest of the source code
COPY . .

# Expose the port Vite runs on
EXPOSE 5173

# The command to run the development server
# --host is needed to expose the server to other Docker containers
CMD ["npm", "run", "dev", "--", "--host"]