/**
 * PRINCE WILLIAMS PHOTOGRAPHY — Frontend Configuration
 * =====================================================
 * Only PAYSTACK_PUBLIC_KEY and PACKAGES live here now.
 * All other config is in .env on the server.
 *
 * API calls use relative URLs (/api/...) so the same
 * config works in both development and production.
 */

const CONFIG = {

  // ── API Base ───────────────────────────────────────────────────────────────
  // Empty string = same origin (works on Railway and on localhost via `node server/index.js`)
  API_URL: '',

  // ── Site Info ─────────────────────────────────────────────────────────────
  SITE_NAME: 'Prince Williams Photography',

  // ── Paystack (public key only — secret key is on the server) ──────────────
  // Get from: https://dashboard.paystack.com/#/settings/developer
  PAYSTACK_PUBLIC_KEY: 'pk_test_REPLACE_WITH_YOUR_PAYSTACK_PUBLIC_KEY',

  // ── Packages (prices in Naira) ─────────────────────────────────────────────
  PACKAGES: [
    {
      id:       'essential',
      name:     'Essential',
      price:    150000,
      currency: 'NGN',
      badge:    null,
      tagline:  'Perfect for intimate ceremonies',
      features: [
        '6 hours of coverage',
        '200+ professionally edited photos',
        'Private online gallery',
        '1 lead photographer',
        'Online delivery within 4 weeks',
      ],
    },
    {
      id:       'premium',
      name:     'Premium',
      price:    300000,
      currency: 'NGN',
      badge:    'Most Popular',
      tagline:  'Our most beloved package',
      features: [
        '10 hours of coverage',
        '400+ professionally edited photos',
        'Private online gallery',
        '2 photographers',
        'Engagement session included',
        'Same-day preview (10 photos)',
        'Online delivery within 3 weeks',
      ],
    },
    {
      id:       'elite',
      name:     'Elite',
      price:    500000,
      currency: 'NGN',
      badge:    'Best Value',
      tagline:  'The ultimate wedding experience',
      features: [
        'Full-day coverage (unlimited hours)',
        '600+ professionally edited photos',
        'Premium private gallery',
        '3 photographers + 1 videographer',
        'Engagement session included',
        'Same-day highlight reel',
        'Custom photo album design',
        'Online delivery within 2 weeks',
        'Print release included',
      ],
    },
  ],
};

Object.freeze(CONFIG);
