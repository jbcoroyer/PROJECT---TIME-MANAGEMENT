"use client";

import { useEffect, useRef } from "react";

/**
 * Halo décoratif sur toute la page : suit la souris (viewport) avec amortissement.
 * Désactivé si prefers-reduced-motion.
 */
export default function HeroMouseGlow() {
  const rootRef = useRef<HTMLDivElement>(null);
  const target = useRef({ x: 0.72, y: 0.28 });
  const current = useRef({ x: 0.72, y: 0.28 });
  const raf = useRef<number | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const apply = (x: number, y: number) => {
      root.style.setProperty("--gx", `${(x * 100).toFixed(2)}%`);
      root.style.setProperty("--gy", `${(y * 100).toFixed(2)}%`);
    };

    apply(current.current.x, current.current.y);

    if (reduceMotion) return;

    const onMove = (e: PointerEvent) => {
      const w = window.innerWidth || 1;
      const h = Math.max(window.innerHeight, 1);
      target.current.x = Math.min(1, Math.max(0, e.clientX / w));
      target.current.y = Math.min(1, Math.max(0, e.clientY / h));
    };

    const tick = () => {
      const ease = 0.08;
      current.current.x += (target.current.x - current.current.x) * ease;
      current.current.y += (target.current.y - current.current.y) * ease;
      apply(current.current.x, current.current.y);
      raf.current = requestAnimationFrame(tick);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    raf.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("pointermove", onMove);
      if (raf.current != null) cancelAnimationFrame(raf.current);
    };
  }, []);

  return (
    <div
      ref={rootRef}
      className="mkt-mouse-glow pointer-events-none"
      aria-hidden
      style={{ ["--gx" as string]: "72%", ["--gy" as string]: "28%" }}
    >
      <div className="mkt-mouse-glow__blob" />
      <div className="mkt-mouse-glow__blob mkt-mouse-glow__blob--soft" />
    </div>
  );
}
