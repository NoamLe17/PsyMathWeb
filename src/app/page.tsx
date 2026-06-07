"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { 
  Tv, Sparkles, CheckSquare, ShieldCheck, PlayCircle, 
  HelpCircle, ArrowLeft, GraduationCap, ArrowRight, BookOpen, 
  Layers, Percent, ChevronLeft
} from "lucide-react";

// ייבוא הרכיבים השונים
import MyCourses from "@/components/MyCourses";
import CourseCatalog from "@/components/CourseCatalog";
import CourseCheckout from "@/components/CourseCheckout";

export default function HomePage() {
  const { user } = useAuth();
  const router = useRouter();
  
  // ניהול המצבים של הדף: "splash" | "home" | "my-courses" | "catalog" | "checkout"
  const [currentView, setCurrentView] = useState("splash");
  
  // שמירת פרטי הקורס שהמשתמש בחר לקנות
  const [selectedCourse, setSelectedCourse] = useState(null);

  // ---------------------------------------------------------
  // 1. מסך פתיחה (Splash View) - מעודכן ויוקרתי
  // ---------------------------------------------------------
  if (currentView === "splash") {
    return (
      <main className="min-h-screen bg-slate-950 flex flex-col items-center justify-center relative overflow-hidden" dir="rtl">
        {/* הילות אור זוחלות ברקע */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/20 rounded-full blur-[120px] animate-glow-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-sky-500/20 rounded-full blur-[120px] animate-glow-pulse [animation-delay:2s]"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[30%] h-[30%] bg-indigo-500/10 rounded-full blur-[100px] animate-float-slow"></div>

        <div className="z-10 text-center px-6 max-w-4xl animate-page-enter">
          <span className="inline-flex items-center gap-1.5 px-5 py-2 mb-8 bg-blue-500/10 text-sky-400 border border-blue-500/20 rounded-full text-sm font-black tracking-wide uppercase backdrop-blur-sm">
            <Sparkles size={14} className="text-sky-400" />
            <span>הדרך לציון 800 מתחילה כאן</span>
          </span>
          
          <h1 className="text-5xl md:text-8xl font-black text-white mb-8 tracking-tight leading-tight font-display">
            הדרך החכמה לציון <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-sky-300">מושלם</span> בכמותי
          </h1>
          
          <p className="text-lg md:text-xl text-black dark:text-white max-w-2xl mx-auto mb-14 leading-relaxed font-medium">
            גלו את מערכת הלמידה שמחליפה את שיטות הלימוד הישנות. כלים דיגיטליים מתקדמים, תרגול מותאם אישית וסרטונים ברמה הגבוהה ביותר — הכל במקום אחד.
          </p>
          
          <button 
            onClick={() => setCurrentView("home")}
            className="group px-12 py-5 bg-gradient-to-r from-blue-600 to-sky-500 text-white rounded-full font-black text-2xl shadow-xl shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer flex items-center gap-3 mx-auto"
          >
            <span>היכנסו ללמוד</span>
            <ArrowLeft className="group-hover:-translate-x-1.5 transition-transform" size={24} />
          </button>
        </div>
      </main>
    );
  }

  // ---------------------------------------------------------
  // 2. מסך הקורסים שלי
  // ---------------------------------------------------------
  if (currentView === "my-courses") {
    return <MyCourses setCurrentView={setCurrentView} user={user} />;
  }

  // ---------------------------------------------------------
  // 3. מסך קטלוג הקורסים
  // ---------------------------------------------------------
  if (currentView === "catalog") {
    return (
      <CourseCatalog 
        setCurrentView={setCurrentView} 
        setSelectedCourse={setSelectedCourse} 
      />
    );
  }

  // ---------------------------------------------------------
  // 4. מסך התשלום (Checkout)
  // ---------------------------------------------------------
  if (currentView === "checkout") {
    return (
      <CourseCheckout 
        setCurrentView={setCurrentView} 
        course={selectedCourse} 
        user={user}
      />
    );
  }

  // ---------------------------------------------------------
  // 5. מסך הבית המרכזי (Home Hero View) - משודרג
  // ---------------------------------------------------------
  return (
    <main className="min-h-screen bg-slate-50/30 dark:bg-[#0c1222] overflow-hidden transition-colors duration-300" dir="rtl">
      
      {/* אזור ה-Hero */}
      <section className="relative pt-20 pb-24 px-4 sm:px-6">
        {/* הילות עיצוביות ברקע */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10">
          <div className="absolute top-[-15%] left-[-15%] w-[45%] h-[45%] bg-blue-100/50 dark:bg-blue-600/15 rounded-full blur-[100px] transition-colors"></div>
          <div className="absolute bottom-[10%] right-[-10%] w-[35%] h-[35%] bg-sky-100/50 dark:bg-sky-500/15 rounded-full blur-[100px] transition-colors"></div>
        </div>

        <div className="max-w-6xl mx-auto text-center animate-page-enter">
          <div className="inline-flex items-center gap-1.5 px-4 py-1.5 mb-8 bg-blue-50 dark:bg-blue-500/10 border border-blue-100/70 dark:border-blue-500/20 rounded-full transition-colors">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
            <span className="text-blue-600 dark:text-sky-400 text-sm font-black tracking-wide uppercase">הפלטפורמה המתקדמת בישראל</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-black text-slate-900 dark:text-white mb-8 tracking-tight leading-none font-display transition-colors">
            לנצח את ה-<span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-sky-500">כמותי</span> <br /> 
            בלי לצאת מהבית
          </h1>
          
          <p className="text-lg md:text-xl text-black dark:text-white max-w-3xl mx-auto mb-14 leading-relaxed font-medium transition-colors">
            קורסי וידאו אינטראקטיביים מעולים, מנוע תרגול חכם עצמאי וסימולציות מלאות שיביאו אותך לציון שאתה שואף אליו. פותח במיוחד עבור דור הלומדים החדש.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            {user ? (
              <button 
                onClick={() => router.push("/dashboard")}
                className="px-12 py-4.5 bg-gradient-to-r from-blue-600 to-sky-500 text-white rounded-2xl font-black text-xl shadow-lg shadow-blue-100 dark:shadow-blue-900/30 hover:shadow-blue-200 dark:hover:shadow-blue-800/40 hover:-translate-y-1 transition-all duration-300 cursor-pointer flex items-center gap-2 active:scale-95"
              >
                <span>אל הקורסים שלי</span>
                <ArrowLeft size={20} />
              </button>
            ) : (
              <>
                <Link href="/register" className="px-10 py-4.5 bg-gradient-to-r from-blue-600 to-sky-500 text-white rounded-2xl font-black text-xl shadow-lg shadow-blue-100 dark:shadow-blue-900/30 hover:shadow-blue-200 dark:hover:shadow-blue-800/40 hover:-translate-y-1 transition-all duration-300 w-full sm:w-auto text-center active:scale-95">
                  התחל ללמוד בחינם
                </Link>
                <Link href="/login" className="px-10 py-4.5 bg-white dark:bg-slate-800 text-black dark:text-white dark:text-slate-200 border-2 border-slate-200/80 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 rounded-2xl font-black text-xl hover:bg-slate-50 dark:hover:bg-slate-700/80 transition-all duration-300 w-full sm:w-auto text-center active:scale-95">
                  יש לי כבר חשבון
                </Link>
              </>
            )}
          </div>

          {/* לוח נתונים סטטיסטי (Stats Grid) */}
          <div className="mt-24 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto border-t border-slate-200/60 dark:border-slate-700/50 pt-12">
            <div className="p-4">
              <div className="text-4xl font-black text-black dark:text-white tracking-tight transition-colors">400+</div>
              <div className="text-sm text-black dark:text-white font-black uppercase tracking-wider mt-1 transition-colors">סרטוני לימוד איכותיים</div>
            </div>
            <div className="p-4">
              <div className="text-4xl font-black text-black dark:text-white tracking-tight transition-colors">2.5k+</div>
              <div className="text-sm text-black dark:text-white font-black uppercase tracking-wider mt-1 transition-colors">שאלות ומטלות לתרגול</div>
            </div>
            <div className="p-4">
              <div className="text-4xl font-black text-black dark:text-white tracking-tight transition-colors">100%</div>
              <div className="text-sm text-black dark:text-white font-black uppercase tracking-wider mt-1 transition-colors">למידה דיגיטלית מותאמת</div>
            </div>
            <div className="p-4">
              <div className="text-4xl font-black text-black dark:text-white tracking-tight transition-colors">24/7</div>
              <div className="text-sm text-black dark:text-white font-black uppercase tracking-wider mt-1 transition-colors">זמינות מלאה מכל מכשיר</div>
            </div>
          </div>

        </div>
      </section>

      {/* מדור תכונות עיקריות (Features Section) */}
      <section className="bg-white dark:bg-slate-900/50 py-24 border-t border-slate-100 dark:border-slate-800 transition-colors">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white mb-4 tracking-tight transition-colors">הכירו את כלי הלמידה בכמותיקס</h2>
            <p className="text-black dark:text-white font-bold max-w-xl mx-auto transition-colors">בנינו את כל הכלים הדרושים לך כדי לקבל 150 בחלק הכמותי</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* כרטיס תכונה 1 */}
            <div className="bg-slate-50 dark:bg-slate-800/60 p-8 rounded-3xl border border-slate-100 dark:border-slate-700/50 hover:shadow-xl hover:shadow-slate-100 dark:hover:shadow-slate-900/50 hover:-translate-y-1 transition-all duration-300">
              <div className="w-12 h-12 bg-blue-50 dark:bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400 mb-6 transition-colors">
                <BookOpen size={24} />
              </div>
              <h3 className="text-xl font-bold text-black dark:text-white dark:text-slate-100 mb-3 transition-colors">קורס וידאו מלא</h3>
              <p className="text-black dark:text-white text-sm leading-relaxed transition-colors">
                פרקים מפורטים באלגברה, גיאומטריה ובעיות כמותיות. הסברים פשוטים ואינטואיטיביים לכל שאלה מורכבת.
              </p>
            </div>

            {/* כרטיס תכונה 2 */}
            <div className="bg-slate-50 dark:bg-slate-800/60 p-8 rounded-3xl border border-slate-100 dark:border-slate-700/50 hover:shadow-xl hover:shadow-slate-100 dark:hover:shadow-slate-900/50 hover:-translate-y-1 transition-all duration-300">
              <div className="w-12 h-12 bg-sky-50 dark:bg-sky-500/10 rounded-2xl flex items-center justify-center text-sky-500 dark:text-sky-400 mb-6 transition-colors">
                <Sparkles size={24} />
              </div>
              <h3 className="text-xl font-bold text-black dark:text-white dark:text-slate-100 mb-3 transition-colors">תרגול חכם מותאם</h3>
              <p className="text-black dark:text-white text-sm leading-relaxed transition-colors">
                מנוע תרגול חכם ללא הגבלת זמן. קבל פידבק מיידי והסבר פתרון מעמיק לכל שאלה כדי להפנים טכניקה.
              </p>
            </div>

            {/* כרטיס תכונה 3 */}
            <div className="bg-slate-50 dark:bg-slate-800/60 p-8 rounded-3xl border border-slate-100 dark:border-slate-700/50 hover:shadow-xl hover:shadow-slate-100 dark:hover:shadow-slate-900/50 hover:-translate-y-1 transition-all duration-300">
              <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-6 transition-colors">
                <Tv size={24} />
              </div>
              <h3 className="text-xl font-bold text-black dark:text-white dark:text-slate-100 mb-3 transition-colors">סימולציות בחינה</h3>
              <p className="text-black dark:text-white text-sm leading-relaxed transition-colors">
                פרקים מלאים של 20 שאלות ב-20 דקות תחת טיימר יורד מדויק. בסיום המבחן תקבל ציון, ותוכל לבצע תחקור מקיף.
              </p>
            </div>

          </div>
        </div>
      </section>

    </main>
  );
}
