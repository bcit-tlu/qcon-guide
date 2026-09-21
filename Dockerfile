# Build
FROM zensical/zensical:0.0.63 AS builder
WORKDIR /app

COPY . /app

RUN ["zensical", "build"]

# Release
FROM nginxinc/nginx-unprivileged:alpine3.24-perl

LABEL maintainer=courseproduction@bcit.ca
LABEL org.opencontainers.image.source="https://github.com/bcit-tlu/qcon-guide"
LABEL org.opencontainers.image.description="Qcon Guide — documentation for using the Qcon question conversion tool."

COPY conf.d/default.conf /etc/nginx/conf.d/default.conf

WORKDIR /usr/share/nginx/html

COPY --from=builder /app/public/ ./
