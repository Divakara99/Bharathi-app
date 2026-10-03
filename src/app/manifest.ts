import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Bharathi Enterprises — Delivery Monitor",
    short_name: "Bharathi",
    description: "Employee-wise Ekart delivery reports, monthly expenses, totals and WhatsApp sharing.",
    lang: "en",
    dir: "ltr",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#f1f5f9",
    theme_color: "#4338ca",
    categories: ["business", "productivity"],
    prefer_related_applications: false,
    icons: [
      { src: "/icons/app-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/app-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/app-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
