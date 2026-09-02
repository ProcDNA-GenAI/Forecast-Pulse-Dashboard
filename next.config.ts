import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: true,
  serverExternalPackages: ["exceljs"],
  outputFileTracingIncludes: {
    "/*": ["./NAP mock data.xlsx"],
  },
};

export default nextConfig;
