# Use an official Node.js runtime as the base image
FROM node:alpine

# Set the working directory in the container to /app
WORKDIR /app

# Copy package.json and pnpm-lock.yaml (if available) into the root directory of the container
COPY package.json pnpm-lock.yaml* ./

# Install any needed packages specified in package.json
RUN npm install -g pnpm && pnpm install && pnpm install nestjs-typeorm-paginate eventemitter3 stripe countries-and-timezones

# Bundle the app source inside the Docker image
COPY . .

# Make port 3000 available to the outside world
EXPOSE 3000

# Define the command to run the app
CMD [ "pnpm", "start" ]