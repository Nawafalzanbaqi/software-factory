import { getSession, getAccessToken } from "@/lib/auth";
import type { ProductDto } from "@/lib/api/types";
import { wishlistApi } from "../api/wishlistApi";
import { WishlistGrid } from "./WishlistGrid";
import { WishlistEmpty } from "./WishlistEmpty";
import { SignInPrompt } from "./SignInPrompt";

/**
 * Server Component orchestrator for the wishlist page body. Enforces the session
 * gate, then fetches the user's saved products with their bearer token. Degrades
 * to an empty grid on backend failure rather than throwing.
 */
export async function WishlistView() {
  const session = await getSession();
  if (!session) return <SignInPrompt />;

  const token = await getAccessToken();

  let products: ProductDto[] = [];
  try {
    const res = token ? await wishlistApi.list(token) : [];
    products = Array.isArray(res) ? res : [];
  } catch {
    products = [];
  }

  if (products.length === 0) return <WishlistEmpty />;

  return <WishlistGrid products={products} />;
}
