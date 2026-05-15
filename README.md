# Zerops x NestJS Showcase Frontend

<!-- #ZEROPS_EXTRACT_START:intro# -->

React + Vite + Tailwind dashboard SPA exercising the showcase API's Items CRUD, cache hits/misses, NATS queue activity, S3 uploads, and Meilisearch results across a single responsive grid of category cards.
<!-- #ZEROPS_EXTRACT_END:intro# -->

![nestjs cover](https://github.com/zeropsio/recipe-shared-assets/blob/main/covers/svg/cover-nestjs.svg)

## Deploy to Zerops

Click the deploy button to deploy directly to Zerops.

[![Deploy on Zerops](https://github.com/zeropsio/recipe-shared-assets/blob/main/deploy-button/light/deploy-button.svg)](https://app.zerops.io/recipes/nestjs-showcase?environment=small-production)

## Integration Guide

<!-- #ZEROPS_EXTRACT_START:integration-guide# -->
### 1. Adding `zerops.yaml`

The main configuration file — place at repository root. It tells Zerops how to build, deploy and run your app. This one declares 2 setups (`dev`, `prod`).

```yaml
# Two setups for the SPA — `dev` is an SSH workspace running the
# Vite dev server with HMR over an SSHFS mount; `prod` builds the
# bundle once and ships it to Nginx-backed static hosting.
zerops:
  - setup: dev
    build:
      base: nodejs@22
      buildCommands:
        # `npm install` (not `npm ci`) so devDependencies land in
        # node_modules — Vite's HMR server is a devDependency and
        # the porter expects it present after deploy.
        - npm install
      # Ship the full source tree to the runtime mount so every
      # file the porter would edit is there — including config
      # they may need to tweak (`vite.config.ts`, `tailwind.config.js`).
      deployFiles: ./
      cache:
        - node_modules
    run:
      base: nodejs@22
      ports:
        # 5173 is Vite's default dev port; httpSupport publishes it
        # through the L7 router so the dev subdomain reaches the
        # bundler. The same port appears in the workspace's
        # `DEV_FRONTEND_URL` constant the api uses for CORS.
        - port: 5173
          httpSupport: true
      # Idle the container so Vite can be started by hand over SSH —
      # the porter runs `npm run dev` from `/var/www` and edits flow
      # through the SSHFS mount with HMR picking them up live. Tying
      # `start:` to `npm run dev` would mean every edit goes through
      # a redeploy cycle, defeating the watch loop.
      start: zsc noop --silent

  - setup: prod
    build:
      base: nodejs@22
      buildCommands:
        # `npm ci` for reproducible builds — fails fast on lockfile
        # drift, which is the right gate for production.
        - npm ci
        # `npm run build` runs Vite's Rollup pipeline so TypeScript +
        # React compile into a static `dist/` tree of HTML, hashed
        # JS, and CSS bundles — the only artifacts the static runtime
        # needs at request time.
        - npm run build
      deployFiles:
        # `dist/~` strips the leading `dist/` so the build output
        # becomes the document root directly — `index.html` lands
        # at `/index.html`. Without the trailing `~`, Nginx serves
        # from `/dist/` and `/` returns 404.
        - dist/~
      cache:
        - node_modules
      envVariables:
        # Bake the API origin into the JS bundle at build time —
        # Vite inlines `VITE_*` as string literals before deploy and
        # the static runtime has no process to read OS env later.
        # `${API_URL}` is the workspace's project-scope constant,
        # composed from `${zeropsSubdomainHost}` at provision time
        # so it resolves before any peer service first-deploys. Set
        # your own production origin here once you swap apistage for
        # a custom domain.
        VITE_API_URL: ${API_URL}
    run:
      # Nginx-backed static runtime — no Node process at request
      # time, SPA fallback for unmatched routes is built in, ~2 MB
      # RAM per replica. A dynamic `start:` directive is silently
      # ignored on this base; if you add server-rendered routes
      # later, switch to `base: nodejs@22` with an explicit `start:`.
      base: static
```

### 2. Bake the API origin into the SPA at build time

Vite inlines `import.meta.env.VITE_*` constants into the JS bundle at build time. The runtime container serving a `base: static` build is Nginx — there is no Node process to read env vars at request time, so the API origin must be present BEFORE `npm run build` fires.

Reach for the API service's URL via the project-scope `API_URL` constant the workspace exposes, then re-publish it under `VITE_API_URL` inside the `prod` setup's `build.envVariables`:

```yaml
build:
  envVariables:
    VITE_API_URL: ${API_URL}
```

`API_URL` is composed once from `${zeropsSubdomainHost}` at project-provision time, so it resolves before any peer service first-deploys — no deploy-ordering dance. Reading `${apistage_zeropsSubdomain}` directly works too, but only after the API service has minted its URL, otherwise the literal token ships into the bundle. The project-scope constant skips that ordering window.

For the dev workspace (long-running Vite process, not a static build), set `VITE_API_URL` on the dev service's env via the Zerops UI and restart the dev process — Vite re-reads it on respawn.

### 3. Bind Vite to every interface and accept the platform's subdomain hosts

Vite's dev server defaults to `host: localhost` and rejects any request whose `Host` header is not in its allowlist. Zerops's L7 balancer routes to the container's VXLAN IP — a `127.0.0.1`-bound listener is unreachable, returns 502, and a request that does reach Vite from the project's dev subdomain hits Vite's host check first (`Blocked request. This host is not allowed.`). The [Zerops L7 balancer + subdomain access](https://docs.zerops.io/features/access) reference covers how `httpSupport: true` ports are published through the balancer.

Open [`vite.config.ts`](vite.config.ts) and pin both bindings on both `server` (dev) and `preview` (cross-deploy preview builds):

```ts
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: true,
  },
  preview: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: true,
  },
});
```

`allowedHosts: true` is the bundler's intended extension point for hosted dev environments — it accepts every Host header so the dynamic `<host>-${zeropsSubdomainHost}` URLs the project mints for dev and preview both work without re-listing each hostname.

### 4. Strip the build-output prefix and ship to the static runtime

Vite compiles the SPA into a `dist/` tree of HTML + assets — no Node process runs at request time. The right runtime is `base: static`, which is Nginx-backed: ~2 MB RAM per replica versus ~80 MB for a `npx serve` Node process, and SPA fallback (unmatched routes serve `/index.html`) is built in.

Nginx's document root is fixed at the deploy-files root, so `dist/index.html` would land at `/dist/index.html` and `/` would 404. The `~` suffix on a `deployFiles` entry tells Zerops to strip the leading directory before publishing — `dist/~` lands `index.html` at the document root directly:

```yaml
build:
  deployFiles:
    - dist/~
run:
  base: static
```

The `dist/~` shape is the canonical pairing with `base: static`; without the trailing `~`, every static-deploy returns 404 on `/`. The [deploy-files tilde syntax + static runtime](https://docs.zerops.io/zerops-yaml/specification#deployfiles-) reference covers the full strip-prefix semantics + every supported `deployFiles` shape.
<!-- #ZEROPS_EXTRACT_END:integration-guide# -->

<!-- #ZEROPS_EXTRACT_START:knowledge-base# -->

### `VITE_API_URL` change silently returns stale data until the next build

Vite bakes `VITE_*` env vars into the JS bundle as string literals at build time. After `npm run build`, the value is gone — the `base: static` runtime is Nginx serving HTML and JS, with no process to re-read OS env. Symptom: rotating `API_URL` in the Zerops UI and restarting the prod app returns the OLD origin from every fetch; `curl https://<app>/index-<hash>.js` still shows the prior URL hardcoded.

Re-deploy `prod` so a fresh build picks up the new env. The dev workspace is different — Vite is a long-running process there, so a `VITE_API_URL` change plus a Vite restart is enough; no re-deploy needed.

> [!CAUTION]
> A `.env` file checked into the repo wins over `build.envVariables` because Vite reads it during `npm run build` inside the build container. Delete any tracked `.env` before pushing, or the platform-injected `${API_URL}` never reaches the bundle.

### `start:` directive on `base: static` is silently ignored

The static runtime ships Nginx; there is no shell that runs `start:`. A `start: npm run preview` (or any other command) in the `prod` setup parses fine but never fires — the dashboard serves but every dynamic-runtime expectation from Heroku / Render porting habits silently breaks. The bundler must compile to a fully static `dist/` tree and ship it via `deployFiles: dist/~`; runtime SSR needs a Node base (`base: nodejs@22` + a long-running `start:`), not the static one.
<!-- #ZEROPS_EXTRACT_END:knowledge-base# -->
