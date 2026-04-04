import Link from "next/link";
import { KANJI_GRADE_1_COUNT, KANJI_ITEMS } from "./lib/kanji";

/** ビルド／ボリュームに古い静的 HTML が残っても一覧が最新になるよう SSR にする */
export const dynamic = "force-dynamic";

export default function HomePage() {
  return (
    <main className="kanji-home">
      <header className="kanji-home__header">
        <h1 className="kanji-home__title">かんじ いちらん</h1>
        <p className="kanji-home__intro">
          しょうがっこう いちねん・にねんのはっていかんじ（240じ）。
          したのいちらんは、はいたいひょうのじゅん（1ねんせい→2ねんせい）だよ。
          えらんでれんしゅうするか、したのボタンでさいしょからはじめられるよ。
        </p>
        <Link
          href="/practice?start=0"
          className="kanji-btn kanji-btn--primary kanji-home__cta"
        >
          れんしゅうをはじめる
        </Link>
      </header>

      <ul className="kanji-home__grid" role="list">
        <li className="kanji-home__section">
          <h2 className="kanji-home__section-title">1ねんせい（80じ）</h2>
        </li>
        {KANJI_ITEMS.slice(0, KANJI_GRADE_1_COUNT).map((item, i) => (
          <li key={`${i}-${item.char}`} className="kanji-home__cell">
            <Link
              href={`/practice?start=${i}`}
              className="kanji-home__card"
              lang="ja-JP"
            >
              <span className="kanji-home__glyph" aria-hidden>
                {item.char}
              </span>
              <span className="kanji-home__readings">
                <span className="kanji-home__kun">{item.kunYomi}</span>
                <span className="kanji-home__on">{item.onYomi}</span>
              </span>
            </Link>
          </li>
        ))}
        <li className="kanji-home__section">
          <h2 className="kanji-home__section-title">2ねんせい（160じ）</h2>
        </li>
        {KANJI_ITEMS.slice(KANJI_GRADE_1_COUNT).map((item, j) => {
          const i = KANJI_GRADE_1_COUNT + j;
          return (
            <li key={`${i}-${item.char}`} className="kanji-home__cell">
              <Link
                href={`/practice?start=${i}`}
                className="kanji-home__card"
                lang="ja-JP"
              >
                <span className="kanji-home__glyph" aria-hidden>
                  {item.char}
                </span>
                <span className="kanji-home__readings">
                  <span className="kanji-home__kun">{item.kunYomi}</span>
                  <span className="kanji-home__on">{item.onYomi}</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
