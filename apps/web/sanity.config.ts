import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { postSchema } from './sanity/schemas/post'

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? ''
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production'

export default defineConfig({
  name: 'nexo-billing-blog',
  title: 'Nexo Billing — Blog',
  projectId,
  dataset,
  plugins: [structureTool()],
  schema: {
    types: [postSchema],
  },
})
