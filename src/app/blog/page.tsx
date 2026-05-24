import { Metadata } from 'next'
import BlogListContent, { type BlogListPost } from '@/components/BlogListContent'
import Crumb from '@/components/terminal/Crumb'
import PageShell from '@/components/terminal/PageShell'
import { readingMinutes } from '@/lib/reading-time'
import { supabase } from '@/lib/supabase'

export const metadata: Metadata = {
  title: 'Blog — DCA Guides & Crypto Investing Tips',
  description:
    'Learn about dollar cost averaging, crypto investing strategies, and how to build long-term wealth with DCA. Guides in English and Korean.',
}

export const revalidate = 3600

interface BlogRow {
  slug: string
  lang: string
  title: string
  description: string
  content: string
  created_at: string
}

async function getPosts(): Promise<BlogListPost[]> {
  const { data } = await supabase
    .from('blog_posts')
    .select('slug, lang, title, description, content, created_at')
    .eq('published', true)
    .order('created_at', { ascending: false })
  return (data as BlogRow[] | null ?? []).map((row) => ({
    slug: row.slug,
    lang: row.lang,
    title: row.title,
    description: row.description,
    created_at: row.created_at,
    readMinutes: readingMinutes(row.content, row.lang),
  }))
}

export default async function BlogPage() {
  const posts = await getPosts()
  return (
    <PageShell tab="blog">
      <Crumb path="/blog" />
      <BlogListContent posts={posts} lang="en" />
    </PageShell>
  )
}
