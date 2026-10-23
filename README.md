# learn.eiakoji.me

Technical articles, project write-ups, and connected learning series published
with Astro and Sanity.

## Architecture

- **Astro + TypeScript** renders a static reader site.
- **Sanity** project `7rp2puan`, dataset `production`, stores structured content.
- **Sanity Studio** is configured in this repository but runs and deploys
  separately from the reader site.
- **Netlify** is prepared to build the static site from `main`; this repository
  does not create a Netlify project, deploy, or change DNS.

Published content is fetched during each Astro build. Sanity changes therefore
appear after the next build. Once deployment is approved, connect a private
Netlify build hook to a Sanity webhook; never commit the hook URL.

## Prerequisites

- Node.js 24
- npm 11+
- Access to Sanity project `7rp2puan` for authoring

## Local setup

```sh
cp .env.example .env
npm install
npm run dev
```

The reader site is available at `http://localhost:4321`.

Project ID and dataset are public identifiers, not secrets. Never add a Sanity
token to a `PUBLIC_` variable or commit a token to this repository.

## Content authoring

Run Studio in a separate terminal:

```sh
npm run studio
```

Studio defaults to `http://localhost:3333`. If Sanity asks for a CORS origin,
add only that controlled local origin and enable credentials. A future hosted
Studio origin must be approved and configured separately.

The initial content model contains:

- `article` — long-form technical writing, optionally attached to a series;
- `project` — project case studies and implementation notes;
- `series` — ordered collections of related articles.

Sanity's native draft/published lifecycle controls visibility. Public queries
also require a slug and a publication date that is not in the future.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start Astro development server |
| `npm run check` | Run Astro and TypeScript diagnostics |
| `npm run build` | Build the static reader site into `dist/` |
| `npm run preview` | Preview the Astro production build |
| `npm run studio` | Start Sanity Studio locally |
| `npm run studio:build` | Validate and build Studio without deploying |
| `npm run test:publication` | Exercise built routes, metadata, configuration, and live GROQ queries |
| `npm run verify` | Run checks, both production builds, and publication integration tests |

## Netlify preparation

`netlify.toml` sets `npm run build` and publishes `dist`. The eventual Netlify
project needs these build variables:

```text
PUBLIC_SANITY_PROJECT_ID=7rp2puan
PUBLIC_SANITY_DATASET=production
```

Build-variable changes require a new deploy before they take effect. `.netlify`
is ignored because its local state must never be committed.

Deployment, build-hook creation, custom-domain configuration, and DNS changes
are intentionally deferred until explicit approval.

## Verification

```sh
npm ci
npm run verify
```

The production dataset may be empty. In that state, the site intentionally
builds useful empty pages rather than shipping fixture content.
