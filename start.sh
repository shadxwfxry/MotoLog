#!/bin/zsh

echo "Installing dependencies..."
npm install

echo "Generating Prisma Client..."
npx prisma generate

echo "Pushing DB schema..."
npx prisma db push

echo "Seeding database..."
npx prisma db seed

echo "Starting Next.js app..."
npm run dev
