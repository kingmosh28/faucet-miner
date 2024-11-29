FROM node:16

WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./
RUN npm install

# Bundle app source
COPY . .

# Standard Node.js port
EXPOSE 3000

# Start command
CMD [ "node", "index.js" ]
