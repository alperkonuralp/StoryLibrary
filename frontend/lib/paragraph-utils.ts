/**
 * Utility functions for converting between paragraph arrays and single text content
 * for improved story editing UX
 */

/**
 * Merges an array of paragraphs into a single text string with double newlines as separators
 * @param paragraphs - Array of paragraph strings
 * @returns Single text string with paragraphs separated by double newlines
 */
export function mergeParagraphs(paragraphs: string[]): string {
  return paragraphs
    .map(p => p.trim()) // Remove leading/trailing whitespace from each paragraph
    .filter(p => p.length > 0) // Remove empty paragraphs
    .join('\n\n'); // Join with double newlines
}

/**
 * Parses a single text string into an array of paragraphs by splitting on double newlines
 * @param text - Single text string with paragraphs separated by double newlines
 * @returns Array of paragraph strings
 */
export function parseParagraphs(text: string): string[] {
  if (!text.trim()) {
    return [''];
  }

  const paragraphs = text
    .split(/\n\s*\n/) // Split on double newlines (with optional whitespace between)
    .map(p => p.trim()) // Remove leading/trailing whitespace
    .filter(p => p.length > 0); // Remove empty paragraphs

  // Ensure we always return at least one paragraph
  return paragraphs.length > 0 ? paragraphs : [''];
}

/**
 * Validates if text content is valid for story creation/editing
 * @param text - Text content to validate
 * @returns True if text contains at least one non-empty paragraph
 */
export function isValidContent(text: string): boolean {
  const paragraphs = parseParagraphs(text);
  return paragraphs.length > 0 && paragraphs.some(p => p.trim().length > 0);
}

/**
 * Counts words in text content
 * @param text - Text content
 * @returns Number of words
 */
export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}

/**
 * Counts paragraphs in text content
 * @param text - Text content
 * @returns Number of paragraphs
 */
export function countParagraphs(text: string): number {
  return parseParagraphs(text).length;
}