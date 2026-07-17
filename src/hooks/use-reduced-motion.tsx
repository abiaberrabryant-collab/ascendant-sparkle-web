import * as React from "react";

/**
 * Returns true when the user has requested reduced motion via their OS/browser
 * (prefers-reduced-motion: reduce). SSR-safe: defaults to false until mounted.
 *
 * Use this to skip or simplify JS-driven motion (IntersectionObserver reveals,
 * parallax, autoplay). Pure-CSS animations are already neutralized globally in
 * styles.css, so this hook is only needed for scripted motion.
 */
export function useReducedMotion() {
  const [reduced, setReduced] = React.useState(false);

  React.useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReduced(mql.matches);
    onChange();
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return reduced;
}
