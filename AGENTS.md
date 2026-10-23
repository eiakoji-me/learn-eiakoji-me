# Project instructions

- This repository owns the publication at `wiki.eiakoji.me`; it does not own
  the Hugo personal site at `eiakoji.me`.
- Use strict TypeScript and keep Sanity queries centralized under
  `src/lib/sanity/`.
- Public queries must exclude drafts, require slugs, and respect `publishedAt`.
- Never commit tokens, `.env`, Netlify local state, build-hook URLs, or other
  credentials.
- Do not deploy the reader site or Studio, create webhooks, or change CORS/DNS
  without explicit operator approval.
- Before committing, run `npm run verify`.
