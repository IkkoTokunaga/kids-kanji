import Link from "next/link";

/** ビルド／ボリュームに古い静的 HTML が残っても一覧が最新になるよう SSR にする */
export const dynamic = "force-dynamic";

export default function HomePage() {
  return (
    <main className="kanji-home">
      <header className="kanji-home__header">
        <h1 className="kanji-home__title">漢字 練習 TOP</h1>
        <div className="kanji-home__gradeActions kanji-home__gradeActions--stack">
          <Link href="/list/1" className="kanji-btn kanji-btn--primary kanji-home__cta">
            1年生 一覧
          </Link>
          <Link href="/list/2" className="kanji-btn kanji-btn--ghost kanji-home__cta">
            2年生 一覧
          </Link>
        </div>
      </header>
    </main>
  );
}
