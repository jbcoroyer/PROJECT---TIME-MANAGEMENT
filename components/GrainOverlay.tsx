/** Texture grain papier — overlay fixe sur toutes les pages (§1.3 Atelier). */
export default function GrainOverlay({ variant = "light" }: { variant?: "light" | "dark" }) {
  const isDark = variant === "dark";
  return (
    <div
      aria-hidden
      className={[
        "grain pointer-events-none fixed inset-0 z-[1]",
        isDark ? "grain--dark" : "grain--light",
      ].join(" ")}
    />
  );
}
