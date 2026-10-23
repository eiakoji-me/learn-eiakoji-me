import { createClient, type QueryParams } from '@sanity/client';

const sanityClient = createClient({
  projectId: import.meta.env.PUBLIC_SANITY_PROJECT_ID ?? '7rp2puan',
  dataset: import.meta.env.PUBLIC_SANITY_DATASET ?? 'production',
  apiVersion: '2026-10-01',
  useCdn: false,
});

export async function fetchContent<T>(query: string, params: QueryParams = {}): Promise<T> {
  return sanityClient.fetch<T>(query, params);
}

export function formatDate(value: string): string {
  return new Intl.DateTimeFormat('en', {
    dateStyle: 'long',
    timeZone: 'UTC',
  }).format(new Date(value));
}

export function contentHref(type: string, slug: string): string {
  const section = type === 'article' ? 'articles' : type === 'project' ? 'projects' : 'series';
  return `/${section}/${slug}/`;
}
