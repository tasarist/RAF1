/**
 * Shelf-builder boundary for the next sprint.
 * v0.1 displays deterministic mock shelf metrics; it does not yet composite uploaded images.
 *
 * Production version will create 3 equal-scale layouts:
 * - main_left
 * - main_center
 * - main_right
 */
export const shelfLayouts = ["main_left", "main_center", "main_right"] as const;
