/** @type {import('next').NextConfig} */

const withPWA = require('@ducanh2912/next-pwa').default({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  reloadOnOnline: true,
  fallbacks: {
    document: '/~offline',
  },
  workboxOptions: {
    runtimeCaching: [
      {
        // Map tiles and glyphs. Riders lose signal in exactly the places they
        // most want the map, so tiles seen once stay available offline.
        // CacheFirst because a rendered tile never changes; the URL does.
        urlPattern: /^https:\/\/tiles\.openfreemap\.org\/.*/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'map-tiles',
          expiration: {
            maxEntries: 1500,
            maxAgeSeconds: 30 * 24 * 60 * 60,
            // Tiles are the largest thing this app caches; without a quota
            // ceiling a long ride could fill the origin's storage budget and
            // get the whole cache evicted, including the offline app shell.
            purgeOnQuotaError: true,
          },
          cacheableResponse: { statuses: [0, 200] },
        },
      },
    ],
  },
});

const nextConfig = {
  reactStrictMode: true,

};

module.exports = withPWA(nextConfig);
