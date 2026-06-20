import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const font = Plus_Jakarta_Sans({ 
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "VTA — Student Portal",
  description: "Your AI-powered virtual teaching assistant — get instant answers from your course materials.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css" integrity="sha384-nAnmC9Wl7iGHhYd84S7vqiPBAb9B9D79wX770NadZsn93W69mG78l2p0N0sXp3M9" crossOrigin="anonymous" />
        <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js" integrity="sha384-S991pU8ERD9AtL9zC6U+7/O/Kx0Oa5Xv+Zz7wD0H7r08pEwY0N0sXp3M9" crossOrigin="anonymous"></script>
        <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/contrib/auto-render.min.js" integrity="sha384-+XBljXPPiv+OzfbB3cVmWlf48b7tXU/r57yC+6V0u25O0sXp3M9" crossOrigin="anonymous"></script>
        <script dangerouslySetInnerHTML={{
          __html: `
            window.addEventListener('load', function() {
              if (window.renderMathInElement) {
                renderMathInElement(document.body, {
                  delimiters: [
                    {left: '$$', right: '$$', display: true},
                    {left: '$', right: '$', display: false}
                  ]
                });
              }
            });
          `
        }} />
      </head>

      <body className={font.className} style={{ background: "var(--background)", minHeight: "100vh" }}>
        <Providers>

          {children}
        </Providers>
      </body>
    </html>
  );
}
