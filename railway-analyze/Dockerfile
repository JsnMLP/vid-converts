FROM node:22-slim

RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    ffmpeg \
    && pip3 install -U yt-dlp --break-system-packages \
    && ln -sf /usr/local/bin/node /usr/bin/node \
    && apt-get clean

WORKDIR /app
COPY package*.json ./
RUN npm ci --ignore-scripts
COPY . .

EXPOSE 8080
CMD ["node", "index.js"]
