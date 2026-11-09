/** @type {import('next').NextConfig} */
const apiBaseUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api").replace(/\/+$/, "");

const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost' },
      { protocol: 'https', hostname: 'cdn.example.com' },
    ],
  },
  async rewrites() {
    return [
      {
        source: "/api/backend/:path*",
        destination: `${apiBaseUrl}/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
