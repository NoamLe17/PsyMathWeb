"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, addDoc, serverTimestamp, doc, getDoc, where } from "firebase/firestore";
import { 
  Clock, CheckCircle2, XCircle, ChevronLeft, Lightbulb, 
  Loader2, ArrowRight, Check, X, Award, Trophy, Target, 
  HelpCircle, Sparkles, BookOpen 
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SelfPracticePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [savingLoading, setSavingLoading] = useState(false);

  // ניהול מצב התשובות והטיימר
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  // הגדרות תרגול
  const [isConfigured, setIsConfigured] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<string>("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all");

  // 1. משיכת שאלות מהמאגר (נקרא ע"י לחיצה על התחל תרגול)
  const fetchQuestions = async () => {
    if (!user) return;
    setLoading(true);
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

      let queryConstraints: any[] = [];
      if (selectedTopic !== "all") {
        queryConstraints.push(where("topic", "==", selectedTopic));
      }
      if (selectedDifficulty !== "all") {
        queryConstraints.push(where("difficulty", "==", Number(selectedDifficulty)));
      }

      const q = query(collection(db, "questions"), ...queryConstraints);
      const querySnapshot = await getDocs(q);
      let fetchedQuestions = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // ערבוב השאלות
      fetchedQuestions = fetchedQuestions.sort(() => Math.random() - 0.5);

      setQuestions(fetchedQuestions);
      setIsConfigured(true);
      setLoading(false);
      setTimerActive(true);
    } catch (error) {
      console.error("Error fetching questions:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  // 2. הפעלת הטיימר
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timerActive && !isFinished) {
      interval = setInterval(() => {
        setSecondsElapsed((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerActive, isFinished]);

  const formatTime = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  // 3. שמירת התוצאה ל-Firebase
  const saveProgressToDB = async (isCorrect: boolean) => {
    if (!user) return;
    setSavingLoading(true);
    try {
      const currentQ = questions[currentIndex];
      await addDoc(collection(db, "users", user.uid, "progress"), {
        questionId: currentQ.id,
        topic: currentQ.topic || "general",
        difficulty: currentQ.difficulty || 1,
        isCorrect: isCorrect,
        timeSpentSeconds: secondsElapsed,
        selectedOptionIndex: selectedOption,
        solvedAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error saving progress:", error);
    } finally {
      setSavingLoading(false);
    }
  };

  // 4. בדיקת התשובה ולחיצה
  const handleCheckAnswer = async () => {
    if (selectedOption === null) return;
    setTimerActive(false); 
    
    const isCorrect = selectedOption === questions[currentIndex].correctIndex;
    if (isCorrect) {
      setCorrectCount(prev => prev + 1);
    }
    await saveProgressToDB(isCorrect);
    
    setIsAnswered(true);
  };

  const handleNextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
      setSecondsElapsed(0);
      setTimerActive(true);
    } else {
      setIsFinished(true);
    }
  };

  if (!isConfigured) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0c1222] p-6 font-sans flex items-center justify-center animate-page-enter" dir="rtl">
        <div className="bg-white dark:bg-slate-900 p-8 sm:p-12 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800 max-w-2xl w-full relative overflow-hidden">
          <div className="absolute top-0 left-0 w-64 h-64 bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
          
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white mb-3 text-center tracking-tight">הגדרות תרגול חופשי</h2>
          <p className="text-slate-600 dark:text-slate-400 text-center mb-10 font-medium">התאם את התרגול לצרכים שלך. בחר נושאים ורמות קושי.</p>
          
          <div className="space-y-8 relative z-10">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">בחר נושא</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { id: "all", label: "הכל מעורבב" },
                  { id: "algebra", label: "אלגברה" },
                  { id: "geometry", label: "גיאומטריה" },
                  { id: "charts", label: "הסקה מתרשים" },
                  { id: "word_problems", label: "בעיות כמותיות" }
                ].map(topic => (
                  <button
                    key={topic.id}
                    onClick={() => setSelectedTopic(topic.id)}
                    className={`py-3 px-4 rounded-xl border-2 font-bold transition-all ${
                      selectedTopic === topic.id 
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 shadow-sm' 
                        : 'border-slate-200 dark:border-slate-700 bg-transparent text-slate-700 dark:text-slate-300 hover:border-blue-300 dark:hover:border-slate-600'
                    }`}
                  >
                    {topic.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">רמת קושי</h3>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                <button
                  onClick={() => setSelectedDifficulty("all")}
                  className={`py-3 px-2 rounded-xl border-2 font-bold transition-all ${
                    selectedDifficulty === "all" 
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 shadow-sm' 
                      : 'border-slate-200 dark:border-slate-700 bg-transparent text-slate-700 dark:text-slate-300 hover:border-emerald-300 dark:hover:border-slate-600'
                  }`}
                >
                  הכל
                </button>
                {[1, 2, 3, 4, 5].map(level => (
                  <button
                    key={level}
                    onClick={() => setSelectedDifficulty(level.toString())}
                    className={`py-3 px-2 rounded-xl border-2 font-bold transition-all ${
                      selectedDifficulty === level.toString() 
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 shadow-sm' 
                        : 'border-slate-200 dark:border-slate-700 bg-transparent text-slate-700 dark:text-slate-300 hover:border-emerald-300 dark:hover:border-slate-600'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-12 flex flex-col sm:flex-row gap-4 relative z-10">
            <Link href="/practice" className="flex-1 py-4 text-center rounded-2xl font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
              חזור למרכז התרגול
            </Link>
            <button
              onClick={fetchQuestions}
              disabled={loading && user !== null}
              className="flex-[2] py-4 rounded-2xl font-black text-white bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-700 hover:to-sky-600 shadow-lg shadow-blue-500/20 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:transform-none"
            >
              {(loading && user !== null) ? <Loader2 className="animate-spin" /> : 'התחל תרגול!'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (authLoading || loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-[#0c1222] font-sans" dir="rtl">
      <div className="relative flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-600 dark:border-t-blue-400 rounded-full animate-spin"></div>
        <Loader2 className="absolute text-blue-600 dark:text-blue-400 animate-pulse" size={24} />
      </div>
      <h3 className="mt-6 text-lg font-black text-black dark:text-white dark:text-slate-200 animate-pulse">טוען שאלות תרגול...</h3>
    </div>
  );

  if (questions.length === 0) return (
    <div className="min-h-screen flex flex-col gap-6 items-center justify-center bg-slate-50 dark:bg-[#0c1222] px-6 text-center" dir="rtl">
      <div className="w-20 h-20 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-3xl flex items-center justify-center border border-blue-100/50 dark:border-blue-500/20 shadow-sm">
        <HelpCircle size={40} />
      </div>
      <div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">אין שאלות במאגר עדיין</h2>
        <p className="text-black dark:text-white max-w-md mx-auto">כדי להתחיל לתרגל, יש להוסיף שאלות במערכת הניהול.</p>
      </div>
      <button 
        onClick={() => router.push("/admin")} 
        className="px-8 py-4 bg-gradient-to-r from-blue-600 to-sky-500 text-white rounded-2xl font-black shadow-lg hover:shadow-blue-500/25 hover:-translate-y-0.5 transition-all duration-200"
      >
        מעבר לפאנל ניהול להוספת שאלות
      </button>
    </div>
  );

  if (isFinished) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0c1222] flex items-center justify-center p-6 font-sans animate-page-enter" dir="rtl">
        <div className="bg-white dark:bg-slate-900 p-10 md:p-12 rounded-3xl shadow-xl dark:shadow-slate-950/50 border border-slate-100 dark:border-slate-800 max-w-xl w-full text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-3xl pointer-events-none ambient-orb animate-glow-pulse"></div>
          
          <div className="w-20 h-20 bg-gradient-to-tr from-amber-400 to-amber-500 text-white rounded-[2rem] mx-auto mb-8 flex items-center justify-center shadow-lg shadow-amber-500/20 animate-bounce">
            <Trophy size={40} />
          </div>

          <h2 className="text-3xl sm:text-4xl font-black text-slate-950 dark:text-white tracking-tight mb-2">סיימת את מאגר התרגול!</h2>
          <p className="text-black dark:text-white font-medium mb-8">כל הכבוד על ההתמדה וההשקעה. הנה סיכום ביצועי התרגול שלך:</p>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-slate-50 dark:bg-slate-800/60 p-6 rounded-3xl border border-slate-100 dark:border-slate-700">
              <div className="text-3xl font-black text-slate-900 dark:text-white mb-1">{correctCount} / {questions.length}</div>
              <div className="text-black dark:text-white text-sm font-bold">תשובות נכונות</div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/60 p-6 rounded-3xl border border-slate-100 dark:border-slate-700">
              <div className="text-3xl font-black text-slate-900 dark:text-white mb-1">
                {Math.round((correctCount / questions.length) * 100)}%
              </div>
              <div className="text-black dark:text-white text-sm font-bold">אחוזי הצלחה</div>
            </div>
          </div>

          <button 
            onClick={() => router.push("/practice")} 
            className="w-full py-5 bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-700 hover:to-sky-600 text-white rounded-2xl font-black text-lg sm:text-xl shadow-lg shadow-blue-500/10 hover:-translate-y-0.5 transition-all duration-200"
          >
            חזרה למרכז התרגול
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const isCorrect = selectedOption === currentQuestion.correctIndex;

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-[#0c1222] pb-20 font-sans relative overflow-hidden animate-page-enter" dir="rtl">
      {/* הילת אור דקורטיבית ברקע */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-3xl pointer-events-none ambient-orb animate-glow-pulse"></div>
      
      <div className="max-w-4xl mx-auto px-6 pt-12 relative">
        
        {/* כפתור חזרה עליון */}
        <div className="mb-6">
          <Link href="/practice" className="inline-flex items-center gap-2 text-black dark:text-white hover:text-blue-600 dark:hover:text-blue-400 font-bold transition-colors group">
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            <span>חזרה למרכז התרגול</span>
          </Link>
        </div>

        {/* כותרת עליונה */}
        <header className="flex justify-between items-center mb-8 glass dark:bg-slate-900/60 dark:border-slate-800/80 p-6 rounded-2xl shadow-sm">
          <div className="flex flex-col">
            <span className="text-sm font-bold text-black dark:text-white tracking-wide mb-1">התקדמות תרגול חופשי</span>
            <div className="font-black text-black dark:text-white text-xl">
              שאלה {currentIndex + 1} <span className="text-black dark:text-white font-normal text-base">/ {questions.length}</span>
            </div>
          </div>
          <div className={`flex items-center gap-2 font-mono text-xl sm:text-2xl font-black px-4 py-2 rounded-2xl transition-colors duration-300 ${timerActive ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-100/20 dark:border-blue-500/20' : 'bg-slate-100 dark:bg-slate-800 text-black dark:text-white'}`}>
            <Clock size={20} className="sm:size-[24px]" />
            {formatTime(secondsElapsed)}
          </div>
        </header>

        {/* מד התקדמות ליניארי חלק */}
        <div className="w-full bg-slate-200/50 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden mb-8 border border-slate-100/50 dark:border-slate-700/50">
          <div 
            className="bg-gradient-to-r from-blue-600 to-sky-500 h-full transition-all duration-500 ease-out" 
            style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
          ></div>
        </div>

        {/* גוף השאלה */}
        <div className="bg-white dark:bg-slate-900 p-8 md:p-12 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-[0_8px_30px_rgb(0,0,0,0.015)] dark:shadow-slate-950/30 mb-8">
          <div className="flex gap-2.5 mb-8">
            <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-black text-sm rounded-xl border border-emerald-100/30 dark:border-emerald-500/20">
              <Award size={14} />
              קושי {currentQuestion.difficulty || 1}
            </span>
            <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 font-black text-sm rounded-xl border border-blue-100/30 dark:border-blue-500/20">
              <BookOpen size={14} />
              {currentQuestion.topic === "algebra" 
                ? "אלגברה" 
                : currentQuestion.topic === "geometry" 
                ? "גיאומטריה" 
                : currentQuestion.topic === "charts" 
                ? "הסקה מתרשים" 
                : "בעיות כמותיות"}
            </span>
          </div>

          <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white mb-10 leading-relaxed whitespace-pre-wrap">
            {currentQuestion.text}
          </h2>

          {currentQuestion.isDataInterpretation && currentQuestion.imageUrl && (
            <div className="mb-10 rounded-3xl overflow-hidden border border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 p-4 flex items-center justify-center max-h-[400px]">
              <img 
                src={currentQuestion.imageUrl} 
                alt="תרשים נתונים" 
                className="max-w-full max-h-[350px] object-contain rounded-2xl shadow-sm" 
              />
            </div>
          )}

          <div className="space-y-3">
            {currentQuestion.options.map((opt: string, idx: number) => {
              // עיצוב כפתורי האפשרויות במצבים שונים
              let buttonStyle = "border-slate-100 dark:border-slate-700 bg-slate-50/30 dark:bg-slate-800/40 text-black dark:text-white dark:text-slate-200 hover:border-blue-300 dark:hover:border-blue-500/40 hover:bg-blue-50/30 dark:hover:bg-blue-500/5 hover:shadow-sm";
              let badgeStyle = "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-black dark:text-white";
              let statusIcon = null;

              if (isAnswered) {
                if (idx === currentQuestion.correctIndex) {
                  buttonStyle = "border-emerald-500 bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-950 dark:text-emerald-300 font-black shadow-sm shadow-emerald-500/5"; 
                  badgeStyle = "bg-emerald-500 border-emerald-500 text-white";
                  statusIcon = <Check size={14} strokeWidth={3} />;
                } else if (idx === selectedOption) {
                  buttonStyle = "border-rose-400 dark:border-rose-500 bg-rose-500/10 dark:bg-rose-500/15 text-rose-950 dark:text-rose-300 font-medium"; 
                  badgeStyle = "bg-rose-500 border-rose-500 text-white";
                  statusIcon = <X size={14} strokeWidth={3} />;
                } else {
                  buttonStyle = "border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/40 text-black dark:text-white opacity-40 cursor-not-allowed"; 
                  badgeStyle = "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-black dark:text-white";
                }
              } else if (selectedOption === idx) {
                buttonStyle = "border-blue-500 bg-blue-50/50 dark:bg-blue-500/10 ring-2 ring-blue-500/10 dark:ring-blue-500/20 font-black text-blue-950 dark:text-blue-100"; 
                badgeStyle = "bg-blue-600 border-blue-600 text-white";
              }

              return (
                <button
                  key={idx}
                  onClick={() => !isAnswered && setSelectedOption(idx)}
                  disabled={isAnswered}
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
        </div>

        {/* פאנל משוב ופעולות */}
        <div className="flex flex-col gap-4">
          {!isAnswered && (
            <button
              onClick={handleCheckAnswer}
              disabled={selectedOption === null || savingLoading}
              className={`w-full py-5 rounded-2xl font-black text-lg sm:text-xl transition-all shadow-lg flex items-center justify-center gap-2 ${
                selectedOption !== null && !savingLoading 
                  ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-white hover:-translate-y-0.5' 
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed'
              }`}
            >
              {savingLoading ? <Loader2 className="animate-spin" /> : 'בדוק תשובה'}
            </button>
          )}

          {isAnswered && (
            <div className="space-y-4 animate-slide-up">
              <div className={`p-6 rounded-2xl border-2 flex items-start gap-4 ${
                isCorrect 
                  ? 'bg-emerald-500/10 dark:bg-emerald-500/15 border-emerald-500/20 dark:border-emerald-500/30 text-emerald-950 dark:text-emerald-200 shadow-sm shadow-emerald-500/5' 
                  : 'bg-rose-500/10 dark:bg-rose-500/15 border-rose-500/20 dark:border-rose-500/30 text-rose-950 dark:text-rose-200'
              }`}>
                {isCorrect 
                  ? <CheckCircle2 size={32} className="text-emerald-500 shrink-0 mt-0.5" /> 
                  : <XCircle size={32} className="text-rose-500 shrink-0 mt-0.5" />
                }
                <div>
                  <h3 className="font-black text-lg sm:text-xl mb-1">{isCorrect ? 'תשובה נכונה! כל הכבוד.' : 'טעות הפעם. לא נורא, לומדים מזה!'}</h3>
                  <p className="font-medium opacity-80 text-sm">
                    זמן פתרון: <span className="font-bold font-mono">{formatTime(secondsElapsed)}</span>
                  </p>
                </div>
              </div>

              {currentQuestion.explanation && (
                <div className="p-8 bg-amber-500/10 dark:bg-amber-500/10 rounded-2xl border border-amber-200/40 dark:border-amber-500/20">
                  <h4 className="flex items-center gap-2 font-black text-amber-800 dark:text-amber-400 mb-4 text-base sm:text-lg">
                    <Lightbulb className="animate-pulse text-amber-600 dark:text-amber-400" />
                    הסבר פתרון כמותיקס
                  </h4>
                  <p className="text-amber-900 dark:text-amber-200/80 font-bold leading-relaxed text-sm sm:text-base whitespace-pre-wrap">
                    {currentQuestion.explanation}
                  </p>
                </div>
              )}

              <button
                onClick={handleNextQuestion}
                className="w-full py-5 rounded-2xl font-black text-lg sm:text-xl bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-700 hover:to-sky-600 text-white hover:-translate-y-0.5 transition-all shadow-lg shadow-blue-500/10 flex justify-center items-center gap-2"
              >
                <span>{currentIndex === questions.length - 1 ? 'סיים תרגול והצג סיכום' : 'לשאלה הבאה'}</span>
                <ChevronLeft size={20} />
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}