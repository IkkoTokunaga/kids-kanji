import KanjiPractice from "../components/KanjiPractice";
import { clampKanjiIndex } from "../lib/kanji";

type Props = {
  searchParams: Promise<{ start?: string }>;
};

export default async function PracticePage({ searchParams }: Props) {
  const sp = await searchParams;
  const parsed = Number.parseInt(sp.start ?? "0", 10);
  const initialIndex = clampKanjiIndex(Number.isNaN(parsed) ? 0 : parsed);

  return <KanjiPractice initialIndex={initialIndex} />;
}
