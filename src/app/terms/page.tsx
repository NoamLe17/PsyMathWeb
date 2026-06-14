import Link from "next/link";
import { ChevronRight } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans" dir="rtl">
      {/* Navbar Minimal */}
      <nav className="w-full h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center px-4 md:px-8">
        <Link href="/" className="flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-blue-600 transition-colors font-bold">
          <ChevronRight size={20} />
          חזרה לאתר
        </Link>
      </nav>

      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white dark:bg-slate-900 p-8 md:p-12 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800">
          <h1 className="text-3xl font-black mb-8 text-slate-900 dark:text-white">תקנון ותנאי שימוש</h1>
          
          <div className="space-y-6 text-slate-700 dark:text-slate-300 leading-relaxed">
            <section>
              <h2 className="text-xl font-bold mb-3 text-slate-900 dark:text-slate-100">1. מבוא</h2>
              <p>ברוכים הבאים לאתר כמותיקס (PsyMath). השימוש באתר, בתכנים ובשירותים המוצעים בו כפוף לתנאי השימוש המפורטים להלן. עצם הגלישה והשימוש באתר מהווים הסכמה מפורשת לתנאים אלו.</p>
            </section>
            
            <section>
              <h2 className="text-xl font-bold mb-3 text-slate-900 dark:text-slate-100">2. קניין רוחני</h2>
              <p>כל זכויות הקניין הרוחני באתר, לרבות סרטוני הוידאו, השאלות, ההסברים, העיצוב והקוד, שייכים בלעדית לכמותיקס. אין להעתיק, לשכפל, להפיץ או לעשות כל שימוש מסחרי בתכנים ללא אישור מראש ובכתב.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3 text-slate-900 dark:text-slate-100">3. רכישות ומדיניות ביטולים</h2>
              <p>רכישת קורסים ושירותים מתבצעת בכפוף לחוק הגנת הצרכן. במקרה של ביטול עסקה על מוצר דיגיטלי שכבר נפתח לשימוש, החברה שומרת לעצמה את הזכות לפעול על פי המגבלות המוגדרות בחוק לגבי מוצרי מידע.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3 text-slate-900 dark:text-slate-100">4. הגבלת אחריות</h2>
              <p>התכנים באתר נועדו לצרכי לימוד בלבד. האתר אינו מתחייב לציון מסוים בבחינה הפסיכומטרית ולא יישא באחריות לכל נזק עקיף או ישיר שייגרם כתוצאה מהסתמכות על התכנים.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3 text-slate-900 dark:text-slate-100">5. עדכון תנאים</h2>
              <p>הנהלת האתר רשאית לשנות את תנאי השימוש מעת לעת, ללא הודעה מוקדמת. התנאים המחייבים הם אלו המופיעים באתר בעת השימוש בו.</p>
            </section>
          </div>

          <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800 text-sm text-slate-500 text-center">
            עודכן לאחרונה: יוני 2026
          </div>
        </div>
      </main>
    </div>
  );
}
