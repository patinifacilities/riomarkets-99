import { useState, useEffect, useRef } from 'react';

interface EmailSuggestionsProps {
  value: string;
  onSelect: (email: string) => void;
  inputRef: React.RefObject<HTMLInputElement>;
}

const EMAIL_DOMAINS = [
  '@gmail.com',
  '@outlook.com',
  '@hotmail.com',
  '@yahoo.com',
  '@icloud.com',
  '@live.com',
];

export function EmailSuggestions({ value, onSelect, inputRef }: EmailSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const atIndex = value.indexOf('@');
    
    if (atIndex > 0 && atIndex === value.length - 1) {
      // User just typed @
      const username = value.slice(0, atIndex);
      setSuggestions(EMAIL_DOMAINS.map(domain => username + domain));
      setSelectedIndex(0);
    } else if (atIndex > 0 && atIndex < value.length - 1) {
      // User is typing domain
      const username = value.slice(0, atIndex);
      const partialDomain = value.slice(atIndex);
      const filtered = EMAIL_DOMAINS
        .filter(domain => domain.startsWith(partialDomain))
        .map(domain => username + domain);
      setSuggestions(filtered);
      setSelectedIndex(0);
    } else {
      setSuggestions([]);
    }
  }, [value]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (suggestions.length === 0) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % suggestions.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
      } else if (e.key === 'Enter' && suggestions.length > 0) {
        e.preventDefault();
        onSelect(suggestions[selectedIndex]);
      } else if (e.key === 'Escape') {
        setSuggestions([]);
      }
    };

    const input = inputRef.current;
    if (input) {
      input.addEventListener('keydown', handleKeyDown);
      return () => input.removeEventListener('keydown', handleKeyDown);
    }
  }, [suggestions, selectedIndex, onSelect, inputRef]);

  if (suggestions.length === 0) return null;

  return (
    <div 
      ref={suggestionsRef}
      className="absolute z-50 w-full mt-1 bg-card border border-border rounded-lg shadow-lg overflow-hidden"
    >
      {suggestions.map((suggestion, index) => (
        <button
          key={suggestion}
          type="button"
          onClick={() => onSelect(suggestion)}
          className={`w-full px-4 py-2 text-left text-sm hover:bg-muted transition-colors ${
            index === selectedIndex ? 'bg-muted' : ''
          }`}
        >
          {suggestion}
        </button>
      ))}
    </div>
  );
}
