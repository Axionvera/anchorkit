/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    "@anchorkit/types",
    "@anchorkit/config",
    "@anchorkit/validators",
    "@anchorkit/stellar-kit",
    "@anchorkit/anchor-utils",
  ],
  experimental: {
    optimizePackageImports: [
      "@anchorkit/types",
      "@anchorkit/config",
      "@anchorkit/validators",
      "@anchorkit/stellar-kit",
      "@anchorkit/anchor-utils",
    ],
  },
};

module.exports = nextConfig;
