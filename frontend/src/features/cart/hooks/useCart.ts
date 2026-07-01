"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useMemo } from "react";
import type { CartLine, CartState } from "../types";

/**
 * Client cart store (Zustand + localStorage persistence). Phase 1 keeps the cart
 * client-side for instant UX; the backend cart endpoints (see cart/api/cartApi.ts)
 * can be layered in for server-synced carts.
 * TODO (backlog): sync guest cart -> server cart on sign-in.
 */
const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      add: (product, quantity = 1) =>
        set((state) => {
          const existing = state.lines.find((l) => l.productId === product.id);
          if (existing) {
            return {
              lines: state.lines.map((l) =>
                l.productId === product.id
                  ? { ...l, quantity: l.quantity + quantity }
                  : l,
              ),
            };
          }
          const line: CartLine = {
            productId: product.id,
            slug: product.slug,
            nameEn: product.nameEn,
            nameAr: product.nameAr,
            price: product.price,
            currency: product.currency,
            imageUrl: product.imageUrl,
            quantity,
          };
          return { lines: [...state.lines, line] };
        }),
      remove: (productId) =>
        set((state) => ({
          lines: state.lines.filter((l) => l.productId !== productId),
        })),
      setQuantity: (productId, quantity) =>
        set((state) => ({
          lines:
            quantity <= 0
              ? state.lines.filter((l) => l.productId !== productId)
              : state.lines.map((l) =>
                  l.productId === productId ? { ...l, quantity } : l,
                ),
        })),
      clear: () => set({ lines: [] }),
    }),
    { name: "sf-cart" },
  ),
);

/** Primary cart hook — actions + derived totals. */
export function useCart() {
  const lines = useCartStore((s) => s.lines);
  const add = useCartStore((s) => s.add);
  const remove = useCartStore((s) => s.remove);
  const setQuantity = useCartStore((s) => s.setQuantity);
  const clear = useCartStore((s) => s.clear);

  const { count, subtotal, currency } = useMemo(() => {
    const count = lines.reduce((sum, l) => sum + l.quantity, 0);
    const subtotal = lines.reduce((sum, l) => sum + l.price * l.quantity, 0);
    const currency = lines[0]?.currency ?? "SAR";
    return { count, subtotal, currency };
  }, [lines]);

  return { lines, add, remove, setQuantity, clear, count, subtotal, currency };
}

/** Lightweight selector for the header badge (avoids re-rendering on totals). */
export function useCartCount() {
  return useCartStore((s) => s.lines.reduce((sum, l) => sum + l.quantity, 0));
}
