import type { Metadata, Viewport } from "next";
import { Geist, Plus_Jakarta_Sans } from "next/font/google";
import localFont from "next/font/local";
import { SkyBackdrop } from "@/components/decor";
import { assetUrl } from "@/lib/asset";
import "./globals.css";

const geist = Geist({ variable: "--font-geist", subsets: ["latin"] });
const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});
const masterpiece = localFont({
  src: "../public/fonts/Masterpiece.ttf",
  variable: "--font-masterpiece",
  display: "swap",
});

// Semua halaman aplikasi ini bergantung pada sesi login dan database per-request,
// jadi tidak ada shell statis yang perlu divalidasi (cacheComponents aktif).
export const instant = false;

export const metadata: Metadata = {
  metadataBase: new URL(process.env.BETTER_AUTH_URL ?? "http://localhost:3000"),
  title: "ASTRO 2026 — Voting Got Talent",
  description: "Voting penonton Astro Got Talent, ASTRO 2026 STT Terpadu Nurul Fikri.",
  icons: {
    icon: [
      { url: assetUrl("/favicon-32x32.png"), sizes: "32x32", type: "image/png" },
      { url: assetUrl("/favicon-16x16.png"), sizes: "16x16", type: "image/png" },
    ],
    apple: assetUrl("/apple-touch-icon.png"),
  },
  openGraph: { images: [assetUrl("/og/logo.png")] },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#7ec8f5",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="id"
      className={`${geist.variable} ${jakarta.variable} ${masterpiece.variable} h-full antialiased`}
    >
      <body className="min-h-full" suppressHydrationWarning>
        <div className="relative isolate flex min-h-svh flex-col">
          <SkyBackdrop />
          {children}
        </div>
      </body>
    </html>
  );
}
