/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  transpilePackages: ["@workspace/ui"],
  serverExternalPackages: ["@prisma/client", ".prisma/client", "@prisma/adapter-pg", "pg"],
  // Ensure Prisma query-engine binaries are included in the standalone output
  outputFileTracingIncludes: {
    "/**": ["./node_modules/.prisma/**/*", "./node_modules/prisma/**/*"],
  },
}

export default nextConfig
