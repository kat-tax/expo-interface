/** Palette a name is hashed into when an avatar is given no color of its own. */
export const AVATAR_COLORS = [
  '#E5484D',
  '#F76B15',
  '#FFB224',
  '#30A46C',
  '#00A2C7',
  '#3E63DD',
  '#8E4EC6',
  '#E93D82',
] as const;

/**
 * The letters an avatar shows: the first of the first and last word, or the
 * first two letters of a single word. Empty for an empty name.
 */
export function initialsOf(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

/** A stable color for a name, so the same person keeps the same circle. */
export function colorOf(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}
