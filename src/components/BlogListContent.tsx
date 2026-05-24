import Link from 'next/link'
import AsciiHeader from '@/components/terminal/AsciiHeader'
import { BLOG_ASCII } from '@/components/terminal/ascii'
import HR from '@/components/terminal/HR'
import Panel from '@/components/terminal/Panel'

export interface BlogListPost {
  slug: string
  lang: string
  title: string
  description: string
  created_at: string
  readMinutes: number
}

interface BlogListContentProps {
  posts: BlogListPost[]
  lang: 'en' | 'ko'
}

const FILTERS_EN = ['all', 'en', 'ko', 'method', 'bitcoin', 'altcoins', 'tax']
const FILTERS_KO = ['all', 'ko', 'en', 'method', 'bitcoin', 'altcoins', '세금']

export default function BlogListContent({ posts, lang }: BlogListContentProps) {
  const subtitle = lang === 'ko'
    ? '적립식 투자 가이드 · 일반 텍스트 · 팝업·이메일 게이트 없음'
    : 'DCA guides and crypto investing notes · plain text · no popups · no email gate'

  const enPosts = posts.filter((p) => p.lang === 'en')
  const koPosts = posts.filter((p) => p.lang === 'ko')

  const [firstSection, secondSection] = lang === 'ko'
    ? [
        { code: 'ko', title: 'ko · 한국어', items: koPosts },
        { code: 'en', title: 'en · english', items: enPosts },
      ]
    : [
        { code: 'en', title: 'en · english', items: enPosts },
        { code: 'ko', title: 'ko · 한국어', items: koPosts },
      ]

  return (
    <div style={{ marginTop: 4 }}>
      <AsciiHeader lines={BLOG_ASCII} subtitle={subtitle} />

      <Panel padding="12px 18px">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 12, flexWrap: 'wrap' }}>
          <span style={{ color: 'var(--muted)' }}>$ ls -la blog/ | grep</span>
          <span style={{ color: 'var(--amber)', background: 'var(--amber-bg)', padding: '0 6px' }}>
            recent
          </span>
          <span style={{ color: 'var(--muted)' }}>· filter:</span>
          {(lang === 'ko' ? FILTERS_KO : FILTERS_EN).map((f, i) => (
            <span
              key={f}
              style={{
                color: i === 0 ? 'var(--accent)' : 'var(--fg-2)',
                borderBottom: i === 0 ? '1px solid var(--accent)' : 'none',
                paddingBottom: 1,
              }}
            >
              {f}
            </span>
          ))}
          <span style={{ marginLeft: 'auto', color: 'var(--muted)', fontSize: 11 }}>
            # {posts.length} posts · feed → /rss.xml
          </span>
        </div>
      </Panel>

      {[firstSection, secondSection].map((section) => (
        <PostsSection
          key={section.code}
          title={section.title}
          posts={section.items}
          lang={lang}
        />
      ))}

      <HR label={lang === 'ko' ? '아카이브' : 'archive'} />
      <div style={{ fontSize: 12, color: 'var(--muted)' }}>
        # {lang === 'ko' ? '예정' : 'older posts'}:{' '}
        <span style={{ color: 'var(--accent)' }}>2025</span> ·{' '}
        <span style={{ color: 'var(--accent)' }}>2024</span> ·{' '}
        <span style={{ color: 'var(--accent)' }}>2023</span>
      </div>
    </div>
  )
}

function PostsSection({ title, posts, lang }: { title: string; posts: BlogListPost[]; lang: 'en' | 'ko' }) {
  if (posts.length === 0) return null
  return (
    <>
      <HR label={title} right={`${posts.length} ${lang === 'ko' ? '개' : 'posts'}`} />
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '100px minmax(0, 1fr) 80px',
          gap: 16,
          fontSize: 11,
          color: 'var(--muted)',
          borderBottom: '1px solid var(--border)',
          paddingBottom: 6,
        }}
      >
        <span>DATE</span>
        <span>TITLE / SLUG</span>
        <span style={{ textAlign: 'right' }}>READ</span>
      </div>
      {posts.map((post) => (
        <PostRow key={post.slug} post={post} lang={lang} />
      ))}
    </>
  )
}

function PostRow({ post, lang }: { post: BlogListPost; lang: 'en' | 'ko' }) {
  const date = post.created_at.slice(0, 10)
  return (
    <Link
      href={`/blog/${post.slug}`}
      style={{
        display: 'grid',
        gridTemplateColumns: '100px minmax(0, 1fr) 80px',
        gap: 16,
        padding: '14px 0',
        borderBottom: '1px solid var(--faint)',
        alignItems: 'baseline',
        color: 'var(--fg)',
      }}
    >
      <span style={{ color: 'var(--muted)', fontSize: 12 }}>{date}</span>
      <div>
        <div style={{ fontSize: 15, color: 'var(--fg)' }}>{post.title}</div>
        <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 3, lineHeight: 1.5 }}>
          {post.description}
        </div>
        <div style={{ fontSize: 11, color: 'var(--faint)', marginTop: 4 }}>
          <span style={{ color: 'var(--muted)' }}>$ </span>
          <span style={{ color: 'var(--accent)' }}>cat </span>
          <span style={{ color: 'var(--fg-2)' }}>blog/{post.slug}.md</span>
        </div>
      </div>
      <span style={{ color: 'var(--muted)', fontSize: 12, textAlign: 'right' }}>
        {post.readMinutes} {lang === 'ko' ? '분' : 'min'}
      </span>
    </Link>
  )
}
