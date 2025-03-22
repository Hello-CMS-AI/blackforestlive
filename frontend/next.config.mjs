import withTM from 'next-transpile-modules';

const tmConfig = withTM([
  '@ant-design/icons',
  'antd',
  'rc-util',
  'rc-picker',
  'rc-tree',
  'rc-table',
]);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    'rc-util',
    'rc-picker',
    'rc-tree',
    'rc-table',
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