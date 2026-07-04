/**
 * Bilingual (en + ar) display labels for the intake catalog KEYS the platform
 * serves. Purely presentational — the platform remains the source of truth for
 * which keys exist; an unknown key falls back to a humanized form of the key
 * itself, so a catalog addition never breaks the form.
 */

export interface BilingualLabel {
  en: string;
  ar: string;
}

export const SITE_TYPE_LABELS: Record<string, BilingualLabel> = {
  ecommerce: { en: "E-commerce", ar: "متجر إلكتروني" },
  restaurant: { en: "Restaurant", ar: "مطعم" },
  corporate: { en: "Corporate", ar: "موقع شركة" },
  landing: { en: "Landing page", ar: "صفحة هبوط" },
  portfolio: { en: "Portfolio", ar: "معرض أعمال" },
  booking: { en: "Booking", ar: "حجوزات" },
};

export const LANGUAGE_LABELS: Record<string, BilingualLabel> = {
  ar: { en: "Arabic only", ar: "العربية فقط" },
  en: { en: "English only", ar: "الإنجليزية فقط" },
  "ar-en": { en: "Arabic + English", ar: "العربية + الإنجليزية" },
};

export const DESIGN_DIRECTION_LABELS: Record<string, BilingualLabel> = {
  clean: { en: "Clean", ar: "نظيف" },
  premium: { en: "Premium", ar: "فاخر" },
  bold: { en: "Bold", ar: "جريء" },
  tech: { en: "Tech", ar: "تقني" },
};

export const SECTION_LABELS: Record<string, BilingualLabel> = {
  hero: { en: "Hero", ar: "الواجهة الرئيسية" },
  promoBanners: { en: "Promo banners", ar: "بانرات ترويجية" },
  categories: { en: "Categories", ar: "التصنيفات" },
  productListing: { en: "Product listing", ar: "قائمة المنتجات" },
  reviews: { en: "Reviews", ar: "التقييمات" },
  about: { en: "About", ar: "من نحن" },
  faq: { en: "FAQ", ar: "الأسئلة الشائعة" },
  contact: { en: "Contact", ar: "تواصل معنا" },
  footer: { en: "Footer", ar: "التذييل" },
  promotions: { en: "Promotions", ar: "العروض" },
  menu: { en: "Menu", ar: "قائمة الطعام" },
  gallery: { en: "Gallery", ar: "المعرض" },
  branches: { en: "Branches", ar: "الفروع" },
  reservation: { en: "Reservation", ar: "الحجوزات" },
  services: { en: "Services", ar: "الخدمات" },
  team: { en: "Team", ar: "الفريق" },
  testimonials: { en: "Testimonials", ar: "آراء العملاء" },
  featureHighlights: { en: "Feature highlights", ar: "أبرز المزايا" },
  pricing: { en: "Pricing", ar: "الأسعار" },
  cta: { en: "Call to action", ar: "دعوة لاتخاذ إجراء" },
  booking: { en: "Booking", ar: "الحجز" },
};

export const PAYMENT_LABELS: Record<string, BilingualLabel> = {
  tamara: { en: "Tamara", ar: "تمارا" },
  tabby: { en: "Tabby", ar: "تابي" },
  mada: { en: "mada", ar: "مدى" },
  stripe: { en: "Stripe", ar: "سترايب" },
};

export const INTEGRATION_LABELS: Record<string, BilingualLabel> = {
  zatca: { en: "ZATCA e-invoicing", ar: "فوترة زاتكا الإلكترونية" },
  whatsapp: { en: "WhatsApp", ar: "واتساب" },
  maps: { en: "Maps", ar: "الخرائط" },
};

export const FEATURE_LABELS: Record<string, BilingualLabel> = {
  clientDashboard: { en: "Client dashboard", ar: "لوحة تحكم العميل" },
  cms: { en: "CMS", ar: "إدارة المحتوى" },
  reviews: { en: "Reviews", ar: "التقييمات" },
  wishlist: { en: "Wishlist", ar: "المفضلة" },
  search: { en: "Search", ar: "البحث" },
  faq: { en: "FAQ", ar: "الأسئلة الشائعة" },
  loyalty: { en: "Loyalty", ar: "برنامج الولاء" },
  analytics: { en: "Analytics", ar: "التحليلات" },
};

/** "promoBanners" → "Promo banners" — fallback for keys without a label entry. */
export function humanizeKey(key: string): string {
  const spaced = key.replace(/([a-z0-9])([A-Z])/g, "$1 $2").toLowerCase();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

export function labelFor(
  map: Record<string, BilingualLabel>,
  key: string,
): BilingualLabel {
  return map[key] ?? { en: humanizeKey(key), ar: key };
}
