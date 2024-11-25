FROM node:16

WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./
RUN npm install

# Bundle app source
COPY . .

# Keep the port exposure - Back4app requires it
EXPOSE 8080

# Start the money printer
CMD [ "node", "index.js" ]
