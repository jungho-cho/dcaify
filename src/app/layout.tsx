import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-gray-950 text-white">{children}</body>
    </html>
  );
}
