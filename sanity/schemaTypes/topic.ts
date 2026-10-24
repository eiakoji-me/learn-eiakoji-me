import { defineField, defineType } from 'sanity';

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
      validation: (rule) =>
        rule.custom((parent, context) => {
          if (!parent) return true;
          const currentDocId = context.document?._id?.replace(/^drafts\./, '');
          if (parent._ref === currentDocId) {
            return 'A topic cannot reference itself as its parent.';
          }
          return true;
        }),
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
