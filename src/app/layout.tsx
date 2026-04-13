import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { getSiteSettings } from "@/lib/siteSettings";
import { FirebaseClientProvider } from '@/firebase';

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export const viewport: Viewport = {
  themeColor: "#619BF3",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const title = settings.siteTitle || "GomerchPay API";
  const description = "Platform gateway pembayaran QRIS otomatis terintegrasi Gopay Merchant. Terima pembayaran QRIS secara real-time dengan integrasi API yang mudah dan aman. di dukung oleh StarVale Technology Solution, Dibuat dengan 💙 oleh AltharDev ";
  const url = process.env.NEXT_PUBLIC_APP_URL || "https://pay-gomerch.web.id";

  return {
    title: {
      default: title,
      template: `%s | ${title}`,
    },
    description,
    keywords: [
      "GomerchPay", 
      "GomerchPay API", 
      "AltharDev", 
      "StarVale", 
      "payment gateway", 
      "QRIS Otomatis", 
      "Gopay Merchant", 
      "API Pembayaran", 
      "pembayaran otomatis", 
      "integrasi QRIS", 
      "QRIS Dinamis"
    ],
    authors: [{ name: "AltharDev", url: "https://althardev.site" }],
    creator: "AltharDev",
    publisher: "StarVale",
    metadataBase: new URL(url),
    alternates: {
      canonical: "/",
    },
    icons: settings.favicon ? { icon: settings.favicon } : { icon: "/favicon.ico" },
    openGraph: {
      type: "website",
      locale: "id_ID",
      url: url,
      title: title,
      description: description,
      siteName: "GomerchPay API",
      images: [
        {
          url: "/img/og-image.png",
          width: 1200,
          height: 630,
          alt: "GomerchPay API by AltharDev",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: title,
      description: description,
      images: ["/img/og-image.png"],
      creator: "@althardev",
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className={`${inter.variable} antialiased selection:bg-blue-100`}>
        <FirebaseClientProvider>
          {children}
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
