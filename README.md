# Zerops x NestJS Showcase Frontend

<!-- #ZEROPS_EXTRACT_START:intro# -->
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
zerops:
  - setup: dev
    build:
      base: nodejs@22
      buildCommands:
        - npm install
      deployFiles: ./
      cache:
        - node_modules
    run:
      base: nodejs@22
      ports:
        - port: 5173
          httpSupport: true
      start: zsc noop --silent

  - setup: prod
    build:
      base: nodejs@22
      buildCommands:
        - npm ci
        - npm run build
      deployFiles:
        - dist/~
      cache:
        - node_modules
      envVariables:
        VITE_API_URL: ${API_URL}
    run:
      base: static
```
<!-- #ZEROPS_EXTRACT_END:integration-guide# -->

<!-- #ZEROPS_EXTRACT_START:knowledge-base# -->

### Gotchas

<!-- #ZEROPS_EXTRACT_END:knowledge-base# -->
