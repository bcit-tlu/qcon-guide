---
title: Site Analytics
---

# Site Analytics

This site collects privacy-preserving, aggregate-only usage analytics so the
Teaching and Learning Unit can see which pages are read, how visitors arrive,
and whether people click through to [Qcon](https://qcon.ltc.bcit.ca).

## What is collected

- Page views and the referring site you arrived from
- Clicks on outbound links (for example, to Qcon or the Learning Hub) and on
  downloadable files such as the example `.docx`
- Approximate browser and device class — bucketed values like "Chrome" /
  "Windows" / "desktop" / "medium viewport", never the raw user-agent string
  or screen dimensions
- Page performance (load metrics) and JavaScript error counts
- Time spent on the site, via an anonymous per-tab session ID stored in
  `sessionStorage` and cleared when the tab closes

## What is not collected

- No cookies and no cross-page tracking identifiers
- No names, email addresses, IP logging by the beacon, or other personal data
- No content you type or files you work with — Qcon itself processes files
  locally in your browser and they are never uploaded

Analytics are delivered to BCIT's own observability platform (OpenTelemetry
and Grafana); nothing is sent to third-party analytics providers. Figures in
dashboards are aggregate counts only.
