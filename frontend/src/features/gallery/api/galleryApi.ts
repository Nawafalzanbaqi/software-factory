import "server-only";
import { getGallery } from "@/lib/cms";
import type { GalleryContent } from "../types";

/**
 * Gallery data access. This feature is CMS-driven (PHASE2.md §4: Gallery = CMS),
 * so there is no backend API client call — content comes from the Payload-backed
 * `lib/cms` fetcher. Kept as a thin, named module so the feature mirrors the
 * `promoBannersApi` pattern and swapping the source stays a one-file change.
 *
 * `getGallery()` defaults to locale "all" (bilingual LocalizedText); components
 * flatten to the active locale via `toGalleryImageViews`.
 */
export const galleryApi = {
  list: (): Promise<GalleryContent[]> => getGallery(),
};
