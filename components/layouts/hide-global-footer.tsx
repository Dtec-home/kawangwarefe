/**
 * HideGlobalFooter — sets `data-no-chrome` on <body> so that the global
 * footer (rendered in root layout) and the bottom-nav bar are hidden via CSS.
 *
 * Drop this into any route's layout to get a clean, chromeless page without
 * having to restructure the root layout or move the footer.
 */

"use client";

import { useEffect } from "react";

export function HideGlobalFooter() {
  useEffect(() => {
    document.body.setAttribute("data-no-chrome", "");
    return () => {
      document.body.removeAttribute("data-no-chrome");
    };
  }, []);

  return null;
}
