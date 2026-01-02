import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Providers } from "@/components/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "InstaClone - Share Your Moments",
  description: "A full-featured Instagram-like social media platform",
  keywords: ["Instagram", "social", "media", "photos", "sharing"],
  authors: [{ name: "InstaClone Team" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "InstaClone - Share Your Moments",
    description: "A full-featured Instagram-like social media platform",
    siteName: "InstaClone",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "InstaClone - Share Your Moments",
    description: "A full-featured Instagram-like social media platform",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
