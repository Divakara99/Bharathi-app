import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Bharathi Enterprises Delivery Monitor",
    short_name: "Bharathi",
    description: "Track delivery cycles, reports, totals and expenses.",
    start_url: "/",
    display: "standalone",
    background_color: "#f1f5f9",
    theme_color: "#4338ca",
    orientation: "portrait-primary",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
