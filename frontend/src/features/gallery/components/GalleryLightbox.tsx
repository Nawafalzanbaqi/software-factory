"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import type { GalleryImageView } from "../types";
import { useLightbox } from "../hooks/useLightbox";

/**
 * Full-gallery grid + accessible Lightbox (the ONLY "use client" leaf in this
 * feature). Thumbnails are buttons that open a modal dialog rendering the full
 * image. Accessibility:
 *  - role="dialog" aria-modal="true" with an accessible name,
 *  - focus is trapped inside the dialog and moved to the close button on open,
 *  - Esc closes, ArrowRight/ArrowLeft navigate, focus returns to the thumbnail,
 *  - background scroll is locked while open.
 *
 * Images arrive pre-localized/flattened from the server (GalleryImageView), so no
 * server-only CMS code crosses the client boundary.
 */
export function GalleryLightbox({ images }: { images: GalleryImageView[] }) {
  const t = useTranslations("gallery");
  const { index, isOpen, open, close, next, prev } = useLightbox(images.length);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const dialog = dialogRef.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
        return;
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        next();
        return;
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        prev();
        return;
      }
      if (event.key === "Tab" && dialog) {
        const focusable = dialog.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (!first || !last) return;
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, close, next, prev]);

  const active = index !== null ? images[index] : null;

  return (
    <>
      <ul
        className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-4"
        role="list"
      >
        {images.map((image, i) => (
          <li key={image.key}>
            <button
              type="button"
              onClick={(event) => open(i, event.currentTarget)}
              aria-haspopup="dialog"
              aria-label={t("openImage", { alt: image.alt })}
              className="group relative block aspect-square w-full overflow-hidden rounded-lg border bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <Image
                src={image.url}
                alt={image.alt}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
              />
            </button>
          </li>
        ))}
      </ul>

      {isOpen && active && (
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-label={t("lightboxLabel")}
          className="fixed inset-0 z-50 flex flex-col bg-black/90 p-4 backdrop-blur-sm"
        >
          <div className="flex items-center justify-between text-white">
            <p className="text-sm" aria-live="polite">
              {t("counter", { current: (index ?? 0) + 1, total: images.length })}
            </p>
            <button
              ref={closeRef}
              type="button"
              onClick={close}
              aria-label={t("close")}
              className="rounded-full p-2 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <X className="size-6" aria-hidden="true" />
            </button>
          </div>

          <div className="relative flex min-h-0 flex-1 items-center justify-center gap-2 sm:gap-4">
            {images.length > 1 && (
              <button
                type="button"
                onClick={prev}
                aria-label={t("previous")}
                className="shrink-0 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <ChevronLeft className="size-6 rtl:rotate-180" aria-hidden="true" />
              </button>
            )}

            <div className="relative h-full min-h-0 w-full flex-1">
              <Image
                key={active.key}
                src={active.url}
                alt={active.alt}
                fill
                sizes="100vw"
                className="object-contain"
                priority
              />
            </div>

            {images.length > 1 && (
              <button
                type="button"
                onClick={next}
                aria-label={t("next")}
                className="shrink-0 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <ChevronRight className="size-6 rtl:rotate-180" aria-hidden="true" />
              </button>
            )}
          </div>

          <p className="mt-2 text-center text-sm text-white/80">{active.alt}</p>
        </div>
      )}
    </>
  );
}
