import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

const editorial = localFont({
  src: "./fonts/cormorant-garamond.ttf",
  variable: "--font-editorial",
  display: "swap",
  weight: "300 700",
  fallback: ["Georgia", "Times New Roman", "serif"],
  adjustFontFallback: "Times New Roman",
});
const sans = localFont({
  src: "./fonts/manrope.ttf",
  variable: "--font-sans",
  display: "swap",
  weight: "200 800",
  fallback: ["system-ui", "Segoe UI", "sans-serif"],
  adjustFontFallback: "Arial",
});

export const metadata: Metadata = {
  title: "Lumen — Beauty and care",
  description: "Beauty, skin and body care. Browse the Lumen care menu and request a consultation. Demonstration only.",
  robots: { index: false, follow: false },
  openGraph: {
    title: "Lumen — Beauty and care",
    description: "Massage, skin rituals and body care. Browse the menu, then tell us how you’d like to begin.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${editorial.variable} ${sans.variable}`}>{children}</body>
    </html>
  );
}
