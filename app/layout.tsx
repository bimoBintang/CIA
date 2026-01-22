import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { VisitorTracker } from "@/components/VisitorTracker";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

function getSiteUrl(): string {
  const url = process.env.NEXT_PUBLIC_SITE_URL || "https://ciaa.web.id";
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  return `https://${url}`;
}

const siteUrl = getSiteUrl();

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#10b981",
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Circle CIA | Komunitas Intelijen Kampus",
    template: "%s | Circle CIA",
  },
  description:
    "Circle CIA adalah komunitas intelijen kampus yang bergerak di bawah tanah. Sunyi tapi selalu tahu berita terbaru. Tidak semua orang boleh bergabung.",
  keywords: [
    "circle cia",
    "komunitas kampus",
    "mahasiswa",
    "intelijen kampus",
    "berita kampus",
    "organisasi mahasiswa",
    "intel",
    "campus intelligence",
  ],
  authors: [{ name: "Circle CIA", url: siteUrl }],
  creator: "Circle CIA",
  publisher: "Circle CIA",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: siteUrl,
    siteName: "Circle CIA",
    title: "Circle CIA | Komunitas Intelijen Kampus",
    description:
      "Komunitas intelijen kampus yang bergerak di bawah tanah. Sunyi tapi selalu tahu berita terbaru.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Circle CIA - Komunitas Intelijen Kampus",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Circle CIA | Komunitas Intelijen Kampus",
    description:
      "Komunitas intelijen kampus yang bergerak di bawah tanah. Sunyi tapi selalu tahu berita terbaru.",
    images: ["/og-image.png"],
    creator: "@circle_cia",
  },
  alternates: {
    canonical: siteUrl,
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
  },
  category: "community",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <VisitorTracker />
        {children}
      </body>
    </html>
  );
}
