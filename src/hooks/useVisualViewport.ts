import { useEffect } from "react";

/**
 * Keeps the CSS variable --app-height in sync with the *visual* viewport
 * height (window.visualViewport.height). This shrinks when the soft keyboard
 * opens on mobile, so any element using height: var(--app-height) will
 * automatically contract – keeping headers and inputs in view.
 *
 * Mount this once inside MainLayout.
 */
export function useVisualViewport() {
  useEffect(() => {
    const update = () => {
      // visualViewport.height is the visible area above the keyboard.
      // Fall back to window.innerHeight on browsers that don't support it.
      const h = window.visualViewport?.height ?? window.innerHeight;
      document.documentElement.style.setProperty("--app-height", `${h}px`);
    };

    update(); // set immediately

    window.visualViewport?.addEventListener("resize", update);
    window.visualViewport?.addEventListener("scroll", update);

    return () => {
      window.visualViewport?.removeEventListener("resize", update);
      window.visualViewport?.removeEventListener("scroll", update);
    };
  }, []);
}
