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

/** れんしゅうで選べる学年（配当表どおり 1・2 のみ） */
export type PracticeGrade = 1 | 2;

/** 小学校1年生の配当漢字 */
export const KANJI_GRADE_1_ITEMS: readonly KanjiItem[] = KANJI_ITEMS.slice(
  0,
  KANJI_GRADE_1_COUNT
) as readonly KanjiItem[];

/** 小学校2年生の配当漢字 */
export const KANJI_GRADE_2_ITEMS: readonly KanjiItem[] = KANJI_ITEMS.slice(
  KANJI_GRADE_1_COUNT
) as readonly KanjiItem[];

export const KANJI_GRADE_2_COUNT = KANJI_GRADE_2_ITEMS.length;

export function getPracticeItems(grade: PracticeGrade): readonly KanjiItem[] {
  return grade === 1 ? KANJI_GRADE_1_ITEMS : KANJI_GRADE_2_ITEMS;
}

export function practiceGradeItemCount(grade: PracticeGrade): number {
  return grade === 1 ? KANJI_GRADE_1_COUNT : KANJI_GRADE_2_COUNT;
}

export function clampKanjiIndex(n: number): number {
  if (!Number.isFinite(n) || n < 0) return 0;
  const max = KANJI_ITEMS.length - 1;
  if (max < 0) return 0;
  if (n > max) return max;
  return Math.floor(n);
}

export function clampPracticeKanjiIndex(
  n: number,
  grade: PracticeGrade
): number {
  const max = practiceGradeItemCount(grade) - 1;
  if (max < 0) return 0;
  if (!Number.isFinite(n) || n < 0) return 0;
  if (n > max) return max;
  return Math.floor(n);
}

/** その学年の範囲でランダム。`excludeIndex` ありのときは別の字を選ぶ */
export function randomPracticeKanjiIndex(
  grade: PracticeGrade,
  excludeIndex?: number
): number {
  const len: number = practiceGradeItemCount(grade);
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
