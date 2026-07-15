/** Marque Atelier — cercle encre + étoile orange (identique SSR / client). */
export function AtelierMark({
  className = "h-9 w-9",
  starOnDark = false,
  spin = true,
}: {
  className?: string;
  /** Étoile claire sur fond encre (panneau auth). */
  starOnDark?: boolean;
  spin?: boolean;
}) {
  return (
    <span
      className={[
        "flex shrink-0 items-center justify-center rounded-full",
        starOnDark ? "bg-[var(--background)]" : "bg-[var(--ink)]",
        className,
      ].join(" ")}
    >
      <span
        className={[
          "atelier-star h-[42%] w-[42%]",
          starOnDark ? "bg-[var(--accent)]" : "",
          spin ? "atelier-star--spin" : "",
        ]
          .filter(Boolean)
          .join(" ")}
        aria-hidden
      />
    </span>
  );
}
