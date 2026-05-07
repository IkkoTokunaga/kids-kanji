import type { Metadata, Viewport } from "next";
import { Noto_Sans_JP } from "next/font/google";
import "@/app/globals.css";

const noto = Noto_Sans_JP({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-noto",
  display: "swap",
});

export const metadata: Metadata = {
  title: "漢字の練習",
  description: "小1〜6年 配当漢字1026字 見本・なぞり・自由書き",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://kids-oekaki.ikk-dev.jp"),
  openGraph: {
    title: "漢字の練習",
    description: "小1〜6年 配当漢字1026字 見本・なぞり・自由書き",
    url: "/",
    siteName: "漢字の練習",
    locale: "ja_JP",
    type: "website",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "漢字の練習アプリ画面",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "漢字の練習",
    description: "小1〜6年 配当漢字1026字 見本・なぞり・自由書き",
    images: ["/twitter-image"],
  },
};

export const viewport: Viewport = {
  themeColor: "#2a6b52",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className={`${noto.variable} ${noto.className}`}>
      <body>{children}</body>
    </html>
  );
}
