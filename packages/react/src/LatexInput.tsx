import React from 'react';

export interface LatexInputProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
}

export const LatexInput: React.FC<LatexInputProps> = ({ 
  value, 
  onChange, 
  className = '',
  placeholder = 'Enter LaTeX expression...'
}) => {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`font-mono ${className}`}
      placeholder={placeholder}
      spellCheck={false}
    />
  );
};
