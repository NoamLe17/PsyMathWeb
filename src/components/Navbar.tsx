"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { usePathname } from "next/navigation";
import { Menu, X, Settings, LogOut, User, GraduationCap, Sparkles, Moon, Sun, FileText, ShoppingBag } from "lucide-react";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const isAdmin = user?.email === "noamhemo2001@gmail.com" || user?.email === "novrubin12@gmail.com";

  const navLinks = [
    { name: "הקורסים שלי", href: "/dashboard", show: !!user, icon: GraduationCap },
    { name: "קטלוג קורסים", href: "/catalog", show: !!user, icon: ShoppingBag },
    { name: "תרגול מקוון", href: "/practice", show: !!user, icon: Sparkles },
    { name: "ניהול תוכן", href: "/admin", show: isAdmin, icon: Settings },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full glass border-b border-slate-200/40 dark:border-white/5 shadow-[0_1px_12px_-2px_rgba(15,23,42,0.04)]" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-18 items-center">

          {/* לוגו וניווט ראשי */}
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-sky-400 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/15 group-hover:rotate-3 group-hover:scale-105 transition-all duration-300">
                <span className="text-white font-black text-xl tracking-tighter">כ</span>
              </div>
              <span className="text-xl font-black gradient-text tracking-tight">
                כמותיקס
              </span>
            </Link>

            {/* ניווט דסקטופ */}
            <div className="hidden md:flex items-center gap-1.5">
              {navLinks.map((link) => {
                const Icon = link.icon;
                return link.show && (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200 flex items-center gap-2 ${pathname === link.href
                        ? "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 shadow-sm"
                        : "text-black dark:text-white hover:bg-slate-50 dark:hover:bg-white/5 hover:text-blue-600 dark:hover:text-blue-400"
                      }`}
                  >
                    <Icon size={16} />
                    {link.name}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* אזור משתמש (דסקטופ) */}
          <div className="hidden md:flex items-center gap-3">
            {/* Toggle dark mode */}
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl text-black dark:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-all duration-200 cursor-pointer active:scale-90"
              title={theme === "dark" ? "מצב בהיר" : "מצב כהה"}
            >
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* Privacy policy link */}
            <Link
              href="/privacy"
              className="p-2.5 rounded-xl text-black dark:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-all duration-200"
              title="מדיניות פרטיות"
            >
              <FileText size={18} />
            </Link>

            {user ? (
              <div className="flex items-center gap-2.5 bg-slate-50/80 dark:bg-white/5 p-1.5 pr-4 rounded-xl border border-slate-200/50 dark:border-white/5">
                <span className="text-sm font-bold text-black dark:text-white">{user.displayName || user.email}</span>
                <button
                  onClick={logout}
                  className="px-3.5 py-1.5 text-sm font-bold text-white bg-slate-800 dark:bg-slate-700 rounded-lg hover:bg-red-500 dark:hover:bg-red-500 transition-all duration-200 shadow-sm flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <LogOut size={14} />
                  <span>התנתק</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login" className="px-4 py-2 text-sm font-bold text-black dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors rounded-lg">
                  התחברות
                </Link>
                <Link href="/register" className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-sky-500 text-white rounded-xl font-bold text-sm shadow-md shadow-blue-500/15 hover:shadow-lg hover:shadow-blue-500/25 hover:-translate-y-0.5 transition-all duration-300 active:scale-95">
                  הצטרפות חינם
                </Link>
              </div>
            )}
          </div>

          {/* כפתור תפריט מובייל */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-black dark:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
            >
              {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-xl text-black dark:text-white hover:bg-slate-50 dark:hover:bg-white/5 hover:text-blue-600 transition-colors focus:outline-none"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

        </div>
      </div>

      {/* Backdrop overlay */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 top-18 bg-black/20 dark:bg-black/40 z-40 animate-fade-in"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* תפריט מובייל נפתח */}
      <div
        className={`md:hidden absolute w-full left-0 z-50 glass border-b border-slate-200/40 dark:border-white/5 shadow-xl transition-all duration-300 ease-in-out origin-top ${isOpen ? "opacity-100 scale-y-100 pointer-events-auto" : "opacity-0 scale-y-0 pointer-events-none h-0 overflow-hidden"
          }`}
      >
        <div className="px-4 pt-3 pb-6 space-y-1.5">
          {navLinks.map((link) => {
            const Icon = link.icon;
            return link.show && (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-base font-bold transition-all ${pathname === link.href
                    ? "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400"
                    : "text-black dark:text-white hover:bg-slate-50 dark:hover:bg-white/5 hover:text-blue-600"
                  }`}
              >
                <Icon size={20} />
                {link.name}
              </Link>
            );
          })}

          <Link
            href="/privacy"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-base font-bold text-black dark:text-white hover:bg-slate-50 dark:hover:bg-white/5 transition-all"
          >
            <FileText size={20} />
            מדיניות פרטיות
          </Link>

          <div className="pt-3 border-t border-slate-100 dark:border-white/5 flex flex-col gap-2 mt-2">
            {user ? (
              <>
                <div className="px-4 py-2 text-sm font-bold text-black dark:text-white flex items-center gap-2">
                  <User size={16} />
                  <span>{user.displayName || user.email}</span>
                </div>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    logout();
                  }}
                  className="w-full px-4 py-3 bg-slate-800 dark:bg-slate-700 text-white rounded-xl text-base font-bold hover:bg-red-500 dark:hover:bg-red-500 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  <LogOut size={18} />
                  <span>התנתק מהמערכת</span>
                </button>
              </>
            ) : (
              <div className="flex flex-col gap-2 px-2 pt-2">
                <Link
                  href="/login"
                  onClick={() => setIsOpen(false)}
                  className="w-full py-3 text-center text-black dark:text-white hover:text-blue-600 font-bold transition-colors rounded-xl"
                >
                  התחברות
                </Link>
                <Link
                  href="/register"
                  onClick={() => setIsOpen(false)}
                  className="w-full py-3 text-center bg-gradient-to-r from-blue-600 to-sky-500 text-white rounded-xl font-bold shadow-md shadow-blue-500/15 hover:shadow-lg transition-all"
                >
                  הצטרפות חינם
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}