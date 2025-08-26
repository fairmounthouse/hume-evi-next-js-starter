"use client";

import { HexColorPicker } from "react-colorful";
import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";

type ThemeKeys = "hero" | "header" | "section" | "cta" | "accent" | "card-border" | "footer";

const cssVarByKey: Record<ThemeKeys, string> = {
  hero: "--theme-hero",
  header: "--theme-header",
  section: "--theme-section",
  cta: "--theme-cta",
  accent: "--theme-accent",
  "card-border": "--theme-card-border",
  footer: "--theme-footer",
};

const defaultPalette: Record<ThemeKeys, string> = {
  hero: "#005587",
  header: "#fbf8ef",
  section: "#ffffff",
  cta: "#519cab",
  accent: "#ffc64f",
  "card-border": "#c3e7fa",
  footer: "#005587",
};

export function ThemePalette() {
  const [open, setOpen] = useState(true);
  const [active, setActive] = useState<ThemeKeys>("cta");
  const [values, setValues] = useState<Record<ThemeKeys, string>>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = window.localStorage.getItem("theme-palette");
        return saved ? { ...defaultPalette, ...(JSON.parse(saved) as Record<ThemeKeys, string>) } : defaultPalette;
      } catch {}
    }
    return defaultPalette;
  });

  useEffect(() => {
    const root = document.documentElement;
    (Object.keys(values) as ThemeKeys[]).forEach((k) => {
      root.style.setProperty(cssVarByKey[k], values[k]);
    });
    try {
      window.localStorage.setItem("theme-palette", JSON.stringify(values));
    } catch {}
  }, [values]);

  const labels: Record<ThemeKeys, string> = useMemo(
    () => ({ hero: "Hero", header: "Header", section: "Section", cta: "CTA", accent: "Accent", "card-border": "Card Border", footer: "Footer" }),
    []
  );

  return (
    <div className="fixed right-4 bottom-4 z-50">
      {open ? (
        <div className="w-72 rounded-xl border border-gray-200 bg-white shadow-xl">
          <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100">
            <div className="text-sm font-semibold">Theme Palette</div>
            <button className="text-gray-500 hover:text-gray-700" onClick={() => setOpen(false)} aria-label="Close">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="p-3 space-y-3">
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(values) as ThemeKeys[]).map((key) => (
                <button
                  key={key}
                  className={`text-xs border rounded-md px-2 py-1 text-left ${active === key ? "border-gray-900" : "border-gray-200"}`}
                  onClick={() => setActive(key)}
                >
                  <span className="block font-medium">{labels[key]}</span>
                  <span className="block text-gray-500">{values[key]}</span>
                </button>
              ))}
            </div>
            <HexColorPicker color={values[active]} onChange={(c) => setValues((v) => ({ ...v, [active]: c }))} />
            <div className="flex items-center justify-between pt-1">
              <button
                className="text-xs px-2 py-1 rounded-md border border-gray-200 hover:bg-gray-50"
                onClick={() => setValues(defaultPalette)}
              >
                Reset
              </button>
              <a
                href="https://www.canva.com/colors/color-wheel/"
                target="_blank"
                rel="noreferrer"
                className="text-xs text-blue-600 hover:underline"
              >
                Open Canva Color Wheel
              </a>
            </div>
          </div>
        </div>
      ) : (
        <button
          className="rounded-full bg-white shadow-lg border border-gray-200 w-12 h-12 flex items-center justify-center"
          onClick={() => setOpen(true)}
          aria-label="Open theme palette"
        >
          🎨
        </button>
      )}
    </div>
  );
}

export default ThemePalette;


