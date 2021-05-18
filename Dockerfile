FROM node:14

RUN apt-get update

RUN echo "alias checkConnections=\"node src/index.js --check\"" >> ~/.bashrc
RUN echo "alias crawlForMatchingWebsites=\"node src/index.js --crawl -u \"$@\"\"" >> ~/.bashrc

#create a working directory
WORKDIR /usr/src/app

#copy package.json file under the working directory
COPY package.json /usr/src/app

RUN npm install

# Bundle app source
COPY . .
