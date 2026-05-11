## Build
FROM squidfunk/mkdocs-material AS builder
WORKDIR /app

RUN set -ex \
    && pip install \
        Pygments \
        pymdown-extensions \
        mkdocs-git-revision-date-localized-plugin \
        mkdocs-glightbox \
        mkdocs-minify-plugin \
    ;

COPY . /app

RUN set -ex \
    && mkdocs build --site-dir /public

## Release
FROM nginxinc/nginx-unprivileged:alpine3.22-perl

LABEL maintainer=courseproduction@bcit.ca
LABEL org.opencontainers.image.source="https://github.com/bcit-tlu/qcon-guide"
LABEL org.opencontainers.image.description="Qcon Guide — documentation for using the Qcon question conversion tool."

COPY conf.d/default.conf /etc/nginx/conf.d/default.conf

WORKDIR /usr/share/nginx/html

COPY --from=builder /public/ ./
