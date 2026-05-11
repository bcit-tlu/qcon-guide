# AGENTS.md

## Setup Commands

- Install development dependencies: `docker compose up` (runs MkDocs with live reload)
- Build for production: `docker build -t qcon-guide .`
- Build static site locally: `mkdocs build --site-dir /public` (inside the mkdocs-material container)

## Code Style

- Documentation is written in Markdown using MkDocs Material theme
- Follow conventional commit format for all PR titles and commits
- Use lowercase imperative mood for commit subjects

## Project Structure

- `/docs` — Markdown source files for documentation pages
- `/docs/css` — Custom stylesheets
- `/docs/javascripts` — Custom JavaScript
- `/docs/assets` — Images, example files, and other static assets
- `/docs/detailed-question-types` — Per-question-type documentation pages
- `/docs/additional-info` — Supplementary documentation pages
- `/conf.d/default.conf` — Nginx configuration for production serving
- `/charts/` — Helm chart for Kubernetes deployment
- `/mkdocs.yml` — MkDocs configuration (site name, theme, plugins, navigation)
- `/.github/workflows/` — CI/CD pipelines

## Development Workflow

- Create feature branches from `main`
- Use pull requests for code review
- PR titles must follow conventional commits (enforced by `pr-title-lint.yaml`)
- Squash commits before merging
- Release versioning is managed by release-please

## Deployment

- CI uses the shared `bcit-tlu/.github` OCI build reusable workflow
- Helm chart is published to `oci://ghcr.io/bcit-tlu/qcon-guide/charts`
- Deployed to Kubernetes via Flux CD (see `bcit-tlu/flux-fleet`)
- Ingress: `qcon-guide.<CLUSTER_ENV>.ltc.bcit.ca`
