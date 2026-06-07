"use client";

import { useState } from "react";
import { signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, ArrowLeft, LogIn } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoggingIn) return;
    
    setIsLoggingIn(true);
    setError("");
    
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/dashboard");
    } catch (err: any) {
      setError("אימייל או סיסמה לא נכונים. נסה שוב.");
      setIsLoggingIn(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (isLoggingIn) return;

    setIsLoggingIn(true);
    setError("");

    try {
      await signInWithPopup(auth, googleProvider);
      router.push("/dashboard");
    } catch (err: any) {
      if (err.code === "auth/popup-blocked") {
        setError("הדפדפן חסם את החלון הקופץ. אנא אשר חלונות קופצים בדפדפן (שורת הכתובת).");
      } else if (err.code === "auth/cancelled-popup-request") {
        console.log("בקשת הפופ-אפ בוטלה");
      } else {
        setError("שגיאה בהתחברות עם גוגל.");
      }
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-[#0c1222] dark:to-slate-900 flex flex-col items-center justify-center p-6 relative overflow-hidden transition-colors duration-300" dir="rtl">
      {/* Ambient background orbs */}
      <div className="absolute top-[-20%] right-[-10%] w-[40%] h-[40%] bg-blue-100/40 dark:bg-blue-600/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-15%] left-[-10%] w-[35%] h-[35%] bg-sky-100/40 dark:bg-sky-500/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-[440px] animate-page-enter relative z-10">
        
        {/* לוגו האתר */}
        <Link href="/" className="flex items-center justify-center gap-3 mb-8 group">
          <div className="w-12 h-12 bg-gradient-to-tr from-blue-600 to-sky-400 rounded-2xl flex items-center justify-center shadow-xl shadow-sky-100 dark:shadow-blue-900/30 group-hover:rotate-6 group-hover:scale-105 transition-all duration-300">
            <span className="text-white font-black text-2xl tracking-tighter">כ</span>
          </div>
          <span className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-sky-500 tracking-tight">כמותיקס</span>
        </Link>

        {/* כרטיס הזנה */}
        <div className="bg-white/80 dark:bg-slate-800/60 backdrop-blur-xl p-8 md:p-10 rounded-[2.5rem] shadow-[0_10px_40px_-10px_rgba(15,23,42,0.06)] dark:shadow-[0_10px_40px_-10px_rgba(0,0,0,0.3)] border border-slate-200/50 dark:border-slate-700/50 transition-colors duration-300">
          <div className="mb-8 text-center md:text-right">
            <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-1.5 font-display tracking-tight transition-colors">ברוכים השבים</h1>
            <p className="text-black dark:text-white font-bold text-sm uppercase tracking-wide transition-colors">התחברו כדי להמשיך ללמוד ולתרגל</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            
            {/* שדה אימייל */}
            <div className="space-y-1.5 text-right">
              <label className="text-sm font-black text-black dark:text-white mr-1 transition-colors">אימייל</label>
              <div className="relative">
                <Mail className="absolute right-4 top-1/2 -translate-y-1/2 text-black dark:text-white transition-colors" size={18} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50/50 dark:bg-slate-900/50 border-2 border-slate-100 dark:border-slate-700 pr-11 pl-4 py-3.5 rounded-2xl focus:border-blue-500 dark:focus:border-blue-400 focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-blue-50 dark:focus:ring-blue-500/10 outline-none transition-all text-slate-900 dark:text-white font-bold placeholder:text-slate-300 dark:placeholder:text-slate-600 text-[15px]"
                  placeholder="name@example.com"
                  required
                />
              </div>
            </div>

            {/* שדה סיסמה */}
            <div className="space-y-1.5 text-right">
              <label className="text-sm font-black text-black dark:text-white mr-1 transition-colors">סיסמה</label>
              <div className="relative">
                <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-black dark:text-white transition-colors" size={18} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50/50 dark:bg-slate-900/50 border-2 border-slate-100 dark:border-slate-700 pr-11 pl-4 py-3.5 rounded-2xl focus:border-blue-500 dark:focus:border-blue-400 focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-blue-50 dark:focus:ring-blue-500/10 outline-none transition-all text-slate-900 dark:text-white font-bold placeholder:text-slate-300 dark:placeholder:text-slate-600 text-[15px]"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {error && <div className="p-4 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-sm font-bold rounded-xl border border-red-100 dark:border-red-500/20 text-right animate-pulse transition-colors">{error}</div>}

            {/* כפתור התחברות */}
            <button
              type="submit"
              disabled={isLoggingIn}
              className={`w-full py-4 rounded-2xl font-black text-lg shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] ${
                isLoggingIn 
                ? "bg-slate-200 dark:bg-slate-700 text-black dark:text-white cursor-not-allowed" 
                : "bg-gradient-to-r from-blue-600 to-sky-500 text-white hover:from-blue-700 hover:to-sky-600 shadow-blue-100 dark:shadow-blue-900/30 hover:shadow-blue-200 dark:hover:shadow-blue-800/40 hover:-translate-y-0.5"
              }`}
            >
              <span>{isLoggingIn ? "מתחבר..." : "התחברות"}</span>
              <ArrowLeft size={18} className="mr-1" />
            </button>
          </form>

          {/* מפריד */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-100 dark:border-slate-700"></span></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="px-4 bg-white dark:bg-slate-800 text-black dark:text-white font-black transition-colors">או התחברו באמצעות</span></div>
          </div>

          {/* התחברות עם גוגל */}
          <button
            onClick={handleGoogleSignIn}
            disabled={isLoggingIn}
            className="w-full py-4 border-2 border-slate-200/80 dark:border-slate-700 rounded-2xl font-bold text-black dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:border-slate-300 dark:hover:border-slate-600 transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-50 cursor-pointer active:scale-[0.98]"
          >
            <LogIn size={18} className="text-blue-500 dark:text-blue-400" />
            <span>המשך עם Google</span>
          </button>

          <p className="mt-8 text-center text-[14px] font-bold text-black dark:text-white transition-colors">
            עדיין אין לכם חשבון?{" "}
            <Link href="/register" className="text-blue-600 dark:text-blue-400 hover:underline hover:text-blue-700 dark:hover:text-blue-300 transition-colors">הירשמו עכשיו</Link>
          </p>
        </div>
      </div>
    </div>
  );
}