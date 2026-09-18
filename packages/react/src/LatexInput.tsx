import React, { useRef, useEffect, useState } from 'react';

export interface LatexInputProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
}

const REPLACE_REGEX = /(?<!\\)\b(sin|cos|tan|arcsin|arccos|arctan|ln|log|exp|int|sum|frac|sqrt|pi|det|arg|binom|alpha|beta|gamma|theta)\b/g;

export const LatexInput: React.FC<LatexInputProps> = ({ 
  value, 
  onChange, 
  className = '',
  placeholder = 'Enter LaTeX expression...'
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [cursorPos, setCursorPos] = useState<number | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const cursorStart = e.target.selectionStart;
    
    let newCursor = cursorStart;
    
    const newValue = rawValue.replace(REPLACE_REGEX, (match, p1, offset) => {
      if (cursorStart !== null && offset < cursorStart) {
        newCursor = (newCursor || 0) + 1;
      }
      return '\\' + match;
    });

    if (newValue !== rawValue) {
      setCursorPos(newCursor);
    }
    
    onChange(newValue);
  };

  useEffect(() => {
    if (cursorPos !== null && inputRef.current) {
      inputRef.current.setSelectionRange(cursorPos, cursorPos);
      setCursorPos(null);
    }
  }, [value, cursorPos]);

  return (
    <input
      ref={inputRef}
      type="text"
      value={value}
      onChange={handleChange}
      className={`font-mono ${className}`}
      placeholder={placeholder}
      spellCheck={false}
    />
  );
};
