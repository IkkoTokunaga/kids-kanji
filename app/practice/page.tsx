import KanjiPractice from "../components/KanjiPractice";
import { clampKanjiIndex } from "../lib/kanji";

type Props = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function parseStartIndex(
  sp: Record<string, string | string[] | undefined> | undefined
): number {
  const raw = sp?.start;
  const first = Array.isArray(raw) ? raw[0] : raw;
  const parsed = Number.parseInt(String(first ?? "0"), 10);
  return clampKanjiIndex(Number.isNaN(parsed) ? 0 : parsed);
}

export default async function PracticePage({ searchParams }: Props) {
  const resolved = searchParams == null ? {} : await searchParams;
  const initialIndex = parseStartIndex(resolved);

  return <KanjiPractice initialIndex={initialIndex} />;
}
