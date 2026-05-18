/** @type {import('next').NextConfig} */
const defaultRuntimeCaching = require('next-pwa/cache');

const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: false, // Control skipWaiting dynamically via client UI
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
    {
      urlPattern: /.*_rsc=.*/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'next-rsc-data',
        expiration: {
          maxEntries: 120,
          maxAgeSeconds: 24 * 60 * 60 // 24 hours
        }
      }
    },
    ...defaultRuntimeCaching
  ]
});

const nextConfig = {
  reactStrictMode: true,
};

module.exports = withPWA(nextConfig);
