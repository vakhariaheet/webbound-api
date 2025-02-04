FROM oven/bun:1

WORKDIR /app

# Copy package files
COPY package.json bun.lock ./

# Install dependencies
RUN bun install

# Copy the rest of the application
COPY . .

# Expose the port your app runs on
EXPOSE 3000

# Start the application
CMD ["bun", "run", "src/index.ts"]