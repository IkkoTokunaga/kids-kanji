import type { NextConfig } from "next";

/** サブパスに置く場合のみ（例: /kids）ビルド・実行前に設定 */
const basePath = process.env.NEXT_PUBLIC_BASE_PATH?.replace(/\/$/, "") ?? "";

const nextConfig: NextConfig = {
  ...(basePath ? { basePath } : {}),
};

export default nextConfig;
