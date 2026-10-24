import { defineField, defineType } from 'sanity';

export const article = defineType({
  name: 'article',
  title: 'Article / Entry',
  type: 'document',
  fieldsets: [
    { name: 'editorial', title: 'Taxonomy & Editorial' },
    { name: 'workshop', title: 'Workshop & Code Details' },
    { name: 'reference', title: 'Reading Notes & Reference Details' },
  ],
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (rule) => rule.required().min(5).max(120),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'title', maxLength: 96 },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'kind',
      title: 'Content Format / Kind',
      type: 'string',
      description: 'The technical format of this entry.',
      initialValue: 'deep-dive',
      options: {
        list: [
          { title: 'Deep Dive (Architecture, Patterns, Concepts)', value: 'deep-dive' },
          { title: 'Workshop / Showcase (Hands-on Labs, Projects)', value: 'workshop' },
          { title: 'Guide (Knowledge Walkthroughs, Practices)', value: 'guide' },
          { title: 'Reading Notes (Recommended Books, Literature)', value: 'reading-notes' },
          { title: 'Reference (Cheatsheets, Curated Lists)', value: 'reference' },
        ],
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'summary',
      title: 'Summary',
      type: 'text',
      rows: 3,
      validation: (rule) => rule.required().min(20).max(300),
    }),
    defineField({
      name: 'publishedAt',
      title: 'Published at',
      type: 'datetime',
      validation: (rule) => rule.required(),
    }),
    defineField({ name: 'featuredImage', title: 'Featured image', type: 'imageWithAlt' }),

    // Editorial & Taxonomy
    defineField({
      name: 'primaryTopic',
      title: 'Primary Topic',
      type: 'reference',
      to: [{ type: 'topic' }],
      fieldset: 'editorial',
      description: 'The primary topic this entry belongs to.',
    }),
    defineField({
      name: 'relatedTopics',
      title: 'Related Topics',
      type: 'array',
      fieldset: 'editorial',
      of: [{ type: 'reference', to: [{ type: 'topic' }] }],
      description: 'Secondary or intersecting topics.',
      validation: (rule) => rule.unique(),
    }),
    defineField({
      name: 'difficulty',
      title: 'Level / Difficulty',
      type: 'string',
      fieldset: 'editorial',
      options: {
        list: [
          { title: 'Fundamentals', value: 'Fundamentals' },
          { title: 'Intermediate', value: 'Intermediate' },
          { title: 'Advanced', value: 'Advanced' },
        ],
      },
    }),
    defineField({
      name: 'series',
      title: 'Series / Learning Path',
      type: 'reference',
      to: [{ type: 'series' }],
      fieldset: 'editorial',
      description: 'Optional. Add this entry to an ordered learning path.',
    }),
    defineField({
      name: 'topics',
      title: 'Tags / Legacy Topics',
      type: 'array',
      fieldset: 'editorial',
      of: [{ type: 'string' }],
      options: { layout: 'tags' },
      validation: (rule) => rule.unique(),
    }),

    // Workshop & Code Details
    defineField({
      name: 'repositoryUrl',
      title: 'Repository URL',
      type: 'url',
      fieldset: 'workshop',
      description: 'GitHub/GitLab repository for workshops or showcases.',
    }),
    defineField({
      name: 'demoUrl',
      title: 'Live Demo URL',
      type: 'url',
      fieldset: 'workshop',
      description: 'Live interactive demo or deployment.',
    }),
    defineField({
      name: 'technologies',
      title: 'Technologies',
      type: 'array',
      fieldset: 'workshop',
      of: [{ type: 'string' }],
      options: { layout: 'tags' },
      validation: (rule) => rule.unique(),
    }),

    // Reading Notes & Reference Details
    defineField({
      name: 'bookAuthor',
      title: 'Book Author',
      type: 'string',
      fieldset: 'reference',
      description: 'For reading notes / recommended books.',
    }),
    defineField({
      name: 'referenceUrl',
      title: 'Reference / Source URL',
      type: 'url',
      fieldset: 'reference',
      description: 'External link to source book, specification, or paper.',
    }),

    // Body & SEO
    defineField({ name: 'body', title: 'Body', type: 'blockContent', validation: (rule) => rule.required() }),
    defineField({ name: 'seo', title: 'SEO', type: 'seo' }),
  ],
  orderings: [
    { title: 'Publication date', name: 'publishedAtDesc', by: [{ field: 'publishedAt', direction: 'desc' }] },
    { title: 'Title', name: 'titleAsc', by: [{ field: 'title', direction: 'asc' }] },
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'summary',
      media: 'featuredImage',
      kind: 'kind',
      topicTitle: 'primaryTopic.title',
    },
    prepare({ title, subtitle, media, kind, topicTitle }) {
      const badges = [kind, topicTitle].filter(Boolean).join(' · ');
      return {
        title,
        subtitle: badges ? `[${badges}] ${subtitle ?? ''}` : subtitle,
        media,
      };
    },
  },
});
