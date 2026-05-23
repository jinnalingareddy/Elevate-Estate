// @ts-check

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
  transpilePackages: ["react-leaflet-cluster"],
  images: { remotePatterns },

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

  experimental: {
    staleTimes: {
      dynamic: 0,
      static: 3600,
    },
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
