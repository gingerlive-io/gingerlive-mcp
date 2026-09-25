# Local stdio build of the GingerLive MCP server (same tools as https://mcp.gingerlive.io/mcp).
FROM node:22-slim
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts
COPY tsconfig.json ./
COPY src ./src
CMD ["npx", "tsx", "src/stdio.ts"]
