FROM node:20.11.1-bullseye

WORKDIR /petaN/admin

COPY . .

RUN rm -rf node_modules

RUN apt-get update

RUN apt-get install -y python3 python-is-python3

RUN npm install -g npm@latest

RUN npm install sharp

RUN npm install --loglevel=error

RUN npm run build &> /dev/null

CMD [ "npm", "run", "dev" ]