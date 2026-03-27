import type { Metadata } from "next";
import { DM_Sans, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "DCAify — Crypto DCA Calculator",
    template: "%s | DCAify",
  },
  description:
    "Calculate your crypto dollar cost averaging returns. Bitcoin, Ethereum, Solana and 25+ coins. Break-even analysis with Korean tax support.",
  metadataBase: new URL("https://dcaify.com"),
  keywords: [
    "DCA calculator",
    "dollar cost averaging",
    "crypto DCA",
    "Bitcoin DCA",
    "적립식 투자",
    "비트코인 적립식",
    "암호화폐 DCA 계산기",
  ],
  authors: [{ name: "DCAify" }],
  creator: "DCAify",
  openGraph: {
    type: "website",
    siteName: "DCAify",
    locale: "en_US",
    alternateLocale: "ko_KR",
  },
  twitter: {
    card: "summary_large_image",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${dmSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <head>
        {/* Satoshi — display font from Fontshare */}
        <link
          href="https://api.fontshare.com/v2/css?f[]=satoshi@700&display=swap"
          rel="stylesheet"
        />
        {/* GA4 */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-6835L1T846" />
        <script
          dangerouslySetInnerHTML={{
            __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','G-6835L1T846');`,
          }}
        />
      </head>
      <body
        className="min-h-full flex flex-col"
        style={{ background: 'var(--bg)', color: 'var(--text)' }}
      >
        {children}
        <footer
          className="py-6 text-center text-xs mt-auto"
          style={{ borderTop: '1px solid var(--border)', color: 'var(--text-faint)' }}
        >
          <div className="flex justify-center gap-4 mb-2">
            <Link href="/about" className="hover:text-[var(--text-muted)]">About</Link>
            <Link href="/privacy" className="hover:text-[var(--text-muted)]">Privacy</Link>
            <Link href="/blog" className="hover:text-[var(--text-muted)]">Blog</Link>
          </div>
          <p>&copy; {new Date().getFullYear()} DCAify. Not financial advice.</p>
        </footer>
      </body>
    </html>
  );
}
