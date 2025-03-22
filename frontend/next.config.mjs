/** @type {import('next').NextConfig} */
const withTM = require('next-transpile-modules')([
  '@ant-design/icons',
  'antd',
  'rc-util',
  'rc-picker',
  'rc-tree',
  'rc-table',
]);

const nextConfig = {
  reactStrictMode: true,
  // Transpile Ant Design and related packages to fix ESM issues
  transpilePackages: [
    'rc-util',
    'rc-picker',
    'rc-tree',
    'rc-table',
  ],
  // Disable ESLint during builds to avoid serialization errors
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack: (config) => {
    config.resolve.fallback = { fs: false, path: false };
    return config;
  },
};

module.exports = withTM(nextConfig);