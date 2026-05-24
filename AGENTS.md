# AGENTS.md

## Setup Commands

- Local development: `docker compose up` (runs MkDocs with live reload)
- Build for production: `docker build -t qcon-guide .`
- Build static site locally: `mkdocs build --site-dir /public` (inside the mkdocs-material container)
- Helm lint: `helm lint charts/`
- Helm validate: `helm template test charts/ | kubeconform -strict -summary -schema-location default -ignore-missing-schemas`

## Code Style

- Documentation is written in Markdown using MkDocs Material theme
- Follow conventional commit format for all PR titles and commits
- Use lowercase imperative mood for commit subjects
- License: MPL-2.0

## Project Structure

- `/docs` — Markdown source files for documentation pages
- `/docs/css` — Custom stylesheets
- `/docs/javascripts` — Custom JavaScript
- `/docs/assets` — Images, example files, and other static assets
- `/docs/detailed-question-types` — Per-question-type documentation pages
- `/docs/additional-info` — Supplementary documentation pages
- `/conf.d/default.conf` — Nginx configuration for production serving
- `/charts/` — Helm chart for Kubernetes deployment (flat layout)
- `/mkdocs.yml` — MkDocs configuration (site name, theme, plugins, navigation)
- `/.github/workflows/` — CI/CD pipelines

## Development Workflow

- Create feature branches from `main`
- Use pull requests for code review
- PR titles must follow conventional commits (enforced by `pr-title-lint.yaml`)
- Squash commits before merging

## CI/CD

- CI uses shared `bcit-tlu/.github` OCI build reusable workflow
- `helm-lint` validates Helm charts on every push and PR
- `release-please` manages versioning via conventional commits (`release-type: "simple"`)
- Version is tracked in `.release-please-manifest.json` and `Chart.yaml` (`# x-release-please-version` annotations)
- Images are published to `ghcr.io/bcit-tlu/qcon-guide/qcon-guide`
- Charts are published to `oci://ghcr.io/bcit-tlu/qcon-guide/charts`
- `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24: true` is set in all workflows

## Deployment

- CI uses the shared `bcit-tlu/.github` OCI build reusable workflow
- Helm chart is published to `oci://ghcr.io/bcit-tlu/qcon-guide/charts`
- Deployed to Kubernetes via Flux CD (see `bcit-tlu/flux-fleet`)
- Ingress: `qcon-guide.<CLUSTER_ENV>.ltc.bcit.ca`
