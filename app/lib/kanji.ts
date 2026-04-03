export type KanjiItem = {
  char: string;
  kunYomi: string;
  onYomi: string;
};

export const KANJI_ITEMS: readonly KanjiItem[] = [
  { char: "山", kunYomi: "やま", onYomi: "サン" },
  { char: "川", kunYomi: "かわ", onYomi: "セン" },
  { char: "田", kunYomi: "た", onYomi: "デン" },
  { char: "木", kunYomi: "き", onYomi: "ボク・モク" },
  { char: "本", kunYomi: "もと", onYomi: "ホン" },
  { char: "日", kunYomi: "ひ・か・び", onYomi: "ニチ・ジツ" },
  { char: "月", kunYomi: "つき", onYomi: "ゲツ・ガツ" },
  { char: "火", kunYomi: "ひ", onYomi: "カ" },
  { char: "水", kunYomi: "みず", onYomi: "スイ" },
  { char: "人", kunYomi: "ひと", onYomi: "ニン・ジン" },
] as const;

export function clampKanjiIndex(n: number): number {
  if (!Number.isFinite(n) || n < 0) return 0;
  const max = KANJI_ITEMS.length - 1;
  if (n > max) return max;
  return Math.floor(n);
}
