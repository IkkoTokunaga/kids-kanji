import KanjiPractice from "../components/KanjiPractice";
import {
  clampGrade1KanjiIndex,
  randomGrade1KanjiIndex,
} from "../lib/kanji";

type Props = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

/** 1年生の並び内インデックスのみ受け付け。未指定はサーバーでランダム（SSR と一致させる） */
function resolveGrade1StartIndex(
  sp: Record<string, string | string[] | undefined> | undefined
): number {
  const raw = sp?.start;
  const first = Array.isArray(raw) ? raw[0] : raw;
  if (first === undefined || first === "") {
    return randomGrade1KanjiIndex();
  }
  const parsed = Number.parseInt(String(first), 10);
  if (Number.isNaN(parsed)) {
    return randomGrade1KanjiIndex();
  }
  return clampGrade1KanjiIndex(parsed);
}

export default async function PracticePage({ searchParams }: Props) {
  const resolved = searchParams == null ? {} : await searchParams;
  const initialIndex = resolveGrade1StartIndex(resolved);

  return <KanjiPractice initialIndex={initialIndex} />;
}
