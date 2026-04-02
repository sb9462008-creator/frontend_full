import type { Metadata } from "next";
import { DM_Sans, Syne } from "next/font/google";

import { AppHeader } from "@/components/app-header";
import { SiteFooter } from "@/components/site-footer";

import "./globals.css";
import { Providers } from "./providers";

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "600", "700", "800"],
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "XADE Computer Store",
  description: "XADE computer store for PC parts, full builds, monitors, accessories, and delivery tracking.",
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="mn">
      <body className={`${syne.variable} ${dmSans.variable}`}>
        <Providers>
          <div className="min-h-screen bg-[radial-gradient(circle_at_18%_12%,rgba(207,35,45,0.2),transparent_26%),radial-gradient(circle_at_78%_8%,rgba(134,184,255,0.14),transparent_24%),linear-gradient(180deg,#090909_0%,#0d0d0d_100%)] text-[#f5f5f3]">
            <AppHeader />
            {children}
            <SiteFooter />
          </div>
        </Providers>
      </body>
    </html>
  );
}
