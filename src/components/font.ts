/**
 * Build a `font` shorthand in the game's face, always with a fallback stack so
 * the layout survives Baloo 2 failing to load.
 *
 *   F('800 38px/1.02')  ->  "800 38px/1.02 'Baloo 2', system-ui, sans-serif"
 */
export const F = (spec: string): string => `${spec} 'Baloo 2', system-ui, sans-serif`;
