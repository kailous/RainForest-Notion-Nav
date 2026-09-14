const path = require('path');

module.exports = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.vercel-storage.com',
      },
      {
        protocol: 'https',
        hostname: '**.blob.vercel-storage.com',
      },
    ],
  },
  webpack: (config) => {
    config.resolve.alias['@'] = path.resolve(__dirname);
    return config;
  },
};

// 扩展构建配置
const extensionConfig = {
  ...module.exports,
  output: 'export',
  images: {
    ...module.exports.images,
    unoptimized: true,
  },
  assetPrefix: './',
};

module.exports.withExtension = () => extensionConfig;
