/**
 * Highlight matching substring in text for search results
 */

import type { ReactNode } from 'react';

/**
 * Highlight matching substring in text
 * Returns JSX with highlighted portion wrapped in <mark> tag
 *
 * @param text - The full text to search in
 * @param query - The search query to highlight
 * @returns React node with highlighted match or plain text if no match
 *
 * @example
 * highlightMatch("808", "8") // Returns: <mark>8</mark>08
 * highlightMatch("snare", "sn") // Returns: <mark>sn</mark>are
 * highlightMatch("kick", "") // Returns: kick (no highlight)
 */
export const highlightMatch = (text: string, query: string): ReactNode => {
  if (!query) return text;

  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const matchIndex = lowerText.indexOf(lowerQuery);

  if (matchIndex === -1) return text;

  const beforeMatch = text.slice(0, matchIndex);
  const matchText = text.slice(matchIndex, matchIndex + query.length);
  const afterMatch = text.slice(matchIndex + query.length);

  return (
    <>
      {beforeMatch}
      <mark className="bg-basilisk-accent-cool/40 text-white px-0.5 rounded">
        {matchText}
      </mark>
      {afterMatch}
    </>
  );
};
