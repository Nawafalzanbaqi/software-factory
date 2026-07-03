import type { CatalogCollectionSlug, CatalogDoc, CatalogListResponse } from "../types";

/**
 * Payload REST access for catalog management — runs in the BROWSER (the
 * dashboard catalog table is an interactive client module) against the
 * embedded Payload API (/api/{collection}), authenticated with the session's
 * Payload JWT (`Authorization: JWT <token>`). Same-origin, so relative URLs.
 */

function headers(token: string): HeadersInit {
  return {
    Accept: "application/json",
    "Content-Type": "application/json",
    Authorization: `JWT ${token}`,
  };
}

async function parseOrThrow<T>(res: Response, context: string): Promise<T> {
  if (!res.ok) {
    throw new Error(`${context} failed with ${res.status}`);
  }
  return (await res.json()) as T;
}

export const payloadCatalogApi = {
  /** One page of catalog docs with every locale (locale=all) for editing. */
  list: async (
    collection: CatalogCollectionSlug,
    token: string,
    page = 1,
    limit = 20,
  ): Promise<CatalogListResponse> => {
    const res = await fetch(
      `/api/${collection}?depth=0&locale=all&limit=${limit}&page=${page}&sort=slug`,
      { headers: headers(token), cache: "no-store" },
    );
    return parseOrThrow<CatalogListResponse>(res, `List ${collection}`);
  },

  /**
   * Update one doc. Payload writes one locale per request, so the en pass
   * carries the shared fields (price/availability) and the ar pass only the
   * localized ones.
   */
  update: async (
    collection: CatalogCollectionSlug,
    id: string | number,
    token: string,
    changes: {
      nameEn: string;
      nameAr: string;
      price?: number;
      availabilityField: "inStock" | "isAvailable";
      available: boolean;
    },
  ): Promise<CatalogDoc> => {
    const enRes = await fetch(`/api/${collection}/${id}?locale=en&depth=0`, {
      method: "PATCH",
      headers: headers(token),
      body: JSON.stringify({
        name: changes.nameEn,
        ...(changes.price !== undefined ? { price: changes.price } : {}),
        [changes.availabilityField]: changes.available,
      }),
    });
    const enBody = await parseOrThrow<{ doc?: CatalogDoc } | CatalogDoc>(
      enRes,
      `Update ${collection}`,
    );

    const arRes = await fetch(`/api/${collection}/${id}?locale=ar&depth=0`, {
      method: "PATCH",
      headers: headers(token),
      body: JSON.stringify({ name: changes.nameAr }),
    });
    await parseOrThrow(arRes, `Update ${collection} (ar)`);

    return (enBody as { doc?: CatalogDoc }).doc ?? (enBody as CatalogDoc);
  },
};
