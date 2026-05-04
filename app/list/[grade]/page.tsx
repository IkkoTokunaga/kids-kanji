import Link from "next/link";
import {
  KANJI_ITEMS,
  PRACTICE_GRADES,
  type PracticeGrade,
  gradeSliceRange,
  isPracticeGrade,
} from "../../lib/kanji";

type Props = {
  params: Promise<{ grade: string }>;
};

export const dynamic = "force-dynamic";

function shuffledIndices(length: number): number[] {
  const arr = Array.from({ length }, (_, i) => i);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = arr[i]!;
    arr[i] = arr[j]!;
    arr[j] = tmp;
  }
  return arr;
}

export default async function GradeListPage({ params }: Props) {
  const { grade } = await params;
  const parsed = Number.parseInt(grade, 10);
  const gradeNum: PracticeGrade | null = isPracticeGrade(parsed) ? parsed : null;

  if (gradeNum == null) {
    return (
      <main className="kanji-home">
        <header className="kanji-home__header">
          <h1 className="kanji-home__title">学年が見つかりません</h1>
          <p className="kanji-home__intro">1年生 から 6年生 を選んでください。</p>
          <Link href="/" className="kanji-btn kanji-btn--primary kanji-home__cta">
            TOPに戻る
          </Link>
        </header>
      </main>
    );
  }

  const { start, end } = gradeSliceRange(gradeNum);
  const items = KANJI_ITEMS.slice(start, end);
  const randomOrder = shuffledIndices(items.length).join(",");
  const title = `${gradeNum}年生 一覧`;
  const gradeIndex = PRACTICE_GRADES.indexOf(gradeNum);
  const prevGrade = gradeIndex > 0 ? PRACTICE_GRADES[gradeIndex - 1] : null;
  const nextGrade =
    gradeIndex >= 0 && gradeIndex < PRACTICE_GRADES.length - 1
      ? PRACTICE_GRADES[gradeIndex + 1]
      : null;

  return (
    <main className="kanji-home">
      <header className="kanji-home__header">
        <h1 className="kanji-home__title">{title}</h1>
        <div className="kanji-home__gradeActions">
          <Link
            href={`/practice?grade=${gradeNum}&start=0&order=${encodeURIComponent(randomOrder)}`}
            className="kanji-btn kanji-btn--primary kanji-home__cta"
          >
            練習を始める
          </Link>
          <Link href="/" className="kanji-btn kanji-btn--ghost kanji-home__cta">
            TOPへ
          </Link>
          {prevGrade != null && (
            <Link
              href={`/list/${prevGrade}`}
              className="kanji-btn kanji-btn--ghost kanji-home__cta"
            >
              ← {prevGrade}年生へ
            </Link>
          )}
          {nextGrade != null && (
            <Link
              href={`/list/${nextGrade}`}
              className="kanji-btn kanji-btn--ghost kanji-home__cta"
            >
              {nextGrade}年生へ →
            </Link>
          )}
        </div>
      </header>

      <ul className="kanji-home__grid" role="list">
        {items.map((item, offset) => {
          const i = start + offset;
          return (
            <li key={`${i}-${item.char}`} className="kanji-home__cell">
              <Link
                href={`/practice?grade=${gradeNum}&start=${offset}`}
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
