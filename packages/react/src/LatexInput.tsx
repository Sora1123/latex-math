import React, {
  useRef,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";
import { normalizeLatex } from "@latex-math/core";
import { useLatexEvaluation } from "./useLatexEvaluation";
import { LatexExpression } from "./LatexExpression";

export interface LatexInputProps {
  value: string;
  variables?: { [key: string]: number };
  onChange: (value: string) => void;
  className?: string;
  inputWrapperClassName?: string;
  mathFieldContainerClassName?: string;
  resultClassName?: string;
  placeholder?: string;
  showToolbar?: boolean;
  showLatexBadge?: boolean;
  showKeyboard?: boolean;
  showMenu?: boolean;
  showEvaluatedResult?: boolean;
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
  inputWrapperClassName = "",
  mathFieldContainerClassName = "",
  resultClassName = "",
  placeholder = "\\text{Type math... }",
  showToolbar = true,
  showLatexBadge = true,
  showKeyboard = true,
  showMenu = true,
  showEvaluatedResult = true,
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

        mf.addEventListener("keydown", (ev: KeyboardEvent) => {
          if (ev.key === "Backspace") {
            const mathfield = (mf as any)._mathfield;
            const model = mathfield?.model;
            if (!model) return;

            const pos = model.position;
            const target = model.at(pos);
            const parent = target?.parent;

            const isInt = (a: any) =>
              a && (a.command === "\\int" || a.type === "integral");

            let intAtom: any = null;
            let branch = "";
            if (isInt(parent)) {
              intAtom = parent;
              branch = target?.parentBranch || "";
            } else if (isInt(target)) {
              intAtom = target;
            } else if (isInt(target?.rightSibling)) {
              intAtom = target.rightSibling;
            }

            if (intAtom) {
              const sup =
                intAtom.superscript ||
                (typeof intAtom.branch === "function" &&
                  intAtom.branch("superscript"));
              const isSupEmpty =
                !sup ||
                sup.length === 0 ||
                (sup.length === 1 &&
                  (sup[0].type === "placeholder" || sup[0].type === "first"));

              if (
                (branch === "superscript" && isSupEmpty) ||
                (target?.rightSibling === intAtom &&
                  (target.isFirstSibling || target.type === "first"))
              ) {
                ev.preventDefault();
                ev.stopPropagation();

                const p = intAtom.parent;
                const leftPos = model.offsetOf(intAtom.leftSibling);
                if (p && typeof p.removeChild === "function") {
                  p.removeChild(intAtom);
                  model.position = Math.max(0, leftPos);
                  if (typeof mathfield.render === "function") {
                    mathfield.render();
                  }
                  onChange(mf.value);
                } else {
                  model.setSelection(leftPos, model.offsetOf(intAtom));
                  mf.executeCommand(["deleteBackward"]);
                  onChange(mf.value);
                }
              }
            }
          }
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
      <div
        className={`relative border border-neutral-300 rounded-xl bg-white shadow-xs focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all overflow-hidden ${inputWrapperClassName}`}
      >
        {/* Live Input Field */}
        <div className={`relative p-2.5 min-h-[56px] flex flex-col justify-start`}>
          {/* Math Field Container */}
          <div
            ref={containerRef}
            className={`w-full ${mathFieldContainerClassName}`}
            onClick={() => mfRef.current?.focus()}
          />

          {/* Evaluated Result Box (bottom-left corner) */}
          {showEvaluatedResult && (
            <div
              className={
                resultClassName ||
                "absolute right-2 bottom-2 flex items-center pointer-events-none z-10 select-none"
              }
            >
              {error ? (
                <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-amber-50 border border-amber-200/90 text-amber-800 text-xs font-sans font-medium shadow-2xs">
                  <span>{error}</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg border border-neutral-200/90 bg-neutral-50/95 text-neutral-800 shadow-2xs backdrop-blur-xs text-sm">
                  <span className="text-neutral-400 font-normal select-none text-xs">
                    =
                  </span>
                  {result !== null ? (
                    <LatexExpression
                      expression={result}
                      className="text-neutral-900 font-medium"
                    />
                  ) : (
                    <span className="text-neutral-400 text-xs font-mono">—</span>
                  )}
                </div>
              )}
            </div>
          )}
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
