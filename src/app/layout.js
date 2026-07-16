import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Torre Fuerte - Distribución Inteligente",
  description: "Plataforma de distribución de torres fuertes. Gestiona tus torres desde cualquier lugar.",
  manifest: "/manifest.json",
  themeColor: "#6366f1", // Color principal (indigo-500)
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Torre Fuerte",
  },
  icons: {
    apple: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  },
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        {/* Meta tags para PWA */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Torre Fuerte" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="application-name" content="Torre Fuerte" />

        {/* Color de la barra de dirección en Chrome Android */}
        <meta name="theme-color" content="#6366f1" />

        {/* Iconos para diferentes plataformas */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/icon-512.png" />

        {/* Soporte para modo oscuro */}
        <meta name="color-scheme" content="light dark" />

        {/* Prevenir detección automática de números de teléfono */}
        <meta name="format-detection" content="telephone=no" />
      </head>
      <body className="min-h-full flex flex-col bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-indigo-950 dark:to-purple-950">
        {children}
      </body>
    </html>
  );
}