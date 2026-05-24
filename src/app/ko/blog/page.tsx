import { Metadata } from 'next'
import BlogListContent, { type BlogListPost } from '@/components/BlogListContent'
import Crumb from '@/components/terminal/Crumb'
import PageShell from '@/components/terminal/PageShell'
import { readingMinutes } from '@/lib/reading-time'
import { supabase } from '@/lib/supabase'

export const metadata: Metadata = {
  title: '블로그 — 적립식 투자 가이드',
  description:
    '적립식 투자(DCA), 암호화폐 투자 전략, 장기 자산 축적 방법에 대한 가이드를 읽어보세요.',
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

export default async function KoBlogPage() {
  const posts = await getPosts()
  return (
    <PageShell tab="blog" lang="ko">
      <Crumb path="/ko/blog" />
      <BlogListContent posts={posts} lang="ko" />
    </PageShell>
  )
}
