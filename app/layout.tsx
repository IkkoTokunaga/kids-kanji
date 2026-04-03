import type { Metadata } from "next";
import { Noto_Sans_JP } from "next/font/google";
import "@/app/globals.css";

const noto = Noto_Sans_JP({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-noto",
  display: "swap",
});

export const metadata: Metadata = {
  title: "かんじのれんしゅう",
  description: "しょう1・2ねん はっていかんじ240じ てほん・なぞり・じゆうかく",
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
