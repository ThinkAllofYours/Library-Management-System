/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: process.env.NODE_ENV === 'production' ? 'https' : 'http',
        hostname: process.env.NODE_ENV === 'production' 
          ? 'storage.big-dolphin.life' 
          : 'localhost',
        port: process.env.NODE_ENV === 'production' ? '' : '9000',
        pathname: '/lms/media/**',
      },
    ],
  },
};

module.exports = nextConfig; 