import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';

import { schemaTypes } from './sanity/schemaTypes';

export default defineConfig({
  name: 'learn-eiakoji-me',
  title: 'learn.eiakoji.me',
  projectId: process.env.SANITY_STUDIO_PROJECT_ID ?? '7rp2puan',
  dataset: process.env.SANITY_STUDIO_DATASET ?? 'production',
  plugins: [structureTool()],
  schema: {
    types: schemaTypes,
  },
});
