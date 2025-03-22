import withTM from 'next-transpile-modules';

// Transpile all Ant Design and related packages
const tmConfig = withTM([
  'antd',
  '@ant-design/icons',
  'rc-util',
  'rc-picker',
  'rc-tree',
  'rc-table',
  'rc-select',
  'rc-field-form',
  'rc-menu', // Added for Ant Design's menu components (used by Sidebar)
  'rc-motion', // Added for Ant Design animations
  'bwip-js',
  'jwt-decode',
]);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    'rc-util',
    'rc-picker',
    'rc-tree',
    'rc-table',
    'rc-select',
    'rc-field-form',
    'rc-menu', // Added
    'rc-motion', // Added
    'bwip-js',
    'jwt-decode',
  ],
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack: (config) => {
    config.resolve.fallback = { fs: false, path: false };
    config.module.rules.push({
      test: /\.css$/,
      use: ['style-loader', 'css-loader'],
    });
    return config;
  },
};

export default tmConfig(nextConfig);