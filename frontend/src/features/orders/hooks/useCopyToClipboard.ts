"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Small clipboard hook for the copy-order-number leaf. Returns a `copied` flag
 * that auto-resets, so the button can flip its icon/label without a toast.
 * Degrades quietly when the Clipboard API is unavailable (older/insecure ctx).
 */
export function useCopyToClipboard(resetMs = 2000) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const copy = useCallback(
    async (value: string) => {
      try {
        await navigator.clipboard.writeText(value);
        setCopied(true);
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => setCopied(false), resetMs);
        return true;
      } catch {
        return false;
      }
    },
    [resetMs],
  );

  return { copied, copy };
}
