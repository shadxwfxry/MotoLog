#!/bin/zsh

# Check for .env and add AI_API_KEY if missing
if [ ! -f .env ]; then
  echo "DATABASE_URL=\"file:./dev.db\"" > .env
  echo "NEXTAUTH_SECRET=\"$(openssl rand -base64 32)\"" >> .env
  echo "NEXTAUTH_URL=\"http://localhost:3000\"" >> .env
fi

if ! grep -q "AI_API_KEY" .env; then
  echo 'AI_API_KEY="AIzaSyDpcQiaHwPOcGAiH5OpT0czTyn76608UhI"' >> .env
fi

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

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
