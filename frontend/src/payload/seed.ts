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
  features?: Record<string, boolean>;
  sections?: Record<string, { enabled?: boolean; order?: number }>;
}

function loadOptions(): SeedOptions {
  const candidates = [
    path.resolve(process.cwd(), "..", "options.json"),
    path.resolve(process.cwd(), "options.json"),
    process.env.OPTIONS_MANIFEST_PATH ?? "",
  ].filter(Boolean);
  for (const candidate of candidates) {
    try {
      return JSON.parse(readFileSync(candidate, "utf-8")) as SeedOptions;
    } catch {
      // try next
    }
  }
  return {};
}

export async function seed(payload: Payload): Promise<void> {
  const options = loadOptions();
  const sectionOn = (key: string) => options.sections?.[key]?.enabled === true;
  const featureOn = (key: string) => options.features?.[key] === true;

  if (!featureOn("cms")) {
    payload.logger.info("[seed] features.cms disabled — skipping CMS content seed");
    return;
  }

  // --- Admin user (so /admin is usable out of the box) -----------------------
  const users = await payload.count({ collection: "users" });
  if (users.totalDocs === 0) {
    const email = process.env.PAYLOAD_ADMIN_EMAIL ?? "admin@softwarefactory.local";
    const password = process.env.PAYLOAD_ADMIN_PASSWORD ?? "ChangeMe!123";
    await payload.create({
      collection: "users",
      data: { email, password, name: "Store Admin" },
    });
    payload.logger.info(`[seed] created admin user ${email}`);
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
