import React, {
  useRef,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";
import { normalizeLatex } from "@latex-math/core";
import { useLatexEvaluation } from "./useLatexEvaluation";

export interface LatexInputProps {
  value: string;
  variables: { [key: string]: number };
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
  showToolbar?: boolean;
  showLatexBadge?: boolean;
  showKeyboard?: boolean;
  showMenu?: boolean;
}

const MATH_BUTTONS = [
  { label: "a/b", latex: "\\frac{#?}{#?}", title: "Fraction" },
  { label: "x²", latex: "^{2}", title: "Squared" },
  { label: "aᵇ", latex: "^{#?}", title: "Superscript / Power" },
  { label: "√x", latex: "\\sqrt{#?}", title: "Square Root" },
  { label: "ⁿ√x", latex: "\\sqrt[#?]{#?}", title: "nth Root" },
  { label: "π", latex: "\\pi", title: "Pi" },
  { label: "∫", latex: "\\int_{#?}^{#?} #?\\, dx", title: "Definite Integral" },
  { label: "Σ", latex: "\\sum_{#?}^{#?} #?", title: "Summation" },
  { label: "sin", latex: "\\sin\\left(#?\\right)", title: "Sine" },
  { label: "cos", latex: "\\cos\\left(#?\\right)", title: "Cosine" },
  { label: "tan", latex: "\\tan\\left(#?\\right)", title: "Tangent" },
  { label: "( )", latex: "\\left(#?\\right)", title: "Parentheses" },
];

export const LatexInput: React.FC<LatexInputProps> = ({
  value,
  variables,
  onChange,
  className = "",
  placeholder = "\\text{Type math... }",
  showToolbar = true,
  showLatexBadge = true,
  showKeyboard = true,
  showMenu = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mfRef = useRef<any>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [isRawMode, setIsRawMode] = useState(false);
  const [copied, setCopied] = useState(false);

  const { result, error } = useLatexEvaluation(value, variables);

  const explicitLatex = useMemo(() => {
    try {
      return normalizeLatex(value);
    } catch {
      return value;
    }
  }, [value]);

  const hasImplicitGrouping = Boolean(
    value && explicitLatex && explicitLatex !== value,
  );

  // Initialize MathLive custom element
  useEffect(() => {
    if (typeof window === "undefined") return;

    let active = true;
    import("mathlive").then((ml) => {
      if (!active || !containerRef.current) return;

      try {
        if (ml.MathfieldElement && !ml.MathfieldElement.fontsDirectory) {
          ml.MathfieldElement.fontsDirectory =
            "https://unpkg.com/mathlive/dist/fonts";
        }
      } catch {
        // fallback to default
      }

      let mf = containerRef.current.querySelector("math-field") as any;
      if (!mf) {
        mf = document.createElement("math-field");
        mf.setAttribute("virtual-keyboard-mode", "manual");
        // mf.setAttribute(
        //   "virtual-keyboard-mode",
        //   showKeyboard ? "manual" : "off",
        // );
        // if (!showMenu) {
        //   mf.setAttribute("menu-items", "none");
        // }

        mf.style.width = "100%";
        mf.style.minHeight = "52px";
        mf.style.fontSize = "1.4rem";
        mf.style.padding = "0.625rem 0.875rem";
        mf.style.outline = "none";
        mf.style.border = "none";
        mf.style.background = "transparent";
        mf.style.color = "#171717";
        mf.style.display = "block";

        if (placeholder) {
          mf.setAttribute("placeholder", placeholder);
        }

        containerRef.current.appendChild(mf);
        mfRef.current = mf;

        mf.addEventListener("input", (ev: Event) => {
          const val = (ev.target as any).value;
          onChange(val);
        });
      }

      mf.setValue(value || "", { silenceNotifications: true });
      setIsMounted(true);
    });

    return () => {
      active = false;
    };
  }, []);

  // useEffect(() => {
  //   if (mfRef.current) {
  //     mfRef.current.setAttribute(
  //       "virtual-keyboard-mode",
  //       showKeyboard ? "manual" : "off",
  //     );
  //     mfRef.current.setAttribute("menu-items", showMenu ? "all" : "none");
  //   }
  // }, [showKeyboard, showMenu]);

  // Synchronize external value changes to MathField
  useEffect(() => {
    if (mfRef.current && isMounted && !isRawMode) {
      if (mfRef.current.value !== value) {
        mfRef.current.setValue(value || "", { silenceNotifications: true });
      }
    }
  }, [value, isMounted, isRawMode]);

  const insertTemplate = useCallback(
    (template: string) => {
      if (mfRef.current && !isRawMode) {
        mfRef.current.focus();
        mfRef.current.executeCommand(["insert", template]);
        onChange(mfRef.current.value);
      } else {
        onChange((value || "") + template);
      }
    },
    [isRawMode, onChange, value],
  );

  const clearInput = useCallback(() => {
    if (mfRef.current) {
      mfRef.current.setValue("", { silenceNotifications: true });
      mfRef.current.focus();
    }
    onChange("");
  }, [onChange]);

  const handleCopyLatex = useCallback(() => {
    if (!value) return;
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [value]);

  return (
    <div
      className={`flex flex-col gap-2 w-full ${className} ${
        showKeyboard
          ? ""
          : "[&_math-field::part(virtual-keyboard-toggle)]:hidden"
      } ${showMenu ? "" : "[&_math-field::part(menu-toggle)]:hidden"}`}
    >
      {/* Main Input Frame */}
      <div className="relative border border-neutral-300 rounded-xl bg-white shadow-sm focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all overflow-hidden">
        {/* Top bar with mode toggle and clear button */}
        {/* <div className="flex items-center justify-between px-3 py-1.5 bg-neutral-50/80 border-b border-neutral-100 text-xs text-neutral-500">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-neutral-600">Math Input</span>
            <span className="text-neutral-400">|</span>
            <span className="text-neutral-400">
              Type{" "}
              <kbd className="px-1 py-0.5 bg-neutral-200/60 rounded text-[10px] font-mono">
                /
              </kbd>{" "}
              for fraction,{" "}
              <kbd className="px-1 py-0.5 bg-neutral-200/60 rounded text-[10px] font-mono">
                ^
              </kbd>{" "}
              for power
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {value && (
              <button
                type="button"
                onClick={clearInput}
                className="px-1.5 py-0.5 rounded text-[11px] font-medium hover:bg-red-50 text-neutral-400 hover:text-red-500 transition"
                title="Clear input"
              >
                ✕ Clear
              </button>
            )}
          </div>
        </div> */}

        {/* Live Input Field */}
        {/* <div className="p-2 min-h-[56px] flex items-center">
          <div
            ref={containerRef}
            className="w-full"
            onClick={() => mfRef.current?.focus()}
          />
          <div className="h-1/2 w-1/2 ml-auto p-4 rounded-xl border bg-neutral-900 text-xl font-mono font-bold flex flex-col items-center justify-end shadow-xs">
            {error ? (
              <span className="text-red-400 font-sans text-sm">
                Error: {error}
              </span>
            ) : (
              <span className="text-emerald-400 ml-auto">
                = {result !== null ? result : "—"}
              </span>
            )}
          </div>
        </div> */}

        <div className="relative p-2 min-h-[56px] flex items-center">
          {/* Math Field Container */}
          <div
            ref={containerRef}
            className="w-full"
            onClick={() => mfRef.current?.focus()}
          />

          {/* Bottom-Right Result Overlay */}
          <div className="absolute bottom-2 right-2 h-1/2 w-1/3 p-2 rounded-xl border bg-neutral-900 text-xl font-mono font-bold flex flex-col items-end justify-end shadow-xs pointer-events-none">
            {error ? (
              <span className="text-red-400 font-sans text-sm">
                Error: {error}
              </span>
            ) : (
              <span className="text-emerald-400">
                = {result !== null ? result : "—"}
              </span>
            )}
          </div>
        </div>

        {/* math toolbar */}
        {showToolbar && (
          <div className="flex items-center gap-1 px-2 py-1.5 bg-neutral-50/60 border-t border-neutral-100 overflow-x-auto">
            {MATH_BUTTONS.map((btn) => (
              <button
                key={btn.label}
                type="button"
                onClick={() => insertTemplate(btn.latex)}
                title={btn.title}
                className="px-2.5 py-1 text-xs font-semibold text-neutral-700 bg-white hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 border border-neutral-200 rounded-md shadow-2xs transition-colors shrink-0"
              >
                {btn.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* LaTeX source display pill */}
      {showLatexBadge && value && (
        <div className="flex flex-col gap-1.5 text-xs px-3 py-2 bg-neutral-100/70 border border-neutral-200/70 rounded-lg text-neutral-600 font-mono overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="truncate flex items-center gap-2">
              <span className="text-neutral-400 select-none uppercase text-[10px] font-sans font-semibold tracking-wider">
                LaTeX
              </span>
              <span className="text-neutral-800 select-all">{value}</span>
            </div>
            <button
              type="button"
              onClick={handleCopyLatex}
              className="ml-2 text-[11px] text-blue-600 hover:text-blue-800 font-sans font-medium shrink-0"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>

          {hasImplicitGrouping && (
            <div className="flex items-center justify-between pt-1.5 border-t border-neutral-200/60 text-[11px]">
              <div className="truncate flex items-center gap-1.5 text-emerald-700">
                <span className="font-sans font-semibold uppercase text-[9px] tracking-wider text-emerald-600 bg-emerald-50 px-1 py-0.5 rounded border border-emerald-200/50">
                  Auto-Compiled
                </span>
                <span className="select-all font-mono font-medium">
                  {explicitLatex}
                </span>
              </div>
              <button
                type="button"
                onClick={() => onChange(explicitLatex)}
                className="ml-2 px-2 py-0.5 rounded bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-sans font-medium text-[11px] transition shrink-0"
                title="Replace with explicit braces"
              >
                Make Explicit
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
