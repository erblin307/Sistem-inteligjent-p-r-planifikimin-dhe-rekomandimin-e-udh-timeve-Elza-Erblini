/**
 * Travel media: normalisation, source policy, selection and credits.
 * Pure and client-safe. Architecture and rules: docs/MEDIA.md.
 */
export { type CreditPart, type ImageCredit, imageCredit, imageCreditText } from "./attribution";
export { catalogImage, normalizeTravelImage, safeImageUrl, safeLinkUrl } from "./normalize";
export { selectImage } from "./select";
export { type ImageSlot, type ImageSourcePolicy, imageSources, slotSources } from "./sources";
