import type { Metadata } from "next";
import Navbar from "../components/Navbar";
import { Providers } from "@/components/Providers";
import ChatBot from "@/components/ChatBot";
import { GoogleAnalytics } from "@next/third-parties/google";
import "./globals.css";

export const metadata: Metadata = {
  title: "כמותיקס — הדרך החכמה לציון מושלם בכמותי",
  description: "פלטפורמת למידה ותרגול פסיכומטרי דיגיטלית מתקדמת, בדגש על הפרק הכמותי. שיעורי וידאו אינטראקטיביים, תרגול חכם מותאם אישית וסימולציות בחינה מדויקות.",
  keywords: "פסיכומטרי, כמותי, תרגול פסיכומטרי, קורס פסיכומטרי, לימוד אונליין, סימולציות, אלגברה, גיאומטריה",
  openGraph: {
    title: "כמותיקס — הדרך החכמה לציון מושלם בכמותי",
    description: "פלטפורמת למידה ותרגול פסיכומטרי דיגיטלית מתקדמת. שיעורי וידאו אינטראקטיביים, תרגול חכם מותאם אישית וסימולציות בחינה מדויקות.",
    url: "https://psymath.co.il",
    siteName: "כמותיקס",
    locale: "he_IL",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "כמותיקס — הדרך החכמה לציון מושלם בכמותי",
    description: "פלטפורמת למידה ותרגול פסיכומטרי דיגיטלית מתקדמת.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl" className="scroll-smooth" suppressHydrationWarning>
      <head>
        {/* Prevent dark mode FOUC */}
        <script dangerouslySetInnerHTML={{
          __html: `
          try {
            const t = localStorage.getItem('kamotix-theme');
            if (t === 'dark' || (!t && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
              document.documentElement.classList.add('dark');
            }
          } catch(e) {}
        `}} />
      </head>
      <body className="antialiased min-h-screen transition-colors duration-300">
        <Providers>
          <Navbar />
          <main className="animate-page-enter">
            {children}
          </main>
          <ChatBot />
        </Providers>
        <GoogleAnalytics gaId="G-YDYTJNPN5X" />
      </body>
    </html>
  );
}