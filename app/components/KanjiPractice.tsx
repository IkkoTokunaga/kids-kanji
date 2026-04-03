"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import Link from "next/link";
import { KANJI_ITEMS, clampKanjiIndex } from "../lib/kanji";

/** キャンバス座標系（以前の約4.35の3倍前後）。 */
const STROKE_LINE_WIDTH = 13;

type Point = { x: number; y: number };

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

/** ブラウザがまとめた移動の途中位置も含め、なめらかな線にする */
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
      e.currentTarget.setPointerCapture(e.pointerId);
      drawingRef.current = true;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const p = canvasPointFromPointerEvent(canvas, e.nativeEvent);
      lastRef.current = p;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.fillStyle = "rgba(26, 26, 26, 0.85)";
      ctx.beginPath();
      ctx.arc(p.x, p.y, STROKE_LINE_WIDTH / 2, 0, Math.PI * 2);
      ctx.fill();
    },
    [enabled]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!enabled || !drawingRef.current) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const last = lastRef.current;
      if (!last) return;

      const points = pointerSamples(canvas, e.nativeEvent);
      if (points.length === 0) return;

      ctx.strokeStyle = "rgba(26, 26, 26, 0.85)";
      ctx.lineWidth = STROKE_LINE_WIDTH;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(last.x, last.y);
      let prev = last;
      let addedInk = 0;
      for (const p of points) {
        ctx.lineTo(p.x, p.y);
        addedInk += Math.hypot(p.x - prev.x, p.y - prev.y);
        prev = p;
      }
      ctx.stroke();

      lastRef.current = prev;
      inkRef.current += addedInk;
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
    handlers: { onPointerDown, onPointerMove, onPointerUp: endStroke, onPointerLeave: endStroke },
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
  const modelSize = useMemo(
    () => ({ fontSize: "min(110cqw, 42vmin, 16rem)", lineHeight: 1 }),
    []
  );

  const trace = useDrawingCanvas(true);
  const free = useDrawingCanvas(true);

  const layoutCanvas = useCallback((canvas: HTMLCanvasElement | null) => {
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio ?? 1, 2);
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(1, Math.round(rect.width * dpr));
    const h = Math.max(1, Math.round(rect.height * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
  }, []);

  /** リサイズ・問題の切り替え時のみ（描画のたびに走らせない） */
  useEffect(() => {
    const sync = () => {
      layoutCanvas(trace.canvasRef.current);
      layoutCanvas(free.canvasRef.current);
      const t = trace.canvasRef.current;
      const tctx = t?.getContext("2d");
      if (t && tctx) trace.inkRef.current = clearDrawingSurface(t, tctx);
      const f = free.canvasRef.current;
      const fctx = f?.getContext("2d");
      if (f && fctx) free.inkRef.current = clearDrawingSurface(f, fctx);
    };
    sync();
    const raf = requestAnimationFrame(sync);
    window.addEventListener("resize", sync);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", sync);
    };
  }, [char, layoutCanvas, trace.canvasRef, trace.inkRef, free.canvasRef, free.inkRef]);

  const resetStrokeArea = useCallback(() => {
    layoutCanvas(trace.canvasRef.current);
    layoutCanvas(free.canvasRef.current);
    const t = trace.canvasRef.current;
    const tctx = t?.getContext("2d");
    if (t && tctx) trace.inkRef.current = clearDrawingSurface(t, tctx);
    const f = free.canvasRef.current;
    const fctx = f?.getContext("2d");
    if (f && fctx) free.inkRef.current = clearDrawingSurface(f, fctx);
  }, [layoutCanvas, trace.canvasRef, trace.inkRef, free.canvasRef, free.inkRef]);

  const minTraceInk = 120;
  const minFreeInk = 120;
  const canAdvance =
    trace.inkRef.current >= minTraceInk && free.inkRef.current >= minFreeInk;
  const [, tick] = useState(0);
  const bump = useCallback(() => tick((t) => t + 1), []);

  const handleNext = () => {
    if (!canAdvance || KANJI_ITEMS.length === 0) return;
    setIndex((i) => (i + 1) % KANJI_ITEMS.length);
  };

  /** 1:1 の外ラッパ（padding-bottom トリック）。列幅＝見かけの一辺。 */
  const squareSizerStyle: CSSProperties = {
    width: "100%",
    minWidth: 0,
    position: "relative",
    height: 0,
    paddingBottom: "100%",
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
    touchAction: "none",
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
    touchAction: "none",
    background: "transparent",
    borderRadius: 8,
  };

  if (KANJI_ITEMS.length === 0) {
    return (
      <main className="kanji-chrome">
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
    <main className="kanji-chrome">
      <header className="kanji-header">
        <div className="kanji-header__top">
          <Link href="/" className="kanji-header__back">
            いちらんへ
          </Link>
          <span className="kanji-header__progress">
            {index + 1} / {KANJI_ITEMS.length} もん
          </span>
        </div>
        <div className="kanji-header__readings" lang="ja-JP">
          <div className="kanji-header__kun">
            <span className="kanji-header__kunLabel">くんよみ</span>
            <span className="kanji-header__kunReading">{kunYomi}</span>
          </div>
          <div className="kanji-header__on">
            <span className="kanji-header__onLabel">おんよみ</span>
            <span className="kanji-header__onReading">{onYomi}</span>
          </div>
        </div>
        <h1 className="kanji-header__title">かんじのれんしゅう</h1>
        <p className="kanji-header__lead">
          ひだりはてほん ·
          まんなかになぞる ·
          みぎにじゆうにかく。
          なぞるばしょとじゆうにかくばしょを、ふたつともかきおわったら「つぎへ」。
        </p>
      </header>

      <div className="kanji-grid">
        <div style={squareSizerStyle}>
          <section style={panelStyle}>
            <span style={labelStyle}>手本</span>
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

        <div style={squareSizerStyle}>
          <section style={panelStyle}>
            <span style={labelStyle}>なぞる</span>
            <div style={traceStageStyle}>
              <div aria-hidden style={traceGuideStyle}>
                {char}
              </div>
              <canvas
                ref={trace.canvasRef}
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
                  bump();
                }}
                onPointerLeave={() => {
                  trace.handlers.onPointerLeave();
                  bump();
                }}
              />
            </div>
          </section>
        </div>

        <div style={squareSizerStyle}>
          <section style={panelStyle}>
            <span style={labelStyle}>じゆうにかく</span>
            <canvas
              ref={free.canvasRef}
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
                bump();
              }}
              onPointerLeave={() => {
                free.handlers.onPointerLeave();
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
