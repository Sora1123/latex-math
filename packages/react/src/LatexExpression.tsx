import React, { useRef, useEffect } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";

export interface LatexExpressionProps {
  expression: string;
  displayMode?: boolean;
  className?: string;
}

export const LatexExpression: React.FC<LatexExpressionProps> = ({
  expression,
  displayMode = false,
  className = "",
}) => {
  const containerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      try {
        katex.render(expression, containerRef.current, {
          displayMode,
          throwOnError: false,
          output: "mathml",
        });
      } catch (err) {
        // Fallback or ignore if katex throws (though throwOnError: false usually handles it)
        console.warn("KaTeX rendering error:", err);
      }
    }
  }, [expression, displayMode]);

  return <span ref={containerRef} className={className} />;
};
