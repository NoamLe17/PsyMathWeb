"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, getDocs, query, orderBy } from "firebase/firestore";
import { PlayCircle, CheckCircle2, TrendingUp, Award, BookOpen, Clock, Loader2, BrainCircuit, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AboutStory from "@/components/AboutStory";

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  // נתוני הקורס התיאורטי
  const [chapters, setChapters] = useState<any[]>([]);
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const [totalLessons, setTotalLessons] = useState(0);

  // סטטיסטיקות תרגול וסימולציות
  const [practiceStats, setPracticeStats] = useState({ totalSolved: 0, correctAnswers: 0 });
  const [simulationCount, setSimulationCount] = useState(0);

  // נתוני רכישה ותוקף
  const [ownedCourses, setOwnedCourses] = useState<string[]>([]);
  const [purchaseDates, setPurchaseDates] = useState<any>({});

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");

    const fetchDashboardData = async () => {
      if (!user) return;
      try {
        // 1. שליפת מבנה הקורס התיאורטי
        let tempTotalLessons = 0;
        const q = query(collection(db, "chapters"), orderBy("order", "asc"));
        const snapshot = await getDocs(q);

        const fetchedChapters = await Promise.all(snapshot.docs.map(async (chapterDoc) => {
          const lessonsQ = query(collection(db, "chapters", chapterDoc.id, "lessons"), orderBy("order", "asc"));
          const lessonsSnap = await getDocs(lessonsQ);
          const lessons = lessonsSnap.docs.map(l => ({ id: l.id, ...l.data() }));
          tempTotalLessons += lessons.length;
          return { id: chapterDoc.id, ...chapterDoc.data(), lessons };
        }));

        setChapters(fetchedChapters);
        setTotalLessons(tempTotalLessons);

        // 2. שליפת ההתקדמות בתיאוריה, נתוני רכישה ותוקף מהמשתמש
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const uData = userDoc.data();
          const owned = uData.ownedCourses || [];
          const pDates = uData.purchaseDates || {};

          setOwnedCourses(owned);
          setPurchaseDates(pDates);

          const hasActiveCourse = owned.some((id: string) => {
            const pDateStr = pDates[id];
            if (!pDateStr) return true;
            const pDate = new Date(pDateStr);
            const expiryDate = new Date(pDate.getTime() + 150 * 24 * 60 * 60 * 1000);
            return expiryDate > new Date();
          });

          if (!hasActiveCourse) {
            router.push("/catalog");
            return;
          }
        } else {
          router.push("/catalog");
          return;
        }

        const progressDoc = await getDoc(doc(db, "userProgress", user.uid));
        if (progressDoc.exists()) {
          setCompletedLessons(progressDoc.data().completed || []);
        }

        // 3. שליפת נתוני התרגול העצמי מהקולקשן
        const practiceQ = query(collection(db, "users", user.uid, "progress"));
        const practiceSnap = await getDocs(practiceQ);
        let correctCount = 0;
        practiceSnap.docs.forEach(doc => {
          if (doc.data().isCorrect) correctCount++;
        });
        setPracticeStats({ totalSolved: practiceSnap.docs.length, correctAnswers: correctCount });

        // 4. שליפת כמות הסימולציות שהוגשו
        const simQ = query(collection(db, "users", user.uid, "simulations"));
        const simSnap = await getDocs(simQ);
        setSimulationCount(simSnap.docs.length);

      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user, authLoading, router]);

  if (authLoading || loading) return (
    <div className="min-h-screen flex flex-col gap-4 items-center justify-center bg-slate-50 dark:bg-slate-950">
      <Loader2 className="animate-spin text-blue-600 dark:text-blue-400" size={48} />
      <span className="text-sm font-bold text-black dark:text-white">טוען את לוח הבקרה...</span>
    </div>
  );

  let validCompletedLessonsCount = 0;
  chapters.forEach(chapter => {
    const chapterLessons = chapter.lessons || [];
    validCompletedLessonsCount += chapterLessons.filter((l: any) => completedLessons.includes(l.id)).length;
  });

  const overallCourseProgress = totalLessons > 0 ? Math.round((validCompletedLessonsCount / totalLessons) * 100) : 0;
  const accuracyRate = practiceStats.totalSolved > 0 ? Math.round((practiceStats.correctAnswers / practiceStats.totalSolved) * 100) : 0;

  return (
    <div className="min-h-screen bg-[var(--color-surface)] dark:bg-[#0c1222] pb-20 font-sans animate-page-enter" dir="rtl">
      {/* Header - Dark Canvas Premium look */}
      <div className="bg-slate-950 text-white pt-16 pb-28 px-6 rounded-b-[2.5rem] md:rounded-b-[3.5rem] relative overflow-hidden shadow-lg shadow-slate-900/10">
        {/* Ambient Orbs */}
        <div className="ambient-orb absolute top-0 right-0 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none -translate-y-1/3 animate-glow-pulse"></div>
        <div className="ambient-orb absolute bottom-0 left-0 w-80 h-80 bg-sky-500/15 rounded-full blur-3xl pointer-events-none translate-y-1/3 animate-glow-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="ambient-orb absolute top-1/2 left-1/3 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none animate-glow-pulse" style={{ animationDelay: '4s' }}></div>

        <div className="max-w-6xl mx-auto relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
          <div>
            <span className="text-sm font-black tracking-widest text-blue-400 uppercase bg-blue-950/80 border border-blue-900/50 px-3 py-1 rounded-full inline-block mb-3.5">
              כמותיקס • לוח בקרה אישי
            </span>
            <h1 className="text-3xl sm:text-4xl font-black mb-2 tracking-tight text-white font-display">
              שלום, {user?.displayName || "סטודנט/ית"} 👋
            </h1>
            <p className="text-black dark:text-white text-sm sm:text-base font-medium">
              מוכנים לעוד תרגול פסיכומטרי מנצח? הנה סיכום ההישגים וההתקדמות שלכם.
            </p>
          </div>

          <div className="flex flex-col gap-3 w-full md:w-auto mt-6 md:mt-0 min-w-[240px] sm:min-w-[280px]">
            <Link
              href="/practice"
              className="w-full px-8 py-4 bg-gradient-to-r from-blue-600 to-sky-500 text-white rounded-2xl font-black text-base hover:shadow-lg hover:shadow-blue-500/25 hover:-translate-y-0.5 transition-all duration-300 active:scale-95 flex items-center justify-between gap-4 cursor-pointer shadow-md"
            >
              <span> המשך לתרגול מקוון</span>
              <ChevronLeft size={20} />
            </Link>
            <Link
              href="/course"
              className="w-full px-8 py-4 bg-white/10 hover:bg-white/15 backdrop-blur-md text-white border border-white/10 rounded-2xl font-black text-base hover:shadow-lg hover:shadow-white/5 hover:-translate-y-0.5 transition-all duration-300 active:scale-95 flex items-center justify-between gap-4 cursor-pointer"
            >
              <span>מעבר לשיעור פעיל</span>
              <ChevronLeft size={20} />
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 -mt-14 relative z-20 space-y-10">

        {/* כרטיסיות סטטיסטיקה */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 stagger-children">

          {/* התקדמות בקורס */}
          <div className="glass-card bg-white/80 dark:bg-slate-800/50 p-6 rounded-3xl shadow-[0_4px_20px_-4px_rgba(15,23,42,0.03)] dark:shadow-slate-950/20 border border-slate-100 dark:border-slate-700/50 hover:shadow-lg hover:border-blue-100 dark:hover:border-blue-500/30 hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between group backdrop-blur-sm">
            <div className="flex items-center justify-between mb-6">
              <span className="text-black dark:text-white text-sm font-bold">התקדמות בקורס</span>
              <div className="w-10 h-10 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center border border-blue-100/30 dark:border-blue-500/20 group-hover:scale-110 transition-transform"><TrendingUp size={20} /></div>
            </div>
            <div>
              <div className="text-4xl font-black text-slate-900 dark:text-white mb-1 tracking-tight">{overallCourseProgress}%</div>
              <p className="text-sm text-black dark:text-white font-bold">מכלל שיעורי התיאוריה</p>
            </div>
          </div>

          {/* דיוק בתרגול */}
          <div className="glass-card bg-white/80 dark:bg-slate-800/50 p-6 rounded-3xl shadow-[0_4px_20px_-4px_rgba(15,23,42,0.03)] dark:shadow-slate-950/20 border border-slate-100 dark:border-slate-700/50 hover:shadow-lg hover:border-emerald-100 dark:hover:border-emerald-500/30 hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between group backdrop-blur-sm">
            <div className="flex items-center justify-between mb-6">
              <span className="text-black dark:text-white text-sm font-bold">אחוז דיוק</span>
              <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center border border-emerald-100/30 dark:border-emerald-500/20 group-hover:scale-110 transition-transform"><Award size={20} /></div>
            </div>
            <div>
              <div className="text-4xl font-black text-slate-900 dark:text-white mb-1 tracking-tight">{accuracyRate}%</div>
              <p className="text-sm text-black dark:text-white font-bold">{practiceStats.correctAnswers} תשובות נכונות</p>
            </div>
          </div>

          {/* שאלות שנפתרו */}
          <div className="glass-card bg-white/80 dark:bg-slate-800/50 p-6 rounded-3xl shadow-[0_4px_20px_-4px_rgba(15,23,42,0.03)] dark:shadow-slate-950/20 border border-slate-100 dark:border-slate-700/50 hover:shadow-lg hover:border-amber-100 dark:hover:border-amber-500/30 hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between group backdrop-blur-sm">
            <div className="flex items-center justify-between mb-6">
              <span className="text-black dark:text-white text-sm font-bold">שאלות שנפתרו</span>
              <div className="w-10 h-10 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center justify-center border border-amber-100/30 dark:border-amber-500/20 group-hover:scale-110 transition-transform"><BrainCircuit size={20} /></div>
            </div>
            <div>
              <div className="text-4xl font-black text-slate-900 dark:text-white mb-1 tracking-tight">{practiceStats.totalSolved}</div>
              <p className="text-sm text-black dark:text-white font-bold">שאלות בתרגול העצמי</p>
            </div>
          </div>

          {/* סימולציות */}
          <div className="glass-card bg-white/80 dark:bg-slate-800/50 p-6 rounded-3xl shadow-[0_4px_20px_-4px_rgba(15,23,42,0.03)] dark:shadow-slate-950/20 border border-slate-100 dark:border-slate-700/50 hover:shadow-lg hover:border-indigo-100 dark:hover:border-indigo-500/30 hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between group backdrop-blur-sm">
            <div className="flex items-center justify-between mb-6">
              <span className="text-black dark:text-white text-sm font-bold">סימולציות מלאות</span>
              <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center border border-indigo-100/30 dark:border-indigo-500/20 group-hover:scale-110 transition-transform"><Clock size={20} /></div>
            </div>
            <div>
              <div className="text-4xl font-black text-slate-900 dark:text-white mb-1 tracking-tight">{simulationCount}</div>
              <p className="text-sm text-black dark:text-white font-bold">פרקים כמותיים שהוגשו</p>
            </div>
          </div>

        </div>

        {/* התקדמות התיאוריה - פרקים */}
        <div className="bg-white dark:bg-slate-900/80 p-6 sm:p-10 rounded-3xl shadow-[0_4px_20px_-4px_rgba(15,23,42,0.03)] dark:shadow-slate-950/20 border border-slate-100/80 dark:border-slate-700/50 backdrop-blur-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center"><BookOpen size={20} /></div>
              <h2 className="text-2xl font-black text-black dark:text-white tracking-tight font-display">תוכנית הלימודים בכמותיקס</h2>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {chapters.map((chapter) => {
              const chapterLessons = chapter.lessons || [];
              const completedInChapter = chapterLessons.filter((l: any) => completedLessons.includes(l.id)).length;
              const chapterProgress = chapterLessons.length > 0 ? Math.round((completedInChapter / chapterLessons.length) * 100) : 0;
              const isFinished = chapterProgress === 100;

              return (
                <Link key={chapter.id} href="/course" className="block group">
                  <div className={`p-6 rounded-2xl border-2 transition-all duration-300 flex flex-col justify-between h-full ${isFinished
                      ? 'bg-emerald-50/20 dark:bg-emerald-500/5 border-emerald-100/70 dark:border-emerald-500/20 hover:border-emerald-300 dark:hover:border-emerald-500/40 hover:bg-emerald-50/40 dark:hover:bg-emerald-500/10'
                      : 'bg-[#f8fafc]/30 dark:bg-slate-800/30 border-slate-100 dark:border-slate-700/50 hover:border-blue-100/80 dark:hover:border-blue-500/30 hover:bg-white dark:hover:bg-slate-800/60 hover:shadow-md dark:hover:shadow-slate-950/10'
                    }`}>
                    <div>
                      <div className="flex justify-between items-start mb-6 gap-3">
                        <div className="flex flex-col">
                          <h3 className="font-extrabold text-black dark:text-white dark:text-slate-200 text-base leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {chapter.title}
                          </h3>
                          {(() => {
                            // חישוב תוקף הקורס
                            const hasFullBundle = ownedCourses.includes("full-bundle");
                            const hasThisCourse = ownedCourses.includes(chapter.id);

                            // אם אין לו את הקורס בשום צורה, לא נציג תוקף
                            if (!hasFullBundle && !hasThisCourse && ownedCourses.length > 0) {
                              return <span className="text-xs text-slate-500 mt-1">לא נרכש</span>;
                            }

                            // אם זה קורס פתוח לכולם (או שיש לו אותו)
                            const pDateStr = hasFullBundle ? (purchaseDates["full-bundle"] || purchaseDates[chapter.id]) : purchaseDates[chapter.id];
                            if (!pDateStr && !hasFullBundle && !hasThisCourse) return null; // אין מידע

                            // אם יש לו אבל חסר תאריך רכישה מהעבר, נניח שהתוקף מלא לעכשיו
                            const effectiveDateStr = pDateStr || new Date().toISOString();
                            const pDate = new Date(effectiveDateStr);
                            const expiryDate = new Date(pDate.getTime() + 150 * 24 * 60 * 60 * 1000);
                            const now = new Date();
                            const diffDays = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

                            if (diffDays > 0) {
                              return <span className="text-xs text-emerald-500 dark:text-emerald-400 mt-1 font-bold">(בתוקף לעוד {diffDays} ימים)</span>;
                            } else {
                              return <span className="text-xs text-red-500 mt-1 font-bold">(פג תוקף)</span>;
                            }
                          })()}
                        </div>
                        {isFinished ? (
                          <span className="w-6 h-6 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center shrink-0 shadow-sm"><CheckCircle2 size={16} /></span>
                        ) : (
                          <span className="w-6 h-6 text-black dark:text-white group-hover:text-blue-500 dark:group-hover:text-blue-400 rounded-full flex items-center justify-center shrink-0 transition-colors"><PlayCircle size={18} /></span>
                        )}
                      </div>
                    </div>

                    <div className="mt-auto">
                      <div className="flex justify-between text-sm mb-2">
                        <span className={isFinished ? "text-emerald-600 dark:text-emerald-400 font-bold" : "text-black dark:text-white font-bold"}>
                          {completedInChapter} מתוך {chapterLessons.length} שיעורים
                        </span>
                        <span className={isFinished ? "text-emerald-700 dark:text-emerald-300 font-extrabold" : "text-black dark:text-white font-extrabold"}>
                          {chapterProgress}%
                        </span>
                      </div>

                      <div className="h-2 w-full bg-slate-200/70 dark:bg-slate-700/50 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-1000 ${isFinished ? 'bg-gradient-to-r from-emerald-500 to-teal-400' : 'bg-gradient-to-r from-blue-600 to-sky-500'
                            }`}
                          style={{ width: `${chapterProgress}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
      
      {/* אזור "הסיפור שלנו" */}
      <AboutStory />
    </div>
  );
}