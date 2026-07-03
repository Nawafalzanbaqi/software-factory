"use client";

import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";

/** Options accepted by the underlying embla hook (inferred to avoid a hard dep on the core type package). */
type EmblaOptions = Parameters<typeof useEmblaCarousel>[0];
/** The embla API instance once mounted. */
type EmblaApi = NonNullable<ReturnType<typeof useEmblaCarousel>[1]>;

/**
 * Thin, reusable wrapper around `embla-carousel-react` that exposes the reactive
 * bits the carousel leaf needs (selected index, snap points, scroll actions) while
 * keeping the component itself declarative. Handles subscribe/unsubscribe to
 * embla's `select`/`reInit` events.
 */
export function usePromoCarousel(options?: EmblaOptions) {
  const [emblaRef, emblaApi] = useEmblaCarousel(options);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);
  const scrollTo = useCallback(
    (index: number) => emblaApi?.scrollTo(index),
    [emblaApi],
  );

  const onSelect = useCallback((api: EmblaApi) => {
    setSelectedIndex(api.selectedScrollSnap());
    setCanScrollPrev(api.canScrollPrev());
    setCanScrollNext(api.canScrollNext());
  }, []);

  const onInit = useCallback((api: EmblaApi) => {
    setScrollSnaps(api.scrollSnapList());
  }, []);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on("reInit", onInit).on("reInit", onSelect).on("select", onSelect);
    // Prime snap/selection state through embla's own event system: reInit()
    // re-emits "reInit", running the handlers above with the mounted values.
    emblaApi.reInit();
    return () => {
      emblaApi.off("reInit", onInit).off("reInit", onSelect).off("select", onSelect);
    };
  }, [emblaApi, onInit, onSelect]);

  return {
    emblaRef,
    selectedIndex,
    scrollSnaps,
    canScrollPrev,
    canScrollNext,
    scrollPrev,
    scrollNext,
    scrollTo,
  };
}
