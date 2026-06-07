"use client";
import Link from "next/link";
import { Zap, Timer, Target, Trophy, ChevronLeft, ShieldAlert } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function PracticeSelectionPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const validateAccess = async () => {
      if (!loading && !user) {
        router.push("/catalog");
        return;
      }
      if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const uData = userDoc.data();
          const owned = uData.ownedCourses || [];
          const purchaseDates = uData.purchaseDates || {};
          
          const hasActiveCourse = owned.some((id: string) => {
            const pDateStr = purchaseDates[id];
            if (!pDateStr) return true;
            const pDate = new Date(pDateStr);
            const expiryDate = new Date(pDate.getTime() + 150 * 24 * 60 * 60 * 1000);
            return expiryDate > new Date();
          });
          
          if (!hasActiveCourse) {
            router.push("/catalog");
          }
        } else {
          router.push("/catalog");
        }
      }
    };
    validateAccess();
  }, [user, loading, router]);

  if (loading) return null;

  return (
    <div className="min-h-screen bg-[var(--color-surface)] dark:bg-[#0c1222] p-6 sm:p-8 animate-page-enter" dir="rtl">
      <div className="max-w-5xl mx-auto pt-12">
        <header className="mb-16 text-center">
          <span className="text-sm font-black tracking-widest text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-3 py-1 rounded-full inline-block mb-3.5 border border-blue-100/30 dark:border-blue-500/20">
            כמותיקס • מנוע תרגול חכם
          </span>
          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white mb-4 tracking-tight font-display">מרכז התרגול</h1>
          <p className="text-lg text-black dark:text-white font-medium max-w-lg mx-auto leading-relaxed">
            &quot;ככל שמתאמנים יותר - המזל משתפר.&quot; בחרו את שיטת הלמידה המתאימה לכם ביותר כרגע.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          
          {/* מצב תרגול עצמי (בהיר ויוקרתי) */}
          <Link href="/practice/self" className="group">
            <div className="glass-card bg-white/80 dark:bg-slate-800/60 p-8 sm:p-10 rounded-[2.5rem] border border-slate-100/80 dark:border-slate-700/50 shadow-[0_4px_25px_-5px_rgba(15,23,42,0.02)] dark:shadow-slate-950/20 hover:shadow-2xl hover:shadow-blue-500/5 dark:hover:shadow-blue-500/10 hover:border-blue-200/50 dark:hover:border-blue-500/30 hover:-translate-y-1 transition-all duration-300 h-full flex flex-col relative overflow-hidden backdrop-blur-sm">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-2xl pointer-events-none"></div>
              
              <div className="w-16 h-16 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-2xl mb-8 flex items-center justify-center border border-blue-100/30 dark:border-blue-500/20 group-hover:rotate-6 transition-transform shadow-sm">
                <Target size={30} />
              </div>
              
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <h2 className="text-2xl sm:text-3xl font-black text-black dark:text-white tracking-tight font-display">תרגול עצמי חופשי</h2>
                <span className="text-sm font-black bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-md border border-blue-100/20 dark:border-blue-500/20">ללא הגבלת זמן</span>
              </div>
              
              <p className="text-black dark:text-white text-sm sm:text-base leading-relaxed mb-8 font-medium">
                תרגול חופשי ללא לחץ זמנים. קבלו פידבק מיידי, ניתוח פתרון והסברים מפורטים עם טיפים ייחודיים על כל שאלה כדי להבין את הטכניקה הכמותית המנצחת.
              </p>
              
              <div className="mt-auto flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-extrabold text-sm sm:text-base group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors">
                <span>התחל תרגול חופשי</span>
                <ChevronLeft size={16} className="transition-transform group-hover:-translate-x-1" />
              </div>
            </div>
          </Link>

          {/* מצב סימולציה (כהה ממוקד) */}
          <Link href="/practice/simulation" className="group">
            <div className="bg-slate-950 dark:bg-slate-900/80 p-8 sm:p-10 rounded-[2.5rem] shadow-xl hover:shadow-2xl hover:shadow-blue-500/10 hover:border-slate-800 dark:hover:border-slate-600 hover:-translate-y-1 transition-all duration-300 h-full flex flex-col text-white relative overflow-hidden border border-slate-900 dark:border-slate-700/50 backdrop-blur-sm">
              {/* Ambient glow */}
              <div className="ambient-orb absolute top-0 right-0 w-48 h-48 bg-blue-600/10 rounded-full blur-3xl pointer-events-none animate-glow-pulse"></div>
              <div className="ambient-orb absolute bottom-0 left-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none animate-glow-pulse" style={{ animationDelay: '3s' }}></div>
              
              <div className="w-16 h-16 bg-blue-500 text-white rounded-2xl mb-8 flex items-center justify-center group-hover:scale-105 transition-transform shadow-lg shadow-blue-500/20 border border-blue-400/20">
                <Timer size={30} />
              </div>
              
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white font-display">סימולציית מבחן מלאה</h2>
                <span className="text-sm font-black bg-red-500/15 text-red-400 px-2 py-0.5 rounded-md border border-red-500/20">מדמה בחינה</span>
              </div>
              
              <p className="text-black dark:text-white text-sm sm:text-base leading-relaxed mb-8 font-medium">
                20 שאלות, 20 דקות. בדיוק כמו בפרק כמותי של הבחינה הפסיכומטרית האמיתית. ללא עזרים, ללא הסברים מיידיים. המבחן יסתיים אוטומטית כאשר הזמן ייגמר.
              </p>
              
              <div className="mt-auto flex items-center gap-1.5 text-sky-400 font-extrabold text-sm sm:text-base group-hover:text-sky-300 transition-colors">
                <span>כניסה למצב בחינה מהירה</span>
                <ChevronLeft size={16} className="transition-transform group-hover:-translate-x-1" />
              </div>
            </div>
          </Link>

        </div>
      </div>
    </div>
  );
}