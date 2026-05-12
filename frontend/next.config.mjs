/** @type {import('next').NextConfig} */

function apiRewriteDestination() {
  const raw = (
    process.env.BACKEND_PROXY_URL?.trim() ||
    process.env.NEXT_PUBLIC_API_BASE_URL?.trim() ||
    ""
  );
  let base = raw.replace(/\/+$/, "");
  if (!base) {
    base = "http://127.0.0.1:8000/api";
  } else if (!base.endsWith("/api")) {
    base = `${base}/api`;
  }
  return `${base}/:path*`;
}

const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: apiRewriteDestination(),
      },
    ];
  },
};

export default nextConfig;
