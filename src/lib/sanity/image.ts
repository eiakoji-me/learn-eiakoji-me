import { createImageUrlBuilder } from '@sanity/image-url';
import type { SanityImageSource } from '@sanity/image-url';

const projectId = import.meta.env.PUBLIC_SANITY_PROJECT_ID ?? '7rp2puan';
const dataset = import.meta.env.PUBLIC_SANITY_DATASET ?? 'production';
const builder = createImageUrlBuilder({ projectId, dataset });

export function imageUrl(source: SanityImageSource, width = 1200): string {
  return builder.image(source).width(width).fit('max').auto('format').url();
}
