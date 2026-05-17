import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import Footer from "@/components/Footer";
import "./globals.css";

const jetBrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "DCAify — Crypto DCA Calculator",
    template: "%s | DCAify",
  },
  description:
    "Calculate your crypto dollar cost averaging returns. Bitcoin, Ethereum, Solana, and 26 more coins, with clear assumptions, result explanations, and an estimated Korean tax scenario.",
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
      className={`${jetBrainsMono.variable} h-full antialiased dark`}
    >
      <head>
        <meta name="naver-site-verification" content="a0f8f58a53d5fc9aee6a53b4f4b242ae061fa4a0" />
        {/* eslint-disable-next-line @next/next/next-script-for-ga */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-6835L1T846" />
        <script
          dangerouslySetInnerHTML={{
            __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','G-6835L1T846');`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        {children}
        <Footer />
      </body>
    </html>
  );
}
