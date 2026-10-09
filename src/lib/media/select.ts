import type { TravelImage } from "@/contracts/media";
import { type ImageSlot, slotSources } from "./sources";

/**
 * Picks the image to show in a slot, following the source hierarchy in
 * `slotSources` (e.g. a place: Google Places, then Wikimedia, then nothing).
 * Returns null when no candidate may stand for the slot; the component then
 * shows the neutral fallback.
 *
 * For a specific hotel or place, pass its provider ids: a provider photo
 * whose id belongs to another entity is rejected.
 */
export function selectImage(
  candidates: readonly (TravelImage | null | undefined)[],
  slot: ImageSlot,
  entity?: { placeId?: string; propertyId?: string },
): TravelImage | null {
  const { subject, sources } = slotSources[slot];
  let best: TravelImage | null = null;
  let bestRank = Infinity;

  for (const image of candidates) {
    if (!image || image.subject !== subject) continue;
    const rank = sources.indexOf(image.source);
    if (rank === -1 || rank >= bestRank) continue;
    if (!belongsTo(image, entity)) continue;
    best = image;
    bestRank = rank;
  }
  return best;
}

function belongsTo(image: TravelImage, entity: { placeId?: string; propertyId?: string } | undefined) {
  if (!entity || image.source === "local") return true;
  if (entity.placeId && image.metadata?.placeId !== entity.placeId) return false;
  if (entity.propertyId && image.metadata?.propertyId !== entity.propertyId) return false;
  return true;
}
