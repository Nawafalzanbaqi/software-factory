/**
 * next-sitemap config (ESM — the package is "type": "module"). Runs on `postbuild`
 * to emit sitemap.xml + robots.txt for static routes. Dynamic routes (products)
 * are also covered by the runtime app/sitemap.ts + app/robots.ts; keep both in
 * sync when adding public routes.
 * @type {import('next-sitemap').IConfig}
 */
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

const config = {
  siteUrl,
  generateRobotsTxt: true,
  changefreq: "daily",
  priority: 0.7,
  sitemapSize: 5000,
  exclude: ["/api/*", "/*/checkout", "/*/cart", "/*/dashboard", "/*/orders/*"],
  alternateRefs: [
    { href: `${siteUrl}/en`, hreflang: "en" },
    { href: `${siteUrl}/ar`, hreflang: "ar" },
  ],
  robotsTxtOptions: {
    policies: [
      { userAgent: "*", allow: "/" },
      { userAgent: "*", disallow: ["/api/", "/checkout", "/dashboard"] },
    ],
  },
};

export default config;
