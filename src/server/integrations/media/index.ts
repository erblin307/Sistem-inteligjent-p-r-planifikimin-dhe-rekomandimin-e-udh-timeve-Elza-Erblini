import "server-only";

import type { TravelImage, TravelImageSource } from "@/contracts/media";
import { normalizeTravelImage, selectImage, slotSources } from "@/lib/media";

/**
 * The port every image provider adapter implements, and the one place pages
 * and services ask for photos. Components never call a provider.
 *
 *   provider API → adapter (this folder) → normalizeTravelImage → TravelImage → ImageFrame
 *
 * No adapter is registered yet: live integration needs API credentials and
 * a review of each provider's display and caching terms. Until then
 * `findImage` returns null and the UI shows its neutral fallback.
 * Planned adapters and their boundaries: docs/MEDIA.md §4.
 */

/** What to find a photo of. Entity queries carry the provider id when known. */
export type ImageQuery =
  | { slot: "accommodation"; name: string; propertyId?: string }
  | { slot: "place"; name: string; placeId?: string; latitude?: number; longitude?: number }
  | { slot: "destination"; name: string; countryCode: string }
  | { slot: "transport"; mode: "air" | "rail" | "bus" | "road" };

export interface ImageProvider {
  readonly source: TravelImageSource;
  /** False when the server has no credentials for this provider. */
  isConfigured(): boolean;
  /**
   * Returns raw candidates; they are normalised and filtered here, so an
   * adapter cannot put an unchecked URL in front of the user. Throws on
   * provider failure; the caller falls back.
   */
  findImages(query: ImageQuery, signal?: AbortSignal): Promise<unknown[]>;
}

/** Live adapters. Each later provider phase adds exactly one entry. */
const providers: readonly ImageProvider[] = [];

/**
 * The best photo for a query, or null. Asks only the providers the slot
 * accepts, in the slot's preference order, and stops at the first usable
 * image. A failing provider is skipped, never retried in a loop.
 */
export async function findImage(
  query: ImageQuery,
  { signal, registry = providers }: { signal?: AbortSignal; registry?: readonly ImageProvider[] } = {},
): Promise<TravelImage | null> {
  const entity = entityIds(query);
  for (const source of slotSources[query.slot].sources) {
    const provider = registry.find((p) => p.source === source && p.isConfigured());
    if (!provider) continue;
    let raw: unknown[];
    try {
      raw = await provider.findImages(query, signal);
    } catch {
      continue;
    }
    const image = selectImage(raw.map(normalizeTravelImage), query.slot, entity);
    if (image) return image;
  }
  return null;
}

function entityIds(query: ImageQuery) {
  if (query.slot === "accommodation" && query.propertyId) return { propertyId: query.propertyId };
  if (query.slot === "place" && query.placeId) return { placeId: query.placeId };
  return undefined;
}
