import { Metadata } from 'next'
import Nav from '@/components/Nav'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'DCAify privacy policy — how we handle your data.',
}

export default function PrivacyPage() {
  return (
    <>
      <Nav />
      <main className="min-h-screen bg-gray-950 text-white">
        <div className="max-w-[65ch] mx-auto px-4 py-12">
          <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
          <p className="text-sm text-gray-500 mb-8">Last updated: March 27, 2026</p>

          <div className="space-y-6 text-gray-300 leading-relaxed text-sm">
            <section>
              <h2 className="text-lg font-semibold text-white mb-2">Information We Collect</h2>
              <p>
                DCAify collects minimal data to operate the service:
              </p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li><strong>Page views:</strong> We record which pages are visited, the referring URL, and the timestamp. This data is anonymous — we do not collect IP addresses, names, or personal identifiers.</li>
                <li><strong>Calculator inputs:</strong> Your investment amount, frequency, and date range are processed entirely in your browser. This data is never sent to our servers or stored.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-2">How We Use Your Data</h2>
              <p>Anonymous page view data helps us understand which coins and features are most useful, so we can improve the service.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-2">Third-Party Services</h2>
              <ul className="list-disc list-inside space-y-1">
                <li><strong>Binance API:</strong> We fetch cryptocurrency price data from Binance. Your browser does not directly communicate with Binance — all requests go through our server.</li>
                <li><strong>Vercel:</strong> Our site is hosted on Vercel. See <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Vercel&apos;s Privacy Policy</a>.</li>
                <li><strong>Supabase:</strong> Anonymous analytics data is stored in Supabase. See <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Supabase Privacy Policy</a>.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-2">Cookies</h2>
              <p>DCAify does not use cookies for tracking. If we add advertising in the future (e.g., Google AdSense), those services may set their own cookies. We will update this policy accordingly.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-2">Data Retention</h2>
              <p>Anonymous page view data is retained for up to 12 months for analytics purposes, then automatically deleted.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-2">Your Rights</h2>
              <p>Since we do not collect personal data, there is no personal data to access, correct, or delete. If you have questions about your data, contact us at <a href="mailto:hello@dcaify.com" className="text-blue-400 hover:underline">hello@dcaify.com</a>.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-2">Changes to This Policy</h2>
              <p>We may update this privacy policy from time to time. Changes will be posted on this page with an updated &ldquo;Last updated&rdquo; date.</p>
            </section>
          </div>
        </div>
      </main>
    </>
  )
}
