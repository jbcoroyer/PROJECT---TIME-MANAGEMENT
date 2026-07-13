import type { AppModuleId } from "../../lib/modules";
import { MODULE_GLYPH_META, type ModuleGlyphShape } from "../../lib/modules/moduleGlyphs";
import "./module-glyphs.css";

export type ModuleGlyphSize = "sm" | "md" | "lg" | "nav";
export type ModuleGlyphVariant = AppModuleId | "ai";

type ModuleGlyphProps = {
  moduleId: ModuleGlyphVariant;
  size?: ModuleGlyphSize;
  /** Sur fond noir (nav active, carte IA). */
  onDark?: boolean;
  className?: string;
};

function GlyphShape({ shape }: { shape: ModuleGlyphShape | "star" }) {
  switch (shape) {
    case "kanban-grid":
      return (
        <div className="mg-grid4" aria-hidden>
          <span /><span /><span /><span />
        </div>
      );
    case "check-circle":
      return <span className="mg-check-circle" aria-hidden />;
    case "calendar":
      return (
        <div className="mg-cal" aria-hidden>
          <div className="mg-cal__pins">
            <span className="mg-cal__pin" />
            <span className="mg-cal__pin" />
          </div>
          <span className="mg-cal__body" />
        </div>
      );
    case "bulb":
      return (
        <div className="mg-bulb" aria-hidden>
          <span className="mg-bulb__top" />
          <span className="mg-bulb__base" />
        </div>
      );
    case "plane":
      return <span className="mg-plane" aria-hidden />;
    case "flag":
      return (
        <span className="mg-flag" aria-hidden>
          <span className="mg-flag__pole" />
          <span className="mg-flag__cloth" />
        </span>
      );
    case "megaphone":
      return <span className="mg-megaphone" aria-hidden />;
    case "image-stack":
      return (
        <div className="mg-stack" aria-hidden>
          <span className="mg-stack__back" />
          <span className="mg-stack__front" />
        </div>
      );
    case "tape-box":
      return <span className="mg-box" aria-hidden />;
    case "target":
      return (
        <span className="mg-target" aria-hidden>
          <span className="mg-target__dot" />
        </span>
      );
    case "document":
      return (
        <div className="mg-doc" aria-hidden>
          <span /><span /><span />
        </div>
      );
    case "star":
      return <span className="mg-star" aria-hidden />;
    default:
      return null;
  }
}

export default function ModuleGlyph({
  moduleId,
  size = "md",
  onDark = false,
  className = "",
}: ModuleGlyphProps) {
  const meta = moduleId === "ai" ? null : MODULE_GLYPH_META[moduleId];
  const color = moduleId === "ai" ? "ai" : meta?.color ?? "orange";
  const shape = moduleId === "ai" ? "star" : meta?.shape ?? "kanban-grid";
  const label = moduleId === "ai" ? "Assistant IA" : meta?.label ?? moduleId;

  return (
    <span
      className={[
        "module-glyph",
        `module-glyph--${size}`,
        `module-glyph--${color}`,
        onDark ? "module-glyph--on-dark" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      role="img"
      aria-label={label}
    >
      <span className="module-glyph__shape">
        <GlyphShape shape={shape} />
      </span>
    </span>
  );
}
