import Link from "next/link";
import { KANJI_GRADE_1_COUNT, KANJI_ITEMS } from "../../lib/kanji";

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
  const gradeNum = Number.parseInt(grade, 10);
  const isGrade1 = gradeNum === 1;
  const isGrade2 = gradeNum === 2;

  if (!isGrade1 && !isGrade2) {
    return (
      <main className="kanji-home">
        <header className="kanji-home__header">
          <h1 className="kanji-home__title">がくねんがみつかりません</h1>
          <p className="kanji-home__intro">1ねんせい か 2ねんせい をえらんでください。</p>
          <Link href="/" className="kanji-btn kanji-btn--primary kanji-home__cta">
            TOPにもどる
          </Link>
        </header>
      </main>
    );
  }

  const start = isGrade1 ? 0 : KANJI_GRADE_1_COUNT;
  const end = isGrade1 ? KANJI_GRADE_1_COUNT : KANJI_ITEMS.length;
  const items = KANJI_ITEMS.slice(start, end);
  const randomOrder = shuffledIndices(items.length).join(",");
  const title = isGrade1 ? "1ねんせい いちらん" : "2ねんせい いちらん";
  const otherGrade = isGrade1 ? 2 : 1;
  const otherLabel = isGrade1 ? "2ねんせい" : "1ねんせい";

  return (
    <main className="kanji-home">
      <header className="kanji-home__header">
        <h1 className="kanji-home__title">{title}</h1>
        <p className="kanji-home__intro">
          したのカードから 1もじずつ れんしゅうできるよ。ほかのがくねんもみたいときは
          ボタンをおしてね。
        </p>
        <div className="kanji-home__gradeActions">
          <Link
            href={`/practice?grade=${gradeNum}&start=0&order=${encodeURIComponent(randomOrder)}`}
            className="kanji-btn kanji-btn--primary kanji-home__cta"
          >
            れんしゅうをはじめる（ランダム）
          </Link>
          <Link href="/" className="kanji-btn kanji-btn--ghost kanji-home__cta">
            TOPへ
          </Link>
          <Link
            href={`/list/${otherGrade}`}
            className="kanji-btn kanji-btn--ghost kanji-home__cta"
          >
            {otherLabel}をみる
          </Link>
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
