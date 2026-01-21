import type { Metadata } from "next";
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

export const metadata: Metadata = {
  title: "Circle CIA | Komunitas Kampus",
  description: "Circle gerakan bawah tanah, sunyi tapi tahu berita terbaru. Tidak semua orang boleh bergabung dengan CIA.",
  keywords: ["circle", "kampus", "komunitas", "mahasiswa", "CIA"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
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

