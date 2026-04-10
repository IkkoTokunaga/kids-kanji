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

/** 配当表の並び：先頭からこの件数が1年生、続きが2年生 */
export const KANJI_GRADE_1_COUNT = 80;

/** 小学校1年生の配当漢字のみ（れんしゅうはここからランダム） */
export const KANJI_GRADE_1_ITEMS: readonly KanjiItem[] = KANJI_ITEMS.slice(
  0,
  KANJI_GRADE_1_COUNT
) as readonly KanjiItem[];

export function clampKanjiIndex(n: number): number {
  if (!Number.isFinite(n) || n < 0) return 0;
  const max = KANJI_ITEMS.length - 1;
  if (max < 0) return 0;
  if (n > max) return max;
  return Math.floor(n);
}

export function clampGrade1KanjiIndex(n: number): number {
  if (!Number.isFinite(n) || n < 0) return 0;
  const max = KANJI_GRADE_1_COUNT - 1;
  if (max < 0) return 0;
  if (n > max) return max;
  return Math.floor(n);
}

/** 1年生の範囲でランダム。`excludeIndex` ありのときは別の字を選ぶ（同じ字の連続を避ける） */
export function randomGrade1KanjiIndex(excludeIndex?: number): number {
  const len: number = KANJI_GRADE_1_COUNT;
  if (len <= 0) return 0;
  if (len === 1) return 0;
  if (
    excludeIndex === undefined ||
    excludeIndex < 0 ||
    excludeIndex >= len
  ) {
    return Math.floor(Math.random() * len);
  }
  let next = excludeIndex;
  let guard = 0;
  while (next === excludeIndex && guard++ < 100) {
    next = Math.floor(Math.random() * len);
  }
  return next;
}
