import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Colsubsidio | Créditos",
  description: "Portal de creditos de Colsubsidio: simulador + deteccion de intencion (demo de hackathon)",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="bg-gray-50 text-gray-900 antialiased">{children}</body>
    </html>
  );
}
