import React from "react";
import { Sparkles, Heart } from "lucide-react";

export default function AboutStory() {
  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 mt-16 mb-8 animate-fade-in" dir="rtl">
      <div className="bg-gradient-to-br from-blue-50/50 to-sky-50/50 dark:from-slate-900/50 dark:to-slate-800/50 border border-blue-100/50 dark:border-slate-800 rounded-[2.5rem] p-8 sm:p-12 relative overflow-hidden backdrop-blur-sm shadow-lg shadow-slate-200/20 dark:shadow-slate-950/20">
        {/* Ambient orbs */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 dark:bg-blue-500/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-sky-500/10 dark:bg-sky-500/10 rounded-full blur-3xl pointer-events-none translate-y-1/2 -translate-x-1/3"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 md:gap-12">
          <div className="w-20 h-20 sm:w-24 sm:h-24 shrink-0 bg-white dark:bg-slate-800 rounded-full shadow-xl shadow-blue-500/10 flex items-center justify-center border border-slate-100 dark:border-slate-700">
            <Heart className="w-10 h-10 text-blue-500 dark:text-blue-400" />
          </div>
          
          <div className="text-center md:text-right">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mb-4 tracking-tight flex items-center justify-center md:justify-start gap-3">
              הסיפור מאחורי כמותיקס
              <Sparkles className="text-amber-400" size={24} />
            </h2>
            <div className="space-y-4 text-slate-700 dark:text-slate-300 font-medium text-base sm:text-lg leading-relaxed max-w-4xl">
              <p>
                היי, אני סטודנט להנדסה, ואני יודע ממקור ראשון כמה קשה ותובעני יכול להיות תהליך הלמידה למבחן הפסיכומטרי – ובמיוחד ההתמודדות עם הפרק הכמותי. 
              </p>
              <p>
                שמתי לב שהרשת אמנם מלאה בתכנים מצוינים שעוזרים, אבל היה חסר לי מקום אחד שבאמת שם את הדגש <strong className="text-blue-600 dark:text-blue-400 font-black">רק על הפרק הכמותי</strong>. מקום שמשלב גם תיאוריה מקיפה וגם תרגול חכם, בתוך מערכת נוחה, קלה לשימוש וכזו שזמינה תמיד, מכל מכשיר.
              </p>
              <p>
                ככה נולדה המערכת הזו – מתוך רצון אמיתי להעניק לכם את הכלי המדויק והטוב ביותר שיעזור לכם למקסם את היכולות שלכם, בשפה אנושית, חברית, ועם המון אכפתיות להצלחה שלכם.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
