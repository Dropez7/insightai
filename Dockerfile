# Imagem base do Node.js (versão LTS, mais leve com "alpine")
FROM node:20-alpine

# Diretório de trabalho dentro do container
WORKDIR /app

# Copiamos primeiro só o package.json para aproveitar o cache de camadas
# do Docker: se o código mudar mas as dependências não, o Docker não
# reinstala tudo de novo, economizando muito tempo de build.
COPY package.json ./
RUN npm install

# Agora copiamos o resto do código
COPY . .

EXPOSE 3000

CMD ["npm", "start"]
