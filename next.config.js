// @ts-check

const path = require("path");
const { withSentryConfig } = require("@sentry/nextjs");
const createNextIntlPlugin = require("next-intl/plugin");
const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
});

const withNextIntl = createNextIntlPlugin("./app/i18n/request.ts");

/** @type {import('next').NextConfig['images']['remotePatterns']} */
const remotePatterns = [
  { protocol: /** @type {"https"} */ ("https"), hostname: "res.cloudinary.com" },
];

// Seed/demo listing images — allowed in development only, never in production
if (process.env.NODE_ENV === "development") {
  remotePatterns.push(
    { protocol: /** @type {"https"} */ ("https"), hostname: "picsum.photos" },
    { protocol: /** @type {"https"} */ ("https"), hostname: "fastly.picsum.photos" }
  );
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  // react-leaflet v4 is incompatible with React 18 Strict Mode: the double
  // mount→cleanup→remount cycle batches the state updates so MapContainer
  // never actually unmounts between cycles, leaving Leaflet's _leaflet_id on
  // the container and throwing "Map container is already initialized".
  // Strict Mode is development-only — production is unaffected.
  reactStrictMode: false,

  // react-leaflet-cluster's index.js does require("./assets/MarkerCluster.css")
  // which turbopack cannot handle. We alias the package to a local vendor copy
  // that has the CSS requires stripped out. The CSS is loaded globally via
  // app/globals.css. The alias is applied for both turbopack (dev) and webpack
  // (production).
  turbopack: {
    resolveAlias: {
      "react-leaflet-cluster": "./lib/map/marker-cluster-group.js",
    },
  },
  images: {
    remotePatterns,
    minimumCacheTTL: 31536000,
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(self)",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            // Report-only — collects violations without breaking anything.
            // Review the report-uri logs, then graduate to Content-Security-Policy.
            key: "Content-Security-Policy-Report-Only",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.conekta.io",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https://res.cloudinary.com",
              "font-src 'self'",
              "connect-src 'self' https://*.supabase.co https://api.conekta.io https://o*.ingest.sentry.io",
              "frame-src https://checkout.conekta.com",
              "worker-src 'self' blob:",
            ].join("; "),
          },
        ],
      },
    ];
  },

  devIndicators: false,

  experimental: {
    staleTimes: {
      dynamic: 0,
      static: 3600,
    },
  },

  webpack(config, { nextRuntime }) {
    // @upstash/redis resolves to nodejs.mjs (uses process.version) when the
    // "node" export condition is present. Strip it for the edge middleware
    // bundle so the fetch-based variant is used instead.
    if (nextRuntime === "edge") {
      config.resolve.conditionNames = (
        config.resolve.conditionNames ?? []
      ).filter((/** @type {string} */ c) => c !== "node");
    }
    // Alias react-leaflet-cluster to our local vendor copy that has the CSS
    // requires stripped out (same alias as turbopack above, for webpack/prod).
    config.resolve.alias["react-leaflet-cluster"] = path.resolve(
      __dirname,
      "lib/map/marker-cluster-group.js"
    );
    return config;
  },
};

const intlConfig = withNextIntl(nextConfig);

module.exports = withSentryConfig(withBundleAnalyzer(intlConfig), {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: true,
  disableLogger: true,
  // Skip source map upload and release creation unless explicitly enabled in CI
  sourcemaps: {
    disable: process.env.CI !== "true",
  },
  release: {
    create: process.env.CI === "true",
    finalize: process.env.CI === "true",
  },
  widenClientFileUpload: false,
  hideSourceMaps: true,
  automaticVercelMonitors: false,
});
