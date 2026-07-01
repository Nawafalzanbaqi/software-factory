"use client";

import { useCallback, useState } from "react";
import {
  addToWishlistAction,
  removeFromWishlistAction,
  type WishlistActionResult,
} from "../api/wishlistActions";

/**
 * Client hook powering the heart toggle. Holds the membership state, flips it
 * optimistically on toggle, and reverts if the server action fails. Auth is
 * enforced server-side (the action returns `unauthenticated` when no session).
 *
 * TODO (backlog): sync a guest wishlist -> server wishlist on sign-in.
 */
export function useWishlist(productId: string, initialInWishlist = false) {
  const [inWishlist, setInWishlist] = useState(initialInWishlist);
  const [pending, setPending] = useState(false);

  const toggle = useCallback(async (): Promise<WishlistActionResult> => {
    const next = !inWishlist;
    setInWishlist(next); // optimistic
    setPending(true);
    const action = next ? addToWishlistAction : removeFromWishlistAction;
    const result = await action(productId);
    if (!result.ok) setInWishlist(!next); // revert on failure
    setPending(false);
    return result;
  }, [inWishlist, productId]);

  return { inWishlist, pending, toggle };
}
