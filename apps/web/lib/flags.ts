/**
 * Runtime feature flags.
 *
 * AI_ENABLED gates the Gemini-backed analysis, chat and ticket generation.
 * It is OFF unless `AI_ENABLED=true` is set in the environment, so the product
 * runs as a pure bug-capture/replay tool when no AI provider is configured.
 * Flip it on once a working AI key/quota is in place.
 */
export const AI_ENABLED = process.env.AI_ENABLED === 'true'
