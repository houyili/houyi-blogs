import { defineCollection, z } from "astro:content";

const post = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    description: z.string(),
    published: z.coerce.date(),
    updated: z.coerce.date().optional(),
    lang: z.enum(["en", "zh"]),
    post_slug: z.string(),
    translation: z.string().optional(),
    category: z.string().optional(),
    read_time: z.string().optional(),
    image: z.string().optional(),
    tags: z.array(z.string()).default([]),
    pinned: z.boolean().default(false),
    paper: z.boolean().default(false),
    project: z.string().optional(),
    venue: z.string().optional(),
    venue_type: z.string().optional(),
    paper_url: z.string().optional(),
    hide_description_in_header: z.boolean().default(false),
    source_project: z.string().optional(),
    source_draft: z.string().optional(),
    source_hash: z.string().optional(),
    imported_at: z.string().optional(),
    draft: z.boolean().default(false)
  })
});

export const collections = { post };
