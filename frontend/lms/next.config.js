/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '9000',
        pathname: '/lms/media/**',
      },
      {
        protocol: 'http',
        hostname: 'minio',
        port: '9000',
        pathname: '/lms/media/**',
      }
    ],
    unoptimized: true,
  },
};

module.exports = nextConfig; 