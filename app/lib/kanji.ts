import lowGradesJson from "./kanji-low-grades.json";

export type KanjiItem = {
  char: string;
  kunYomi: string;
  onYomi: string;
  /** 使い方・短い例文（ひらがな中心） */
  example: string;
};

/** 小学校1・2年生の配当漢字（各80・160字、計240字）の代表読みつき */
export const KANJI_ITEMS: readonly KanjiItem[] =
  lowGradesJson as readonly KanjiItem[];

export function clampKanjiIndex(n: number): number {
  if (!Number.isFinite(n) || n < 0) return 0;
  const max = KANJI_ITEMS.length - 1;
  if (max < 0) return 0;
  if (n > max) return max;
  return Math.floor(n);
}
