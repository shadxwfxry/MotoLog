/** @type {import('next').NextConfig} */
const defaultRuntimeCaching = require('next-pwa/cache');

const runtimeCaching = [
  {
    urlPattern: /\/api\/auth\/.*/i,
    handler: 'NetworkOnly',
    options: {},
  },
  {
    urlPattern: /.*_rsc=.*/i,
    handler: 'NetworkFirst',
    options: {
      cacheName: 'next-rsc-data',
      networkTimeoutSeconds: 3,
      expiration: {
        maxEntries: 120,
        maxAgeSeconds: 24 * 60 * 60, // 24 hours
      },
    },
  },
  {
    urlPattern: ({ request }) => request.mode === 'navigate',
    handler: 'NetworkFirst',
    options: {
      cacheName: 'next-html-navigation',
      networkTimeoutSeconds: 3,
      expiration: {
        maxEntries: 30,
        maxAgeSeconds: 24 * 60 * 60,
      },
    },
  },
  ...defaultRuntimeCaching
];

const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  additionalManifestEntries: [
    { url: '/', revision: '1' },
    { url: '/garage', revision: '1' },
    { url: '/settings', revision: '1' },
    { url: '/tournaments', revision: '1' },
    { url: '/~offline', revision: '1' },
  ],
  fallbacks: {
    document: '/~offline',
  },
  runtimeCaching,
});

const nextConfig = {
  reactStrictMode: true,
};

module.exports = withPWA(nextConfig);
