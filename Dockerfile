## Build
# Pin to a specific digest for reproducible builds.
# Image: squidfunk/mkdocs-material:latest (2025-05-11)
FROM squidfunk/mkdocs-material@sha256:868ad4d39fb5865b72d00173ade00f4eae2b38dde7ff790a011cc44ce4a8ff8e AS builder
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
