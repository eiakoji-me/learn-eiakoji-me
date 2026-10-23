import sanity from '@sanity/astro';
import { defineConfig } from 'astro/config';
import { loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    site: 'https://wiki.eiakoji.me',
    output: 'static',
    integrations: [
      sanity({
        projectId: env.PUBLIC_SANITY_PROJECT_ID ?? '7rp2puan',
        dataset: env.PUBLIC_SANITY_DATASET ?? 'production',
        apiVersion: '2026-10-01',
        useCdn: false,
      }),
    ],
  };
});
