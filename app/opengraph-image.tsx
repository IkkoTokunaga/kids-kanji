import { ImageResponse } from "next/og";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          background: "linear-gradient(160deg, #f6f1e9 0%, #e3d9cb 100%)",
          color: "#1a1a1a",
          padding: "72px",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            fontSize: 76,
            fontWeight: 800,
            lineHeight: 1.1,
            marginBottom: 20,
          }}
        >
          漢字の練習
        </div>
        <div
          style={{
            fontSize: 34,
            fontWeight: 600,
            color: "#2a6b52",
          }}
        >
          小1〜6年 配当漢字1026字 見本・なぞり・自由書き
        </div>
      </div>
    ),
    size,
  );
}
