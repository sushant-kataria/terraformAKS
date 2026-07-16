# PageAgent Connect

Based on [alibaba/page-agent](https://github.com/alibaba/page-agent) — the GUI agent that lives in your webpage.

This repo ships the upstream PageAgent monorepo plus a **simplified Connect UI** so you can:

1. Start with one command
2. Log in providers / add models in the browser
3. Copy a one-line script, NPM snippet, or bookmarklet to connect any page

## One command

```bash
npm install
npm start
```

Open the URL Vite prints (default `http://localhost:5173`).

## Connect UI

In the Connect UI you can:

- **Log in models** — DashScope, OpenAI, OpenRouter, DeepSeek, Ollama, LM Studio, or a custom OpenAI-compatible endpoint
- **Save sessions** — API keys stay in `localStorage` on your machine
- **Copy connect snippets**
    - `npm start` (local UI)
    - `<script>` tag with your model baked into the CDN URL
    - NPM `PageAgent` constructor config
    - Bookmarklet for any site
- **Try a playground** — launch PageAgent on the Connect page and run a natural-language task

## Upstream PageAgent

Everything under `packages/` except `packages/connect` comes from upstream PageAgent (`v1.12.1`).

Useful upstream commands:

```bash
npm run start:website   # full docs site
npm run dev:demo        # library demo
npm run build           # build packages
```

Docs: [alibaba.github.io/page-agent](https://alibaba.github.io/page-agent/)

## License

MIT — see [LICENSE](./LICENSE). Upstream attribution and terms for the free testing API are in [docs/terms-and-privacy.md](./docs/terms-and-privacy.md).
