"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Headless open/navigation state for the gallery lightbox. Owns the active image
 * index and next/prev wrap-around, and restores focus to the triggering thumbnail
 * when the modal closes (accessibility: focus must return to where it left).
 *
 * Keyboard handling, the focus trap and body-scroll lock live in the component
 * (they need the dialog DOM node); this hook stays DOM-light and testable.
 */
export function useLightbox(count: number) {
  const [index, setIndex] = useState<number | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const isOpen = index !== null;

  const open = useCallback((i: number, trigger?: HTMLElement | null) => {
    triggerRef.current =
      trigger ?? (document.activeElement as HTMLElement | null);
    setIndex(i);
  }, []);

  const close = useCallback(() => setIndex(null), []);

  const next = useCallback(
    () => setIndex((i) => (i === null ? i : (i + 1) % count)),
    [count],
  );

  const prev = useCallback(
    () => setIndex((i) => (i === null ? i : (i - 1 + count) % count)),
    [count],
  );

  // Restore focus to the trigger element after the modal unmounts.
  useEffect(() => {
    if (!isOpen && triggerRef.current) {
      triggerRef.current.focus();
      triggerRef.current = null;
    }
  }, [isOpen]);

  return { index, isOpen, open, close, next, prev };
}
