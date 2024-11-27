#!/bin/sh
npx prisma migrate deploy
/usr/local/lib/node_modules/pm2/bin/pm2-runtime start npm --name "scriptorium" -- start