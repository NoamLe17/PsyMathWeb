import { Shield, AlertTriangle, Database, CreditCard, Cookie, RefreshCw, Mail } from "lucide-react";
import Link from "next/link";

export default function PrivacyPage() {
  const sections = [
    {
      icon: <AlertTriangle size={22} />,
      iconBg: "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-100/50 dark:border-amber-500/20",
      title: "הגבלת אחריות (Disclaimer)",
      items: [
        "כמותיקס אינה מהווה תחליף להוראה מקצועית או ללימוד עם מורה פרטי לפסיכומטרי.",
        "מפעילי האתר אינם מורים מוסמכים לפסיכומטרי.",
        "השאלות לתרגול, ההסברים והתכנים נוצרו בסיוע כלי בינה מלאכותית (AI) ועשויים להכיל אי-דיוקים.",
        "האתר אינו מבטיח תוצאות ספציפיות בבחינה הפסיכומטרית.",
        "השימוש באתר הוא על אחריות המשתמש בלבד.",
      ],
    },
    {
      icon: <Database size={22} />,
      iconBg: "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-100/50 dark:border-blue-500/20",
      title: "איסוף מידע",
      items: [
        "אנו אוספים כתובת אימייל, שם תצוגה ונתוני התקדמות בלבד.",
        "המידע מאוחסן בשרתי Firebase של Google בצורה מאובטחת.",
        "איננו מוכרים או משתפים מידע אישי עם צדדים שלישיים.",
      ],
    },
    {
      icon: <CreditCard size={22} />,
      iconBg: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-100/50 dark:border-emerald-500/20",
      title: "תשלומים",
      items: [
        "התשלומים מבוצעים דרך PayPal בצורה מוצפנת ומאובטחת.",
        "איננו שומרים פרטי אשראי או מידע פיננסי אצלנו.",
      ],
    },
    {
      icon: <Cookie size={22} />,
      iconBg: "bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-100/50 dark:border-purple-500/20",
      title: "שימוש בקוקיז",
      items: [
        "האתר משתמש בקוקיז טכניים לצורך אימות משתמשים ושמירת העדפות (כגון מצב כהה/בהיר).",
      ],
    },
    {
      icon: <RefreshCw size={22} />,
      iconBg: "bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-100/50 dark:border-sky-500/20",
      title: "שינויים במדיניות",
      items: [
        "אנו שומרים את הזכות לעדכן מדיניות זו מעת לעת.",
        "שינויים יפורסמו בעמוד זה.",
      ],
    },
    {
      icon: <Mail size={22} />,
      iconBg: "bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-100/50 dark:border-rose-500/20",
      title: "יצירת קשר",
      items: [
        "לשאלות בנוגע למדיניות זו ניתן לפנות אלינו בכתובת: noamhemo2001@gmail.com",
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-[#0c1222] pb-20 font-sans relative overflow-hidden animate-page-enter" dir="rtl">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 left-0 w-96 h-96 bg-sky-500/5 dark:bg-sky-500/8 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-4xl mx-auto px-6 pt-12 sm:pt-16 relative">
        {/* Back link */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-black dark:text-white hover:text-blue-600 dark:hover:text-blue-400 font-bold transition-colors text-sm"
          >
            <span>→</span>
            <span>חזרה לעמוד הראשי</span>
          </Link>
        </div>

        {/* Header */}
        <header className="mb-12 text-right">
          <div className="flex items-center gap-3 mb-4">
            <span className="p-2.5 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl border border-blue-100/50 dark:border-blue-500/20">
              <Shield size={24} />
            </span>
            <span className="text-sm font-black tracking-widest text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-500/10 px-3 py-1 rounded-full border border-blue-100/20 dark:border-blue-500/20">
              מדיניות פרטיות
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-tight mb-4">
            מדיניות פרטיות ותנאי שימוש — כמותיקס
          </h1>

          <p className="text-base sm:text-lg font-medium text-black dark:text-white leading-relaxed max-w-3xl">
            כמותיקס היא פלטפורמה דיגיטלית לתרגול ולמידה עצמית בתחום הפרק הכמותי בבחינה הפסיכומטרית.
          </p>
        </header>

        {/* Sections */}
        <div className="space-y-6">
          {sections.map((section, idx) => (
            <section
              key={idx}
              className="bg-white dark:bg-slate-800/70 p-7 sm:p-9 rounded-3xl shadow-[0_4px_20px_rgb(0,0,0,0.01)] dark:shadow-[0_4px_20px_rgb(0,0,0,0.15)] border border-slate-100/80 dark:border-slate-700/50 transition-all duration-200"
            >
              <div className="flex items-center gap-3 mb-5">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center border ${section.iconBg}`}
                >
                  {section.icon}
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  {section.title}
                </h2>
              </div>

              <ul className="space-y-3 mr-1">
                {section.items.map((item, itemIdx) => (
                  <li
                    key={itemIdx}
                    className="flex items-start gap-3 text-base text-black dark:text-white leading-relaxed font-medium"
                  >
                    <span className="mt-2 w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600 shrink-0"></span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        {/* Footer */}
        <footer className="mt-14 pt-8 border-t border-slate-200/60 dark:border-slate-700/50 text-center">
          <p className="text-sm font-bold text-black dark:text-white">
            עודכן לאחרונה: מאי 2025
          </p>
        </footer>
      </div>
    </div>
  );
}
