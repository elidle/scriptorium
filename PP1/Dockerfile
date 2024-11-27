FROM node:20-bullseye AS installer
WORKDIR /app

RUN apt-get update && apt-get install -y \
    python3 \
    gcc \
    g++ \
    docker.io \
    curl \
    zip \
    unzip \
    && rm -rf /var/lib/apt/lists/*

COPY --from=openjdk:17-jdk-alpine /opt/openjdk-17 /usr/java/openjdk-17
ENV JAVA_HOME=/usr/java/openjdk-17
ENV PATH="${JAVA_HOME}/bin:${PATH}"

RUN curl -s https://get.sdkman.io | bash \
    && bash -c "source $HOME/.sdkman/bin/sdkman-init.sh && sdk install kotlin"

COPY package*.json ./
RUN npm install

FROM node:20-bullseye AS release
WORKDIR /app

COPY --from=installer /app /app
COPY --from=installer /root/.sdkman/candidates/kotlin /usr/local/kotlin
ENV PATH="/usr/local/kotlin/bin:${PATH}"

COPY . .
RUN npx prisma generate

RUN npm run build

EXPOSE 3000
ENV NODE_ENV=production

COPY run.sh .
RUN chmod +x run.sh
CMD ["./run.sh"]