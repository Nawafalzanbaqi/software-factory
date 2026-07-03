import { readFileSync } from "fs";
import path from "path";
import type { Payload } from "payload";

/**
 * Guarded seed. Inserts sample content ONLY for sections enabled in the root
 * options.json (and only when features.cms is on). Idempotent: it no-ops when data
 * already exists. Run it after DB migration, e.g. from a `payload run` script:
 *
 *   import { getPayload } from "payload";
 *   import config from "@payload-config";
 *   import { seed } from "@/payload/seed";
 *   const payload = await getPayload({ config });
 *   await seed(payload);
 */

interface SeedOptions {
  siteType?: string;
  features?: Record<string, boolean>;
  sections?: Record<string, { enabled?: boolean; order?: number }>;
}

function loadOptions(): { options: SeedOptions; source: string | null } {
  const candidates = [
    path.resolve(process.cwd(), "..", "options.json"),
    path.resolve(process.cwd(), "options.json"),
    process.env.OPTIONS_MANIFEST_PATH ?? "",
  ].filter(Boolean);
  for (const candidate of candidates) {
    try {
      return {
        options: JSON.parse(readFileSync(candidate, "utf-8")) as SeedOptions,
        source: candidate,
      };
    } catch {
      // try next
    }
  }
  return { options: {}, source: null };
}

/**
 * Account passwords are NEVER defaulted (security audit fix #2): a repo-known
 * credential must not exist in any environment. When the env var is unset the
 * account is skipped with a loud log (error-level in production) telling the
 * operator to set it and re-run the seed — fail closed, nothing to reset later.
 */
function seedPassword(payload: Payload, envVar: string, account: string): string | undefined {
  const value = process.env[envVar];
  if (value) return value;
  const message =
    `[seed] ${envVar} is not set — SKIPPING the ${account} account. ` +
    `Set ${envVar} and re-run \`npm run payload:seed\` to create it.`;
  if (process.env.NODE_ENV === "production") payload.logger.error(message);
  else payload.logger.warn(message);
  return undefined;
}

export async function seed(payload: Payload): Promise<void> {
  const { options, source } = loadOptions();
  // Unconditional first line: a seed run must never be silent about WHICH
  // manifest drove it (or that none was readable) — a skipped-everything run
  // and a never-ran run were previously indistinguishable in CI logs.
  if (source) {
    payload.logger.info(`[seed] manifest: ${source}`);
  } else {
    payload.logger.error(
      "[seed] NO readable options manifest (tried ../options.json, ./options.json, " +
        "OPTIONS_MANIFEST_PATH) — nothing will be seeded",
    );
  }
  const sectionOn = (key: string) => options.sections?.[key]?.enabled === true;
  const featureOn = (key: string) => options.features?.[key] === true;

  if (!featureOn("cms")) {
    payload.logger.info("[seed] features.cms disabled — skipping CMS content seed");
    return;
  }

  // --- Admin user (so /admin is usable out of the box) -----------------------
  // Gate on "no ADMIN exists", not "collection empty": a run that skipped the
  // admin (env unset) but created the owner must still honor the logged
  // "set PAYLOAD_ADMIN_PASSWORD and re-run" recovery on the next run.
  const existingAdmin = await payload.find({
    collection: "users",
    where: { role: { equals: "admin" } },
    limit: 1,
  });
  if (existingAdmin.totalDocs === 0) {
    const adminPassword = seedPassword(payload, "PAYLOAD_ADMIN_PASSWORD", "factory admin");
    if (adminPassword) {
      const email = process.env.PAYLOAD_ADMIN_EMAIL ?? "admin@softwarefactory.local";
      await payload.create({
        collection: "users",
        data: { email, password: adminPassword, name: "Store Admin", role: "admin" },
      });
      payload.logger.info(`[seed] created admin user ${email}`);
    }
  }

  // --- Dashboard owner (Phase 4, features.clientDashboard) -------------------
  // The client's owner account for /dashboard. Gated by the flag: a build
  // without the dashboard gets no owner user seeded.
  if (featureOn("clientDashboard")) {
    const ownerEmail = process.env.DASHBOARD_OWNER_EMAIL ?? "owner@softwarefactory.local";
    const existingOwner = await payload.find({
      collection: "users",
      where: { email: { equals: ownerEmail } },
      limit: 1,
    });
    if (existingOwner.totalDocs === 0) {
      const ownerPassword = seedPassword(payload, "DASHBOARD_OWNER_PASSWORD", "dashboard owner");
      if (ownerPassword) {
        await payload.create({
          collection: "users",
          data: {
            email: ownerEmail,
            password: ownerPassword,
            name: "Store Owner",
            role: "owner",
          },
        });
        payload.logger.info(`[seed] created dashboard owner ${ownerEmail}`);
      }
    }
  }

  // --- Restaurant vertical ---------------------------------------------------
  // When the active options select the restaurant vertical, seed restaurant
  // sample content (reusing the shared Hero/About/Contact/Footer globals with
  // restaurant copy) and skip the ecommerce catalog seed entirely.
  if (options.siteType === "restaurant") {
    await seedRestaurant(payload, sectionOn);
    payload.logger.info("[seed] restaurant seed done");
    return;
  }

  // --- Hero global -----------------------------------------------------------
  if (sectionOn("hero")) {
    await payload.updateGlobal({
      slug: "hero",
      locale: "en",
      data: {
        eyebrow: "Software Factory Store",
        title: "Premium products, built to last",
        subtitle: "Discover a curated catalog with fast, secure checkout.",
        ctaPrimaryLabel: "Shop now",
        ctaPrimaryHref: "/products",
        ctaSecondaryLabel: "Browse categories",
        ctaSecondaryHref: "/categories",
      },
    });
    await payload.updateGlobal({
      slug: "hero",
      locale: "ar",
      data: {
        eyebrow: "متجر مصنع البرمجيات",
        title: "منتجات فاخرة مصممة لتدوم",
        subtitle: "اكتشف تشكيلة مختارة مع دفع سريع وآمن.",
        ctaPrimaryLabel: "تسوّق الآن",
        ctaSecondaryLabel: "تصفح الفئات",
      },
    });
    payload.logger.info("[seed] hero global seeded");
  }

  // --- About global ----------------------------------------------------------
  if (sectionOn("about")) {
    await payload.updateGlobal({
      slug: "about",
      locale: "en",
      data: {
        title: "About us",
        body: "We build premium commerce experiences for ambitious brands.",
      },
    });
    await payload.updateGlobal({
      slug: "about",
      locale: "ar",
      data: {
        title: "من نحن",
        body: "نبني تجارب تجارة إلكترونية فاخرة للعلامات الطموحة.",
      },
    });
    payload.logger.info("[seed] about global seeded");
  }

  // --- Contact global --------------------------------------------------------
  if (sectionOn("contact")) {
    await payload.updateGlobal({
      slug: "contact",
      locale: "en",
      data: {
        heading: "Get in touch",
        subheading: "Questions about an order? Our team is here to help.",
        email: "support@softwarefactory.local",
        phone: "+966 11 000 0000",
        address: "Riyadh, Saudi Arabia",
      },
    });
    await payload.updateGlobal({
      slug: "contact",
      locale: "ar",
      data: {
        heading: "تواصل معنا",
        subheading: "لديك سؤال عن طلبك؟ فريقنا جاهز لمساعدتك.",
        address: "الرياض، المملكة العربية السعودية",
      },
    });
    payload.logger.info("[seed] contact global seeded");
  }

  // --- Footer global ---------------------------------------------------------
  if (sectionOn("footer")) {
    await payload.updateGlobal({
      slug: "footer",
      locale: "en",
      data: {
        tagline: "Premium commerce, delivered.",
        columns: [
          {
            title: "Shop",
            links: [
              { label: "Products", href: "/products" },
              { label: "Categories", href: "/categories" },
            ],
          },
          {
            title: "Support",
            links: [
              { label: "FAQ", href: "/faq" },
              { label: "Contact", href: "/contact" },
            ],
          },
        ],
      },
    });
    await payload.updateGlobal({
      slug: "footer",
      locale: "ar",
      data: {
        tagline: "تجارة فاخرة، تصلك أينما كنت.",
        columns: [
          {
            title: "المتجر",
            links: [
              { label: "المنتجات", href: "/products" },
              { label: "الفئات", href: "/categories" },
            ],
          },
          {
            title: "الدعم",
            links: [
              { label: "الأسئلة الشائعة", href: "/faq" },
              { label: "تواصل معنا", href: "/contact" },
            ],
          },
        ],
      },
    });
    payload.logger.info("[seed] footer global seeded");
  }

  // --- FAQ collection --------------------------------------------------------
  if (sectionOn("faq")) {
    const faqCount = await payload.count({ collection: "faq" });
    if (faqCount.totalDocs === 0) {
      const faqs: { en: [string, string]; ar: [string, string]; order: number }[] = [
        {
          order: 1,
          en: ["What payment methods are supported?", "We support Tamara, Tabby and card payments."],
          ar: ["ما طرق الدفع المدعومة؟", "ندعم تمارا وتابي والدفع بالبطاقة."],
        },
        {
          order: 2,
          en: ["How long does delivery take?", "Orders are typically delivered within 2–5 business days."],
          ar: ["كم تستغرق مدة التوصيل؟", "عادةً يتم التوصيل خلال 2 إلى 5 أيام عمل."],
        },
      ];
      for (const f of faqs) {
        const doc = await payload.create({
          collection: "faq",
          locale: "en",
          data: { question: f.en[0], answer: f.en[1], order: f.order },
        });
        await payload.update({
          collection: "faq",
          id: doc.id,
          locale: "ar",
          data: { question: f.ar[0], answer: f.ar[1] },
        });
      }
      payload.logger.info("[seed] faq collection seeded");
    }
  }

  // --- PromoBanners collection ----------------------------------------------
  if (sectionOn("promoBanners")) {
    const bannerCount = await payload.count({ collection: "promoBanners" });
    if (bannerCount.totalDocs === 0) {
      const doc = await payload.create({
        collection: "promoBanners",
        locale: "en",
        data: {
          headline: "Season sale — up to 40% off",
          subcopy: "Limited-time offers across the catalog.",
          ctaLabel: "Shop the sale",
          ctaHref: "/products",
          order: 1,
          enabled: true,
        },
      });
      await payload.update({
        collection: "promoBanners",
        id: doc.id,
        locale: "ar",
        data: {
          headline: "تخفيضات الموسم — حتى 40%",
          subcopy: "عروض لفترة محدودة على جميع المنتجات.",
          ctaLabel: "تسوّق العروض",
        },
      });
      payload.logger.info("[seed] promoBanners collection seeded");
    }
  }

  // --- Categories + Products (catalog reference content) ---------------------
  if (sectionOn("categories") || sectionOn("productListing")) {
    const categoryCount = await payload.count({ collection: "categories" });
    if (categoryCount.totalDocs === 0) {
      const category = await payload.create({
        collection: "categories",
        locale: "en",
        data: {
          slug: "accessories",
          name: "Accessories",
          description: "Everyday premium accessories.",
        },
      });
      await payload.update({
        collection: "categories",
        id: category.id,
        locale: "ar",
        data: { name: "الإكسسوارات", description: "إكسسوارات فاخرة للاستخدام اليومي." },
      });

      const productCount = await payload.count({ collection: "products" });
      if (productCount.totalDocs === 0) {
        const product = await payload.create({
          collection: "products",
          locale: "en",
          data: {
            slug: "signature-leather-wallet",
            name: "Signature Leather Wallet",
            description: "Full-grain leather wallet with RFID protection.",
            category: category.id,
            price: 249,
            currency: "SAR",
            inStock: true,
            tags: ["leather", "wallet"],
          },
        });
        await payload.update({
          collection: "products",
          id: product.id,
          locale: "ar",
          data: {
            name: "محفظة جلدية مميزة",
            description: "محفظة من الجلد الطبيعي مع حماية RFID.",
          },
        });
      }
      payload.logger.info("[seed] categories + products seeded");
    }
  }

  // Reviews are intentionally NOT seeded: features.reviews is OFF by default.

  payload.logger.info("[seed] done");
}

/**
 * Restaurant-vertical sample content. Called only when options.siteType ===
 * "restaurant". Idempotent (no-ops when data already exists). Section keys follow
 * options.restaurant.json: hero, promotions, menu, gallery, branches, reservation,
 * about, faq, contact, footer.
 *
 * TODO(phase-3): multi-tenant — seed per tenant/brand instead of a single dataset.
 */
async function seedRestaurant(
  payload: Payload,
  sectionOn: (key: string) => boolean
): Promise<void> {
  // --- Hero global (reused) --------------------------------------------------
  if (sectionOn("hero")) {
    await payload.updateGlobal({
      slug: "hero",
      locale: "en",
      data: {
        eyebrow: "Authentic flavors",
        title: "Fresh food, made to order",
        subtitle: "Dine in, pick up, or get it delivered — reserve a table in seconds.",
        ctaPrimaryLabel: "View menu",
        ctaPrimaryHref: "/menu",
        ctaSecondaryLabel: "Reserve a table",
        ctaSecondaryHref: "/reservations",
      },
    });
    await payload.updateGlobal({
      slug: "hero",
      locale: "ar",
      data: {
        eyebrow: "نكهات أصيلة",
        title: "طعام طازج يُحضّر عند الطلب",
        subtitle: "تناول في المطعم، أو استلم، أو اطلب التوصيل — واحجز طاولتك خلال ثوانٍ.",
        ctaPrimaryLabel: "تصفح القائمة",
        ctaSecondaryLabel: "احجز طاولة",
      },
    });
    payload.logger.info("[seed] (restaurant) hero global seeded");
  }

  // --- About global (reused) -------------------------------------------------
  if (sectionOn("about")) {
    await payload.updateGlobal({
      slug: "about",
      locale: "en",
      data: {
        title: "Our story",
        body: "A neighborhood kitchen serving seasonal dishes from locally sourced ingredients.",
      },
    });
    await payload.updateGlobal({
      slug: "about",
      locale: "ar",
      data: {
        title: "قصتنا",
        body: "مطبخ الحي يقدّم أطباقاً موسمية من مكونات محلية طازجة.",
      },
    });
    payload.logger.info("[seed] (restaurant) about global seeded");
  }

  // --- Contact global (reused) -----------------------------------------------
  if (sectionOn("contact")) {
    await payload.updateGlobal({
      slug: "contact",
      locale: "en",
      data: {
        heading: "Visit or reach us",
        subheading: "Reservations, catering and feedback — we'd love to hear from you.",
        email: "hello@restaurant.local",
        phone: "+966 11 000 1111",
        address: "King Fahd Road, Riyadh, Saudi Arabia",
        whatsapp: "+966 55 000 1111",
      },
    });
    await payload.updateGlobal({
      slug: "contact",
      locale: "ar",
      data: {
        heading: "زُرنا أو تواصل معنا",
        subheading: "الحجوزات والتموين وملاحظاتكم — يسعدنا تواصلكم.",
        address: "طريق الملك فهد، الرياض، المملكة العربية السعودية",
      },
    });
    payload.logger.info("[seed] (restaurant) contact global seeded");
  }

  // --- Footer global (reused) ------------------------------------------------
  if (sectionOn("footer")) {
    await payload.updateGlobal({
      slug: "footer",
      locale: "en",
      data: {
        tagline: "Good food, warm hospitality.",
        columns: [
          {
            title: "Explore",
            links: [
              { label: "Menu", href: "/menu" },
              { label: "Branches", href: "/branches" },
              { label: "Gallery", href: "/gallery" },
            ],
          },
          {
            title: "Visit",
            links: [
              { label: "Reservations", href: "/reservations" },
              { label: "Contact", href: "/contact" },
            ],
          },
        ],
      },
    });
    await payload.updateGlobal({
      slug: "footer",
      locale: "ar",
      data: {
        tagline: "طعام لذيذ وحفاوة صادقة.",
        columns: [
          {
            title: "استكشف",
            links: [
              { label: "القائمة", href: "/menu" },
              { label: "الفروع", href: "/branches" },
              { label: "المعرض", href: "/gallery" },
            ],
          },
          {
            title: "زُرنا",
            links: [
              { label: "الحجوزات", href: "/reservations" },
              { label: "تواصل معنا", href: "/contact" },
            ],
          },
        ],
      },
    });
    payload.logger.info("[seed] (restaurant) footer global seeded");
  }

  // --- FAQ collection (reused) -----------------------------------------------
  if (sectionOn("faq")) {
    const faqCount = await payload.count({ collection: "faq" });
    if (faqCount.totalDocs === 0) {
      const faqs: { en: [string, string]; ar: [string, string]; order: number }[] = [
        {
          order: 1,
          en: ["Do you take reservations?", "Yes — reserve a table online or by phone."],
          ar: ["هل تقبلون الحجوزات؟", "نعم — احجز طاولتك عبر الإنترنت أو هاتفياً."],
        },
        {
          order: 2,
          en: ["Do you offer delivery?", "Yes, delivery and pickup are available from all branches."],
          ar: ["هل يتوفر توصيل؟", "نعم، التوصيل والاستلام متاحان من جميع الفروع."],
        },
      ];
      for (const f of faqs) {
        const doc = await payload.create({
          collection: "faq",
          locale: "en",
          data: { question: f.en[0], answer: f.en[1], order: f.order },
        });
        await payload.update({
          collection: "faq",
          id: doc.id,
          locale: "ar",
          data: { question: f.ar[0], answer: f.ar[1] },
        });
      }
      payload.logger.info("[seed] (restaurant) faq collection seeded");
    }
  }

  // --- Promotions collection -------------------------------------------------
  if (sectionOn("promotions")) {
    const promoCount = await payload.count({ collection: "promotions" });
    if (promoCount.totalDocs === 0) {
      const doc = await payload.create({
        collection: "promotions",
        locale: "en",
        data: {
          headline: "Weekday lunch set — 20% off",
          subcopy: "Two courses plus a drink, every weekday 12–3pm.",
          ctaLabel: "See the menu",
          ctaHref: "/menu",
          order: 1,
          enabled: true,
        },
      });
      await payload.update({
        collection: "promotions",
        id: doc.id,
        locale: "ar",
        data: {
          headline: "غداء أيام الأسبوع — خصم 20%",
          subcopy: "طبقان ومشروب، كل أيام الأسبوع من 12 حتى 3 عصراً.",
          ctaLabel: "شاهد القائمة",
        },
      });
      payload.logger.info("[seed] (restaurant) promotions collection seeded");
    }
  }

  // --- Menu (categories + items) ---------------------------------------------
  if (sectionOn("menu")) {
    const catCount = await payload.count({ collection: "menuCategories" });
    if (catCount.totalDocs === 0) {
      const starters = await payload.create({
        collection: "menuCategories",
        locale: "en",
        data: { slug: "starters", name: "Starters", description: "Light bites to begin.", order: 1 },
      });
      await payload.update({
        collection: "menuCategories",
        id: starters.id,
        locale: "ar",
        data: { name: "المقبلات", description: "أطباق خفيفة للبداية." },
      });

      const mains = await payload.create({
        collection: "menuCategories",
        locale: "en",
        data: { slug: "mains", name: "Main Courses", description: "Hearty signature plates.", order: 2 },
      });
      await payload.update({
        collection: "menuCategories",
        id: mains.id,
        locale: "ar",
        data: { name: "الأطباق الرئيسية", description: "أطباق مميزة ومشبعة." },
      });

      const items: {
        slug: string;
        // Payload postgres ids are numeric (payload-types.ts MenuCategory.id).
        category: number;
        en: [string, string];
        ar: [string, string];
        price: number;
        spicyLevel?: number;
        calories?: number;
        tags: string[];
      }[] = [
        {
          slug: "hummus-beiruti",
          category: starters.id,
          en: ["Hummus Beiruti", "Creamy chickpea dip with garlic, lemon and olive oil."],
          ar: ["حمص بيروتي", "غموس الحمص الكريمي بالثوم والليمون وزيت الزيتون."],
          price: 22,
          spicyLevel: 0,
          calories: 320,
          tags: ["vegetarian", "cold"],
        },
        {
          slug: "grilled-lamb-chops",
          category: mains.id,
          en: ["Grilled Lamb Chops", "Char-grilled lamb chops with garlic rice and grilled vegetables."],
          ar: ["ريش الغنم المشوية", "ريش غنم مشوية على الفحم مع أرز بالثوم وخضار مشوية."],
          price: 89,
          spicyLevel: 1,
          calories: 740,
          tags: ["grill", "signature"],
        },
      ];
      for (const it of items) {
        const doc = await payload.create({
          collection: "menuItems",
          locale: "en",
          data: {
            slug: it.slug,
            name: it.en[0],
            description: it.en[1],
            category: it.category,
            price: it.price,
            currency: "SAR",
            isAvailable: true,
            spicyLevel: it.spicyLevel,
            calories: it.calories,
            tags: it.tags,
          },
        });
        await payload.update({
          collection: "menuItems",
          id: doc.id,
          locale: "ar",
          data: { name: it.ar[0], description: it.ar[1] },
        });
      }
      payload.logger.info("[seed] (restaurant) menu categories + items seeded");
    }
  }

  // --- Branches (+ tables) ---------------------------------------------------
  if (sectionOn("branches")) {
    const branchCount = await payload.count({ collection: "branches" });
    if (branchCount.totalDocs === 0) {
      const branch = await payload.create({
        collection: "branches",
        locale: "en",
        data: {
          slug: "riyadh-olaya",
          name: "Riyadh — Olaya",
          address: "Olaya Street, Riyadh",
          city: "Riyadh",
          latitude: 24.6908,
          longitude: 46.6853,
          phone: "+966 11 000 2222",
          openingHours: [
            { day: "sun", opens: "12:00", closes: "23:00", closed: false },
            { day: "mon", opens: "12:00", closes: "23:00", closed: false },
            { day: "fri", opens: "13:00", closes: "00:00", closed: false },
          ],
        },
      });
      await payload.update({
        collection: "branches",
        id: branch.id,
        locale: "ar",
        data: { name: "الرياض — العليا", address: "شارع العليا، الرياض" },
      });

      const tableCount = await payload.count({ collection: "restaurantTables" });
      if (tableCount.totalDocs === 0) {
        for (const t of [
          { label: "T1", capacity: 2 },
          { label: "T2", capacity: 4 },
          { label: "T3", capacity: 6 },
        ]) {
          await payload.create({
            collection: "restaurantTables",
            data: { label: t.label, branch: branch.id, capacity: t.capacity, isActive: true },
          });
        }
        payload.logger.info("[seed] (restaurant) tables seeded");
      }
      payload.logger.info("[seed] (restaurant) branches seeded");
    }
  }

  // --- Gallery ---------------------------------------------------------------
  if (sectionOn("gallery")) {
    const galleryCount = await payload.count({ collection: "gallery" });
    if (galleryCount.totalDocs === 0) {
      // Images are attached later via the admin UI; seed the block + title only.
      const doc = await payload.create({
        collection: "gallery",
        locale: "en",
        data: { title: "Inside the restaurant", order: 1, enabled: true },
      });
      await payload.update({
        collection: "gallery",
        id: doc.id,
        locale: "ar",
        data: { title: "داخل المطعم" },
      });
      payload.logger.info("[seed] (restaurant) gallery seeded");
    }
  }

  // Reservations are created by customers via the backend flow — not seeded.
}
