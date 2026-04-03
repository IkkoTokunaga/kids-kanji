import Link from "next/link";
import { KANJI_ITEMS } from "./lib/kanji";

export default function HomePage() {
  return (
    <main className="kanji-home">
      <header className="kanji-home__header">
        <h1 className="kanji-home__title">かんじ いちらん</h1>
        <p className="kanji-home__intro">
          しょうがっこう いちねん・にねんのはっていかんじ（240じ）。
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
        {KANJI_ITEMS.map((item, i) => (
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
      </ul>
    </main>
  );
}
