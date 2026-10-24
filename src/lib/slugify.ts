export function slugify(text: string): string {
  return text
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
}

export function extractHeadings(body: any[]): HeadingItem[] {
  if (!Array.isArray(body)) return [];
  const headings: HeadingItem[] = [];

  for (const block of body) {
    if (block._type === 'block' && (block.style === 'h2' || block.style === 'h3')) {
      const text = (block.children || [])
        .map((child: any) => child.text || '')
        .join('')
        .trim();
      if (text) {
        headings.push({
          depth: block.style === 'h2' ? 2 : 3,
          text,
          slug: slugify(text),
        });
      }
    }
  }

  return headings;
}
