import path from "path";
import { fileURLToPath } from "url";

import { buildConfig } from "payload";
import { postgresAdapter } from "@payloadcms/db-postgres";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import sharp from "sharp";

import { Users } from "./payload/collections/Users";
import { Media } from "./payload/collections/Media";
import { Categories } from "./payload/collections/Categories";
import { Products } from "./payload/collections/Products";
import { Reviews } from "./payload/collections/Reviews";
import { PromoBanners } from "./payload/collections/PromoBanners";
import { Faq } from "./payload/collections/Faq";
// Restaurant vertical collections (registered for all boots; only exercised when
// siteType==="restaurant"). See docs/PHASE2.md.
import { MenuCategory } from "./payload/collections/MenuCategory";
import { MenuItem } from "./payload/collections/MenuItem";
import { Branch } from "./payload/collections/Branch";
import { RestaurantTable } from "./payload/collections/RestaurantTable";
import { Reservation } from "./payload/collections/Reservation";
import { Gallery } from "./payload/collections/Gallery";
import { Promotions } from "./payload/collections/Promotions";
import { Hero } from "./payload/globals/Hero";
import { About } from "./payload/globals/About";
import { Contact } from "./payload/globals/Contact";
import { Footer } from "./payload/globals/Footer";
// Client dashboard (Phase 4): client-managed settings global.
import { SiteSettings } from "./payload/globals/SiteSettings";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

/**
 * Payload CMS 3 config — runs natively inside the Next.js App Router.
 *
 * - db: Postgres (Npgsql-compatible) via DATABASE_URI (shares the stack DB).
 * - editor: Lexical.
 * - localization: en/ar so all editorial copy is bilingual (Payload handles the
 *   per-locale storage; lib/cms fetchers read locale "all" to fill LocalizedText).
 *
 * TODO (backlog): multi-tenant / white-label — introduce a Tenants collection and
 * scope collection access + admin visibility per tenant (see docs/ARCHITECTURE §6).
 */
export default buildConfig({
  admin: {
    user: Users.slug,
    // Where `payload generate:importmap` resolves custom-component paths from.
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || "",
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI || "",
    },
  }),
  collections: [
    Users,
    Media,
    Categories,
    Products,
    Reviews,
    PromoBanners,
    Faq,
    // Restaurant vertical
    MenuCategory,
    MenuItem,
    Branch,
    RestaurantTable,
    Reservation,
    Gallery,
    Promotions,
  ],
  globals: [Hero, About, Contact, Footer, SiteSettings],
  localization: {
    locales: ["en", "ar"],
    defaultLocale: "en",
  },
  sharp,
  typescript: {
    outputFile: path.resolve(dirname, "payload-types.ts"),
  },
});
