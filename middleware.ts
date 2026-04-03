import { NextResponse } from "next/server";

/**
 * 今は何もしないが、matcher で /_next/* を除外しておく。
 * i18n 等ですべてのパスを middleware に通すと、CSS/JS が返らず「スタイルが効かない」原因になる。
 */
export function middleware() {
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};
