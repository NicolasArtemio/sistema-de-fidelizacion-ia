import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
// @ts-ignore
import './globals.css';

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["300", "400", "500", "600", "700", "800", "900"], // Full range for aggressive typography
});

export const metadata: Metadata = {
  title: "tulook",
  description: "Sistema de Fidelidad para Barbería y Ropa",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${montserrat.variable} font-sans antialiased`}
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
