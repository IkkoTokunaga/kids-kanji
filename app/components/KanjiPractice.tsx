"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";

const KANJI_ITEMS: readonly { char: string; kunYomi: string }[] = [
  { char: "山", kunYomi: "やま" },
  { char: "川", kunYomi: "かわ" },
  { char: "田", kunYomi: "た" },
  { char: "木", kunYomi: "き" },
  { char: "本", kunYomi: "もと" },
  { char: "日", kunYomi: "ひ・か・び" },
  { char: "月", kunYomi: "つき" },
  { char: "火", kunYomi: "ひ" },
  { char: "水", kunYomi: "みず" },
  { char: "人", kunYomi: "ひと" },
] as const;

/** キャンバス座標系（以前の約4.35の3倍前後）。 */
const STROKE_LINE_WIDTH = 13;

type Point = { x: number; y: number };

function useDrawingCanvas(enabled: boolean) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);
  const lastRef = useRef<Point | null>(null);
  const inkRef = useRef(0);

  const drawLine = useCallback(
    (from: Point, to: Point) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.strokeStyle = "rgba(26, 26, 26, 0.85)";
      ctx.lineWidth = STROKE_LINE_WIDTH;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.stroke();
      inkRef.current += Math.hypot(to.x - from.x, to.y - from.y);
    },
    []
  );

  const getPos = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const r = canvas.getBoundingClientRect();
    const scaleX = canvas.width / r.width;
    const scaleY = canvas.height / r.height;
    return {
      x: (e.clientX - r.left) * scaleX,
      y: (e.clientY - r.top) * scaleY,
    };
  }, []);

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!enabled) return;
      e.currentTarget.setPointerCapture(e.pointerId);
      drawingRef.current = true;
      const p = getPos(e);
      lastRef.current = p;
    },
    [enabled, getPos]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!enabled || !drawingRef.current) return;
      const p = getPos(e);
      const last = lastRef.current;
      if (last) drawLine(last, p);
      lastRef.current = p;
    },
    [drawLine, enabled, getPos]
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
    drawLine,
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

export default function KanjiPractice() {
  const [index, setIndex] = useState(0);
  const { char, kunYomi } = KANJI_ITEMS[index];
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
    if (!canAdvance) return;
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

  return (
    <main
      style={{
        maxWidth: 1100,
        width: "100%",
        height: "100dvh",
        maxHeight: "100dvh",
        margin: "0 auto",
        padding: "0.75rem 1rem 1rem",
        display: "flex",
        flexDirection: "column",
        gap: "0.75rem",
        boxSizing: "border-box",
        overflow: "hidden",
        touchAction: "manipulation",
      }}
    >
      <header style={{ flexShrink: 0 }}>
        <p
          style={{
            margin: 0,
            marginBottom: "0.4rem",
            fontSize: "0.92rem",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "baseline",
            gap: "0.35rem 0.65rem",
          }}
        >
          <span style={{ opacity: 0.62, fontWeight: 600 }}>訓読み</span>
          <span
            style={{
              fontSize: "1.15rem",
              fontWeight: 700,
              letterSpacing: "0.04em",
              fontFamily: "var(--font-noto), sans-serif",
            }}
            lang="ja-JP"
          >
            {kunYomi}
          </span>
        </p>
        <h1 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 700 }}>
          漢字の練習
        </h1>
        <p style={{ margin: "0.25rem 0 0", opacity: 0.75, fontSize: "0.82rem" }}>
          左は手本 · 真ん中になぞる · 右に自分で書く。両方かけたら「つぎへ」。
        </p>
      </header>

      <div
        style={{
          flex: 1,
          minHeight: 0,
          minWidth: 0,
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          gridAutoRows: "auto",
          gap: "0.6rem",
          alignContent: "center",
          alignItems: "start",
          justifyItems: "stretch",
        }}
      >
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

      <footer
        style={{
          flexShrink: 0,
          display: "flex",
          flexWrap: "wrap",
          gap: "0.75rem",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ fontSize: "0.85rem", opacity: 0.8 }}>
          {index + 1} / {KANJI_ITEMS.length} 問 ·{" "}
          {canAdvance ? "よくかけました。つぎへどうぞ。" : "なぞりとじゆうの両方に線をひいてね。"}
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            type="button"
            onClick={() => {
              resetStrokeArea();
              bump();
            }}
            style={{
              padding: "0.55rem 1rem",
              borderRadius: 8,
              border: `1px solid var(--border)`,
              background: "#fff",
              cursor: "pointer",
              fontSize: "0.9rem",
            }}
          >
            やりなおす
          </button>
          <button
            type="button"
            disabled={!canAdvance}
            onClick={handleNext}
            style={{
              padding: "0.55rem 1.25rem",
              borderRadius: 8,
              border: "none",
              background: canAdvance ? "var(--accent)" : "var(--accent-dim)",
              color: "#fff",
              cursor: canAdvance ? "pointer" : "not-allowed",
              fontSize: "0.9rem",
              fontWeight: 700,
            }}
          >
            つぎへ
          </button>
        </div>
      </footer>
    </main>
  );
}
