import type { MetadataRoute } from "next";
import { listSubjects } from "@/lib/seo-subjects";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://etutor.ro";
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/`, lastModified: now, changeFrequency: "weekly", priority: 1.0 },
    { url: `${baseUrl}/en`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${baseUrl}/ro`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    // Magic Quiz demo — top acquisition surface.
    { url: `${baseUrl}/ro/try`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/en/try`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    // SEO subject index.
    { url: `${baseUrl}/ro/grile`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/en/grile`, lastModified: now, changeFrequency: "weekly", priority: 0.6 },
    { url: `${baseUrl}/en/auth/signin`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/ro/auth/signin`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/en/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${baseUrl}/ro/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${baseUrl}/en/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${baseUrl}/ro/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];

  // Per-subject SEO landings (RO primary — the queries are Romanian-exam specific).
  const subjectPages: MetadataRoute.Sitemap = listSubjects().flatMap((s) => [
    { url: `${baseUrl}/ro/grile/${s.slug}`, lastModified: now, changeFrequency: "weekly" as const, priority: 0.7 },
    { url: `${baseUrl}/en/grile/${s.slug}`, lastModified: now, changeFrequency: "monthly" as const, priority: 0.4 },
  ]);

  return [...staticPages, ...subjectPages];
}
