import React, { useRef, useEffect } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";

export interface LatexExpressionProps {
  expression: string;
  displayMode?: boolean;
  className?: string;
  /**
   * Markup language output:
   * - "html": Outputs KaTeX in visual HTML only (prevents duplicate MathML rendering in Next.js).
   * - "htmlAndMathml": Outputs both HTML and MathML.
   * - "mathml": Outputs MathML only.
   * @default "html"
   */
  output?: "html" | "mathml" | "htmlAndMathml";
}

export const LatexExpression: React.FC<LatexExpressionProps> = ({
  expression,
  displayMode = false,
  className = "",
  output = "html",
}) => {
  const containerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      try {
        katex.render(expression, containerRef.current, {
          displayMode,
          throwOnError: false,
          output,
        });
      } catch (err) {
        // Fallback or ignore if katex throws (though throwOnError: false usually handles it)
        console.warn("KaTeX rendering error:", err);
      }
    }
  }, [expression, displayMode, output]);

  return (
    <span
      ref={containerRef}
      className={`latex-math-expression inline-block [&_.katex-mathml]:hidden ${className}`}
    />
  );
};
