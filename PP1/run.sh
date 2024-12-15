#!/bin/sh
ls -la /app/prisma
npx prisma generate
npx prisma migrate deploy
npm start