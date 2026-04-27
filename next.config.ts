import type { NextConfig } from "next";

if (!process.env.NEXT_PUBLIC_API_URL) {
  throw new Error(
    "Missing required environment variable: NEXT_PUBLIC_API_URL\n" +
      "Add it to .env.local: NEXT_PUBLIC_API_URL=http://localhost:8000"
  );
}

const nextConfig: NextConfig = {};

export default nextConfig;
