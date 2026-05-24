import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import BlogPostContent, { type BlogPostData } from '@/components/BlogPostContent'
import Crumb from '@/components/terminal/Crumb'
import PageShell from '@/components/terminal/PageShell'
import { supabase } from '@/lib/supabase'

interface Props {
  params: Promise<{ slug: string }>
}

async function getPost(slug: string): Promise<BlogPostData | null> {
  const { data } = await supabase
    .from('blog_posts')
    .select('slug, lang, title, description, content, created_at')
    .eq('slug', slug)
    .eq('published', true)
    .single()
  return data as BlogPostData | null
}

export const revalidate = 3600

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const post = await getPost(slug)
  if (!post) return {}

  return {
    title: post.title,
    description: post.description,
    // Phase 1: noindex individual blog posts until content quality is established.
    robots: { index: false, follow: true },
    openGraph: {
      title: post.title,
      description: post.description,
      type: 'article',
      publishedTime: post.created_at,
      siteName: 'DCAify',
    },
  }
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params
  const post = await getPost(slug)
  if (!post) notFound()

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.description,
    datePublished: post.created_at,
    publisher: { '@type': 'Organization', name: 'DCAify', url: 'https://dcaify.com' },
    mainEntityOfPage: `https://dcaify.com/blog/${post.slug}`,
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <PageShell tab="blog" lang={post.lang === 'ko' ? 'ko' : 'en'}>
        <Crumb path={`/blog/${post.slug}`} />
        <BlogPostContent post={post} />
      </PageShell>
    </>
  )
}
