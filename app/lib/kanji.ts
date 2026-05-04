import lowGradesJson from "./kanji-low-grades.json";

export type KanjiItem = {
  char: string;
  kunYomi: string;
  onYomi: string;
  /** 使い方・短い例文（ひらがな中心） */
  example: string;
};

/** 小学校1〜6年生の配当漢字（計1026字）の代表読みつき */
export const KANJI_ITEMS: readonly KanjiItem[] =
  lowGradesJson as readonly KanjiItem[];

/** 学年ごとの配当数（学年別漢字配当表） */
export const KANJI_GRADE_COUNTS = {
  1: 80,
  2: 160,
  3: 200,
  4: 202,
  5: 193,
  6: 191,
} as const;

/** れんしゅうで選べる学年（配当表どおり 1〜6） */
export type PracticeGrade = keyof typeof KANJI_GRADE_COUNTS;

export const PRACTICE_GRADES: readonly PracticeGrade[] = [1, 2, 3, 4, 5, 6];

const KANJI_GRADE_STARTS: Readonly<Record<PracticeGrade, number>> = {
  1: 0,
  2: KANJI_GRADE_COUNTS[1],
  3: KANJI_GRADE_COUNTS[1] + KANJI_GRADE_COUNTS[2],
  4: KANJI_GRADE_COUNTS[1] + KANJI_GRADE_COUNTS[2] + KANJI_GRADE_COUNTS[3],
  5:
    KANJI_GRADE_COUNTS[1] +
    KANJI_GRADE_COUNTS[2] +
    KANJI_GRADE_COUNTS[3] +
    KANJI_GRADE_COUNTS[4],
  6:
    KANJI_GRADE_COUNTS[1] +
    KANJI_GRADE_COUNTS[2] +
    KANJI_GRADE_COUNTS[3] +
    KANJI_GRADE_COUNTS[4] +
    KANJI_GRADE_COUNTS[5],
};

export function isPracticeGrade(value: number): value is PracticeGrade {
  return PRACTICE_GRADES.includes(value as PracticeGrade);
}

export function gradeSliceRange(grade: PracticeGrade): {
  start: number;
  end: number;
} {
  const start = KANJI_GRADE_STARTS[grade];
  const end = start + KANJI_GRADE_COUNTS[grade];
  return { start, end };
}

export function getPracticeItems(grade: PracticeGrade): readonly KanjiItem[] {
  const { start, end } = gradeSliceRange(grade);
  return KANJI_ITEMS.slice(start, end) as readonly KanjiItem[];
}

export function practiceGradeItemCount(grade: PracticeGrade): number {
  return KANJI_GRADE_COUNTS[grade];
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
