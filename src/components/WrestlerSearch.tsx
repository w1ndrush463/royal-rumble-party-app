import { useState, useRef, useEffect } from 'react';
import type { Wrestler } from '../types';
import WrestlerCard from './WrestlerCard';

interface WrestlerSearchProps {
  wrestlers: Wrestler[];
  onSelect: (wrestler: Wrestler) => void;
  placeholder?: string;
  excludeIds?: string[];
  genderFilter?: 'male' | 'female' | null;
  autoFocus?: boolean;
}

export default function WrestlerSearch({
  wrestlers,
  onSelect,
  placeholder = 'Search wrestlers...',
  excludeIds = [],
  genderFilter = null,
  autoFocus = false,
}: WrestlerSearchProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Filter wrestlers based on query and filters
  const filteredWrestlers = wrestlers.filter((wrestler) => {
    // Exclude already selected
    if (excludeIds.includes(wrestler.id)) return false;

    // Gender filter
    if (genderFilter && wrestler.gender !== genderFilter) return false;

    // Search query
    if (query.trim()) {
      const searchLower = query.toLowerCase();
      return (
        wrestler.name.toLowerCase().includes(searchLower) ||
        wrestler.promotion.toLowerCase().includes(searchLower) ||
        (wrestler.brand && wrestler.brand.toLowerCase().includes(searchLower))
      );
    }

    return true;
  });

  // Sort: prioritize WWE, then by name
  const sortedWrestlers = [...filteredWrestlers].sort((a, b) => {
    // WWE first
    if (a.promotion === 'WWE' && b.promotion !== 'WWE') return -1;
    if (b.promotion === 'WWE' && a.promotion !== 'WWE') return 1;
    // Then alphabetical
    return a.name.localeCompare(b.name);
  });

  // Limit results for performance
  const displayWrestlers = sortedWrestlers.slice(0, 20);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < displayWrestlers.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (displayWrestlers[highlightedIndex]) {
          handleSelect(displayWrestlers[highlightedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        break;
    }
  };

  const handleSelect = (wrestler: Wrestler) => {
    onSelect(wrestler);
    setQuery('');
    setIsOpen(false);
    setHighlightedIndex(0);
    inputRef.current?.focus();
  };

  // Scroll highlighted item into view
  useEffect(() => {
    if (isOpen && listRef.current) {
      const highlightedElement = listRef.current.children[highlightedIndex] as HTMLElement;
      if (highlightedElement) {
        highlightedElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex, isOpen]);

  // Reset highlight when query changes
  useEffect(() => {
    setHighlightedIndex(0);
  }, [query]);

  // Auto-focus
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  return (
    <div className="relative w-full">
      {/* Search Input */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Dropdown Results */}
      {isOpen && (
        <div
          ref={listRef}
          className="absolute z-50 w-full mt-2 max-h-96 overflow-y-auto bg-gray-900 border border-gray-700 rounded-lg shadow-xl"
        >
          {displayWrestlers.length === 0 ? (
            <div className="p-4 text-center text-gray-400">
              {query ? 'No wrestlers found' : 'Start typing to search'}
            </div>
          ) : (
            displayWrestlers.map((wrestler, index) => (
              <div
                key={wrestler.id}
                onClick={() => handleSelect(wrestler)}
                onMouseEnter={() => setHighlightedIndex(index)}
                className={`
                  cursor-pointer transition-colors
                  ${index === highlightedIndex ? 'bg-gray-800' : ''}
                `}
              >
                <WrestlerCard wrestler={wrestler} size="small" />
              </div>
            ))
          )}

          {sortedWrestlers.length > 20 && (
            <div className="p-2 text-center text-gray-500 text-sm border-t border-gray-700">
              Showing 20 of {sortedWrestlers.length} results. Type more to narrow down.
            </div>
          )}
        </div>
      )}

      {/* Backdrop to close on outside click */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
