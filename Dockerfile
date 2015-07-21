FROM mhart/alpine-node-base

WORKDIR /src
ADD . .
ENV PORT=18737
EXPOSE 18737
CMD ['node', 'server.js']
