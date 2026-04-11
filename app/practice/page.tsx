import KanjiPractice from "../components/KanjiPractice";
import {
  type PracticeGrade,
  clampPracticeKanjiIndex,
  randomPracticeKanjiIndex,
} from "../lib/kanji";

type Props = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function parseGrade(
  sp: Record<string, string | string[] | undefined> | undefined
): PracticeGrade {
  const raw = sp?.grade;
  const first = Array.isArray(raw) ? raw[0] : raw;
  const n = Number.parseInt(String(first ?? "1"), 10);
  if (n === 2) return 2;
  return 1;
}

function resolveStartIndex(
  sp: Record<string, string | string[] | undefined> | undefined,
  grade: PracticeGrade
): number {
  const raw = sp?.start;
  const first = Array.isArray(raw) ? raw[0] : raw;
  if (first === undefined || first === "") {
    return randomPracticeKanjiIndex(grade);
  }
  const parsed = Number.parseInt(String(first), 10);
  if (Number.isNaN(parsed)) {
    return randomPracticeKanjiIndex(grade);
  }
  return clampPracticeKanjiIndex(parsed, grade);
}

export default async function PracticePage({ searchParams }: Props) {
  const resolved = searchParams == null ? {} : await searchParams;
  const grade = parseGrade(resolved);
  const initialIndex = resolveStartIndex(resolved, grade);

  return <KanjiPractice grade={grade} initialIndex={initialIndex} />;
}
