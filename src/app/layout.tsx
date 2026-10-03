import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { createPwaSafetyScript } from "@/lib/pwa-safety";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bharathi Enterprises · Delivery Monitor",
  description: "Ekart vendor 15-day delivery cycle reports, totals and expenses.",
  applicationName: "Bharathi Enterprises",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [{ url: "/icons/app-192.png", sizes: "192x192", type: "image/png" }, { url: "/icons/app-512.png", sizes: "512x512", type: "image/png" }],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    title: "Bharathi",
    statusBarStyle: "black-translucent",
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#4338ca",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <script id="bharathi-pwa-safety" dangerouslySetInnerHTML={{ __html: createPwaSafetyScript(process.env.NODE_ENV === "production") }} />
      </head>
      <body className="bg-slate-100 text-slate-900 antialiased">{children}</body>
    </html>
  );
}
