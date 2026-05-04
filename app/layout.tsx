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
  metadataBase: new URL("https://kids-kanji.ikk-dev.jp"),
  openGraph: {
    title: "漢字の練習",
    description: "小1〜6年 配当漢字1026字 見本・なぞり・自由書き",
    url: "https://kids-kanji.ikk-dev.jp",
    siteName: "漢字の練習",
    locale: "ja_JP",
    type: "website",
    images: [
      {
        url: "/ogp.png",
        width: 1784,
        height: 1006,
        alt: "漢字の練習アプリ画面",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "漢字の練習",
    description: "小1〜6年 配当漢字1026字 見本・なぞり・自由書き",
    images: ["/ogp.png"],
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
