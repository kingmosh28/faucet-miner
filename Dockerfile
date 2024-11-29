FROM node:16

WORKDIR /usr/src/app

# Copy package.json and package-lock.json first
COPY package*.json ./

# Install app dependencies
RUN npm install --production=false

# Bundle app source
COPY . .

# Standard Node.js port
EXPOSE 3000

# Start command
CMD [ "node", "src/index.js" ]
