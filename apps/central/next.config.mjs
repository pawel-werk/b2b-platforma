/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  async headers() {
    if (process.env.ROBOTS_NOINDEX === "false") {
      return [];
    }
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-Robots-Tag",
            value: "noindex, nofollow, noarchive",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
