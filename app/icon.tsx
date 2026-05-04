import { ImageResponse } from "next/og";

export const size = {
  width: 64,
  height: 64,
};

export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          borderRadius: 14,
          background: "linear-gradient(180deg, #3a8068 0%, #2a6b52 55%, #1f5641 100%)",
          border: "1px solid rgba(255,255,255,0.22)",
          boxSizing: "border-box",
          position: "relative",
        }}
      >
        <svg viewBox="0 0 64 64" width="64" height="64">
          <g
            fill="none"
            stroke="#ffffff"
            strokeWidth="3.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20 18 L44 18" />
            <path d="M22 18 L32 28 L42 18" />
            <path d="M32 28 L32 48" />
            <path d="M22 36 L42 36" />
            <path d="M24 48 L40 48" />
            <path d="M32 48 L27 53" />
          </g>
        </svg>
      </div>
    ),
    {
      ...size,
    }
  );
}
