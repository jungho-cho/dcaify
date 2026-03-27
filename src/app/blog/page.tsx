import { Metadata } from 'next'
import Link from 'next/link'
import Nav from '@/components/Nav'
import { supabase } from '@/lib/supabase'

export const metadata: Metadata = {
  title: 'Blog — DCA Guides & Crypto Investing Tips',
  description: 'Learn about dollar cost averaging, crypto investing strategies, and how to build long-term wealth with DCA. Guides in English and Korean.',
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

export const revalidate = 3600 // revalidate every hour

export default async function BlogPage() {
  const posts = await getPosts()
  const enPosts = posts.filter((p) => p.lang === 'en')
  const koPosts = posts.filter((p) => p.lang === 'ko')

  return (
    <>
      <Nav />
      <main className="min-h-screen bg-gray-950 text-white">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <h1 className="text-3xl font-bold mb-2">Blog</h1>
          <p className="text-gray-400 mb-10">DCA guides and crypto investing tips</p>

          {enPosts.length > 0 && (
            <section className="mb-12">
              <h2 className="text-xl font-semibold mb-4">English</h2>
              <div className="space-y-4">
                {enPosts.map((post) => (
                  <Link
                    key={post.slug}
                    href={`/blog/${post.slug}`}
                    className="block rounded-xl border border-gray-800 bg-gray-900 p-5 hover:border-blue-500 transition-colors"
                  >
                    <h3 className="text-lg font-medium mb-1">{post.title}</h3>
                    <p className="text-sm text-gray-400">{post.description}</p>
                    <p className="text-xs text-gray-600 mt-2">
                      {new Date(post.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {koPosts.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold mb-4">한국어</h2>
              <div className="space-y-4">
                {koPosts.map((post) => (
                  <Link
                    key={post.slug}
                    href={`/blog/${post.slug}`}
                    className="block rounded-xl border border-gray-800 bg-gray-900 p-5 hover:border-blue-500 transition-colors"
                  >
                    <h3 className="text-lg font-medium mb-1">{post.title}</h3>
                    <p className="text-sm text-gray-400">{post.description}</p>
                    <p className="text-xs text-gray-600 mt-2">
                      {new Date(post.created_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {posts.length === 0 && (
            <p className="text-gray-500">No posts yet. Check back soon!</p>
          )}
        </div>
      </main>
    </>
  )
}
