import { defineField, defineType } from 'sanity';

export interface TopicParentValidationContext {
  document?: { _id?: string };
  getClient?: (options: { apiVersion: string }) => {
    fetch: <T = unknown>(query: string, params?: Record<string, unknown>) => Promise<T>;
  };
}

export async function validateTopicParent(
  parent: { _ref?: string } | undefined,
  context: TopicParentValidationContext
): Promise<true | string> {
  if (!parent?._ref) return true;
  const currentDocId = context.document?._id?.replace(/^drafts\./, '');
  if (parent._ref === currentDocId) {
    return 'A topic cannot reference itself as its parent.';
  }

  try {
    const client = context.getClient?.({ apiVersion: '2026-10-01' });
    if (!client) return true;

    const visited = new Set<string>([currentDocId || '']);
    let currentParentId: string | undefined = parent._ref;
    let depth = 0;

    while (currentParentId && depth <= 6) {
      if (visited.has(currentParentId)) {
        return 'Circular parent reference detected in topic hierarchy.';
      }
      visited.add(currentParentId);
      depth++;

      if (depth > 4) {
        return 'Topic hierarchy exceeds maximum supported depth of 4 levels.';
      }

      const parentDoc: { parent?: { _ref: string } } | null = await client.fetch(
        `coalesce(*[_id == "drafts." + $id][0], *[_id == $id][0]){ parent }`,
        { id: currentParentId }
      );
      currentParentId = parentDoc?.parent?._ref;
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return `Topic hierarchy validation could not be completed: ${message}`;
  }

  return true;
}

export const topic = defineType({
  name: 'topic',
  title: 'Topic',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (rule) => rule.required().min(2).max(100),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'title', maxLength: 96 },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'parent',
      title: 'Parent Topic / Domain',
      type: 'reference',
      to: [{ type: 'topic' }],
      description: 'Leave empty for Root Topics / Domains (e.g., Distributed Systems, Languages, Cloud). Select a parent for subtopics.',
      validation: (rule) => rule.custom(validateTopicParent),
    }),
    defineField({
      name: 'summary',
      title: 'Summary',
      type: 'text',
      rows: 3,
      validation: (rule) => rule.required().min(20).max(300),
    }),
    defineField({
      name: 'description',
      title: 'Topic Overview',
      type: 'blockContent',
      description: 'Detailed curriculum notes, patterns, or introductory material rendered on the topic hub page.',
    }),
    defineField({
      name: 'icon',
      title: 'Icon Identifier',
      type: 'string',
      description: 'Optional icon keyword (e.g., cpu, server, code, book, cloud, brain).',
    }),
    defineField({
      name: 'order',
      title: 'Display Order',
      type: 'number',
      description: 'Sort weight in navigation and listings (lowest first).',
    }),
    defineField({
      name: 'featured',
      title: 'Featured',
      type: 'boolean',
      initialValue: false,
      description: 'Highlight prominently in navigation and topic hub listings.',
    }),
  ],
  orderings: [
    {
      title: 'Display Order',
      name: 'orderAsc',
      by: [
        { field: 'order', direction: 'asc' },
        { field: 'title', direction: 'asc' },
      ],
    },
    {
      title: 'Title',
      name: 'titleAsc',
      by: [{ field: 'title', direction: 'asc' }],
    },
  ],
  preview: {
    select: {
      title: 'title',
      parentTitle: 'parent.title',
    },
    prepare({ title, parentTitle }) {
      return {
        title,
        subtitle: parentTitle ? `under ${parentTitle}` : 'Root Domain / Area',
      };
    },
  },
});
