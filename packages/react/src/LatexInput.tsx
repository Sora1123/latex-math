import React, {
  useRef,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";
import "katex/dist/katex.min.css";
import { normalizeLatex } from "@latex-math/core";
import { useLatexEvaluation } from "./useLatexEvaluation";
import { LatexExpression } from "./LatexExpression";

export interface LatexInputProps {
  value: string;
  variables?: { [key: string]: number };
  onChange: (value: string) => void;
  className?: string;
  /**
   * Styling class for the math input box.
   * Can be passed via inputWrapperClassName or mathFieldClassName (combined for the same box).
   */
  inputWrapperClassName?: string;
  mathFieldClassName?: string;
  mathfieldClassName?: string;
  mathFieldContainerClassName?: string;
  /**
   * Styling class for the evaluated result badge (e.g. bg-*, text-*, border-*, or custom positioning).
   */
  resultClassName?: string;
  placeholder?: string;
  showToolbar?: boolean;
  showLatexBadge?: boolean;
  showKeyboard?: boolean;
  showMenu?: boolean;
  showEvaluatedResult?: boolean;
  /**
   * Whether to show autocomplete suggestions when typing "\" in the input.
   * @default true
   */
  showSuggestions?: boolean;
  /**
   * Optional custom list of commands to suggest when typing "\" (e.g. ['\\sqrt', '\\frac', '\\int', '\\sin', '\\cos']).
   */
  customSuggestions?: string[];
  /**
   * Character or symbol used for empty placeholders in math templates.
   * Defaults to empty string ("") so no square placeholder boxes are shown.
   */
  placeholderSymbol?: string;
  /**
   * Directory where MathLive fonts are located.
   * Defaults to unpkg CDN ("https://unpkg.com/mathlive@0.110.0/dist/fonts/") to avoid Next.js/Webpack chunk 404s.
   */
  fontsDirectory?: string;
}

function getBoxClasses(customClasses: string = ""): {
  boxClasses: string;
  hasCustomBg: boolean;
} {
  const hasCustomBg = /\bbg-\S+/.test(customClasses);
  const hasBorder = /\bborder-\S+/.test(customClasses);
  const hasRounded = /\brounded-\S+/.test(customClasses);
  const hasShadow = /\bshadow-\S+/.test(customClasses);
  const hasRing = /\b(ring-|focus-within:ring-)\S+/.test(customClasses);
  const hasTextColor = /\btext-(?!xs\b|sm\b|base\b|lg\b|xl\b|[2-9]xl\b)\S+/.test(customClasses);
  const hasTextSize = /\btext-(xs|sm|base|lg|xl|[2-9]xl)\b/.test(customClasses);

  const boxClasses = [
    "relative transition-all overflow-hidden",
    hasBorder ? "" : "border border-neutral-300",
    hasRounded ? "" : "rounded-xl",
    hasCustomBg ? "" : "bg-white",
    hasShadow ? "" : "shadow-xs",
    hasRing ? "" : "focus-within:border-neutral-400",
    hasTextColor ? "" : "text-neutral-900",
    hasTextSize ? "" : "text-lg",
    customClasses,
  ]
    .filter(Boolean)
    .join(" ");

  return { boxClasses, hasCustomBg };
}

function getResultClasses(resultClassName: string = ""): {
  containerClasses: string;
  badgeClasses: string;
  hasCustomText: boolean;
  hasCustomBg: boolean;
} {
  const words = resultClassName.split(/\s+/).filter(Boolean);
  const posWords = words.filter((w) =>
    /^(top-|bottom-|left-|right-|static|relative|absolute|fixed)/.test(w)
  );
  const styleWords = words.filter(
    (w) =>
      !/^(top-|bottom-|left-|right-|static|relative|absolute|fixed)/.test(w)
  );

  const hasExplicitPositionType = posWords.some((w) =>
    /^(static|relative|absolute|fixed)$/.test(w)
  );
  const hasExplicitHorizontal = posWords.some((w) => /^(left-|right-)/.test(w));
  const hasExplicitVertical = posWords.some((w) => /^(top-|bottom-)/.test(w));

  const containerClasses = [
    hasExplicitPositionType ? "" : "absolute",
    hasExplicitHorizontal ? "" : "right-3",
    hasExplicitVertical ? "" : "bottom-2",
    ...posWords,
    "flex items-center pointer-events-none z-10 select-none",
  ]
    .filter(Boolean)
    .join(" ");

  const styleClassString = styleWords.join(" ");
  const hasCustomBg = /\bbg-\S+/.test(styleClassString);
  const hasCustomBorder = /\bborder-\S+/.test(styleClassString);
  const hasCustomRounded = /\brounded-\S+/.test(styleClassString);
  const hasCustomShadow = /\bshadow-\S+/.test(styleClassString);
  const hasCustomText = /\btext-(?!xs\b|sm\b|base\b|lg\b|xl\b|[2-9]xl\b)\S+/.test(
    styleClassString
  );
  const hasCustomBackdrop = /\bbackdrop-\S+/.test(styleClassString);

  const badgeClasses = [
    "inline-flex items-center gap-1.5 px-2.5 py-0.5 text-sm",
    hasCustomRounded ? "" : "rounded-lg",
    hasCustomShadow ? "" : "shadow-2xs",
    hasCustomBackdrop ? "" : "backdrop-blur-xs",
    hasCustomBorder ? "" : "border border-neutral-200/90",
    hasCustomBg ? "" : "bg-neutral-50/95",
    hasCustomText ? "" : "text-neutral-800",
    styleClassString,
  ]
    .filter(Boolean)
    .join(" ");

  return { containerClasses, badgeClasses, hasCustomText, hasCustomBg };
}

const MATH_BUTTONS = [
  { label: "a/b", latex: "\\frac{#?}{#?}", title: "Fraction" },
  { label: "x²", latex: "^{2}", title: "Squared" },
  { label: "aᵇ", latex: "^{#?}", title: "Superscript / Power" },
  { label: "√x", latex: "\\sqrt{#?}", title: "Square Root" },
  { label: "ⁿ√x", latex: "\\sqrt[#?]{#?}", title: "nth Root" },
  { label: "π", latex: "\\pi", title: "Pi" },
  { label: "∫", latex: "\\int_{#?}^{#?} \\dx", title: "Definite Integral" },
  { label: "Σ", latex: "\\sum_{#?}^{#?}", title: "Summation" },
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
  mathFieldClassName = "",
  mathfieldClassName = "",
  mathFieldContainerClassName = "",
  resultClassName = "",
  placeholder = "\\text{Type math... }",
  showToolbar = true,
  showLatexBadge = true,
  showKeyboard = true,
  showMenu = true,
  showEvaluatedResult = true,
  showSuggestions = true,
  customSuggestions,
  placeholderSymbol = "\u25A2",
  fontsDirectory,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mfRef = useRef<any>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [isRawMode, setIsRawMode] = useState(false);
  const [copied, setCopied] = useState(false);

  // Combine inputWrapper and mathField classNames as they target the same box
  const combinedInputClassName = [
    inputWrapperClassName,
    mathFieldClassName,
    mathfieldClassName,
    mathFieldContainerClassName,
  ]
    .filter(Boolean)
    .join(" ");

  const { boxClasses, hasCustomBg } = useMemo(
    () => getBoxClasses(combinedInputClassName),
    [combinedInputClassName]
  );

  const {
    containerClasses: resultContainerClasses,
    badgeClasses: resultBadgeClasses,
    hasCustomText: hasResultText,
  } = useMemo(() => getResultClasses(resultClassName), [resultClassName]);

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

  // Global styling override to remove blue highlight on sqrt/numbers, remove focus rings, and style placeholders as grey rectangles
  useEffect(() => {
    if (typeof document === "undefined") return;
    const styleId = "latex-math-global-overrides";
    let styleEl = document.getElementById(styleId) as HTMLStyleElement;
    if (!styleEl) {
      styleEl = document.createElement("style");
      styleEl.id = styleId;
      styleEl.textContent = `
        math-field {
          --contains-highlight-background-color: transparent !important;
          --_contains-highlight-background-color: transparent !important;
          --contains-highlight-color: inherit !important;
          --_contains-highlight-color: inherit !important;
          --primary: inherit !important;
          outline: none !important;
          box-shadow: none !important;
        }
        math-field:focus,
        math-field:focus-visible,
        math-field:focus-within {
          outline: none !important;
          box-shadow: none !important;
        }
        .ML__contains-caret .ML__sqrt-sign,
        .ML__contains-caret .ML__sqrt-line,
        .ML__contains-caret.ML__close,
        .ML__contains-caret.ML__open,
        .ML__contains-caret > .ML__close,
        .ML__contains-caret > .ML__open {
          color: inherit !important;
        }
        .ML__contains-highlight,
        .ML__focused .ML__contains-highlight,
        .ML__contains-caret.ML__contains-highlight {
          background-color: transparent !important;
          background: transparent !important;
          color: inherit !important;
          box-shadow: none !important;
        }
        .ML__placeholder {
          display: inline-block !important;
          min-width: 0.85em !important;
          height: 0.9em !important;
          background-color: rgba(140, 140, 140, 0.22) !important;
          border-radius: 2px !important;
          color: transparent !important;
          font-size: 0.85em !important;
          line-height: 1 !important;
          vertical-align: 0.05em !important;
          margin: 0 1.5px !important;
          user-select: none !important;
          box-shadow: inset 0 0 0 1px rgba(140, 140, 140, 0.12) !important;
        }
        .ML__placeholder-selected,
        .ML__placeholder.ML__selected {
          background-color: rgba(140, 140, 140, 0.38) !important;
        }
      `;
      document.head.appendChild(styleEl);
    }
  }, []);

  // Control LaTeX command suggestions popup
  useEffect(() => {
    if (typeof document === "undefined") return;
    const styleId = "latex-math-suggestions-style";
    let styleEl = document.getElementById(styleId) as HTMLStyleElement;

    if (!showSuggestions) {
      if (!styleEl) {
        styleEl = document.createElement("style");
        styleEl.id = styleId;
        document.head.appendChild(styleEl);
      }
      styleEl.textContent = `
        #mathlive-suggestion-popover,
        .ML__suggestion-popover,
        [data-ml-suggestion-popover] {
          display: none !important;
          visibility: hidden !important;
          opacity: 0 !important;
          pointer-events: none !important;
        }
      `;
    } else {
      if (styleEl) {
        styleEl.remove();
      }
    }

    return () => {
      if (!showSuggestions && styleEl && styleEl.parentNode) {
        styleEl.remove();
      }
    };
  }, [showSuggestions]);

  // Filter custom suggestions if provided
  useEffect(() => {
    if (!showSuggestions || !customSuggestions || customSuggestions.length === 0) return;
    if (typeof MutationObserver === "undefined") return;

    const observer = new MutationObserver(() => {
      const popover = document.getElementById("mathlive-suggestion-popover");
      if (popover) {
        const items = popover.querySelectorAll("li, [role='option'], [data-command]");
        items.forEach((item) => {
          const text = (item.textContent || "").trim();
          const cmd = item.getAttribute("data-command") || text;
          const match = customSuggestions.some(
            (s) => s === cmd || cmd.startsWith(s) || s.startsWith(cmd)
          );
          if (!match) {
            (item as HTMLElement).style.display = "none";
          }
        });
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [showSuggestions, customSuggestions]);

  // Synchronize showKeyboard and showMenu props with math-field element
  useEffect(() => {
    if (mfRef.current) {
      mfRef.current.setAttribute(
        "virtual-keyboard-mode",
        showKeyboard ? "manual" : "off"
      );
      if (!showMenu) {
        mfRef.current.setAttribute("menu-items", "none");
      } else {
        mfRef.current.removeAttribute("menu-items");
      }
    }
  }, [showKeyboard, showMenu]);

  // Synchronize fontsDirectory if prop changes dynamically
  useEffect(() => {
    if (typeof window !== "undefined" && fontsDirectory && (window as any).MathfieldElement) {
      (window as any).MathfieldElement.fontsDirectory = fontsDirectory;
      document.body.classList.remove("ML__fonts-did-not-load");
    }
  }, [fontsDirectory]);

  // Initialize MathLive custom element
  useEffect(() => {
    if (typeof window === "undefined") return;

    let active = true;
    import("mathlive").then((ml) => {
      if (!active || !containerRef.current) return;

      try {
        if (ml.MathfieldElement) {
          const targetDir =
            fontsDirectory || "https://unpkg.com/mathlive@0.110.0/dist/fonts/";
          ml.MathfieldElement.fontsDirectory = targetDir;
          document.body.classList.remove("ML__fonts-did-not-load");
        }
      } catch {
        // fallback
      }

      let mf = containerRef.current.querySelector("math-field") as any;
      if (!mf) {
        mf = document.createElement("math-field");
        mf.setAttribute(
          "virtual-keyboard-mode",
          showKeyboard ? "manual" : "off"
        );
        if (!showMenu) {
          mf.setAttribute("menu-items", "none");
        }

        mf.style.width = "100%";
        mf.style.minHeight = "48px";
        mf.style.fontSize = "inherit";
        mf.style.padding = "0.5rem 0.75rem";
        mf.style.outline = "none";
        mf.style.border = "none";
        mf.style.background = "transparent";
        mf.style.color = "inherit";
        mf.style.setProperty("--color", "inherit");
        mf.style.setProperty("--contains-highlight-background-color", "transparent");
        mf.style.setProperty("--contains-highlight-color", "inherit");
        mf.style.setProperty("--_contains-highlight-background-color", "transparent");
        mf.style.setProperty("--_contains-highlight-color", "inherit");
        mf.style.boxShadow = "none";
        mf.style.display = "block";

        if (placeholder) {
          mf.setAttribute("placeholder", placeholder);
        }

        containerRef.current.appendChild(mf);
        mfRef.current = mf;

        // Custom macros, shortcuts, and placeholderSymbol must be set AFTER mounting to the DOM
        try {
          if (placeholderSymbol !== undefined) {
            mf.placeholderSymbol = placeholderSymbol;
          }
        } catch {
          // ignore if option not available
        }

        const injectShadowStyles = () => {
          if (mf.shadowRoot) {
            const shadowStyleId = "latex-mathfield-shadow-overrides";
            let shadowStyle = mf.shadowRoot.getElementById(shadowStyleId) as HTMLStyleElement;
            if (!shadowStyle) {
              shadowStyle = document.createElement("style");
              shadowStyle.id = shadowStyleId;
              shadowStyle.textContent = `
                :host,
                :host(:focus),
                :host(:focus-visible),
                :host(:focus-within),
                .ML__keyboard-sink,
                .ML__fieldcontainer {
                  outline: none !important;
                  box-shadow: none !important;
                  border-color: transparent !important;
                }
                .ML__contains-caret .ML__sqrt-sign,
                .ML__contains-caret .ML__sqrt-line,
                .ML__contains-caret.ML__close,
                .ML__contains-caret.ML__open,
                .ML__contains-caret > .ML__close,
                .ML__contains-caret > .ML__open {
                  color: inherit !important;
                }
                .ML__contains-highlight,
                .ML__focused .ML__contains-highlight,
                .ML__contains-caret.ML__contains-highlight {
                  background-color: transparent !important;
                  background: transparent !important;
                  color: inherit !important;
                  box-shadow: none !important;
                }
                .ML__placeholder {
                  display: inline-block !important;
                  min-width: 0.85em !important;
                  height: 0.9em !important;
                  background-color: rgba(140, 140, 140, 0.22) !important;
                  border-radius: 2px !important;
                  color: transparent !important;
                  font-size: 0.85em !important;
                  line-height: 1 !important;
                  vertical-align: 0.05em !important;
                  margin: 0 1.5px !important;
                  user-select: none !important;
                  box-shadow: inset 0 0 0 1px rgba(140, 140, 140, 0.12) !important;
                }
                .ML__placeholder-selected,
                .ML__placeholder.ML__selected {
                  background-color: rgba(140, 140, 140, 0.38) !important;
                }
              `;
              mf.shadowRoot.appendChild(shadowStyle);
            }
          }
        };
        injectShadowStyles();
        mf.addEventListener("focus", injectShadowStyles);

        try {
          const existingMacros = mf._mathfield ? mf.macros || {} : {};
          mf.macros = {
            ...existingMacros,
            dx: "{\\,\\mathrm{d}x}",
          };
        } catch {
          // ignore
        }

        try {
          const existingShortcuts = mf._mathfield ? mf.inlineShortcuts || {} : {};
          const updatedShortcuts = {
            ...existingShortcuts,
            dx: "\\dx",
            xx: "",
          };
          delete updatedShortcuts.xx;
          mf.inlineShortcuts = updatedShortcuts;
        } catch {
          // ignore
        }

        try {
          mf.onInlineShortcut = (_mf: any, shortcut: string) => {
            if (shortcut === "xx") return "";
            return shortcut;
          };
        } catch {
          // ignore
        }

        mf.addEventListener("input", (ev: Event) => {
          const val = (ev.target as any).value;
          onChange(val);
        });

        const deleteEntireIntegral = (intAtom: any) => {
          const mathfield = (mf as any)._mathfield;
          const model = mathfield?.model;
          if (!intAtom || !model) return;
          const intIndex = model.offsetOf(intAtom);
          const beforePos = Math.max(0, intIndex - 1);

          // Find all contiguous descendant atoms of intAtom in model.atoms
          let lastIndex = intIndex;
          const atoms = model.atoms || [];
          for (let i = intIndex + 1; i < atoms.length; i++) {
            let a = atoms[i];
            let isChild = false;
            while (a) {
              if (a === intAtom) {
                isChild = true;
                break;
              }
              a = a.parent;
            }
            if (isChild) {
              lastIndex = i;
            } else {
              break;
            }
          }

          try {
            if (intAtom.parent && typeof intAtom.parent.removeChild === "function") {
              intAtom.parent.removeChild(intAtom);
            }
          } catch {
            // ignore
          }

          try {
            if (typeof model.deleteAtoms === "function") {
              model.deleteAtoms([Math.max(0, intIndex - 1), lastIndex]);
            }
          } catch {
            // ignore
          }

          model.position = beforePos;
          if (typeof mathfield.render === "function") {
            mathfield.render();
          }
          onChange(mf.value);
        };

        mf.addEventListener("keydown", (ev: KeyboardEvent) => {
          const mathfield = (mf as any)._mathfield;
          const model = mathfield?.model;
          if (!model) return;

          const isIntegral = (a: any) =>
            Boolean(
              a &&
              (a.command === "\\int" ||
                a.type === "integral" ||
                a.type === "extensible-symbol" ||
                (a.type === "operator" && a.value === "\\int") ||
                a.command?.includes("int"))
            );

          const pos = model.position;
          const target = model.at(pos);
          const parent = target?.parent;

          // Identify if target or an ancestor is an integral
          let intAtom: any = null;
          let inBranch: "superscript" | "subscript" | null = null;

          if (target?.parentBranch === "superscript" && isIntegral(parent)) {
            intAtom = parent;
            inBranch = "superscript";
          } else if (target?.parentBranch === "subscript" && isIntegral(parent)) {
            intAtom = parent;
            inBranch = "subscript";
          } else if (parent && isIntegral(parent)) {
            intAtom = parent;
            inBranch = target?.parentBranch === "subscript" ? "subscript" : "superscript";
          } else if (isIntegral(target)) {
            intAtom = target;
          } else {
            let anc = target?.parent;
            while (anc) {
              if (isIntegral(anc)) {
                intAtom = anc;
                inBranch = target?.parentBranch === "subscript" ? "subscript" : "superscript";
                break;
              }
              anc = anc.parent;
            }
          }

          // Backspace behavior for integral
          if (ev.key === "Backspace") {
            if (intAtom && inBranch) {
              const branchAtoms = (
                intAtom[inBranch] ||
                (typeof intAtom.branch === "function" && intAtom.branch(inBranch)) ||
                []
              ).filter(
                (a: any) => a && a.type !== "first" && a.type !== "placeholder"
              );

              if (branchAtoms.length > 0) {
                // Real content in this limit: delete the character, keep integral
                ev.preventDefault();
                ev.stopPropagation();

                const atomToDelete =
                  target &&
                  target.type !== "first" &&
                  target.type !== "placeholder" &&
                  target.parentBranch === inBranch
                    ? target
                    : branchAtoms[branchAtoms.length - 1];

                if (atomToDelete) {
                  const bParent = atomToDelete.parent;
                  const prevSibling = atomToDelete.leftSibling;
                  const newPos = prevSibling
                    ? model.offsetOf(prevSibling)
                    : Math.max(0, model.offsetOf(atomToDelete) - 1);

                  if (bParent && typeof bParent.removeChild === "function") {
                    try {
                      bParent.removeChild(atomToDelete);
                    } catch {
                      // ignore
                    }
                  }
                  model.position = Math.max(0, newPos);
                  if (typeof mathfield.render === "function") {
                    mathfield.render();
                  }
                  onChange(mf.value);
                  return;
                }
              } else {
                // Limit is empty: deleting backward removes the ENTIRE integral!
                ev.preventDefault();
                ev.stopPropagation();
                deleteEntireIntegral(intAtom);
                return;
              }
            } else if (isIntegral(target)) {
              ev.preventDefault();
              ev.stopPropagation();
              deleteEntireIntegral(target);
              return;
            }
          }

          // ArrowRight navigation for integral
          // Order: front of integral -> lower limit -> upper limit -> after integral
          if (ev.key === "ArrowRight") {
            if (!model.selectionIsCollapsed) return;

            // In front of integral: move into lower limit
            const nextAtom = model.at(pos + 1);
            const candidateInt = isIntegral(target?.rightSibling)
              ? target.rightSibling
              : isIntegral(nextAtom)
              ? nextAtom
              : null;

            if (candidateInt) {
              const sub =
                candidateInt.subscript ||
                (typeof candidateInt.branch === "function" &&
                  candidateInt.branch("subscript")) ||
                [];
              if (sub.length > 0) {
                ev.preventDefault();
                ev.stopPropagation();
                const targetSub = sub.length > 1 ? sub[1] : sub[0];
                model.position = model.offsetOf(targetSub);
                if (typeof mathfield.render === "function") mathfield.render();
                return;
              }
            }

            // Inside lower limit: at end of lower limit, jump to start of upper limit
            if (intAtom && inBranch === "subscript") {
              const sub =
                intAtom.subscript ||
                (typeof intAtom.branch === "function" &&
                  intAtom.branch("subscript")) ||
                [];
              const lastSubAtom = sub[sub.length - 1];
              const isAtEndOfSub =
                pos >= model.offsetOf(lastSubAtom) || target === lastSubAtom;

              if (isAtEndOfSub) {
                const sup =
                  intAtom.superscript ||
                  (typeof intAtom.branch === "function" &&
                    intAtom.branch("superscript")) ||
                  [];
                if (sup.length > 0) {
                  ev.preventDefault();
                  ev.stopPropagation();
                  const targetSup = sup.length > 1 ? sup[1] : sup[0];
                  model.position = model.offsetOf(targetSup);
                  if (typeof mathfield.render === "function")
                    mathfield.render();
                  return;
                }
              }
            }

            // Inside upper limit: at end of upper limit, jump to AFTER the integral
            if (intAtom && inBranch === "superscript") {
              const sup =
                intAtom.superscript ||
                (typeof intAtom.branch === "function" &&
                  intAtom.branch("superscript")) ||
                [];
              const lastSupAtom = sup[sup.length - 1];
              const isAtEndOfSup =
                pos >= model.offsetOf(lastSupAtom) || target === lastSupAtom;

              if (isAtEndOfSup) {
                ev.preventDefault();
                ev.stopPropagation();

                let lastIndex = model.offsetOf(intAtom);
                const atoms = model.atoms || [];
                for (let i = lastIndex + 1; i < atoms.length; i++) {
                  let a = atoms[i];
                  let isChild = false;
                  while (a) {
                    if (a === intAtom) {
                      isChild = true;
                      break;
                    }
                    a = a.parent;
                  }
                  if (isChild) lastIndex = i;
                  else break;
                }

                model.position = lastIndex;
                if (typeof mathfield.render === "function") mathfield.render();
                return;
              }
            }
          }

          // ArrowLeft navigation for integral
          // Order: after integral -> end of upper limit -> end of lower limit -> front of integral
          if (ev.key === "ArrowLeft") {
            if (!model.selectionIsCollapsed) return;

            // Inside upper limit: at start of upper limit, jump to end of lower limit
            if (intAtom && inBranch === "superscript") {
              const sup =
                intAtom.superscript ||
                (typeof intAtom.branch === "function" &&
                  intAtom.branch("superscript")) ||
                [];
              const firstSupAtom = sup[0];
              const isAtStartOfSup =
                pos <= model.offsetOf(firstSupAtom) ||
                target === firstSupAtom ||
                target?.type === "first";

              if (isAtStartOfSup) {
                const sub =
                  intAtom.subscript ||
                  (typeof intAtom.branch === "function" &&
                    intAtom.branch("subscript")) ||
                  [];
                if (sub.length > 0) {
                  ev.preventDefault();
                  ev.stopPropagation();
                  model.position = model.offsetOf(sub[sub.length - 1]);
                  if (typeof mathfield.render === "function")
                    mathfield.render();
                  return;
                }
              }
            }

            // Inside lower limit: at start of lower limit, jump to in front of integral
            if (intAtom && inBranch === "subscript") {
              const sub =
                intAtom.subscript ||
                (typeof intAtom.branch === "function" &&
                  intAtom.branch("subscript")) ||
                [];
              const firstSubAtom = sub[0];
              const isAtStartOfSub =
                pos <= model.offsetOf(firstSubAtom) ||
                target === firstSubAtom ||
                target?.type === "first";

              if (isAtStartOfSub) {
                ev.preventDefault();
                ev.stopPropagation();
                const frontPos = model.offsetOf(intAtom.leftSibling);
                model.position = Math.max(0, frontPos);
                if (typeof mathfield.render === "function") mathfield.render();
                return;
              }
            }
          }
        });
      }

      mfRef.current = mf;
      try {
        mf.setValue(value || "", { silenceNotifications: true });
      } catch {
        // ignore if not ready
      }
      setIsMounted(true);
    });

    return () => {
      active = false;
    };
  }, []);

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
      {/* Main Input Frame (Combined inputWrapper + mathField) */}
      <div className={boxClasses}>
        {/* Live Input Field */}
        <div className="relative p-1 min-h-[52px] flex flex-col justify-start">
          {/* Math Field Container */}
          <div
            ref={containerRef}
            className="w-full bg-transparent"
            onClick={() => mfRef.current?.focus()}
          />

          {/* Evaluated Result Box: Only appears when there is no error and result is not null */}
          {showEvaluatedResult && !error && result !== null && (
            <div className={resultContainerClasses}>
              <div className={resultBadgeClasses}>
                <span
                  className={`${
                    hasResultText ? "opacity-60" : "text-neutral-400"
                  } font-normal select-none text-xs`}
                >
                  =
                </span>
                <LatexExpression
                  expression={result}
                  output="html"
                  className={`${
                    hasResultText ? "" : "text-neutral-900"
                  } font-medium`}
                />
              </div>
            </div>
          )}
        </div>

        {/* math toolbar */}
        {showToolbar && (
          <div
            className={`flex items-center gap-1 px-2 py-1.5 overflow-x-auto ${
              hasCustomBg
                ? "bg-black/10 border-t border-current/15"
                : "bg-neutral-50/60 border-t border-neutral-100"
            }`}
          >
            {MATH_BUTTONS.map((btn) => (
              <button
                key={btn.label}
                type="button"
                onClick={() => insertTemplate(btn.latex)}
                title={btn.title}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md shadow-2xs transition-colors shrink-0 ${
                  hasCustomBg
                    ? "bg-white/10 hover:bg-white/20 text-inherit border border-current/20"
                    : "text-neutral-700 bg-white hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 border border-neutral-200"
                }`}
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
