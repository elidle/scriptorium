#!/bin/bash
docker pull python:3-alpine
docker pull node:alpine
docker pull gcc:latest
docker pull openjdk:17-jdk-alpine
docker pull mcr.microsoft.com/dotnet/sdk:6.0-alpine
docker pull r-base:latest
docker pull zenika/kotlin:latest
docker pull swift:latest

# Seed database once during startup
npx prisma generate
npx prisma migrate deploy
npx prisma seed