import type { SiteSetting } from "@/payload-types";

/**
 * Payload REST access for the siteSettings global (browser-side, session
 * Payload JWT). Like the catalog module, localized text is fetched with
 * locale=all and written one locale per request.
 */

export interface LocalizedValue {
  en?: string | null;
  ar?: string | null;
}

/** siteSettings under locale=all: localized text fields become {en,ar}. */
export type SiteSettingsAllLocales = Omit<SiteSetting, "tagline" | "announcement"> & {
  tagline?: string | LocalizedValue | null;
  announcement?: string | LocalizedValue | null;
};

export interface SiteSettingsChanges {
  taglineEn: string;
  taglineAr: string;
  announcementEn: string;
  announcementAr: string;
  supportEmail: string;
  supportPhone: string;
  twitter: string;
  instagram: string;
  tiktok: string;
}

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

export const payloadSettingsApi = {
  get: async (token: string): Promise<SiteSettingsAllLocales> => {
    const res = await fetch("/api/globals/siteSettings?depth=0&locale=all", {
      headers: headers(token),
      cache: "no-store",
    });
    return parseOrThrow<SiteSettingsAllLocales>(res, "Load settings");
  },

  update: async (token: string, changes: SiteSettingsChanges): Promise<void> => {
    const enRes = await fetch("/api/globals/siteSettings?locale=en&depth=0", {
      method: "POST",
      headers: headers(token),
      body: JSON.stringify({
        tagline: changes.taglineEn,
        announcement: changes.announcementEn,
        supportEmail: changes.supportEmail,
        supportPhone: changes.supportPhone,
        social: {
          twitter: changes.twitter,
          instagram: changes.instagram,
          tiktok: changes.tiktok,
        },
      }),
    });
    await parseOrThrow(enRes, "Save settings");

    const arRes = await fetch("/api/globals/siteSettings?locale=ar&depth=0", {
      method: "POST",
      headers: headers(token),
      body: JSON.stringify({
        tagline: changes.taglineAr,
        announcement: changes.announcementAr,
      }),
    });
    await parseOrThrow(arRes, "Save settings (ar)");
  },
};
