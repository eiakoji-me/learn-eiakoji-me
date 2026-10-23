import { defineArrayMember, defineField, defineType } from 'sanity';

export const blockContent = defineType({
  name: 'blockContent',
  title: 'Content',
  type: 'array',
  of: [
    defineArrayMember({
      type: 'block',
      styles: [
        { title: 'Normal', value: 'normal' },
        { title: 'Heading 2', value: 'h2' },
        { title: 'Heading 3', value: 'h3' },
        { title: 'Quote', value: 'blockquote' },
      ],
      marks: {
        annotations: [
          {
            name: 'link',
            title: 'Link',
            type: 'object',
            fields: [
              defineField({
                name: 'href',
                title: 'URL',
                type: 'url',
                validation: (rule) =>
                  rule.required().uri({
                    allowRelative: true,
                    scheme: ['http', 'https', 'mailto'],
                  }),
              }),
            ],
          },
        ],
      },
    }),
    defineArrayMember({ type: 'imageWithAlt' }),
    defineArrayMember({
      name: 'codeBlock',
      title: 'Code block',
      type: 'object',
      fields: [
        defineField({
          name: 'code',
          title: 'Code',
          type: 'text',
          rows: 14,
          validation: (rule) => rule.required(),
        }),
        defineField({
          name: 'language',
          title: 'Language',
          type: 'string',
        }),
        defineField({
          name: 'filename',
          title: 'Filename',
          type: 'string',
        }),
      ],
      preview: {
        select: { title: 'filename', subtitle: 'language' },
        prepare: ({ title, subtitle }) => ({
          title: title || 'Code block',
          subtitle: subtitle || 'Plain text',
        }),
      },
    }),
  ],
});
