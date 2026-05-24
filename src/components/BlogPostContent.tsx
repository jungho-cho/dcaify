import HR from '@/components/terminal/HR'
import { readingMinutes } from '@/lib/reading-time'

export interface BlogPostData {
  slug: string
  lang: string
  title: string
  description: string
  content: string
  created_at: string
}

interface BlogPostContentProps {
  post: BlogPostData
}

export default function BlogPostContent({ post }: BlogPostContentProps) {
  const isKo = post.lang === 'ko'
  const dateLabel = post.created_at.slice(0, 10)
  const readMin = readingMinutes(post.content, post.lang)

  return (
    <div style={{ marginTop: 4 }}>
      <header style={{ paddingBottom: 18, borderBottom: '1px solid var(--border)', marginTop: 18 }}>
        <div style={{ fontSize: 12, color: 'var(--muted)' }}>
          <span style={{ color: 'var(--accent)' }}>$ </span>cat blog/
          <span style={{ color: 'var(--fg)' }}>{post.slug}.md</span>
        </div>
        <h1
          style={{
            margin: '14px 0 8px',
            fontSize: 30,
            lineHeight: 1.2,
            fontWeight: 700,
            letterSpacing: '-0.01em',
            color: 'var(--fg)',
          }}
        >
          {post.title}
        </h1>
        <div
          style={{
            display: 'flex',
            gap: 16,
            fontSize: 12,
            color: 'var(--muted)',
            flexWrap: 'wrap',
          }}
        >
          <span>{dateLabel}</span>
          <span style={{ color: 'var(--faint)' }}>·</span>
          <span>{readMin} {isKo ? '분 분량' : 'min read'}</span>
        </div>
      </header>

      <article
        style={{
          maxWidth: 720,
          margin: 0,
          fontSize: 14,
          color: 'var(--fg-2)',
          lineHeight: 1.75,
        }}
      >
        {renderContent(post.content)}
      </article>

      <HR label={isKo ? '관련' : 'related'} />
      <div style={{ fontSize: 12, color: 'var(--muted)' }}>
        # share-url: dcaify.com/blog/{post.slug}
      </div>
    </div>
  )
}

function renderContent(content: string) {
  const lines = content.split('\n')
  const elements: React.ReactNode[] = []
  let listItems: string[] = []
  let listType: 'ul' | 'ol' | null = null
  let key = 0

  function flushList() {
    if (listItems.length === 0) return
    const Tag = listType === 'ol' ? 'ol' : 'ul'
    elements.push(
      <Tag
        key={key++}
        style={{ paddingLeft: 22, marginTop: 12, marginBottom: 18, color: 'var(--fg-2)' }}
      >
        {listItems.map((item, i) => (
          <li key={i} dangerouslySetInnerHTML={{ __html: parseInline(item) }} style={{ marginBottom: 6 }} />
        ))}
      </Tag>,
    )
    listItems = []
    listType = null
  }

  function parseInline(text: string): string {
    return text
      .replace(/\*\*(.+?)\*\*/g, '<strong style="color: var(--fg)">$1</strong>')
      .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" style="color: var(--accent)">$1</a>')
      .replace(
        /`(.+?)`/g,
        '<code style="background: var(--panel-2); border: 1px solid var(--border); padding: 1px 6px; color: var(--amber);">$1</code>',
      )
  }

  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed.startsWith('## ')) {
      flushList()
      elements.push(
        <h2
          key={key++}
          style={{
            marginTop: 32,
            marginBottom: 12,
            fontSize: 17,
            color: 'var(--accent)',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            fontWeight: 400,
          }}
        >
          # {trimmed.slice(3)}
        </h2>,
      )
    } else if (trimmed.startsWith('### ')) {
      flushList()
      elements.push(
        <h3
          key={key++}
          style={{
            marginTop: 24,
            marginBottom: 10,
            fontSize: 15,
            color: 'var(--fg)',
            fontWeight: 600,
          }}
        >
          {trimmed.slice(4)}
        </h3>,
      )
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
      elements.push(
        <hr key={key++} style={{ borderTop: '1px dashed var(--border)', borderBottom: 'none', margin: '24px 0' }} />,
      )
    } else if (trimmed.startsWith('> ')) {
      flushList()
      elements.push(
        <div
          key={key++}
          style={{
            borderLeft: '2px solid var(--accent)',
            padding: '10px 16px',
            background: 'var(--panel-2)',
            margin: '20px 0',
            color: 'var(--fg)',
          }}
          dangerouslySetInnerHTML={{ __html: parseInline(trimmed.slice(2)) }}
        />,
      )
    } else if (trimmed.startsWith('*') && trimmed.endsWith('*') && !trimmed.startsWith('**')) {
      flushList()
      elements.push(
        <p
          key={key++}
          style={{ color: 'var(--muted)', fontStyle: 'italic', fontSize: 12.5 }}
          dangerouslySetInnerHTML={{ __html: parseInline(trimmed.slice(1, -1)) }}
        />,
      )
    } else if (trimmed === '') {
      flushList()
    } else {
      flushList()
      elements.push(
        <p
          key={key++}
          style={{ marginTop: 12, marginBottom: 12, color: 'var(--fg-2)' }}
          dangerouslySetInnerHTML={{ __html: parseInline(trimmed) }}
        />,
      )
    }
  }
  flushList()
  return elements
}
