"use client";

import { useState, useEffect } from "react";
import { Accessibility, X, Type, Contrast, Zap, Plus, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

type FontSize = "small" | "normal" | "large" | "xlarge";

const FONT_SIZES: Record<FontSize, { label: string; root: string }> = {
  small: { label: "小", root: "15px" },
  normal: { label: "标准", root: "16px" },
  large: { label: "大", root: "18px" },
  xlarge: { label: "特大", root: "20px" },
};

export function AccessibilityPanel() {
  const [open, setOpen] = useState(false);
  const [fontSize, setFontSize] = useState<FontSize>("normal");
  const [highContrast, setHighContrast] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const fs = localStorage.getItem("a11y_fontSize") as FontSize;
    const hc = localStorage.getItem("a11y_highContrast");
    const rm = localStorage.getItem("a11y_reduceMotion");
    if (fs && FONT_SIZES[fs]) setFontSize(fs);
    if (hc === "true") setHighContrast(true);
    if (rm === "true") setReduceMotion(true);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.style.fontSize = FONT_SIZES[fontSize].root;
    root.classList.toggle("high-contrast", highContrast);
    root.classList.toggle("reduce-motion", reduceMotion);
    localStorage.setItem("a11y_fontSize", fontSize);
    localStorage.setItem("a11y_highContrast", String(highContrast));
    localStorage.setItem("a11y_reduceMotion", String(reduceMotion));
  }, [fontSize, highContrast, reduceMotion]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-20 md:bottom-6 right-4 z-40 w-11 h-11 rounded-full bg-ink-800 text-ink-50 shadow-lift flex items-center justify-center hover:bg-ink-700 transition-colors"
        aria-label="无障碍设置"
      >
        <Accessibility size={20} />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-ink-900/30 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-4"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="无障碍设置"
        >
          <div
            className="bg-white rounded-t-2xl md:rounded-2xl w-full md:max-w-sm p-6 animate-slideUp"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-medium text-ink-800 flex items-center gap-2">
                <Accessibility size={18} /> 无障碍设置
              </h3>
              <button
                onClick={() => setOpen(false)}
                className="text-ink-400 hover:text-ink-700"
                aria-label="关闭"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-5">
              <div>
                <label className="label flex items-center gap-1.5">
                  <Type size={13} /> 字体大小
                </label>
                <div className="flex gap-2">
                  {(Object.keys(FONT_SIZES) as FontSize[]).map((fs) => (
                    <button
                      key={fs}
                      onClick={() => setFontSize(fs)}
                      className={cn(
                        "flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors",
                        fontSize === fs
                          ? "bg-ink-800 text-ink-50"
                          : "bg-ink-50 text-ink-500 hover:bg-ink-100"
                      )}
                      aria-pressed={fontSize === fs}
                    >
                      {FONT_SIZES[fs].label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setHighContrast(!highContrast)}
                className="w-full flex items-center justify-between p-3.5 rounded-xl bg-ink-50/50 hover:bg-ink-50 transition-colors"
                aria-pressed={highContrast}
              >
                <span className="flex items-center gap-2 text-sm text-ink-700">
                  <Contrast size={16} /> 高对比度模式
                </span>
                <span
                  className={cn(
                    "w-10 h-6 rounded-full transition-colors relative",
                    highContrast ? "bg-sage-500" : "bg-ink-200"
                  )}
                >
                  <span
                    className={cn(
                      "absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform",
                      highContrast ? "translate-x-5" : "translate-x-0.5"
                    )}
                  />
                </span>
              </button>

              <button
                onClick={() => setReduceMotion(!reduceMotion)}
                className="w-full flex items-center justify-between p-3.5 rounded-xl bg-ink-50/50 hover:bg-ink-50 transition-colors"
                aria-pressed={reduceMotion}
              >
                <span className="flex items-center gap-2 text-sm text-ink-700">
                  <Zap size={16} /> 减少动画
                </span>
                <span
                  className={cn(
                    "w-10 h-6 rounded-full transition-colors relative",
                    reduceMotion ? "bg-sage-500" : "bg-ink-200"
                  )}
                >
                  <span
                    className={cn(
                      "absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform",
                      reduceMotion ? "translate-x-5" : "translate-x-0.5"
                    )}
                  />
                </span>
              </button>

              <p className="text-xs text-ink-400 leading-relaxed">
                设置会保存在本地浏览器，方便下次使用。
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
