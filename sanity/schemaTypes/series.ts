import { defineField, defineType } from 'sanity';

export const series = defineType({
  name: 'series',
  title: 'Series',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Title', type: 'string', validation: (rule) => rule.required().min(3).max(120) }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'title', maxLength: 96 },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'summary',
      title: 'Summary',
      type: 'text',
      rows: 3,
      validation: (rule) => rule.required().min(40).max(240),
    }),
    defineField({ name: 'featuredImage', title: 'Featured image', type: 'imageWithAlt' }),
    defineField({
      name: 'articles',
      title: 'Articles',
      type: 'array',
      description: 'Order articles here in the sequence readers should follow.',
      of: [{ type: 'reference', to: [{ type: 'article' }] }],
      validation: (rule) => rule.unique(),
    }),
    defineField({ name: 'seo', title: 'SEO', type: 'seo' }),
  ],
  preview: { select: { title: 'title', subtitle: 'summary', media: 'featuredImage' } },
});
