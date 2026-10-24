import type { PortableTextBlock } from '@portabletext/types';
import type { BodyBlock } from './sanity/types';

export function slugify(text: string): string {
  if (!text) return '';
  return text
    .normalize('NFKD')
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-');
}

export interface HeadingItem {
  depth: number;
  text: string;
  slug: string;
  key?: string;
}

const keySlugCache = new Map<string, string>();

export function registerHeadings(headings: HeadingItem[]): void {
  for (const h of headings) {
    if (h.key) {
      keySlugCache.set(h.key, h.slug);
    }
  }
}

export function getRegisteredHeadingSlug(key?: string, text?: string): string {
  if (key && keySlugCache.has(key)) {
    return keySlugCache.get(key)!;
  }
  return slugify(text || '') || 'section';
}

export function extractHeadings(body: BodyBlock[] | PortableTextBlock[] | undefined): HeadingItem[] {
  if (!Array.isArray(body)) return [];
  const headings: HeadingItem[] = [];
  const slugCounts = new Map<string, number>();

  for (const item of body) {
    const block = item as PortableTextBlock;
    if (block._type === 'block' && (block.style === 'h2' || block.style === 'h3')) {
      const text = (block.children || [])
        .map((child: any) => child.text || '')
        .join('')
        .trim();
      if (text) {
        const rawSlug = slugify(text) || 'section';
        const count = slugCounts.get(rawSlug) ?? 0;
        slugCounts.set(rawSlug, count + 1);
        const slug = count === 0 ? rawSlug : `${rawSlug}-${count}`;

        headings.push({
          depth: block.style === 'h2' ? 2 : 3,
          text,
          slug,
          key: block._key,
        });
      }
    }
  }

  registerHeadings(headings);
  return headings;
}
