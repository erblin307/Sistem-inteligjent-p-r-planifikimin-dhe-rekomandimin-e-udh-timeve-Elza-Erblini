import { describe, expect, it } from "vitest";

import type { TravelImage } from "@/contracts/media";
import {
  catalogImage,
  imageCredit,
  imageCreditText,
  imageSources,
  normalizeTravelImage,
  safeImageUrl,
  selectImage,
} from "@/lib/media";
import { findImage, type ImageProvider } from "@/server/integrations/media";

const wikimediaColosseum = {
  url: "https://upload.wikimedia.org/wikipedia/commons/a/ab/Colosseum.jpg",
  alt: "Colosseum in Rome",
  width: 1200,
  height: 800,
  source: "wikimedia",
  subject: "entity",
  attribution: {
    authorName: "Jane Doe",
    authorUrl: "https://commons.wikimedia.org/wiki/User:Jane",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Colosseum.jpg",
    license: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
  },
  metadata: { placeId: "place-colosseum" },
};

const pexelsRome = {
  url: "https://images.pexels.com/photos/1/rome.jpeg?w=1200",
  thumbnailUrl: "https://images.pexels.com/photos/1/rome.jpeg?w=400",
  alt: "Rooftops of Rome at dusk",
  source: "pexels",
  subject: "context",
  attribution: { authorName: "Ana Ruiz", authorUrl: "https://www.pexels.com/@ana" },
};

describe("normalizeTravelImage", () => {
  it("keeps a valid provider image and fills the source name", () => {
    const image = normalizeTravelImage(wikimediaColosseum);
    expect(image).not.toBeNull();
    expect(image!.source).toBe("wikimedia");
    expect(image!.attribution!.sourceName).toBe("Wikimedia Commons");
    expect(image!.attribution!.license).toBe("CC BY-SA 4.0");
  });

  it("refuses an unknown source key", () => {
    expect(normalizeTravelImage({ ...pexelsRome, source: "google_images" })).toBeNull();
  });

  it("refuses stock imagery presented as a specific entity", () => {
    expect(normalizeTravelImage({ ...pexelsRome, subject: "entity" })).toBeNull();
  });

  it("refuses Wikimedia media without a licence", () => {
    const attribution = { ...wikimediaColosseum.attribution, license: undefined, licenseUrl: undefined };
    expect(normalizeTravelImage({ ...wikimediaColosseum, attribution })).toBeNull();
  });

  it.each([
    ["http (not https)", "http://images.pexels.com/photos/1/rome.jpeg"],
    ["another host", "https://example-travel-blog.com/rome.jpg"],
    ["a lookalike host", "https://images.pexels.com.evil.example/rome.jpg"],
    ["credentials", "https://user:pw@images.pexels.com/rome.jpg"],
    ["javascript:", "javascript:alert(1)"],
    ["data:", "data:image/png;base64,AAAA"],
    ["protocol-relative", "//images.pexels.com/rome.jpg"],
    ["malformed", "https://"],
  ])("refuses %s URLs", (_, url) => {
    expect(normalizeTravelImage({ ...pexelsRome, url })).toBeNull();
  });

  it("drops an invalid thumbnail but keeps the image", () => {
    const image = normalizeTravelImage({ ...pexelsRome, thumbnailUrl: "https://elsewhere.example/t.jpg" });
    expect(image!.thumbnailUrl).toBeUndefined();
  });

  it.each(["image", "photo 3", "IMG_2041.jpg", "DSC0001"])("refuses meaningless alt text %j", (alt) => {
    expect(normalizeTravelImage({ ...pexelsRome, alt })).toBeNull();
  });

  it("allows empty alt for decorative images", () => {
    expect(normalizeTravelImage({ ...pexelsRome, alt: "" })).not.toBeNull();
  });

  it("drops unsafe attribution links but keeps the credit text", () => {
    const image = normalizeTravelImage({
      ...pexelsRome,
      attribution: { authorName: "Ana Ruiz", authorUrl: "javascript:alert(1)" },
    });
    expect(image!.attribution!.authorName).toBe("Ana Ruiz");
    expect(image!.attribution!.authorUrl).toBeUndefined();
  });

  it("drops a lone width or height", () => {
    const image = normalizeTravelImage({ ...pexelsRome, width: 1200 });
    expect(image!.width).toBeUndefined();
  });
});

describe("safeImageUrl", () => {
  it("accepts same-origin paths only for sources served through the app", () => {
    expect(safeImageUrl("/media/rome.jpg", imageSources.local)).toBe("/media/rome.jpg");
    expect(safeImageUrl("/media/rome.jpg", imageSources.pexels)).toBeNull();
  });

  it("matches subdomains only for dotted hosts", () => {
    expect(safeImageUrl("https://lh3.googleusercontent.com/p/x", imageSources.google_places)).not.toBeNull();
    expect(safeImageUrl("https://googleusercontent.com/p/x", imageSources.google_places)).toBeNull();
  });
});

describe("catalogImage", () => {
  it("reads app-served files as local images", () => {
    expect(catalogImage("/media/sagrada.jpg", { alt: "Sagrada Família", subject: "entity" })).toMatchObject({
      source: "local",
      url: "/media/sagrada.jpg",
    });
  });

  it("ignores external URLs: their source and licence are unknown", () => {
    expect(catalogImage("https://images.unsplash.com/x.jpg", { alt: "Hotel", subject: "entity" })).toBeNull();
    expect(catalogImage(null, { alt: "Hotel", subject: "entity" })).toBeNull();
  });
});

describe("selectImage", () => {
  const colosseum = normalizeTravelImage(wikimediaColosseum)!;
  const rome = normalizeTravelImage(pexelsRome)!;
  const googleColosseum = normalizeTravelImage({
    url: "https://lh3.googleusercontent.com/places/colosseum",
    alt: "Colosseum in Rome",
    source: "google_places",
    subject: "entity",
    attribution: { authorName: "A Visitor" },
    metadata: { placeId: "place-colosseum" },
  })!;

  it("follows the place hierarchy: Google Places before Wikimedia", () => {
    expect(selectImage([colosseum, googleColosseum], "place")).toBe(googleColosseum);
  });

  it("never fills a named place with destination stock imagery", () => {
    expect(selectImage([rome], "place")).toBeNull();
    expect(selectImage([rome], "accommodation")).toBeNull();
  });

  it("rejects a provider photo that belongs to another entity", () => {
    expect(selectImage([colosseum], "place", { placeId: "place-pantheon" })).toBeNull();
    expect(selectImage([colosseum], "place", { placeId: "place-colosseum" })).toBe(colosseum);
  });

  it("uses context imagery for destinations, not entity photos", () => {
    expect(selectImage([colosseum, rome], "destination")).toBe(rome);
  });
});

describe("imageCredit", () => {
  it("credits Pexels photographers in Pexels wording", () => {
    const credit = imageCredit(normalizeTravelImage(pexelsRome)!)!;
    expect(imageCreditText(credit)).toBe("Photo by Ana Ruiz on Pexels");
    expect(credit.parts[1]).toEqual({ text: "Ana Ruiz", href: "https://www.pexels.com/@ana" });
  });

  it("keeps the full Wikimedia licence", () => {
    const credit = imageCredit(normalizeTravelImage(wikimediaColosseum)!)!;
    expect(imageCreditText(credit)).toBe("Photo: Jane Doe / Wikimedia Commons · CC BY-SA 4.0");
    expect(credit.license!.href).toBe("https://creativecommons.org/licenses/by-sa/4.0/");
  });

  it("names the source when the author is unknown", () => {
    const image: TravelImage = { url: "/p", alt: "Lobby", source: "booking", subject: "entity", attribution: { sourceName: "Booking.com" } };
    expect(imageCreditText(imageCredit(image)!)).toBe("Photo: Booking.com");
  });

  it("needs no credit for the team's own files", () => {
    expect(imageCredit(catalogImage("/media/a.jpg", { alt: "A", subject: "context" })!)).toBeNull();
  });
});

describe("findImage", () => {
  const provider = (source: ImageProvider["source"], results: unknown[] | Error, configured = true): ImageProvider => ({
    source,
    isConfigured: () => configured,
    findImages: async () => {
      if (results instanceof Error) throw results;
      return results;
    },
  });

  it("returns null when no provider is integrated", async () => {
    expect(await findImage({ slot: "place", name: "Colosseum" })).toBeNull();
  });

  it("skips unconfigured and failing providers and falls through the hierarchy", async () => {
    const registry = [
      provider("google_places", new Error("quota")),
      provider("wikimedia", [{ ...wikimediaColosseum, url: "https://bad.example/x.jpg" }, wikimediaColosseum]),
    ];
    const image = await findImage({ slot: "place", name: "Colosseum", placeId: "place-colosseum" }, { registry });
    expect(image?.source).toBe("wikimedia");
  });

  it("never asks stock providers for a hotel", async () => {
    const registry = [provider("pexels", [{ ...pexelsRome, subject: "entity" }])];
    expect(await findImage({ slot: "accommodation", name: "Hotel Artemide" }, { registry })).toBeNull();
  });
});
