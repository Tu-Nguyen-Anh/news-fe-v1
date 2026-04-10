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
      const vv = window.visualViewport;
      // visualViewport.height is the visible area above the keyboard.
      // Fall back to window.innerHeight on browsers that don't support it.
      const h = vv?.height ?? window.innerHeight;
      document.documentElement.style.setProperty("--app-height", `${h}px`);

      // iOS Safari scrolls the layout viewport when an input is focused to
      // bring it into view (visualViewport.offsetTop > 0). Since #root is
      // position:fixed this visual scroll is harmless, but resetting it
      // prevents Safari from accumulating offset across multiple focus events.
      if (vv && vv.offsetTop > 0) {
        window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
      }
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
