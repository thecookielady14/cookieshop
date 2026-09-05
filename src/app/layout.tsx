import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import HideOnAdmin from "@/components/HideOnAdmin";
import { siteUrl, siteName } from "@/lib/site";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-serif" });

const baseUrl = siteUrl;

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
        url: `${baseUrl}/opengraph-image`,
        width: 1200,
        height: 630,
        alt: "The Cookie Lady – Handgemachte Cookies",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "The Cookie Lady – Handgemachte Cookies",
    description: "Handgemachte Kekse aus regionalem Dinkelmehl, frisch gebacken und direkt zu dir nach Hause geliefert.",
    images: [`${baseUrl}/opengraph-image`],
  },
  metadataBase: new URL(baseUrl),
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Kein maximumScale/userScalable: Zoom zu sperren verstößt gegen WCAG 1.4.4
  // und macht die Seite für Menschen mit Sehschwäche unbenutzbar.
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Bakery",
  name: siteName,
  url: siteUrl,
  logo: `${siteUrl}/logo.jpeg`,
  email: "kontakt@thecookielady.de",
  telephone: "+49 151 29786411",
  address: {
    "@type": "PostalAddress",
    streetAddress: "Kissinger Straße 17",
    postalCode: "86415",
    addressLocality: "Mering",
    addressCountry: "DE",
  },
  sameAs: ["https://www.instagram.com/the.cookie_lady"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body className={`${inter.variable} ${playfair.variable} font-sans antialiased min-h-screen flex flex-col`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <HideOnAdmin>
          <Navbar />
        </HideOnAdmin>
        <main className="flex-1">
          {children}
        </main>
        <HideOnAdmin>
          <Footer />
        </HideOnAdmin>
      </body>
    </html>
  );
}
