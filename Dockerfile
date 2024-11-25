FROM node:16

WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./
RUN npm install

# Bundle app source
COPY . .

# Remove port exposure since we don't need it
# EXPOSE 8080 

# Start the money printer without health checks
CMD [ "node", "index.js" ]
