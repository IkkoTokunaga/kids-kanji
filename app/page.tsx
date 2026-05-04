import Link from "next/link";
import { PRACTICE_GRADES } from "./lib/kanji";

/** ビルド／ボリュームに古い静的 HTML が残っても一覧が最新になるよう SSR にする */
export const dynamic = "force-dynamic";

export default function HomePage() {
  return (
    <main className="kanji-home">
      <header className="kanji-home__header">
        <h1 className="kanji-home__title">漢字 練習 TOP</h1>
        <div className="kanji-home__gradeActions kanji-home__gradeActions--stack">
          {PRACTICE_GRADES.map((grade) => (
            <Link
              key={grade}
              href={`/list/${grade}`}
              className={`kanji-btn kanji-btn--ghost kanji-home__cta kanji-home__gradeLink kanji-home__gradeLink--g${grade}`}
            >
              {grade}年生 一覧
            </Link>
          ))}
        </div>
      </header>
    </main>
  );
}
