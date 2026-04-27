import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CookieBanner from "@/components/CookieBanner";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-serif" });

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://thecookielady.de';

export const metadata: Metadata = {
  title: {
    default: "The Cookie Lady – Handgemachte Cookies",
    template: "%s | The Cookie Lady",
  },
  description: "Entdecke handgemachte, unwiderstehliche Cookies aus besten Zutaten. Jeder Keks ein kleines Stückchen Glück.",
  openGraph: {
    title: "The Cookie Lady – Handgemachte Cookies",
    description: "Handgemachte Kekse aus regionalem Dinkelmehl, frisch gebacken und direkt zu dir nach Hause geliefert.",
    url: baseUrl,
    siteName: "The Cookie Lady",
    locale: "de_DE",
    type: "website",
    images: [
      {
        url: `${baseUrl}/logo.jpeg`,
        width: 800,
        height: 800,
        alt: "The Cookie Lady – Handgemachte Cookies",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "The Cookie Lady – Handgemachte Cookies",
    description: "Handgemachte Kekse aus regionalem Dinkelmehl, frisch gebacken und direkt zu dir nach Hause geliefert.",
    images: [`${baseUrl}/logo.jpeg`],
  },
  metadataBase: new URL(baseUrl),
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body className={`${inter.variable} ${playfair.variable} font-sans antialiased min-h-screen flex flex-col`}>
        <Navbar />
        <main className="flex-1">
          {children}
        </main>
        <Footer />
        <CookieBanner />
      </body>
    </html>
  );
}
