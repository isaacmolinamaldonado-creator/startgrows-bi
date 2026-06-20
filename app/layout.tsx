import type { Metadata } from "next";
import { Space_Grotesk, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "StartGrows — Business Intelligence",
  description: "Panel de control financiero y de marketing de StartGrows",
  icons: {
    icon: [
      {
        url:
          "data:image/svg+xml," +
          encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'>
            <defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
              <stop offset='0%' stop-color='#6366F1'/><stop offset='100%' stop-color='#10B981'/>
            </linearGradient></defs>
            <rect width='64' height='64' rx='14' fill='#070A10'/>
            <rect x='4' y='4' width='56' height='56' rx='12' fill='url(#g)'/>
            <path d='M20 40 L20 30 L26 30 L26 40 Z' fill='#070A10'/>
            <path d='M29 40 L29 22 L35 22 L35 40 Z' fill='#070A10'/>
            <path d='M38 40 L38 16 L44 16 L44 40 Z' fill='#070A10'/>
            <circle cx='44' cy='14' r='4' fill='#070A10'/>
          </svg>`),
        type: "image/svg+xml",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${spaceGrotesk.variable} ${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full" suppressHydrationWarning>{children}</body>
    </html>
  );
}
