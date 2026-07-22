import type { MetadataRoute } from "next";

const routes = [
  "",
  "/about",
  "/blog",
  "/business",
  "/business/register",
  "/categories",
  "/contact",
  "/faq",
  "/food-journey",
  "/impressum",
  "/pricing",
  "/privacy-policy",
  "/terms-and-services",
  "/usage-and-disclaimer",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return routes.map((route) => ({
    url: `https://foodeez.ch${route}`,
    lastModified,
    changeFrequency: route === "" || route === "/business" ? "daily" : "weekly",
    priority: route === "" ? 1 : route === "/business" ? 0.9 : 0.7,
  }));
}
