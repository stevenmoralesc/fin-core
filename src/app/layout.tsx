import type { Metadata } from "next";
import { Inter, Hanken_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/layout/Sidebar";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import { FeedbackProvider } from "@/components/ui/Feedback";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const hanken = Hanken_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-hanken",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  title: "FinControl — Sistema de Control Financiero Personal",
  description:
    "Gestiona tu liquidez, cupos de tarjeta de crédito y gastos corrientes en un solo lugar.",
};

export const dynamic = "force-dynamic";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${inter.variable} ${hanken.variable} ${jetbrains.variable}`} suppressHydrationWarning>
      <head>
        {/* Anti-flash: apply theme before first paint */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');var dark=(t==='dark')||(t!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.setAttribute('data-theme',dark?'dark':'light');}catch(e){}})();`,
          }}
        />
      </head>
      <body
        className="min-h-screen font-sans antialiased overflow-hidden"
        style={{ background: "var(--bg-base)", color: "var(--text-primary)" }}
      >
        <ThemeProvider>
          <FeedbackProvider>
            <div
              className="flex h-screen w-full overflow-hidden"
              style={{ background: "var(--bg-base)" }}
            >
              <Sidebar />
              <main className="flex-1 h-full overflow-y-auto flex flex-col">
                {children}
              </main>
            </div>
          </FeedbackProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
