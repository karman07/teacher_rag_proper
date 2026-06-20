import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./components/Providers";
import AnimatedBackground from "./components/visuals/AnimatedBackground";
import Script from "next/script";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "VTA — Virtual Teaching Assistant",
  description:
    "AI-powered virtual teaching assistant that learns from your course materials and answers student questions instantly.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/* Flash-prevention: apply saved theme as soon as interactive */}
        <Script
          id="theme-switcher"
          src="/theme-check.js"
          strategy="afterInteractive"
        />
      </head>
      <body className="min-h-full flex flex-col">
        <AnimatedBackground />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

