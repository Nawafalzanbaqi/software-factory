"use server";

import { getAccessToken } from "@/lib/auth";
import { wishlistApi } from "./wishlistApi";

/**
 * Server Actions for the interactive wishlist toggle. They run on the server so
 * the backend bearer token never reaches the client bundle: the token is read
 * from the session and forwarded to the authed REST endpoints.
 *
 * The client `WishlistButton` calls these (optimistically); an `unauthenticated`
 * result lets the button prompt the visitor to sign in.
 */
export type WishlistActionResult =
  | { ok: true }
  | { ok: false; reason: "unauthenticated" | "error" };

export async function addToWishlistAction(
  productId: string,
): Promise<WishlistActionResult> {
  const token = await getAccessToken();
  if (!token) return { ok: false, reason: "unauthenticated" };
  try {
    await wishlistApi.add(productId, token);
    // TODO (backlog): fire analytics `add_to_wishlist` + loyalty hooks here.
    return { ok: true };
  } catch {
    return { ok: false, reason: "error" };
  }
}

export async function removeFromWishlistAction(
  productId: string,
): Promise<WishlistActionResult> {
  const token = await getAccessToken();
  if (!token) return { ok: false, reason: "unauthenticated" };
  try {
    await wishlistApi.remove(productId, token);
    // TODO (backlog): fire analytics `remove_from_wishlist` event here.
    return { ok: true };
  } catch {
    return { ok: false, reason: "error" };
  }
}
