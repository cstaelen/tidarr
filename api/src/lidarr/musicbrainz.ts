/**
 * Format string for MusicBrainz compatibility
 */
export function formatForMusicBrainz(str: string): string {
  if (!str?.trim()) return str;
  return applyMusicBrainzTitleCase(str.trim());
}

/**
 * Apply MusicBrainz title case formatting
 */
export function applyMusicBrainzTitleCase(str: string): string {
  const lowerCaseWords = new Set([
    "a",
    "an",
    "and",
    "as",
    "at",
    "but",
    "by",
    "for",
    "in",
    "into",
    "near",
    "nor",
    "of",
    "on",
    "onto",
    "or",
    "the",
    "to",
    "with",
  ]);

  return str
    .split(/(\s+)/)
    .map((part, index, array) => {
      if (/^\s+$/.test(part)) return part;

      const isWord = /^[a-zA-Z]+$/.test(part);
      if (!isWord) return part;

      const lowerPart = part.toLowerCase();

      // Count actual words (not whitespace)
      const wordCount = array
        .slice(0, index)
        .filter((p) => !/^\s+$/.test(p) && /^[a-zA-Z]+$/.test(p)).length;

      if (wordCount === 0) {
        return part.charAt(0).toUpperCase() + lowerPart.slice(1);
      } else if (lowerCaseWords.has(lowerPart)) {
        return lowerPart;
      } else {
        return part.charAt(0).toUpperCase() + lowerPart.slice(1);
      }
    })
    .join("");
}
