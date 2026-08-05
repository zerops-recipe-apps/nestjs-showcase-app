# nestjs-showcase-app

React 19 + TypeScript SPA built with Vite 8 — dashboard frontend for the NestJS showcase API. Each card exercises one backing capability via `src/lib/api.ts`.

## Zerops service facts

- HTTP port: dev `5173` (vite dev) / prod `80` (nginx)
- Siblings: `api` — `VITE_API_URL` baked at build time from `${API_URL}`
- Runtime base: dev `nodejs@22` / prod `static`

## Zerops dev

`setup: dev` idles on `zsc noop --silent`; the agent starts the dev server.

- Dev command: `npm run dev`
- In-container rebuild without deploy: `npm run build`

**All platform operations (start/stop/status/logs of the dev server, deploy, env / scaling / storage / domains) go through the Zerops development workflow via `zcp` MCP tools. Don't shell out to `zcli`.**

## Notes

- `VITE_API_URL` is embedded at build time — static prod runtime cannot read OS env later.
- Favicon lives in `public/favicon.ico`.
- Dev server binds `0.0.0.0:5173` in `vite.config.ts`.
