#!/usr/bin/env bash
# ==============================
# Script para parar a API antes do deploy
# ==============================

# Carrega NVM
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Caminho do projeto
cd /var/www/html/mentis-api/

# Para a aplicação PM2
if pm2 show mentis-api &> /dev/null; then
    echo "Parando aplicação mentis-api..."
    pm2 stop mentis-api
    pm2 save
else
    echo "Aplicação mentis-api não está rodando."
fi

# Para o Nginx (opcional)
# sudo systemctl stop nginx
