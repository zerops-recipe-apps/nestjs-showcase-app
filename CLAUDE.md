<!-- #ZEROPS_EXTRACT_START:claude-md# -->

# nestjs-showcase-app

React 18 + TypeScript SPA built with Vite that renders a dashboard for the NestJS showcase API. Each card on the dashboard exercises one backing capability — items CRUD, cache, queue, object storage, and search — by calling the typed fetch wrapper in `src/lib/api.ts` against a base URL baked in at build time from `VITE_API_URL`.

## Build & run

- `npm run dev` — Vite dev server on `0.0.0.0:5173` with HMR (see `vite.config.ts`).
- `npm run build` — type-check via `tsc` then emit a production bundle to `dist/`.
- `npm run preview` — serve the built `dist/` on `0.0.0.0:5173` for smoke-testing the production output.

## Architecture

- `index.html` — Vite entry document; loads `/src/main.tsx` as an ES module and preconnects Google Fonts (Geologica / JetBrains Mono / Roboto) used by the design tokens.
- `src/main.tsx` — React DOM bootstrap; mounts `<App />` inside `<React.StrictMode>` on `#root` and imports the global stylesheet.
- `src/App.tsx` — top-level dashboard layout: a full-width `StatusStrip` plus a responsive 3-2-1 column grid of `ItemsCard` / `CacheCard` / `QueueCard` / `StorageCard` / `SearchCard`. Owns the `indexedHint` state propagated from `QueueCard` down into `SearchCard` and a remount key that lets the items card refresh after cross-card mutations.
- `src/styles.css` — global Tailwind layer plus the `--zerops-*` CSS custom properties consumed by the UI primitives.
- `src/lib/api.ts` — thin `fetch` wrapper. Exports `API_BASE` (derived from `import.meta.env.VITE_API_URL`), typed response interfaces, and one function per endpoint: `listItems` / `createItem` / `deleteItem`, `cacheDemo` / `cacheState`, `queuePublish` / `queueState`, `storageState` / `storageUploadBlob` / `storageUploadFile`, `search` / `searchState`, and `servicesState`. `cacheDemo` also surfaces the `X-Cache` and `X-Cache-Elapsed-Ms` response headers because the cache badge reads from headers rather than the body.
- `src/components/StatusStrip.tsx` — leading "is anything wired?" strip; fetches `/api/services/state` and renders one `[data-test="status-<service>"]` dot per provisioned managed service.
- `src/components/ItemsCard.tsx` — list / create / delete UI over `/api/items`; calls back into `App` so siblings can refresh when items mutate.
- `src/components/CacheCard.tsx` — fires the cache-demo endpoint, displays hit/miss counters and the `X-Cache` header badge.
- `src/components/QueueCard.tsx` — publishes events via `/api/queue/publish`, polls `/api/queue/state`, and bubbles the latest `searchState().indexed` up to `App` so the search card can show a freshness chip.
- `src/components/StorageCard.tsx` — multipart upload card backed by `storageUploadBlob` / `storageUploadFile`; lists recent objects from `/api/storage/state`.
- `src/components/SearchCard.tsx` — query box over `/api/search` with the `indexedHint` chip wired from `QueueCard`.
- `src/components/ui.tsx` — design-system primitives (`Card`, `CardHeader`, `Button`, `Badge`, `Chip`, `Counter`, `TextInput`, `ErrorBanner`, `MutedText`, `CardFootnote`) that consume the `--zerops-*` CSS custom properties via Tailwind arbitrary-property syntax instead of hardcoded palette values.
- `tailwind.config.js` / `postcss.config.js` — Tailwind v3 + autoprefixer wiring; content globs cover `index.html` and `src/**`.
- `tsconfig.json` — strict TypeScript targeting ES2022 with `jsx: react-jsx` and `moduleResolution: bundler`; `vite/client` types provide the `import.meta.env` typing for `VITE_API_URL`.
- `vite.config.ts` — `@vitejs/plugin-react` plus dev/preview server bound to `0.0.0.0:5173` with `allowedHosts: true`.
<!-- #ZEROPS_EXTRACT_END:claude-md# -->
