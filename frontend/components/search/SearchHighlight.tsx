'use client';

import React from 'react';

interface SearchHighlightProps {
  text: string;
  searchTerm?: string;
  className?: string;
  highlightClassName?: string;
}

export function SearchHighlight({ 
  text, 
  searchTerm, 
  className = '', 
  highlightClassName = 'bg-yellow-200 font-medium px-1 rounded'
}: SearchHighlightProps) {
  if (!searchTerm || !searchTerm.trim()) {
    return <span className={className}>{text}</span>;
  }

  const searchRegex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(searchRegex);

  return (
    <span className={className}>
      {parts.map((part, index) =>
        searchRegex.test(part) ? (
          <mark key={index} className={highlightClassName}>
            {part}
          </mark>
        ) : (
          <span key={index}>{part}</span>
        )
      )}
    </span>
  );
}

export default SearchHighlight;