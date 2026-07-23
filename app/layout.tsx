import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CajaCrédito Demo",
  description: "Demo de hackathon: simulador de creditos + deteccion de intencion",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="bg-gray-50 text-gray-900 antialiased">{children}</body>
    </html>
  );
}
