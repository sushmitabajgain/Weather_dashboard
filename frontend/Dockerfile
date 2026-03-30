FROM node:20-alpine AS build

WORKDIR /app

ARG VITE_API_URL=/graphql
ARG VITE_BASE_URL=
ARG VITE_AGENT_URL=/agent/chat

ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_BASE_URL=${VITE_BASE_URL}
ENV VITE_AGENT_URL=${VITE_AGENT_URL}

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:1.27-alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
