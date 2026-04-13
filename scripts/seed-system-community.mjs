#!/usr/bin/env node

/**
 * Backward-compatible wrapper.
 * The product no longer seeds a general public/system community. The current
 * phase is restricted to the four official communities in
 * config/allowed-communities.json.
 */

await import('./seed-allowed-communities.mjs');
