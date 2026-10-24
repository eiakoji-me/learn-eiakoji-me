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
      name: 'domain',
      title: 'Domain / Area',
      type: 'string',
      description: 'High-level category for organizational grouping.',
      options: {
        list: [
          { title: 'System Architecture & Design', value: 'architecture' },
          { title: 'Languages & Ecosystems', value: 'languages' },
          { title: 'Cloud & Infrastructure', value: 'cloud' },
          { title: 'Frontier & AI Systems', value: 'ai' },
          { title: 'Foundations & Craft', value: 'foundations' },
        ],
      },
    }),
    defineField({
      name: 'parent',
      title: 'Parent Topic',
      type: 'reference',
      to: [{ type: 'topic' }],
      description: 'Leave empty for top-level topics (e.g. Distributed Systems), or select a parent (e.g. Spring Boot -> Java).',
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
      description: 'Detailed topic overview and curriculum notes rendered on the topic hub page.',
    }),
    defineField({
      name: 'icon',
      title: 'Icon Identifier',
      type: 'string',
      description: 'Optional icon keyword or identifier (e.g., cpu, server, code, book, cloud, brain).',
    }),
    defineField({
      name: 'order',
      title: 'Display Order',
      type: 'number',
      description: 'Sort weight in navigation and topic listings (lowest first).',
    }),
    defineField({
      name: 'featured',
      title: 'Featured',
      type: 'boolean',
      initialValue: false,
      description: 'Feature this topic prominently in navigation and hub highlights.',
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
      domain: 'domain',
      parentTitle: 'parent.title',
    },
    prepare({ title, domain, parentTitle }) {
      const parts = [domain, parentTitle ? `under ${parentTitle}` : null].filter(Boolean);
      return {
        title,
        subtitle: parts.length > 0 ? parts.join(' · ') : 'Top-level topic',
      };
    },
  },
});
