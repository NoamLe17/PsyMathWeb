"use client";

import { useState, useEffect } from "react";
import { Calculator, Compass, Clock, Sparkles, ArrowRight, ShieldCheck, CheckCircle2, ArrowUpRight, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";

interface CourseCatalogProps {
  setCurrentView: (view: string) => void;
  setSelectedCourse: (course: any) => void;
}

export default function CourseCatalog({ setCurrentView, setSelectedCourse }: CourseCatalogProps) {
  const { user } = useAuth();
  const [ownedCourseIds, setOwnedCourseIds] = useState<string[]>([]);
  const [loadingOwned, setLoadingOwned] = useState(true);
  const [showAlreadyOwnedModal, setShowAlreadyOwnedModal] = useState(false);
  const [isCheckingPurchase, setIsCheckingPurchase] = useState(false);

  // שליפת הקורסים שבבעלות המשתמש
  useEffect(() => {
    const fetchOwnedCourses = async () => {
      if (!user) {
        setLoadingOwned(false);
        return;
      }
      try {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const userData = docSnap.data();
          const owned = userData.ownedCourses || [];
          const purchaseDates = userData.purchaseDates || {};
          
          const validOwned = owned.filter((id: string) => {
            const pDateStr = purchaseDates[id];
            if (!pDateStr) return true;
            const pDate = new Date(pDateStr);
            const expiryDate = new Date(pDate.getTime() + 150 * 24 * 60 * 60 * 1000);
            return expiryDate > new Date();
          });
          
          setOwnedCourseIds(validOwned);
        }
      } catch (error) {
        console.error("Error fetching owned courses:", error);
      } finally {
        setLoadingOwned(false);
      }
    };

    fetchOwnedCourses();
  }, [user]);

  // בדיקה אם קורס מסוים כבר בבעלות המשתמש
  const isCourseOwned = (courseId: string): boolean => {
    // אם יש למשתמש את החבילה המלאה — כל הקורסים שייכים לו
    if (ownedCourseIds.includes("full-bundle")) return true;
    
    // בדיקה מיוחדת לחבילה המלאה: אם המשתמש מחזיק בכל קורסי הבסיס, הרי שהחבילה המלאה כבר ברשותו
    if (courseId === "full-bundle") {
      const hasAllSingles = singleCourses.every(c => ownedCourseIds.includes(c.id));
      if (hasAllSingles) return true;
    }
    
    // אם הקורס הספציפי בבעלותו
    return ownedCourseIds.includes(courseId);
  };

  // בדיקה אם הקורס נרכש ישירות או דרך החבילה
  const getOwnershipReason = (courseId: string): string => {
    if (ownedCourseIds.includes(courseId)) return "direct";
    if (ownedCourseIds.includes("full-bundle")) return "bundle";
    return "";
  };

  // רשימת הקורסים הבודדים
  const singleCourses = [
    {
      id: "algebra",
      title: "אלגברה - הפרק המלא",
      description: "כל מה שצריך לדעת על משוואות, אי-שוויונות, חזקות ושורשים. יסודות חזקים לכל הפרק.",
      price: 49,
      icon: Calculator,
      color: "text-blue-600 bg-blue-50 border-blue-100/50 dark:text-blue-400 dark:bg-blue-500/10 dark:border-blue-500/20"
    },
    {
      id: "geometry",
      title: "גיאומטריה מהיסוד",
      description: "משולשים, מעגלים, מצולעים ותלת-מימד. הסברים פשוטים וויזואליים לתרגילים מורכבים.",
      price: 49,
      icon: Compass,
      color: "text-sky-600 bg-sky-50 border-sky-100/50 dark:text-sky-400 dark:bg-sky-500/10 dark:border-sky-500/20"
    },
    {
      id: "word-problems",
      title: "בעיות מילוליות",
      description: "תנועה, הספק, אחוזים והסתברות. שיטות עבודה שיחסכו לכם זמן יקר בבחינה.",
      price: 49,
      icon: Clock,
      color: "text-indigo-600 bg-indigo-50 border-indigo-100/50 dark:text-indigo-400 dark:bg-indigo-500/10 dark:border-indigo-500/20"
    }
  ];

  // החבילה המלאה המאגדת את הכל
  const fullPackage = {
    id: "full-bundle",
    title: "החבילה הכמותית המלאה",
    description: "גישה מלאה לכל הקורסים (אלגברה, גיאומטריה ובעיות מילוליות) + מאגר שאלות אקסטרה ותרגולי סיכום לציון מקסימלי.",
    price: 199,
    icon: Sparkles
  };

  const handlePurchaseClick = async (course: any) => {
    console.log("[DEBUG] handlePurchaseClick called, course:", course?.id, "user:", user?.uid);
    if (user) {
      setIsCheckingPurchase(true);
      try {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        console.log("[DEBUG] docSnap exists:", docSnap.exists());
        if (docSnap.exists()) {
          const userData = docSnap.data();
          const owned = userData.ownedCourses || [];
          const purchaseDates = userData.purchaseDates || {};
          
          const validOwned = owned.filter((id: string) => {
            const pDateStr = purchaseDates[id];
            if (!pDateStr) return true;
            const pDate = new Date(pDateStr);
            const expiryDate = new Date(pDate.getTime() + 150 * 24 * 60 * 60 * 1000);
            return expiryDate > new Date();
          });
          
          console.log("[DEBUG] validOwned from DB:", validOwned);
          
          const hasFullBundle = validOwned.includes("full-bundle");
          const hasThisCourse = validOwned.includes(course.id);
          const hasAllSingles = singleCourses.every(c => validOwned.includes(c.id));
          const coversFullBundle = course.id === "full-bundle" && hasAllSingles;

          console.log("[DEBUG] hasFullBundle:", hasFullBundle, "hasThisCourse:", hasThisCourse, "hasAllSingles:", hasAllSingles);

          if (hasFullBundle || hasThisCourse || coversFullBundle) {
            console.log("[DEBUG] Course already owned! Showing modal.");
            setShowAlreadyOwnedModal(true);
            setIsCheckingPurchase(false);
            setOwnedCourseIds(validOwned);
            return;
          }
        }
      } catch (error) {
        console.error("[DEBUG] Error checking ownership:", error);
      }
      setIsCheckingPurchase(false);
    } else {
      console.log("[DEBUG] No user logged in!");
    }
    
    setSelectedCourse(course);
    setCurrentView("checkout");
  };

  const isFullBundleOwned = isCourseOwned("full-bundle");

  return (
    <main className="min-h-screen bg-slate-50/30 dark:bg-[#0c1222] py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300 animate-page-enter" dir="rtl">
      <div className="max-w-6xl mx-auto">
        
        {/* כותרת וכפתור חזרה */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div>
            <span className="text-xs font-bold text-blue-600 dark:text-blue-400 tracking-wider bg-blue-50 dark:bg-blue-500/10 px-3 py-1 rounded-full">מערכת כמותיקס (Kvantix)</span>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white mt-3 mb-2 tracking-tight">קטלוג הקורסים</h1>
            <p className="text-black dark:text-white text-base sm:text-lg">
              בחרו את הנושא שבו אתם רוצים להשתפר, או קחו את החבילה המלאה במחיר משתלם.
            </p>
          </div>
          <button 
            onClick={() => setCurrentView("my-courses")}
            className="group px-5 py-2.5 bg-white dark:bg-slate-800 text-black dark:text-white hover:text-blue-600 dark:hover:text-blue-400 font-bold text-sm rounded-full border border-slate-200/80 dark:border-slate-700 shadow-[0_2px_8px_-3px_rgba(15,23,42,0.05)] dark:shadow-none hover:shadow-md transition-all duration-300 flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            <span>חזרה לאזור האישי</span>
          </button>
        </div>

        {/* --- החבילה המלאה (Hero Banner) --- */}
        <div className="bg-gradient-to-br from-blue-600 via-blue-500 to-sky-500 rounded-3xl p-8 sm:p-12 text-white mb-16 shadow-xl shadow-blue-500/10 dark:shadow-blue-500/5 flex flex-col lg:flex-row justify-between items-center gap-10 relative overflow-hidden">
          {/* אפקטים של תאורה ברקע */}
          <div className="absolute -top-12 -right-12 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none animate-glow-pulse"></div>
          <div className="absolute -bottom-20 -left-12 w-80 h-80 bg-sky-300/20 rounded-full blur-2xl pointer-events-none animate-glow-pulse" style={{ animationDelay: '2s' }}></div>
          
          <div className="relative z-10 text-center lg:text-right max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-white/15 backdrop-blur-md rounded-full text-xs sm:text-sm font-black tracking-wide mb-6 border border-white/10 shadow-sm animate-pulse">
              <Sparkles size={14} className="text-amber-300" />
              <span>המסלול המשתלם והמקיף ביותר ⭐️</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-black mb-5 tracking-tight leading-tight">{fullPackage.title}</h2>
            <p className="text-blue-50 text-base sm:text-lg mb-8 leading-relaxed font-medium">
              {fullPackage.description}
            </p>
            
            <div className="flex flex-wrap justify-center lg:justify-start gap-4 text-xs sm:text-sm font-bold text-blue-50/90">
              <span className="flex items-center gap-1 bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
                <ShieldCheck size={16} className="text-sky-300" /> 🔐 גישה מיידית ל150 ימים 
              </span>
              <span className="flex items-center gap-1 bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
                📚 3 קורסים מקיפים בפרק אחד
              </span>
              <span className="flex items-center gap-1 bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
                📈 מאגר שאלות מוגדל ומעודכן
              </span>
            </div>
          </div>
          
          <div className="relative z-10 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-8 rounded-2xl text-center min-w-[260px] max-w-xs shadow-2xl border border-white dark:border-slate-700 flex flex-col items-center hover:scale-[1.03] transition-all duration-300">
            {isFullBundleOwned ? (
              <>
                {/* הודעה ידידותית — החבילה כבר בבעלות המשתמש */}
                <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center mb-4 border border-emerald-100/50 dark:border-emerald-500/20">
                  <CheckCircle2 size={32} />
                </div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2">החבילה המלאה ברשותך! 🎉</h3>
                <p className="text-black dark:text-white text-sm mb-6 leading-relaxed">
                  כבר רכשת את החבילה הכמותית המלאה. כל הקורסים פתוחים עבורך — אין צורך לרכוש שוב.
                </p>
                <Link 
                  href="/dashboard"
                  className="w-full py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl font-extrabold text-base hover:shadow-lg hover:shadow-emerald-500/25 transition-all duration-300 active:scale-95 flex items-center justify-center gap-2"
                >
                  <span>לצפייה בקורסים שלי</span>
                  <ArrowUpRight size={18} />
                </Link>
              </>
            ) : (
              <>
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-3 py-1 rounded-full mb-4">חיסכון של מעל 30%</span>
                <p className="text-black dark:text-white font-bold mb-1 text-sm">תשלום חד-פעמי ומאובטח</p>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-5xl font-black text-slate-900 dark:text-white tracking-tight">₪{fullPackage.price}</span>
                  <span className="text-black dark:text-white text-sm line-through font-bold">₪249</span>
                </div>
                
                <button 
                  onClick={() => handlePurchaseClick(fullPackage)}
                  disabled={isCheckingPurchase}
                  className="w-full py-4 bg-gradient-to-r from-blue-600 to-sky-500 text-white rounded-xl font-extrabold text-lg hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-300 active:scale-95 cursor-pointer disabled:opacity-70 flex justify-center items-center"
                >
                  {isCheckingPurchase ? (
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  ) : (
                    "רכישת החבילה המלאה"
                  )}
                </button>
              </>
            )}
          </div>
        </div>

        {/* --- קורסים בודדים --- */}
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-2xl font-black text-black dark:text-white dark:text-slate-100 tracking-tight">רכישה לפי נושאים ספציפיים</h3>
          <span className="text-sm text-black dark:text-white font-bold">בחרו נושא ממוקד לתרגול</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 stagger-children">
          {singleCourses.map((course) => {
            const Icon = course.icon;
            const owned = isCourseOwned(course.id);
            const ownershipReason = getOwnershipReason(course.id);

            return (
              <div 
                key={course.id} 
                className={`glass-card bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.03)] dark:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.2)] border transition-all duration-300 flex flex-col group hover:-translate-y-1.5 ${
                  owned 
                    ? 'border-emerald-200/60 dark:border-emerald-500/20 hover:shadow-xl hover:border-emerald-300 dark:hover:border-emerald-500/30' 
                    : 'border-slate-100/80 dark:border-slate-800 hover:shadow-xl dark:hover:shadow-slate-950/40 hover:border-blue-100 dark:hover:border-blue-500/30'
                }`}
              >
                <div className={`w-14 h-14 rounded-2xl mb-6 flex items-center justify-center border shadow-sm group-hover:scale-110 transition-transform duration-300 ${course.color}`}>
                  <Icon size={26} />
                </div>
                <h4 className="text-xl font-extrabold text-black dark:text-white dark:text-slate-100 mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{course.title}</h4>
                <p className="text-black dark:text-white text-sm mb-8 flex-grow leading-relaxed font-medium">{course.description}</p>
                
                <div className="mt-auto pt-6 border-t border-slate-50 dark:border-slate-800">
                  {owned ? (
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-2.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 px-4 py-3 rounded-xl border border-emerald-100/50 dark:border-emerald-500/20">
                        <CheckCircle2 size={18} className="shrink-0" />
                        <span className="text-sm font-bold leading-snug">
                          {ownershipReason === "bundle" 
                            ? "קורס זה כלול בחבילה המלאה שרכשת" 
                            : "כבר רכשת קורס זה — אין צורך לקנות שוב"}
                        </span>
                      </div>
                      <Link 
                        href="/dashboard"
                        className="w-full py-3 bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 text-black dark:text-white hover:text-emerald-700 dark:hover:text-emerald-400 rounded-xl font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2"
                      >
                        <span>צפה בקורס שלי</span>
                        <ArrowUpRight size={16} />
                      </Link>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-sm text-black dark:text-white font-bold">מחיר מלא</span>
                        <span className="text-2xl font-black text-slate-900 dark:text-white">₪{course.price}</span>
                      </div>
                      <button 
                        onClick={() => handlePurchaseClick(course)}
                        disabled={isCheckingPurchase}
                        className="px-5 py-3 bg-gradient-to-r from-blue-600 to-sky-500 hover:shadow-lg hover:shadow-blue-500/25 text-white rounded-xl font-bold text-sm shadow-sm transition-all duration-300 cursor-pointer active:scale-95 disabled:opacity-70 flex justify-center items-center min-w-[120px]"
                      >
                        {isCheckingPurchase ? (
                          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                        ) : (
                          "הצטרפות לקורס"
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

      </div>

      {/* מודל כבר בבעלותך */}
      {showAlreadyOwnedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-md w-full shadow-2xl border border-slate-100 dark:border-slate-800 relative animate-slide-up">
            <button 
              onClick={() => setShowAlreadyOwnedModal(false)}
              className="absolute top-4 left-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            >
              <X size={24} />
            </button>
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 size={32} />
            </div>
            <h3 className="text-2xl font-black text-center text-slate-900 dark:text-white mb-2">משתמש יקר, הקורס שבחרת כבר ברשותך</h3>
            <p className="text-center text-black dark:text-white mb-8">
              אין צורך לרכוש אותו שוב. ניתן לעבור אליו ישירות מאזור הקורסים שלך.
            </p>
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => {
                  setShowAlreadyOwnedModal(false);
                  setCurrentView("my-courses");
                }}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
              >
                <span>מעבר לקורס</span>
                <ArrowRight size={18} />
              </button>
              <button 
                onClick={() => setShowAlreadyOwnedModal(false)}
                className="w-full py-3.5 bg-slate-100 dark:bg-slate-800 text-black dark:text-white rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                סגור
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}