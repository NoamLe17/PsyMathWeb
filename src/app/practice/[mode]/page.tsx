"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where, orderBy, limit } from "firebase/firestore";
import { Timer, CheckCircle2, XCircle, ChevronLeft, AlertCircle, Expand, Minimize, BarChart3, Loader2 } from "lucide-react";

export default function PracticeSessionPage() {
  const { mode } = useParams();
  const router = useRouter();
  
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [timeLeft, setTimeLeft] = useState(20 * 60);
  const [isFinished, setIsFinished] = useState(false);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const buildExam = async () => {
      setLoading(true);
      try {
        const qRef = collection(db, "questions");
        
        // משיכת שאלות רגילות ממוינות לפי קושי
        const regQ = await getDocs(query(qRef, where("isDataInterpretation", "==", false), orderBy("difficulty", "asc")));
        const allRegular = regQ.docs.map(d => ({ id: d.id, ...d.data() }));

        // משיכת שאלות תרשים
        const chartQ = await getDocs(query(qRef, where("isDataInterpretation", "==", true), limit(4)));
        const allChart = chartQ.docs.map(d => ({ id: d.id, ...d.data() }));

        let finalExam = [];
        if (mode === "simulation") {
          finalExam = [...allRegular.slice(0, 16), ...allChart];
        } else {
          finalExam = [...allRegular, ...allChart].sort(() => Math.random() - 0.5);
        }
        setQuestions(finalExam);
      } catch (err) {
        console.error("Error building exam:", err);
      } finally {
        setLoading(false);
      }
    };
    buildExam();
  }, [mode]);

  useEffect(() => {
    if (mode === "simulation" && timeLeft > 0 && !isFinished) {
      const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
      return () => clearInterval(timer);
    } else if (timeLeft === 0 && !isFinished) {
      setIsFinished(true);
    }
  }, [timeLeft, mode, isFinished]);

  const handleAnswer = (index: number) => {
    if (showExplanation && mode === "self") return;
    setSelectedAnswer(index);
    if (mode === "self") setShowExplanation(true);
  };

  const nextQuestion = () => {
    if (selectedAnswer === questions[currentIndex].correctIndex) {
      setScore(prev => prev + 1);
    }
    
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    } else {
      setIsFinished(true);
    }
  };

  // בדיקת בטיחות: אם אנחנו בטעינה או שאין שאלות עדיין
  if (loading || questions.length === 0) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 font-sans" dir="rtl">
      <Loader2 className="animate-spin text-sky-500 mb-4" size={48} />
      <h2 className="text-xl font-black text-black dark:text-white">מכין את השאלות...</h2>
      <p className="text-black dark:text-white text-sm mt-2">וודא שיצרת אינדקס בפיירבייס אם זו פעם ראשונה</p>
    </div>
  );

  if (isFinished) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 p-6 font-sans" dir="rtl">
        <div className="bg-white p-12 rounded-[3.5rem] shadow-2xl text-center max-w-lg w-full border-b-8 border-sky-500">
          <h2 className="text-4xl font-black text-slate-900 mb-2 tracking-tight">סיכום התרגול</h2>
          <div className="text-7xl font-black text-sky-500 my-8 italic">{score}<span className="text-slate-200 text-3xl mx-2">/</span>{questions.length}</div>
          <button onClick={() => router.push("/practice")} className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-xl hover:bg-sky-600 transition-all shadow-xl">
            חזרה למרכז התרגול
          </button>
        </div>
      </div>
    );
  }

  // הגדרת השאלה הנוכחית רק אחרי שווידאנו שיש שאלות
  const currentQ = questions[currentIndex];

  // פונקציית עזר לפורמט זמן
  const formatTime = (s: number) => `${Math.floor(s/60)}:${(s%60).toString().padStart(2, '0')}`;

  return (
    <div className={`min-h-screen bg-slate-50 font-sans p-4 md:p-8 ${mode === 'simulation' ? 'bg-slate-100' : ''}`} dir="rtl">
      <div className={`mx-auto transition-all duration-700 ${currentQ?.isDataInterpretation ? 'max-w-7xl' : 'max-w-4xl'}`}>
        
        {/* Header - סטטוס וזמן */}
        <header className="flex justify-between items-center mb-8 bg-white p-5 rounded-[2rem] shadow-sm border border-slate-100">
          <div className="flex items-center gap-6">
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-black dark:text-white uppercase tracking-widest text-right">התקדמות</span>
              <span className="text-lg font-black text-black dark:text-white italic">שאלה {currentIndex + 1} <span className="text-black dark:text-white font-normal">/ {questions.length}</span></span>
            </div>
            {mode === "simulation" && (
              <div className={`flex items-center gap-3 px-6 py-2 rounded-2xl font-black text-xl ${timeLeft < 60 ? 'bg-red-50 text-red-500 animate-pulse' : 'bg-slate-50 text-black dark:text-white'}`}>
                <Timer size={22} />
                {formatTime(timeLeft)}
              </div>
            )}
          </div>
          <div className="w-64 bg-slate-100 h-3 rounded-full overflow-hidden hidden md:block">
            <div className="bg-sky-500 h-full transition-all duration-700 ease-out" style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}></div>
          </div>
        </header>

        <div className={`grid gap-8 ${currentQ?.isDataInterpretation ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
          
          {/* אזור התרשים */}
          {currentQ?.isDataInterpretation && (
            <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border-4 border-sky-100 flex flex-col h-full min-h-[400px]">
              <div className="flex items-center gap-2 text-sky-600 font-black mb-4 uppercase text-xs tracking-widest">
                <BarChart3 size={18} /> הסקה מתרשים
              </div>
              <div className="flex-1 flex items-center justify-center bg-slate-50 rounded-2xl overflow-hidden">
                <img src={currentQ.imageUrl} alt="תרשים" className="max-w-full max-h-full object-contain" />
              </div>
            </div>
          )}

          {/* אזור השאלה */}
          <div className="flex flex-col gap-6">
            <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100 relative">
              <div className="absolute top-8 left-8 flex items-center gap-1.5 px-3 py-1 bg-slate-50 rounded-full">
                <span className="text-[10px] font-black text-black dark:text-white uppercase">קושי: {currentQ?.difficulty}</span>
              </div>
              <h2 className="text-2xl font-black text-black dark:text-white leading-tight mb-12 text-right">
                {currentQ?.text}
              </h2>
              
              <div className="grid grid-cols-1 gap-4">
                {currentQ?.options?.map((option: string, index: number) => {
                  let style = "flex items-center justify-between p-6 rounded-2xl border-2 transition-all font-bold text-lg text-right group ";
                  if (selectedAnswer === index) {
                    if (mode === "self") {
                      style += index === currentQ.correctIndex ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-red-500 bg-red-50 text-red-700";
                    } else {
                      style += "border-sky-500 bg-sky-50 text-sky-700 shadow-lg shadow-sky-100";
                    }
                  } else {
                    style += "border-slate-50 bg-slate-50 hover:border-sky-200 hover:bg-white text-black dark:text-white";
                  }

                  return (
                    <button key={index} onClick={() => handleAnswer(index)} className={style}>
                      <div className="flex items-center gap-4">
                        <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs transition-colors ${selectedAnswer === index ? 'bg-white/50' : 'bg-white text-black dark:text-white'}`}>
                          {index + 1}
                        </span>
                        <span>{option}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {showExplanation && mode === "self" && (
              <div className="bg-emerald-600 p-8 rounded-[2rem] text-white shadow-xl animate-in slide-in-from-bottom-4">
                <div className="flex items-center gap-2 font-black mb-3 text-emerald-100">
                  <AlertCircle size={20} /> הסבר פתרון:
                </div>
                <p className="text-lg font-bold leading-relaxed text-right">{currentQ?.explanation || "לא הוזן הסבר."}</p>
              </div>
            )}

            <div className="flex justify-end pt-4">
              <button 
                disabled={selectedAnswer === null}
                onClick={nextQuestion}
                className="group px-14 py-5 bg-slate-900 text-white rounded-3xl font-black text-xl shadow-2xl hover:bg-sky-600 hover:-translate-y-1 transition-all disabled:opacity-20 flex items-center gap-3"
              >
                {currentIndex === questions.length - 1 ? "סיים תרגול" : "שאלה הבאה"}
                <ChevronLeft className="group-hover:-translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}