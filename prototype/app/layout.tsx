import type { Metadata, Viewport } from "next";
import { Manrope, Newsreader } from "next/font/google";
import "./globals.css";
import "./password-recovery.css";

const sans = Manrope({ variable: "--font-sans", subsets: ["latin"] });
const serif = Newsreader({ variable: "--font-serif", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL ?? "http://localhost:3000"),
  applicationName: "Helix",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Helix",
  },
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
  title: "Helix — Tu tratamiento, en orden",
  description: "Prototipo visual de continuidad del tratamiento Helix.",
  openGraph: {
    title: "Helix — Tu tratamiento, en orden",
    description: "Tratamiento, dosis, adherencia e inventario en una sola vista.",
    images: [{ url: "/og.png", width: 1536, height: 1024 }],
    locale: "es_MX",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Helix — Tu tratamiento, en orden",
    description: "Tratamiento, dosis, adherencia e inventario en una sola vista.",
    images: ["/og.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#153f35",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es"><body className={`${sans.variable} ${serif.variable}`}>{children}</body></html>;
}
