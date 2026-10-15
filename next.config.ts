import path from "node:path";
import type { NextConfig } from "next";

const glslLoader = path.resolve("./src/gl/glsl-loader.mjs");

const nextConfig: NextConfig = {
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
      "*.vert": {
        loaders: [{ loader: glslLoader }],
        as: "*.js",
      },
      "*.frag": {
        loaders: [{ loader: glslLoader }],
        as: "*.js",
      },
      "*.glsl": {
        loaders: [{ loader: glslLoader }],
        as: "*.js",
      },
    },
  },
  webpack(config) {
    config.module.rules.push({
      test: /\.(vert|frag|glsl)$/,
      use: [{ loader: glslLoader }],
    });
    return config;
  },
};

export default nextConfig;
