"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import Link from "next/link";
import { KANJI_ITEMS, clampKanjiIndex } from "../lib/kanji";

/** キャンバス座標系（以前の約4.35の3倍前後）。 */
const STROKE_LINE_WIDTH = 13;
/** 不透過（半透明だとストロークの重なりが濃く見えて玉連りになる） */
const INK_COLOR = "#1a1a1a";

/** 例文内の **…** を除去して赤い span に分割（マークダウン風） */
function renderExampleWithEmphasis(text: string): ReactNode {
  const re = /\*\*(.+?)\*\*/g;
  const nodes: ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) {
      nodes.push(text.slice(last, m.index));
    }
    nodes.push(
      <span key={i++} className="kanji-header__exampleEmph">
        {m[1]}
      </span>
    );
    last = m.index + m[0].length;
  }
  if (last < text.length) {
    nodes.push(text.slice(last));
  }
  return nodes.length === 0 ? text : <>{nodes}</>;
}

type Point = { x: number; y: number };

function clearDocumentSelection() {
  const sel = window.getSelection?.();
  if (sel && sel.rangeCount > 0) sel.removeAllRanges();
}

function canvasPointFromPointerEvent(
  canvas: HTMLCanvasElement,
  ev: PointerEvent
): Point {
  const r = canvas.getBoundingClientRect();
  const scaleX = canvas.width / r.width;
  const scaleY = canvas.height / r.height;
  return {
    x: (ev.clientX - r.left) * scaleX,
    y: (ev.clientY - r.top) * scaleY,
  };
}

/** 生サンプルのざらつきを減らす（小さい alpha ほどなめらか・追従は遅め） */
function smoothAlongAnchor(
  anchor: Point,
  samples: Point[],
  alpha: number
): Point[] {
  const out: Point[] = [];
  let prev = anchor;
  for (const p of samples) {
    const q = {
      x: prev.x + alpha * (p.x - prev.x),
      y: prev.y + alpha * (p.y - prev.y),
    };
    out.push(q);
    prev = q;
  }
  return out;
}

/** ほぼ同じ座標は間引き（ベジェのオーバーシュート防止） */
function dedupeNear(points: Point[], minDistSq: number): Point[] {
  if (points.length === 0) return [];
  const out: Point[] = [points[0]];
  for (let i = 1; i < points.length; i++) {
    const p = points[i];
    const q = out[out.length - 1]!;
    const dx = p.x - q.x;
    const dy = p.y - q.y;
    if (dx * dx + dy * dy >= minDistSq) out.push(p);
  }
  return out;
}

/** 速い筆致でサンプルが飛ぶとき、曲線用に区間を分割 */
function subdivideLongSegments(points: Point[], maxSegLen: number): Point[] {
  if (points.length < 2) return points;
  const out: Point[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i]!;
    const b = points[i + 1]!;
    out.push(a);
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.hypot(dx, dy);
    if (len > maxSegLen) {
      const n = Math.ceil(len / maxSegLen);
      for (let k = 1; k < n; k++) {
        const t = k / n;
        out.push({ x: a.x + t * dx, y: a.y + t * dy });
      }
    }
  }
  out.push(points[points.length - 1]!);
  return out;
}

function polylineInk(points: Point[]): number {
  let ink = 0;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1]!;
    const b = points[i]!;
    ink += Math.hypot(b.x - a.x, b.y - a.y);
  }
  return ink;
}

/**
 * Catmull-Rom（均一）→ 三次ベジェ：手書きアプリでよく使うなめらかな通過曲線
 */
function strokeCatmullRomCubic(ctx: CanvasRenderingContext2D, pts: Point[]) {
  if (pts.length < 2) return;
  const p0 = pts[0]!;
  ctx.moveTo(p0.x, p0.y);
  if (pts.length === 2) {
    const p1 = pts[1]!;
    const c1x = p0.x + (p1.x - p0.x) / 3;
    const c1y = p0.y + (p1.y - p0.y) / 3;
    const c2x = p1.x - (p1.x - p0.x) / 3;
    const c2y = p1.y - (p1.y - p0.y) / 3;
    ctx.bezierCurveTo(c1x, c1y, c2x, c2y, p1.x, p1.y);
    return;
  }
  for (let i = 0; i < pts.length - 1; i++) {
    const prev = i > 0 ? pts[i - 1]! : pts[i]!;
    const cur = pts[i]!;
    const next = pts[i + 1]!;
    const after = i + 2 < pts.length ? pts[i + 2]! : pts[i + 1]!;
    const cp1x = cur.x + (next.x - prev.x) / 6;
    const cp1y = cur.y + (next.y - prev.y) / 6;
    const cp2x = next.x - (after.x - cur.x) / 6;
    const cp2y = next.y - (after.y - cur.y) / 6;
    ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, next.x, next.y);
  }
}

/** ブラウザがまとめた移動の途中位置も含める */
function pointerSamples(
  canvas: HTMLCanvasElement,
  native: PointerEvent
): Point[] {
  const coalesced =
    typeof native.getCoalescedEvents === "function"
      ? native.getCoalescedEvents()
      : [];
  const events =
    coalesced.length > 0 ? coalesced : [native];
  return events.map((ev) => canvasPointFromPointerEvent(canvas, ev));
}

function useDrawingCanvas(enabled: boolean) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);
  const lastRef = useRef<Point | null>(null);
  const inkRef = useRef(0);

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!enabled) return;
      e.preventDefault();
      clearDocumentSelection();
      e.currentTarget.setPointerCapture(e.pointerId);
      drawingRef.current = true;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const p = canvasPointFromPointerEvent(canvas, e.nativeEvent);
      lastRef.current = p;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.globalAlpha = 1;
      ctx.fillStyle = INK_COLOR;
      ctx.beginPath();
      ctx.arc(p.x, p.y, STROKE_LINE_WIDTH / 2, 0, Math.PI * 2);
      ctx.fill();
    },
    [enabled]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!enabled || !drawingRef.current) return;
      e.preventDefault();
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const last = lastRef.current;
      if (!last) return;

      const samples = pointerSamples(canvas, e.nativeEvent);
      if (samples.length === 0) return;

      const smoothed = smoothAlongAnchor(last, samples, 0.42);
      const merged = dedupeNear([last, ...smoothed], 0.32 * 0.32);
      if (merged.length < 2) return;

      const forCurve = subdivideLongSegments(merged, 4.5);

      ctx.globalAlpha = 1;
      ctx.strokeStyle = INK_COLOR;
      ctx.lineWidth = STROKE_LINE_WIDTH;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      strokeCatmullRomCubic(ctx, forCurve);
      ctx.stroke();

      lastRef.current = merged[merged.length - 1]!;
      inkRef.current += polylineInk(merged);
    },
    [enabled]
  );

  const endStroke = useCallback(() => {
    drawingRef.current = false;
    lastRef.current = null;
  }, []);

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    inkRef.current = clearDrawingSurface(canvas, ctx);
  }, []);

  return {
    canvasRef,
    inkRef,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: endStroke,
      onPointerLeave: endStroke,
      onPointerCancel: endStroke,
    },
    clearCanvas,
  };
}

function clearDrawingSurface(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D
): number {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  return 0;
}

/**
 * 表示サイズに合わせて bitmap 寸法を更新する。
 * - clear: 寸法だけ合わせる（代入でバッファは消える。続けて clear を呼ぶ想定）
 * - preserve: 変化がごく小さいときは触らない（サブピクセル／dvh 揺れでの 1px 再設定を防ぐ）。
 *   それ以外で寸法が変わるときは、リサイズ前に内容をコピーして引き継ぐ（スクロール後に線が消えるのを防ぐ）
 */
function resizeCanvasToDisplaySize(
  canvas: HTMLCanvasElement | null,
  mode: "clear" | "preserve"
): void {
  if (!canvas) return;
  const dpr = Math.min(window.devicePixelRatio ?? 1, 2);
  const rect = canvas.getBoundingClientRect();
  const w = Math.max(1, Math.round(rect.width * dpr));
  const h = Math.max(1, Math.round(rect.height * dpr));
  const oldW = canvas.width;
  const oldH = canvas.height;

  if (oldW === w && oldH === h) return;

  if (
    mode === "preserve" &&
    oldW > 0 &&
    oldH > 0 &&
    Math.abs(w - oldW) <= 1 &&
    Math.abs(h - oldH) <= 1
  ) {
    return;
  }

  let snap: HTMLCanvasElement | null = null;
  if (mode === "preserve" && oldW > 0 && oldH > 0) {
    const ctx0 = canvas.getContext("2d");
    if (ctx0) {
      snap = document.createElement("canvas");
      snap.width = oldW;
      snap.height = oldH;
      const sctx = snap.getContext("2d");
      if (sctx) {
        sctx.drawImage(canvas, 0, 0);
      }
    }
  }

  canvas.width = w;
  canvas.height = h;

  if (snap) {
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(snap, 0, 0, snap.width, snap.height, 0, 0, w, h);
    }
  }
}

type KanjiPracticeProps = {
  initialIndex?: number;
};

export default function KanjiPractice({
  initialIndex = 0,
}: KanjiPracticeProps) {
  const safeStart = clampKanjiIndex(initialIndex);
  const [index, setIndex] = useState(safeStart);

  useEffect(() => {
    setIndex(clampKanjiIndex(initialIndex));
  }, [initialIndex]);

  const safeIndex = clampKanjiIndex(index);
  const item =
    KANJI_ITEMS.length > 0
      ? (KANJI_ITEMS[safeIndex] ?? KANJI_ITEMS[0])
      : null;
  const char = item?.char ?? "\uFF1F";
  const kunYomi = item?.kunYomi ?? "";
  const onYomi = item?.onYomi ?? "";
  const exampleText = item?.example ?? "";
  const modelSize = useMemo(
    () => ({ fontSize: "min(110cqw, 42vmin, 16rem)", lineHeight: 1 }),
    []
  );

  const trace = useDrawingCanvas(true);
  const free = useDrawingCanvas(true);
  const chromeRef = useRef<HTMLElement | null>(null);
  const practiceGridRef = useRef<HTMLDivElement | null>(null);

  /** iOS 等：selectstart を抑止（CSS だけでは残る場合がある） */
  useEffect(() => {
    const root = practiceGridRef.current;
    if (!root) return;
    const block = (e: Event) => {
      e.preventDefault();
    };
    const opts = { capture: true };
    root.addEventListener("selectstart", block, opts);
    root.addEventListener("dragstart", block, opts);
    return () => {
      root.removeEventListener("selectstart", block, opts);
      root.removeEventListener("dragstart", block, opts);
    };
  }, []);

  const applyCanvasLayout = useCallback(
    (forceClear: boolean) => {
      const mode = forceClear ? "clear" : "preserve";
      resizeCanvasToDisplaySize(trace.canvasRef.current, mode);
      resizeCanvasToDisplaySize(free.canvasRef.current, mode);
      const t = trace.canvasRef.current;
      const tctx = t?.getContext("2d");
      const f = free.canvasRef.current;
      const fctx = f?.getContext("2d");
      if (forceClear) {
        if (t && tctx) trace.inkRef.current = clearDrawingSurface(t, tctx);
        if (f && fctx) free.inkRef.current = clearDrawingSurface(f, fctx);
      }
    },
    [trace.canvasRef, trace.inkRef, free.canvasRef, free.inkRef]
  );

  /**
   * もんだい切り替え・初回：必ずクリア。
   * それ以外のレイアウト変化：bitmap を引き継ぎつつ寸法だけ合わせる（スクロール・モバイル UI・dvh で
   * getBoundingClientRect がわずかに変わり canvas 寸法が再設定されると線が消える問題への対策）。
   */
  useEffect(() => {
    applyCanvasLayout(true);
    const raf = requestAnimationFrame(() => applyCanvasLayout(false));
    const onResize = () => applyCanvasLayout(false);
    window.addEventListener("resize", onResize);
    const vv = window.visualViewport;
    vv?.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      vv?.removeEventListener("resize", onResize);
    };
  }, [char, applyCanvasLayout]);

  const resetStrokeArea = useCallback(() => {
    applyCanvasLayout(true);
  }, [applyCanvasLayout]);

  const minTraceInk = 120;
  const minFreeInk = 120;
  const canAdvance =
    trace.inkRef.current >= minTraceInk && free.inkRef.current >= minFreeInk;
  const [, tick] = useState(0);
  const bump = useCallback(() => tick((t) => t + 1), []);

  const handleNext = () => {
    if (!canAdvance || KANJI_ITEMS.length === 0) return;
    setIndex((i) => (i + 1) % KANJI_ITEMS.length);
    requestAnimationFrame(() => {
      chromeRef.current?.scrollTo({ top: 0, left: 0, behavior: "auto" });
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    });
  };

  const panelStyle: CSSProperties = {
    position: "absolute",
    left: 0,
    top: 0,
    width: "100%",
    height: "100%",
    boxSizing: "border-box",
    background: "var(--panel)",
    border: `1px solid var(--border)`,
    borderRadius: 12,
    padding: "0.5rem 0.5rem 0.65rem",
    display: "grid",
    gridTemplateRows: "auto minmax(0, 1fr)",
    containerType: "size",
    overflow: "hidden",
    userSelect: "none",
    WebkitUserSelect: "none",
  };

  const labelStyle: CSSProperties = {
    fontSize: "0.7rem",
    opacity: 0.6,
    marginBottom: 4,
  };

  const canvasStyle: CSSProperties = {
    width: "100%",
    height: "100%",
    display: "block",
    borderRadius: 8,
    background: "#faf8f5",
  };

  const traceStageStyle: CSSProperties = {
    position: "relative",
    minHeight: 0,
    width: "100%",
    height: "100%",
    background: "#faf8f5",
    borderRadius: 8,
    overflow: "hidden",
  };

  const traceGuideStyle: CSSProperties = {
    position: "absolute",
    inset: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    pointerEvents: "none",
    userSelect: "none",
    WebkitUserSelect: "none",
    fontWeight: 700,
    color: "var(--ink)",
    opacity: 0.13,
    ...modelSize,
  };

  const traceCanvasStyle: CSSProperties = {
    position: "absolute",
    left: 0,
    top: 0,
    width: "100%",
    height: "100%",
    display: "block",
    background: "transparent",
    borderRadius: 8,
  };

  if (KANJI_ITEMS.length === 0) {
    return (
      <main ref={chromeRef} className="kanji-chrome">
        <header className="kanji-header">
          <Link href="/" className="kanji-header__back">
            いちらんへ
          </Link>
        </header>
        <p className="kanji-header__lead">
          かんじのデータをよみこめませんでした。かんりしゃにきいてください。
        </p>
      </main>
    );
  }

  return (
    <main ref={chromeRef} className="kanji-chrome">
      <header className="kanji-header" lang="ja-JP">
        <div className="kanji-header__top">
          <Link href="/" className="kanji-header__back">
            いちらんへ
          </Link>
          <span className="kanji-header__progress">
            {index + 1} / {KANJI_ITEMS.length} もん
          </span>
        </div>
        <div className="kanji-header__readings">
          <div className="kanji-header__kun">
            <span className="kanji-header__kunLabel">くんよみ</span>
            <span className="kanji-header__kunReading">{kunYomi}</span>
          </div>
          <div className="kanji-header__on">
            <span className="kanji-header__onLabel">おんよみ</span>
            <span className="kanji-header__onReading">{onYomi}</span>
          </div>
        </div>
        <div
          className="kanji-header__example"
          aria-label="このかんじのれいぶん"
        >
          <span className="kanji-header__exampleLabel">このかんじのれいぶん</span>
          <p className="kanji-header__exampleSentence">
            {renderExampleWithEmphasis(exampleText)}
          </p>
        </div>
      </header>

      <div ref={practiceGridRef} className="kanji-grid">
        <div className="kanji-grid__cell">
          <section className="kanji-practice-panel" style={panelStyle}>
            <span style={labelStyle}>てほん</span>
            <div
              style={{
                minHeight: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                color: "var(--ink)",
                ...modelSize,
              }}
            >
              {char}
            </div>
          </section>
        </div>

        <div className="kanji-grid__cell">
          <section className="kanji-practice-panel" style={panelStyle}>
            <span style={labelStyle}>なぞる</span>
            <div style={traceStageStyle}>
              <div aria-hidden style={traceGuideStyle}>
                {char}
              </div>
              <canvas
                ref={trace.canvasRef}
                className="kanji-practice-canvas"
                style={traceCanvasStyle}
                onPointerDown={(e) => {
                  trace.handlers.onPointerDown(e);
                  bump();
                }}
                onPointerMove={(e) => {
                  trace.handlers.onPointerMove(e);
                  bump();
                }}
                onPointerUp={() => {
                  trace.handlers.onPointerUp();
                  clearDocumentSelection();
                  bump();
                }}
                onPointerLeave={() => {
                  trace.handlers.onPointerLeave();
                  clearDocumentSelection();
                  bump();
                }}
                onPointerCancel={() => {
                  trace.handlers.onPointerCancel();
                  clearDocumentSelection();
                  bump();
                }}
              />
            </div>
          </section>
        </div>

        <div className="kanji-grid__cell">
          <section className="kanji-practice-panel" style={panelStyle}>
            <span style={labelStyle}>じゆうにかく</span>
            <canvas
              ref={free.canvasRef}
              className="kanji-practice-canvas"
              style={canvasStyle}
              onPointerDown={(e) => {
                free.handlers.onPointerDown(e);
                bump();
              }}
              onPointerMove={(e) => {
                free.handlers.onPointerMove(e);
                bump();
              }}
              onPointerUp={() => {
                free.handlers.onPointerUp();
                clearDocumentSelection();
                bump();
              }}
              onPointerLeave={() => {
                free.handlers.onPointerLeave();
                clearDocumentSelection();
                bump();
              }}
              onPointerCancel={() => {
                free.handlers.onPointerCancel();
                clearDocumentSelection();
                bump();
              }}
            />
          </section>
        </div>
      </div>

      <footer className="kanji-footer">
        <p
          className={
            canAdvance
              ? "kanji-footer__status kanji-footer__status--ok"
              : "kanji-footer__status"
          }
        >
          {canAdvance
            ? "よくかけました。「つぎへ」をおしてね。"
            : "なぞるばしょと、じゆうにかくばしょに、それぞれくっきりせんをひいてね。"}
        </p>
        <div className="kanji-footer__actions">
          <button
            type="button"
            className="kanji-btn kanji-btn--ghost"
            onClick={() => {
              resetStrokeArea();
              bump();
            }}
          >
            やりなおす
          </button>
          <button
            type="button"
            className="kanji-btn kanji-btn--primary"
            disabled={!canAdvance}
            onClick={handleNext}
          >
            つぎへ
          </button>
        </div>
      </footer>
    </main>
  );
}
