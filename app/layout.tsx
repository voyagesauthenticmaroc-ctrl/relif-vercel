import type { Metadata, Viewport } from "next";
import { SITE_URL } from "../lib/site-url";
import "./globals.css";

const title =
  "Relief Visibility OS — Audit de visibilité dans les réponses IA";
const description =
  "Découvrez si ChatGPT, Perplexity et Gemini recommandent votre entreprise ou vos concurrents, quelles sources ils citent et quelles actions examiner en priorité.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: title,
    template: "%s · Relief Visibility OS",
  },
  description,
  applicationName: "Relief Visibility OS",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: "Relief Visibility OS",
    url: "/",
    title:
      "Les IA recommandent-elles votre entreprise ou vos concurrents ?",
    description:
      "Relief conserve les réponses, compare les marques et les sources citées, puis transforme les écarts observés en priorités vérifiables.",
    images: [
      {
        url: "/og-clarity.png",
        width: 1731,
        height: 909,
        type: "image/png",
        alt: "Relief Visibility OS analyse les réponses IA, les concurrents et les sources citées.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Relief Visibility OS",
    description:
      "Découvrez si les IA recommandent votre marque ou vos concurrents, et pourquoi.",
    images: ["/og-clarity.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  colorScheme: "dark",
  themeColor: "#050506",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <head>
        <link rel="icon" href="/favicon.png" />
        <link rel="shortcut icon" href="/favicon.png" />
        <link rel="apple-touch-icon" href="/favicon.png" />
      </head>
      <body>{children}</body>
    </html>
  );
}
