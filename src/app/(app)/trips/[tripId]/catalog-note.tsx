/** Says when results come from development fixtures rather than real listings. */
export function CatalogNote({ sources }: { sources: string[] }) {
  if (!sources.includes("fixture")) return null;
  return (
    <p className="border-l-2 border-border-strong pl-4 type-body text-muted-foreground">
      Development catalog: names and places are real, but prices, ratings and review counts are
      sample values. The ranking itself is computed for this trip.
    </p>
  );
}
