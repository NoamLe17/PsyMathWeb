"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, addDoc, serverTimestamp, limit, doc, getDoc } from "firebase/firestore";
import { 
  Clock, ChevronLeft, ChevronRight, CheckCircle2, XCircle, 
  Loader2, ArrowRight, Trophy, AlertTriangle, BarChart2, Check, 
  X, ShieldAlert, Award, Play 
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SimulationPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [savingLoading, setSavingLoading] = useState(false);

  // ניהול המבחן
  const [userAnswers, setUserAnswers] = useState<(number | null)[]>([]);
  const [timeLeft, setTimeLeft] = useState(1200); // 20 דקות בשניות
  const [isFinished, setIsFinished] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  // 1. משיכת שאלות (עד 20 שאלות לפרק)
  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
    
    const fetchQuestions = async () => {
      if (!user) return;
      try {
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
            return;
          }
        } else {
          router.push("/catalog");
          return;
        }

        const q = query(collection(db, "questions"), limit(20));
        const querySnapshot = await getDocs(q);
        const fetchedQuestions = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        setQuestions(fetchedQuestions);
        setUserAnswers(new Array(fetchedQuestions.length).fill(null));
        setLoading(false);
      } catch (error) {
        console.error("Error fetching simulation questions:", error);
        setLoading(false);
      }
    };

    if (user) fetchQuestions();
  }, [user, authLoading, router]);

  // 2. טיימר ספירה לאחור
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (!loading && !isFinished && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && !isFinished) {
      handleFinishSimulation(); 
    }
    return () => clearInterval(interval);
  }, [loading, isFinished, timeLeft]);

  const formatTime = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  // 3. בחירת תשובה
  const handleSelectOption = (optionIndex: number) => {
    if (isFinished) return;
    const newAnswers = [...userAnswers];
    newAnswers[currentIndex] = optionIndex;
    setUserAnswers(newAnswers);
  };

  // 4. ניווט בין שאלות
  const goToNext = () => {
    if (currentIndex < questions.length - 1) setCurrentIndex(prev => prev + 1);
  };
  const goToPrev = () => {
    if (currentIndex > 0) setCurrentIndex(prev => prev - 1);
  };

  // 5. סיום והגשת הסימולציה
  const handleFinishSimulation = async () => {
    if (!user) return;
    setSavingLoading(true);
    setIsFinished(true);

    let correctCount = 0;
    questions.forEach((q, idx) => {
      if (userAnswers[idx] === q.correctIndex) {
        correctCount++;
      }
    });

    setScore({ correct: correctCount, total: questions.length });

    try {
      await addDoc(collection(db, "users", user.uid, "simulations"), {
        score: correctCount,
        totalQuestions: questions.length,
        timeSpentSeconds: 1200 - timeLeft,
        completedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error saving simulation:", error);
    } finally {
      setSavingLoading(false);
      setCurrentIndex(0); 
    }
  };

  if (authLoading || loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white font-sans" dir="rtl">
      <div className="relative flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
        <Loader2 className="absolute text-blue-400 animate-pulse" size={24} />
      </div>
      <h3 className="mt-6 text-lg font-black text-black dark:text-white animate-pulse">בונה סימולציית בחינה...</h3>
    </div>
  );

  if (questions.length === 0) return (
    <div className="min-h-screen flex flex-col gap-6 items-center justify-center bg-slate-950 px-6 text-center text-white" dir="rtl">
      <div className="w-20 h-20 bg-slate-900 text-blue-400 rounded-3xl flex items-center justify-center border border-slate-800 shadow-lg shadow-blue-500/5">
        <ShieldAlert size={40} />
      </div>
      <div>
        <h2 className="text-2xl font-black mb-2 text-slate-100">אין מספיק שאלות במאגר</h2>
        <p className="text-black dark:text-white max-w-md mx-auto">כדי ליצור סימולציה מלאה, יש להוסיף לפחות שאלה אחת במאגר דרך מערכת הניהול.</p>
      </div>
      <button 
        onClick={() => router.push("/admin")} 
        className="px-8 py-4 bg-gradient-to-r from-blue-600 to-sky-500 text-white rounded-2xl font-black shadow-lg shadow-blue-500/15 hover:-translate-y-0.5 transition-all duration-200"
      >
        מעבר לפאנל ניהול להוספת שאלות
      </button>
    </div>
  );

  const currentQuestion = questions[currentIndex];
  const selectedOption = userAnswers[currentIndex];
  const isTimeLow = timeLeft < 120 && !isFinished; // פחות מ-2 דקות

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20 font-sans relative overflow-hidden animate-page-enter" dir="rtl">
      {/* הילות אור מעוצבות ברקע */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none ambient-orb animate-glow-pulse"></div>
      <div className="absolute bottom-10 left-10 w-80 h-80 bg-indigo-600/5 rounded-full blur-3xl pointer-events-none ambient-orb animate-glow-pulse" style={{ animationDelay: '1.5s' }}></div>

      <div className="max-w-4xl mx-auto px-6 pt-12 relative">
        
        {/* כפתור חזרה ללובי */}
        <div className="mb-6 flex justify-between items-center">
          <Link href="/practice" className="inline-flex items-center gap-2 text-black dark:text-white hover:text-blue-400 font-bold transition-colors group">
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            <span>חזרה למרכז התרגול</span>
          </Link>
          <span className="text-sm font-black text-black dark:text-white tracking-wider bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-full">
            מצב סימולציית מבחן
          </span>
        </div>

        {/* כותרת עליונה */}
        <header className="flex justify-between items-center mb-8 bg-slate-900/80 backdrop-blur-xl p-6 rounded-2xl border border-slate-800/80 sticky top-4 z-20 shadow-xl shadow-slate-950/20">
          <div className="flex flex-col">
            <span className="text-sm font-bold text-black dark:text-white tracking-wide mb-1">מעקב התקדמות בבחינה</span>
            <div className="font-black text-white text-xl">
              שאלה {currentIndex + 1} <span className="text-black dark:text-white font-normal text-base">/ {questions.length}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {!isFinished && (
              <button 
                onClick={() => {
                  if(confirm("האם אתה בטוח שברצונך להגיש את הפרק ולסיים את הבחינה?")) handleFinishSimulation();
                }}
                className="px-5 py-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 rounded-xl font-black text-sm transition-all active:scale-95 shadow-sm"
              >
                הגש פרק
              </button>
            )}
            
            <div className={`flex items-center gap-2 font-mono text-xl sm:text-2xl font-black px-4 py-2 rounded-2xl border transition-all duration-300 ${
              isFinished 
                ? 'bg-slate-800 border-slate-700 text-black dark:text-white' 
                : isTimeLow 
                ? 'bg-red-500/10 border-red-500 text-red-400 animate-pulse shadow-md shadow-red-500/10' 
                : 'bg-blue-500/10 border-blue-500/20 text-blue-400'
            }`}>
              <Clock size={20} className="sm:size-[24px]" />
              {isFinished ? "00:00" : formatTime(timeLeft)}
            </div>
          </div>
        </header>

        {/* מד התקדמות מובנה */}
        <div className="w-full bg-slate-900 border border-slate-800 h-2.5 rounded-full overflow-hidden mb-8">
          <div 
            className="bg-gradient-to-r from-blue-600 to-sky-500 h-full transition-all duration-500 ease-out" 
            style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
          ></div>
        </div>

        {/* תצוגת תוצאות בסיום */}
        {isFinished && currentIndex === 0 && (
          <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 p-8 sm:p-10 rounded-3xl text-white shadow-2xl mb-8 text-center relative overflow-hidden animate-slide-up border border-indigo-500/20">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none"></div>
            
            <div className="w-16 h-16 bg-white/10 text-amber-400 rounded-2xl mx-auto mb-6 flex items-center justify-center border border-white/10 shadow-lg animate-bounce">
              <Trophy size={32} />
            </div>

            <h2 className="text-3xl font-black mb-2 tracking-tight">הסימולציה הושלמה בהצלחה!</h2>
            <p className="text-indigo-100 mb-8 font-medium max-w-md mx-auto text-sm sm:text-base leading-relaxed">
              הפרק הוגש ונשמר באזור האישי שלך. להלן סיכום הישגיך בבחינה:
            </p>

            <div className="grid grid-cols-3 gap-3 sm:gap-4 max-w-lg mx-auto mb-8">
              <div className="bg-slate-950/30 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-white/5">
                <div className="text-2xl sm:text-3xl font-black mb-1">{score.correct} / {score.total}</div>
                <div className="text-indigo-200 text-sm font-bold">תשובות נכונות</div>
              </div>
              <div className="bg-slate-950/30 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-white/5">
                <div className="text-2xl sm:text-3xl font-black mb-1">{formatTime(1200 - timeLeft)}</div>
                <div className="text-indigo-200 text-sm font-bold">זמן בחינה</div>
              </div>
              <div className="bg-slate-950/30 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-white/5">
                <div className="text-2xl sm:text-3xl font-black mb-1">
                  {score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0}%
                </div>
                <div className="text-indigo-200 text-sm font-bold">הצלחה</div>
              </div>
            </div>
            
            <div className="inline-flex items-center gap-2 text-sm text-indigo-100 bg-slate-950/20 py-2 px-6 rounded-full border border-white/5">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
              <span>תוכל לבצע כעת תחקור מקיף של כל השאלות בעזרת לחצני הניווט.</span>
            </div>
          </div>
        )}

        {/* גוף השאלה */}
        <div className={`bg-slate-900 p-8 md:p-12 rounded-3xl shadow-xl border mb-8 transition-all ${
          isFinished 
            ? (userAnswers[currentIndex] === currentQuestion.correctIndex 
              ? 'border-emerald-500/30 shadow-emerald-950/5' 
              : 'border-red-500/30 shadow-red-950/5') 
            : 'border-slate-800/80'
        }`}>
          <div className="flex gap-2.5 mb-8">
            <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-800 text-black dark:text-white font-black text-sm rounded-xl border border-slate-700/50">
              <Award size={14} className="text-blue-400" />
              שאלה {currentIndex + 1}
            </span>
            <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-800 text-black dark:text-white font-black text-sm rounded-xl border border-slate-700/50">
              {currentQuestion.topic === "algebra" 
                ? "אלגברה" 
                : currentQuestion.topic === "geometry" 
                ? "גיאומטריה" 
                : currentQuestion.topic === "charts" 
                ? "הסקה מתרשים" 
                : "בעיות כמותיות"}
            </span>
          </div>

          <h2 className="text-lg sm:text-xl font-black text-white mb-10 leading-relaxed whitespace-pre-wrap">
            {currentQuestion.text}
          </h2>

          {currentQuestion.isDataInterpretation && currentQuestion.imageUrl && (
            <div className="mb-10 rounded-3xl overflow-hidden border border-slate-800 bg-slate-950/50 p-4 flex items-center justify-center max-h-[400px]">
              <img 
                src={currentQuestion.imageUrl} 
                alt="תרשים נתונים" 
                className="max-w-full max-h-[350px] object-contain rounded-2xl shadow-sm border border-slate-800" 
              />
            </div>
          )}

          <div className="space-y-3">
            {currentQuestion.options.map((opt: string, idx: number) => {
              let buttonStyle = "border-slate-800 bg-slate-950/40 text-black dark:text-white hover:border-slate-700 hover:bg-slate-800/40 hover:-translate-y-0.5";
              let badgeStyle = "bg-slate-900 border-slate-800 text-black dark:text-white";
              let statusIcon = null;

              if (isFinished) {
                if (idx === currentQuestion.correctIndex) {
                  buttonStyle = "border-emerald-500 bg-emerald-500/10 text-emerald-300 font-black shadow-md shadow-emerald-500/5"; 
                  badgeStyle = "bg-emerald-500 border-emerald-500 text-white";
                  statusIcon = <Check size={14} strokeWidth={3} />;
                } else if (idx === selectedOption) {
                  buttonStyle = "border-red-500 bg-red-500/10 text-red-300 font-medium"; 
                  badgeStyle = "bg-red-500 border-red-500 text-white";
                  statusIcon = <X size={14} strokeWidth={3} />;
                } else {
                  buttonStyle = "border-slate-900 bg-slate-950/20 text-black dark:text-white opacity-40 cursor-not-allowed"; 
                  badgeStyle = "bg-slate-950 border-slate-900 text-black dark:text-white";
                }
              } else if (selectedOption === idx) {
                buttonStyle = "border-blue-500 bg-blue-500/10 ring-2 ring-blue-500/10 font-black text-blue-100"; 
                badgeStyle = "bg-blue-500 border-blue-500 text-white shadow-md shadow-blue-500/20";
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleSelectOption(idx)}
                  disabled={isFinished}
                  className={`w-full text-right p-5 rounded-2xl border-2 transition-all duration-200 text-base sm:text-lg flex items-center justify-between gap-4 ${buttonStyle}`}
                >
                  <div className="flex items-center gap-4">
                    <span className={`flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full font-black border-2 text-sm sm:text-base shrink-0 transition-all ${badgeStyle}`}>
                      {statusIcon ? statusIcon : idx + 1}
                    </span>
                    <span className="font-bold leading-relaxed">{opt}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* תחקור פתרון בסיום */}
          {isFinished && currentQuestion.explanation && (
            <div className="mt-10 p-6 bg-slate-950 rounded-2xl border border-slate-800 text-black dark:text-white animate-slide-up">
              <h4 className="font-black text-amber-400 mb-4 text-base sm:text-lg flex items-center gap-2">
                <Trophy size={20} className="text-amber-400 animate-pulse" />
                הסבר הפתרון הכמותי
              </h4>
              <p className="font-medium leading-relaxed text-sm sm:text-base text-black dark:text-white whitespace-pre-wrap">
                {currentQuestion.explanation}
              </p>
            </div>
          )}
        </div>

        {/* ניווט פנימי */}
        <div className="flex items-center justify-between gap-4">
          <button
            onClick={goToNext}
            disabled={currentIndex === questions.length - 1}
            className={`flex-1 py-5 rounded-2xl font-black text-base sm:text-xl transition-all flex justify-center items-center gap-2 ${
              currentIndex !== questions.length - 1 
                ? 'bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-700 hover:to-sky-600 text-white hover:-translate-y-0.5 shadow-lg shadow-blue-500/10' 
                : 'bg-slate-900 text-black dark:text-white border border-slate-800 cursor-not-allowed'
            }`}
          >
            <span>{isFinished && currentIndex === questions.length - 1 ? 'סוף הבחינה' : 'שאלה הבאה'}</span>
            <ChevronLeft size={20} />
          </button>
          
          <button
            onClick={goToPrev}
            disabled={currentIndex === 0}
            className={`py-5 px-6 sm:px-8 rounded-2xl font-black text-base sm:text-xl transition-all flex justify-center items-center gap-2 ${
              currentIndex !== 0 
                ? 'bg-slate-900 border border-slate-800 text-black dark:text-white hover:bg-slate-800/80' 
                : 'bg-slate-950/20 text-black dark:text-white border border-slate-900 cursor-not-allowed'
            }`}
          >
            <ChevronRight size={20} />
            <span>הקודמת</span>
          </button>
        </div>

      </div>
    </div>
  );
}