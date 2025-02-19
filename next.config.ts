import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  distDir: 'build',
  output: 'standalone',
  env: {
    MONGODB_URI: process.env.MONGODB_URI,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    AZURE_STORAGE_CONNECTION_STRING: process.env.AZURE_STORAGE_CONNECTION_STRING,
    AZURE_STORAGE_CONTAINER_NAME: process.env.AZURE_STORAGE_CONTAINER_NAME,
    AZURE_EMAIL_CONNECTION_STRING: process.env.AZURE_EMAIL_CONNECTION_STRING,
    AZURE_RESOURCE_NAME: process.env.AZURE_RESOURCE_NAME,
    AZURE_API_KEY: process.env.AZURE_API_KEY,
    AZURE_OPENAI_API_KEY: process.env.AZURE_OPENAI_API_KEY,
    AZURE_OPENAI_API_BASE: process.env.AZURE_OPENAI_API_BASE,
    JWT: process.env.JWT,
    GROQ_API_KEY: process.env.GROQ_API_KEY,
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY
  },
  experimental: {
    ppr: true,
    turbo: {
      resolveAlias: {
        canvas: './empty-module.ts',
      },
    },
  },
  images: {
    remotePatterns: [
      {
        hostname: 'avatar.vercel.sh',
      },
    ],
  },
  eslint: {
    ignoreDuringBuilds: true
  }
};

export default nextConfig;