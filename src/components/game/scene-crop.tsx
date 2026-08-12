import { sceneImage } from "@/game/scene";
import type { EvidenceCrop } from "@/game/types";

/**
 * Renders a real close-up crop of the single crime-scene photograph.
 * Every piece of evidence is a magnified region of that same image, so the
 * board never shows unrelated stock shots. Percentage background-position
 * keeps the framing stable at any container size.
 */
export function SceneCrop({
  crop,
  alt,
  className = "",
  detail = false,
}: {
  crop: EvidenceCrop;
  alt: string;
  className?: string;
  /** Adds forensic close-up treatment (grain + vignette) for large views. */
  detail?: boolean;
}) {
  return (
    <span
      role="img"
      aria-label={alt}
      className={`relative block overflow-hidden bg-black ${className}`}
    >
      <img
        src={sceneImage}
        alt=""
        aria-hidden
        className="absolute block max-w-none"
        style={{
          width: `${crop.zoom * 100}%`,
          height: "auto",
          left: "50%",
          top: "50%",
          transform: `translate(-${crop.x}%, -${crop.y}%)`,
          filter: "contrast(1.06) saturate(1.05) brightness(1.14)",
        }}
      />
      {detail && (
        <>
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.16]"
            style={{
              backgroundImage:
                "radial-gradient(rgba(255,255,255,0.5) 0.5px, transparent 0.5px)",
              backgroundSize: "3px 3px",
            }}
          />
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              boxShadow: "inset 0 0 90px 30px rgba(0,0,0,0.55)",
            }}
          />
        </>
      )}
    </span>
  );
}
