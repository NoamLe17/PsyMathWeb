"use client";
import PayPalButton from "@/components/PayPalButton";
import { doc, getDoc, setDoc, updateDoc, arrayUnion } from "firebase/firestore";
import { db } from "@/lib/firebase"; 
import { ArrowRight, Lock, ShieldCheck, CheckCircle2 } from "lucide-react";

interface CourseCheckoutProps {
  setCurrentView: (view: string) => void;
  course: any;
  user: any;
}

export default function CourseCheckout({ setCurrentView, course, user }: CourseCheckoutProps) {
  
  if (!course) {
    return (
      <main className="min-h-screen bg-slate-50 dark:bg-[#0c1222] flex flex-col items-center justify-center p-6 transition-colors duration-300" dir="rtl">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-xl dark:shadow-slate-950/50 border border-slate-100 dark:border-slate-800 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-50 dark:bg-red-500/10 text-red-500 dark:text-red-400 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock size={32} />
          </div>
          <h2 className="text-2xl font-black text-black dark:text-white dark:text-slate-100 mb-2">לא נבחר קורס לרכישה</h2>
          <p className="text-black dark:text-white mb-6">נראה שהגעת לכאן ללא בחירת קורס מתאים מהקטלוג.</p>
          <button 
            onClick={() => setCurrentView("catalog")}
            className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-sky-500 text-white rounded-xl font-bold shadow-md hover:shadow-lg hover:shadow-blue-500/25 transition-all cursor-pointer active:scale-95"
          >
            מעבר לקטלוג הקורסים
          </button>
        </div>
      </main>
    );
  }

  const handlePaymentSuccess = async (details: any) => {
    try {
      if (!user) {
        alert("שגיאה: עליך להיות מחובר כדי לבצע רכישה.");
        return;
      }

      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        await setDoc(userRef, {
          ownedCourses: [course.id],
          purchaseDates: {
            [course.id]: new Date().toISOString()
          },
          email: user.email,
          name: user.displayName || "Student"
        }, { merge: true });
      } else {
        await updateDoc(userRef, {
          ownedCourses: arrayUnion(course.id),
          [`purchaseDates.${course.id}`]: new Date().toISOString()
        });
      }

      alert(`תודה רבה ${details.payer.name.given_name}! התשלום על הקורס "${course.title}" התקבל בהצלחה. גישה נפתחה.`);
      setCurrentView("my-courses");

    } catch (error) {
      console.error("Error saving purchase to Firebase:", error);
      alert("התשלום עבר, אך חלה שגיאה בעדכון המערכת. אנא צור קשר עם התמיכה.");
    }
  };

  return (
    <main className="min-h-screen bg-slate-50/30 dark:bg-[#0c1222] py-12 px-4 flex items-center justify-center transition-colors duration-300 animate-page-enter" dir="rtl">
      <div className="max-w-4xl w-full bg-white dark:bg-slate-900 rounded-3xl shadow-xl shadow-slate-100 dark:shadow-slate-950/50 border border-slate-100/80 dark:border-slate-800 overflow-hidden flex flex-col md:flex-row">
        
        {/* פאנל ימין - פירוט הקורס (כהה ויוקרתי) */}
        <div className="w-full md:w-1/2 bg-slate-950 p-8 md:p-12 text-white flex flex-col justify-between relative overflow-hidden">
          {/* הילת אור מעוצבת ברקע */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/15 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none animate-glow-pulse"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-sky-500/10 rounded-full blur-2xl pointer-events-none animate-glow-pulse" style={{ animationDelay: '1.5s' }}></div>
          
          <div className="relative z-10">
            <button 
              onClick={() => setCurrentView("catalog")}
              className="group text-sky-400 hover:text-white text-sm font-bold transition-colors mb-12 flex items-center gap-2 cursor-pointer"
            >
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
              <span>חזרה לקטלוג הקורסים</span>
            </button>

            <div>
              <span className="text-xs font-extrabold tracking-widest text-blue-400 uppercase bg-blue-950/80 border border-blue-900/50 px-3 py-1 rounded-full inline-block mb-4">
                סיכום הזמנה • כמותיקס
              </span>
              <h2 className="text-3xl font-black mb-4 tracking-tight text-white leading-tight">{course.title}</h2>
              <p className="text-black dark:text-white/90 text-sm leading-relaxed mb-8 font-medium">
                {course.description}
              </p>
              
              {/* יתרונות הרכישה */}
              <div className="space-y-3.5 mb-8">
                <div className="flex items-center gap-2.5 text-sm text-black dark:text-white font-medium">
                  <CheckCircle2 size={16} className="text-sky-400 shrink-0" />
                  <span>גישה מלאה לכל השיעורים והווידאו</span>
                </div>
                <div className="flex items-center gap-2.5 text-sm text-black dark:text-white font-medium">
                  <CheckCircle2 size={16} className="text-sky-400 shrink-0" />
                  <span>מאגר שאלות ותרגולים מותאם אישית</span>
                </div>
                <div className="flex items-center gap-2.5 text-sm text-black dark:text-white font-medium">
                  <CheckCircle2 size={16} className="text-sky-400 shrink-0" />
                  <span>עדכונים חינם ללא הגבלת זמן</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="relative z-10 pt-6 border-t border-slate-800/80 mt-8">
            <div className="flex justify-between items-baseline">
              <span className="text-black dark:text-white text-sm font-bold">סה"כ לתשלום:</span>
              <span className="text-4xl font-black text-white tracking-tight">₪{course.price}</span>
            </div>
          </div>
        </div>

        {/* פאנל שמאל - אמצעי תשלום (בהיר ונקי) */}
        <div className="w-full md:w-1/2 p-8 md:p-12 bg-white dark:bg-slate-900 flex flex-col items-center justify-center transition-colors duration-300">
          <div className="w-12 h-12 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mb-4">
            <ShieldCheck size={26} />
          </div>
          <h3 className="text-2xl font-black text-black dark:text-white dark:text-slate-100 mb-2 w-full text-center tracking-tight">רכישה מאובטחת</h3>
          <p className="text-black dark:text-white text-sm mb-10 w-full text-center font-medium leading-relaxed max-w-xs">
            התשלום מבוצע בצורה מוצפנת ומאובטחת דרך PayPal.
          </p>
          
          <div className="w-full max-w-sm mb-6">
            <PayPalButton 
              amount={course.price.toString()} 
              onSuccess={handlePaymentSuccess} 
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-black dark:text-white font-bold bg-slate-50 dark:bg-slate-800 px-4 py-2.5 rounded-full border border-slate-100 dark:border-slate-700">
            <Lock size={12} className="text-black dark:text-white" />
            <span>אבטחה בתקן SSL מחמיר • תשלום מוגן</span>
          </div>
        </div>

      </div>
    </main>
  );
}