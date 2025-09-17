#!/usr/bin/env bash
# ==============================
# Script para rodar a API após deploy
# ==============================

# Carrega NVM
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Caminho do projeto
cd /var/www/html/mentis-api/

# Usa Node correto
nvm install 20.13.1
nvm use 20.13.1

echo "Rodando Node $(node -v)"

# Instala dependências
npm install

# Prisma: gerar client e migrar banco
npx prisma generate
npx prisma migrate deploy

# Build do NestJS
npm run build

# Reinicia ou inicia aplicação no PM2
if pm2 show mentis-api &> /dev/null; then
    echo "Reiniciando mentis-api..."
    pm2 restart mentis-api
else
    echo "Iniciando mentis-api..."
    pm2 start dist/main.js --name mentis-api --restart-delay 5000
fi

pm2 save
pm2 startup
