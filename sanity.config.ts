import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';

import { schemaTypes } from './sanity/schemaTypes';
import { structure } from './sanity/structure';

export default defineConfig({
  name: 'wiki-eiakoji-me',
  title: 'wiki.eiakoji.me',
  projectId: process.env.SANITY_STUDIO_PROJECT_ID ?? '7rp2puan',
  dataset: process.env.SANITY_STUDIO_DATASET ?? 'production',
  plugins: [structureTool({ structure })],
  schema: {
    types: schemaTypes,
  },
});
