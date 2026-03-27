import { Metadata } from 'next'
import Link from 'next/link'
import Nav from '@/components/Nav'
import { supabase } from '@/lib/supabase'

export const metadata: Metadata = {
  title: '블로그 — 적립식 투자 가이드',
  description: '적립식 투자(DCA), 암호화폐 투자 전략, 장기 자산 축적 방법에 대한 가이드를 읽어보세요.',
}

interface BlogPost {
  slug: string
  lang: string
  title: string
  description: string
  created_at: string
}

async function getPosts(): Promise<BlogPost[]> {
  const { data } = await supabase
    .from('blog_posts')
    .select('slug, lang, title, description, created_at')
    .eq('published', true)
    .order('created_at', { ascending: false })
  return data ?? []
}

export const revalidate = 3600

export default async function KoBlogPage() {
  const posts = await getPosts()
  const koPosts = posts.filter((p) => p.lang === 'ko')
  const enPosts = posts.filter((p) => p.lang === 'en')

  return (
    <>
      <Nav lang="ko" />
      <main className="min-h-screen">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: 'var(--font-display)' }}>블로그</h1>
          <p className="mb-10" style={{ color: 'var(--text-muted)' }}>적립식 투자 가이드 및 암호화폐 투자 팁</p>

          {koPosts.length > 0 && (
            <section className="mb-12">
              <h2 className="text-xl font-semibold mb-4">한국어</h2>
              <div className="space-y-4">
                {koPosts.map((post) => (
                  <Link key={post.slug} href={`/blog/${post.slug}`}
                    className="block p-5 transition-all duration-150 hover:translate-x-1"
                    style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
                    <h3 className="text-lg font-medium mb-1">{post.title}</h3>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{post.description}</p>
                    <p className="text-xs mt-2" style={{ color: 'var(--text-faint)' }}>
                      {new Date(post.created_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {enPosts.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold mb-4">English</h2>
              <div className="space-y-4">
                {enPosts.map((post) => (
                  <Link key={post.slug} href={`/blog/${post.slug}`}
                    className="block p-5 transition-all duration-150 hover:translate-x-1"
                    style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
                    <h3 className="text-lg font-medium mb-1">{post.title}</h3>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{post.description}</p>
                    <p className="text-xs mt-2" style={{ color: 'var(--text-faint)' }}>
                      {new Date(post.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {posts.length === 0 && (
            <p style={{ color: 'var(--text-faint)' }}>아직 게시물이 없습니다. 곧 업데이트됩니다!</p>
          )}
        </div>
      </main>
    </>
  )
}
