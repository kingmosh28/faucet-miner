FROM node:16

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./
RUN npm install

# Bundle app source
COPY . .

# Expose port if needed
EXPOSE 8080

# Start the money printer
CMD [ "npm", "start" ]
