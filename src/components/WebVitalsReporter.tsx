import { useEffect } from "react";
import { useRouterState } from "@tanstack/react-router";

type Metric = {
  name: "LCP" | "INP" | "CLS" | "TTFB" | "FCP";
  value: number;
  rating?: "good" | "needs-improvement" | "poor";
  navigationType?: string;
};

const buffer: Array<{
  route: string;
  metric: Metric["name"];
  value: number;
  rating?: Metric["rating"];
  navigation_type?: string;
}> = [];

let flushScheduled = false;
function schedule() {
  if (flushScheduled) return;
  flushScheduled = true;
  setTimeout(flush, 2000);
}

function flush() {
  flushScheduled = false;
  if (buffer.length === 0) return;
  const payload = { metrics: buffer.splice(0, buffer.length) };
  const body = JSON.stringify(payload);
  try {
    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: "application/json" });
      navigator.sendBeacon("/api/public/perf", blob);
      return;
    }
  } catch {}
  fetch("/api/public/perf", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => {});
}

/**
 * Client-only Web Vitals reporter. Renders nothing; sends CLS/INP/LCP/TTFB/FCP
 * to /api/public/perf, batched via sendBeacon.
 */
export function WebVitalsReporter() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { onCLS, onINP, onLCP, onTTFB, onFCP } = await import("web-vitals");
        const report = (name: Metric["name"]) => (m: any) => {
          if (cancelled) return;
          buffer.push({
            route: pathname,
            metric: name,
            value: m.value,
            rating: m.rating,
            navigation_type: m.navigationType,
          });
          schedule();
        };
        onCLS(report("CLS"));
        onINP(report("INP"));
        onLCP(report("LCP"));
        onTTFB(report("TTFB"));
        onFCP(report("FCP"));
      } catch {}
    })();

    const onHide = () => flush();
    window.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", onHide);
    return () => {
      cancelled = true;
      window.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", onHide);
    };
    // pathname is intentionally captured only once at mount; web-vitals fires later.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
