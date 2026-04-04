import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* cacheComponents + legacy unstable_cache (e.g. year service) can break prod RSC; re-enable after migrating to `use cache`. */
};

export default nextConfig;
