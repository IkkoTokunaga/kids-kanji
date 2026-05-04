import { ImageResponse } from "next/og";

export const size = {
  width: 180,
  height: 180,
};

export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          borderRadius: 40,
          background: "linear-gradient(180deg, #3a8068 0%, #2a6b52 55%, #1f5641 100%)",
          border: "2px solid rgba(255,255,255,0.24)",
          boxSizing: "border-box",
        }}
      >
        <svg viewBox="0 0 180 180" width="180" height="180">
          <g
            fill="none"
            stroke="#ffffff"
            strokeWidth="10"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M54 50 L126 50" />
            <path d="M60 50 L90 80 L120 50" />
            <path d="M90 80 L90 140" />
            <path d="M60 104 L120 104" />
            <path d="M64 140 L116 140" />
            <path d="M90 140 L76 154" />
          </g>
        </svg>
      </div>
    ),
    {
      ...size,
    }
  );
}
