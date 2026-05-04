import KanjiPractice from "../components/KanjiPractice";
import { type PracticeGrade, clampPracticeKanjiIndex } from "../lib/kanji";

type Props = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function firstValue(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

function parseGrade(
  sp: Record<string, string | string[] | undefined> | undefined
): PracticeGrade {
  const first = firstValue(sp?.grade);
  const n = Number.parseInt(String(first ?? "1"), 10);
  if (n === 2) return 2;
  return 1;
}

function parseStartIndex(
  sp: Record<string, string | string[] | undefined> | undefined,
  grade: PracticeGrade
): number {
  const first = firstValue(sp?.start);
  const parsed = Number.parseInt(String(first ?? "0"), 10);
  return clampPracticeKanjiIndex(Number.isNaN(parsed) ? 0 : parsed, grade);
}

function parseOrder(
  sp: Record<string, string | string[] | undefined> | undefined,
  grade: PracticeGrade
): number[] | undefined {
  const raw = firstValue(sp?.order);
  if (!raw) return undefined;
  const values = raw
    .split(",")
    .map((s) => Number.parseInt(s.trim(), 10))
    .filter((n) => Number.isFinite(n) && n >= 0)
    .map((n) => clampPracticeKanjiIndex(n, grade));
  if (values.length === 0) return undefined;
  return values;
}

export default async function PracticePage({ searchParams }: Props) {
  const resolved = searchParams == null ? {} : await searchParams;
  const grade = parseGrade(resolved);
  const initialIndex = parseStartIndex(resolved, grade);
  const order = parseOrder(resolved, grade);

  return <KanjiPractice grade={grade} initialIndex={initialIndex} order={order} />;
}
