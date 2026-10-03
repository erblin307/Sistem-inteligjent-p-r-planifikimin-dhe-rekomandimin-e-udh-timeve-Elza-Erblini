import { HotelMarker, MapMarker } from "@/components/travel/map-marker";

/** Lightweight map stand-in until the MapLibre integration is connected. */
function MapCanvas({ label = "Barcelona trip map" }: { label?: string }) {
  const stops = [
    { number: 1, left: "56%", top: "46%" },
    { number: 2, left: "38%", top: "26%", selected: true },
    { number: 3, left: "64%", top: "20%" },
  ];

  return (
    <div role="img" aria-label={label} className="relative min-h-80 size-full overflow-hidden bg-muted">
      <svg aria-hidden className="absolute inset-0 size-full text-border-strong">
        <defs>
          <pattern id="trip-map-grid" width="48" height="48" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <path d="M0 0H48M0 0V48" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.55" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#trip-map-grid)" />
      </svg>
      <svg aria-hidden className="absolute inset-0 size-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        <polyline
          points="44,68 56,46 38,26 64,20"
          vectorEffect="non-scaling-stroke"
          fill="none"
          stroke="var(--color-primary)"
          strokeWidth="3"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute left-[44%] top-[68%] -translate-x-1/2 -translate-y-1/2">
        <HotelMarker />
      </span>
      {stops.map((stop) => (
        <span
          key={stop.number}
          className="absolute -translate-x-1/2 -translate-y-1/2"
          style={{ left: stop.left, top: stop.top }}
        >
          <MapMarker label={stop.number} state={stop.selected ? "selected" : "default"} />
        </span>
      ))}
    </div>
  );
}

export { MapCanvas };
