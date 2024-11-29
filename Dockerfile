FROM node:16

WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./
RUN npm install

# Bundle app source
COPY index.js .
COPY command.js .
COPY worker.js .

EXPOSE 3000

# Update the start command to match actual file location
CMD [ "node", "index.js" ]
