import Link from "next/link";
import { KANJI_ITEMS } from "./lib/kanji";

/** ビルド／ボリュームに古い静的 HTML が残っても一覧が最新になるよう SSR にする */
export const dynamic = "force-dynamic";

export default function HomePage() {
  return (
    <main className="kanji-home">
      <header className="kanji-home__header">
        <h1 className="kanji-home__title">かんじ れんしゅう TOP</h1>
        <p className="kanji-home__intro">
          しょうがっこう 1ねん・2ねんのかんじを、がくねんごとのいちらんで
          れんしゅうできるよ。したのボタンからみたいがくねんをえらんでね。
        </p>
        <div className="kanji-home__gradeActions kanji-home__gradeActions--stack">
          <Link href="/list/1" className="kanji-btn kanji-btn--primary kanji-home__cta">
            1ねんせい いちらん
          </Link>
          <Link href="/list/2" className="kanji-btn kanji-btn--ghost kanji-home__cta">
            2ねんせい いちらん
          </Link>
        </div>
      </header>
      <p className="kanji-home__meta">ぜんぶで {KANJI_ITEMS.length} じ をれんしゅうできるよ。</p>
    </main>
  );
}
