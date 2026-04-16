import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import Link from 'next/link'
import Nav from '@/components/Nav'
import { supabase } from '@/lib/supabase'

interface BlogPost {
  slug: string
  lang: string
  title: string
  description: string
  content: string
  created_at: string
}

interface Props {
  params: Promise<{ slug: string }>
}

async function getPost(slug: string): Promise<BlogPost | null> {
  const { data } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .eq('published', true)
    .single()
  return data
}

export const revalidate = 3600

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const post = await getPost(slug)
  if (!post) return {}

  return {
    title: post.title,
    description: post.description,
    // Phase 1: noindex individual blog posts until content quality is established (see docs/superpowers/specs/2026-04-16-seo-indexation-recovery-design.md).
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

// Simple markdown-like renderer for blog content
function renderContent(content: string) {
  const lines = content.split('\n')
  const elements: React.ReactNode[] = []
  let listItems: string[] = []
  let listType: 'ul' | 'ol' | null = null
  let key = 0

  function flushList() {
    if (listItems.length === 0) return
    const Tag = listType === 'ol' ? 'ol' : 'ul'
    const cls = listType === 'ol' ? 'list-decimal' : 'list-disc'
    elements.push(
      <Tag key={key++} className={`${cls} list-inside text-[var(--text-muted)] leading-relaxed space-y-1 mb-4`}>
        {listItems.map((item, i) => <li key={i} dangerouslySetInnerHTML={{ __html: parseInline(item) }} />)}
      </Tag>
    )
    listItems = []
    listType = null
  }

  function parseInline(text: string): string {
    return text
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" class="text-[var(--accent)] hover:underline">$1</a>')
      .replace(/`(.+?)`/g, '<code class="bg-[var(--surface)] px-1 rounded text-sm">$1</code>')
  }

  for (const line of lines) {
    const trimmed = line.trim()

    if (trimmed.startsWith('## ')) {
      flushList()
      elements.push(<h2 key={key++} className="text-2xl font-semibold text-[var(--text)] mt-8 mb-4">{trimmed.slice(3)}</h2>)
    } else if (trimmed.startsWith('### ')) {
      flushList()
      elements.push(<h3 key={key++} className="text-xl font-semibold text-[var(--text)] mt-6 mb-3">{trimmed.slice(4)}</h3>)
    } else if (trimmed.startsWith('- ')) {
      if (listType !== 'ul') flushList()
      listType = 'ul'
      listItems.push(trimmed.slice(2))
    } else if (/^\d+\.\s/.test(trimmed)) {
      if (listType !== 'ol') flushList()
      listType = 'ol'
      listItems.push(trimmed.replace(/^\d+\.\s/, ''))
    } else if (trimmed === '---') {
      flushList()
      elements.push(<hr key={key++} className="border-[var(--border)] my-8" />)
    } else if (trimmed.startsWith('*') && trimmed.endsWith('*') && !trimmed.startsWith('**')) {
      flushList()
      elements.push(<p key={key++} className="text-[var(--text-muted)] italic text-sm" dangerouslySetInnerHTML={{ __html: parseInline(trimmed.slice(1, -1)) }} />)
    } else if (trimmed === '') {
      flushList()
    } else {
      flushList()
      elements.push(<p key={key++} className="text-[var(--text-muted)] leading-relaxed mb-4" dangerouslySetInnerHTML={{ __html: parseInline(trimmed) }} />)
    }
  }
  flushList()
  return elements
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params
  const post = await getPost(slug)

  if (!post) notFound()

  const isKo = post.lang === 'ko'

  // JSON-LD for article
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
      <Nav lang={isKo ? 'ko' : 'en'} />
      <main className="min-h-screen bg-gray-950 text-[var(--text)]">
        <article className="max-w-[65ch] mx-auto px-4 py-12">
          <nav className="mb-8 text-sm text-[var(--text-muted)]">
            <Link href="/" className="hover:text-[var(--text)]">Home</Link>
            {' / '}
            <Link href="/blog" className="hover:text-[var(--text)]">Blog</Link>
            {' / '}
            <span className="text-[var(--text)]">{post.title.length > 40 ? post.title.slice(0, 40) + '…' : post.title}</span>
          </nav>

          <h1 className="text-3xl font-bold mb-4">{post.title}</h1>
          <p className="text-[var(--text-faint)] text-sm mb-8">
            {new Date(post.created_at).toLocaleDateString(isKo ? 'ko-KR' : 'en-US', {
              year: 'numeric', month: 'long', day: 'numeric',
            })}
          </p>

          <div>{renderContent(post.content)}</div>
        </article>
      </main>
    </>
  )
}
