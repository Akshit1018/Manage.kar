"use client";

import { useEffect } from "react";
import { keyboardOverlap } from "@/lib/ui/visual-viewport";

let insetListeners = 0;

function applyKeyboardInset() {
  if (typeof window === "undefined") return;
  const visual = window.visualViewport;
  const overlap = keyboardOverlap(
    window.innerHeight,
    visual?.height ?? window.innerHeight,
    visual?.offsetTop ?? 0,
  );
  document.documentElement.style.setProperty("--mk-keyboard", `${overlap}px`);
}

export function useVisualViewportInset(active: boolean) {
  useEffect(() => {
    if (!active || typeof window === "undefined") return;

    insetListeners += 1;
    applyKeyboardInset();
    window.visualViewport?.addEventListener("resize", applyKeyboardInset);
    window.visualViewport?.addEventListener("scroll", applyKeyboardInset);
    window.addEventListener("resize", applyKeyboardInset);

    return () => {
      window.visualViewport?.removeEventListener("resize", applyKeyboardInset);
      window.visualViewport?.removeEventListener("scroll", applyKeyboardInset);
      window.removeEventListener("resize", applyKeyboardInset);
      insetListeners -= 1;
      if (insetListeners === 0) {
        document.documentElement.style.removeProperty("--mk-keyboard");
      }
    };
  }, [active]);
}
