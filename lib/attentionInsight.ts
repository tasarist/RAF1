/**
 * Attention Insight adapter placeholder.
 * v0.1 intentionally does not call the live API.
 *
 * Next sprint:
 * 1. Confirm the exact Attention Insight API endpoints and auth contract from the account docs.
 * 2. Implement single-pack analysis.
 * 3. Implement shelf analysis + AOI extraction.
 * 4. Map the provider response into our internal types.
 */
export async function analyzeSinglePack(_file: File) {
  throw new Error("Attention Insight live adapter is not enabled in MVP v0.1.");
}

export async function analyzeShelf(_file: File) {
  throw new Error("Attention Insight live adapter is not enabled in MVP v0.1.");
}
