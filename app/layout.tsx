import type { Metadata } from "next";
import { DM_Sans, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const bodyFont = DM_Sans({
  subsets: ["latin"],
  variable: "--font-body"
});

const displayFont = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-display"
});

export const metadata: Metadata = {
  title: "Ruban Core CRM",
  description: "Role-based business operating system for lead-to-payment lifecycle tracking."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${bodyFont.variable} ${displayFont.variable}`}>
      <body className="min-h-screen font-[var(--font-body)]">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
