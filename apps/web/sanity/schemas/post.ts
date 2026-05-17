import { defineType, defineField, type Rule } from 'sanity'

export const postSchema = defineType({
  name: 'post',
  title: 'Artículo',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Título',
      type: 'string',
      validation: (r: Rule) => r.required().min(5).max(120),
    }),
    defineField({
      name: 'slug',
      title: 'Slug (URL)',
      type: 'slug',
      options: { source: 'title', maxLength: 96 },
      validation: (r: Rule) => r.required(),
    }),
    defineField({
      name: 'excerpt',
      title: 'Extracto (meta description)',
      type: 'text',
      rows: 3,
      validation: (r: Rule) => r.required().max(200),
    }),
    defineField({
      name: 'coverImage',
      title: 'Imagen de portada',
      type: 'image',
      options: { hotspot: true },
    }),
    defineField({
      name: 'category',
      title: 'Categoría',
      type: 'string',
      options: {
        list: [
          { title: 'Tutorial', value: 'tutorial' },
          { title: 'Fiscal', value: 'fiscal' },
          { title: 'SEO / Comparativas', value: 'seo' },
        ],
      },
      validation: (r: Rule) => r.required(),
    }),
    defineField({
      name: 'publishedAt',
      title: 'Fecha de publicación',
      type: 'datetime',
      validation: (r: Rule) => r.required(),
    }),
    defineField({
      name: 'readTime',
      title: 'Tiempo de lectura (minutos)',
      type: 'number',
      validation: (r: Rule) => r.required().min(1).max(60),
    }),
    defineField({
      name: 'body',
      title: 'Contenido',
      type: 'array',
      of: [
        {
          type: 'block',
          styles: [
            { title: 'Normal', value: 'normal' },
            { title: 'H2', value: 'h2' },
            { title: 'H3', value: 'h3' },
            { title: 'H4', value: 'h4' },
            { title: 'Cita', value: 'blockquote' },
          ],
          marks: {
            decorators: [
              { title: 'Negrita', value: 'strong' },
              { title: 'Cursiva', value: 'em' },
              { title: 'Código', value: 'code' },
            ],
            annotations: [
              {
                name: 'link',
                type: 'object',
                title: 'Enlace',
                fields: [{ name: 'href', type: 'url', title: 'URL' }],
              },
            ],
          },
        },
        { type: 'image', options: { hotspot: true } },
        {
          type: 'object',
          name: 'codeBlock',
          title: 'Bloque de código',
          fields: [
            { name: 'code', type: 'text', title: 'Código' },
            { name: 'language', type: 'string', title: 'Lenguaje' },
          ],
        },
      ],
    }),
  ],
  preview: {
    select: { title: 'title', category: 'category', media: 'coverImage' },
    prepare({ title, category, media }: { title: string; category: string; media: unknown }) {
      return { title, subtitle: category, media }
    },
  },
})
