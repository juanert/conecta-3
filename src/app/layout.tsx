import type { Metadata, Viewport } from "next";
import { Outfit } from "next/font/google";

import "./globals.css";

// Fuente autoalojada por Next.js (sin peticiones a Google desde el navegador)
const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "Conecta 3 - Juego Interactivo",
  description: "Alinea 3 fichas en vertical, horizontal o diagonal. Juega contra la CPU o contra un amigo.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0f172a",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={outfit.variable}>
      <body>{children}</body>
    </html>
  );
}
