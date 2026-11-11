import type { NextConfig } from "next";

// Strapi serves uploaded media; allow next/image to optimise it.
const strapi = new URL(process.env.STRAPI_URL ?? "http://localhost:1337");
// In production the CMS stores media on Cloudinary; only this account's images are allowed.
const cloudinary = process.env.CLOUDINARY_CLOUD_NAME;

const nextConfig: NextConfig = {
  images: {
    // Local Strapi runs on localhost; only allowed when STRAPI_URL points there.
    dangerouslyAllowLocalIP: ["localhost", "127.0.0.1"].includes(strapi.hostname),
    remotePatterns: [
      {
        protocol: strapi.protocol.replace(":", "") as "http" | "https",
        hostname: strapi.hostname,
        port: strapi.port,
        pathname: "/uploads/**",
      },
      ...(cloudinary
        ? [{ protocol: "https" as const, hostname: "res.cloudinary.com", pathname: `/${cloudinary}/**` }]
        : []),
    ],
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
