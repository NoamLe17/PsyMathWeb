"use client";
import { useState, useEffect } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { Calculator, Compass, Clock, Sparkles, ArrowLeft, ArrowUpRight, GraduationCap, Calendar, BookOpen } from "lucide-react";

interface MyCoursesProps {
  setCurrentView: (view: string) => void;
  user: any;
}

const COURSES_INFO = [
  { id: "algebra", title: "אלגברה - הפרק המלא", icon: Calculator, color: "text-blue-600 bg-blue-50 border-blue-100/40 dark:text-blue-400 dark:bg-blue-500/10 dark:border-blue-500/20", expiry: "ללא הגבלה" },
  { id: "geometry", title: "גיאומטריה מהיסוד", icon: Compass, color: "text-sky-600 bg-sky-50 border-sky-100/40 dark:text-sky-400 dark:bg-sky-500/10 dark:border-sky-500/20", expiry: "ללא הגבלה" },
  { id: "word-problems", title: "בעיות מילוליות", icon: Clock, color: "text-indigo-600 bg-indigo-50 border-indigo-100/40 dark:text-indigo-400 dark:bg-indigo-500/10 dark:border-indigo-500/20", expiry: "ללא הגבלה" },
  { id: "full-bundle", title: "החבילה הכמותית המלאה", icon: Sparkles, color: "text-amber-600 bg-amber-50 border-amber-100/40 dark:text-amber-400 dark:bg-amber-500/10 dark:border-amber-500/20", expiry: "ללא הגבלה" }
];

export default function MyCourses({ setCurrentView, user }: MyCoursesProps) {
  const [ownedCourses, setOwnedCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchUserCourses = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      
      try {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const userData = docSnap.data();
          const userCourseIds = userData.ownedCourses || [];
          const purchaseDates = userData.purchaseDates || {};
          let needsDbUpdate = false;
          
          const coursesToDisplay = COURSES_INFO.filter(c => userCourseIds.includes(c.id)).map(c => {
            let pDateStr = purchaseDates[c.id];
            // תמיכה לאחור בקורסים ישנים שנקנו לפני תוספת התאריכים
            if (!pDateStr) {
              pDateStr = new Date().toISOString();
              purchaseDates[c.id] = pDateStr;
              needsDbUpdate = true;
            }
            
            const pDate = new Date(pDateStr);
            const expiryDate = new Date(pDate.getTime() + 150 * 24 * 60 * 60 * 1000);
            const now = new Date();
            const diffTime = expiryDate.getTime() - now.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            let expiryText = "";
            let isExpired = false;
            
            if (diffDays > 0) {
              expiryText = `הקורס בתוקף לעוד ${diffDays} ימים`;
            } else {
              expiryText = "פג תוקף";
              isExpired = true;
            }

            return { ...c, expiry: expiryText, diffDays, isExpired };
          });

          if (needsDbUpdate) {
            updateDoc(docRef, { purchaseDates }).catch(e => console.error("Error updating old purchases", e));
          }
          
          setOwnedCourses(coursesToDisplay);
        }
      } catch (error) {
        console.error("Error fetching courses:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserCourses();
  }, [user]);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50/30 dark:bg-[#0c1222] py-12 flex items-center justify-center transition-colors duration-300">
        <div className="flex flex-col items-center gap-4 text-black dark:text-white font-bold">
          <div className="w-10 h-10 border-4 border-blue-600 dark:border-sky-400 border-t-transparent rounded-full animate-spin"></div>
          <span>טוען את הקורסים שלך...</span>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50/30 dark:bg-[#0c1222] py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300 animate-page-enter" dir="rtl">
      <div className="max-w-5xl mx-auto">
        
        {/* כותרת וכפתור חזרה */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-12 gap-6 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div>
            <span className="text-xs font-bold text-blue-600 dark:text-blue-400 tracking-wider bg-blue-50 dark:bg-blue-500/10 px-3 py-1 rounded-full">האזור האישי כמותיקס</span>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white mt-3 mb-2 tracking-tight">הקורסים שלי</h1>
            <p className="text-black dark:text-white text-base sm:text-lg">
              שלום <span className="font-bold text-black dark:text-white dark:text-slate-200">{user?.displayName || "סטודנט/ית"}</span>, כאן מרוכזים כל התכנים שפתוחים עבורכם ללמידה.
            </p>
          </div>
          <button 
            onClick={() => setCurrentView("home")}
            className="group px-5 py-2.5 bg-white dark:bg-slate-800 text-black dark:text-white hover:text-blue-600 dark:hover:text-blue-400 font-bold text-sm rounded-full border border-slate-200/80 dark:border-slate-700 shadow-[0_2px_8px_-3px_rgba(15,23,42,0.05)] dark:shadow-none hover:shadow-md transition-all duration-300 flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <span>חזרה לדף הראשי</span>
            <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
          </button>
        </div>

        {ownedCourses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 stagger-children">
            {ownedCourses.map((course, index) => {
              const Icon = course.icon;
              return (
                <div 
                  key={index} 
                  className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.03)] dark:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.2)] border border-slate-100 dark:border-slate-800 hover:shadow-xl dark:hover:shadow-slate-950/40 hover:border-blue-100/60 dark:hover:border-blue-500/30 transition-all duration-300 flex flex-col group"
                >
                  <div className={`w-full h-40 rounded-xl mb-6 flex items-center justify-center border shadow-inner group-hover:scale-[1.02] transition-transform duration-300 ${course.color}`}>
                    <Icon size={44} className="stroke-[1.5]" />
                  </div>
                  
                  <h3 className="text-xl font-extrabold text-black dark:text-white dark:text-slate-100 mb-2 leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {course.title} <span className="text-sm font-normal text-slate-500 dark:text-slate-400">({course.expiry})</span>
                  </h3>
                  
                  <div className="flex items-center gap-2 text-black dark:text-white text-sm font-bold mb-6">
                    <Calendar size={13} className={course.isExpired ? "text-red-500" : "text-emerald-500"} />
                    <span className={course.isExpired ? "text-red-500" : "text-emerald-600 dark:text-emerald-400"}>
                      {course.expiry}
                    </span>
                  </div>
                  
                  <button 
                    onClick={() => !course.isExpired && router.push("/dashboard")}
                    disabled={course.isExpired}
                    className={`w-full py-3.5 text-white rounded-xl font-black text-sm transition-all flex items-center justify-center gap-2 mt-auto ${
                      course.isExpired 
                        ? "bg-slate-400 dark:bg-slate-700 cursor-not-allowed opacity-70" 
                        : "bg-gradient-to-r from-blue-600 to-sky-500 hover:shadow-lg hover:shadow-blue-500/25 cursor-pointer active:scale-95 shadow-sm"
                    }`}
                  >
                    <span>{course.isExpired ? "הקורס פג תוקף" : "המשך למידה"}</span>
                    {!course.isExpired && <ArrowUpRight size={16} />}
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-10 sm:p-16 text-center shadow-[0_4px_25px_-5px_rgba(15,23,42,0.03)] dark:shadow-[0_4px_25px_-5px_rgba(0,0,0,0.2)] border border-slate-100 dark:border-slate-800 max-w-2xl mx-auto mt-6 flex flex-col items-center transition-colors duration-300">
            <div className="w-20 h-20 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-3xl flex items-center justify-center mb-6 shadow-sm">
              <GraduationCap size={40} className="stroke-[1.5]" />
            </div>
            
            <h2 className="text-2xl font-black text-black dark:text-white dark:text-slate-100 mb-3 tracking-tight">עדיין לא נרשמתם לאף קורס</h2>
            <p className="text-black dark:text-white max-w-md mx-auto mb-8 leading-relaxed font-medium text-sm sm:text-base">
              זה הזמן לקחת את הציון הכמותי שלכם לשלב הבא. הצטרפו לאחד מהקורסים המובילים שלנו בקטלוג ותתחילו ללמוד עוד היום.
            </p>
            
            <button 
              onClick={() => setCurrentView("catalog")}
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-sky-500 text-white rounded-xl font-black text-base sm:text-lg shadow-lg shadow-blue-500/15 hover:shadow-xl hover:shadow-blue-500/25 hover:-translate-y-0.5 transition-all duration-300 cursor-pointer active:scale-95 flex items-center gap-2.5"
            >
              <BookOpen size={20} />
              <span>למעבר לקטלוג הקורסים</span>
            </button>
          </div>
        )}

      </div>
    </main>
  );
}