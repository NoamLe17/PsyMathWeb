"use client";

import { useState, useEffect, useRef } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy, doc, setDoc, getDoc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { PlayCircle, ChevronRight, ChevronLeft, BookOpen, CheckCircle2, Circle, Expand, Minimize, AlertTriangle, Menu } from "lucide-react";

export default function CoursePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [chapters, setChapters] = useState<any[]>([]);
  const [activeLesson, setActiveLesson] = useState<any>(null);
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  const playerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const ytPlayerRef = useRef<any>(null);

  // Load YouTube API globally
  useEffect(() => {
    if (typeof window !== 'undefined' && !(window as any).YT) {
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName('script')[0];
      if (firstScriptTag?.parentNode) {
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      }
    }
  }, []);

  const markLessonAsCompleted = async (lessonId: string) => {
    if (!user) return;
    setCompletedLessons(prev => {
      if (prev.includes(lessonId)) return prev;
      
      const progressRef = doc(db, "userProgress", user.uid);
      setDoc(progressRef, { completed: arrayUnion(lessonId) }, { merge: true }).catch(console.error);
      
      return [...prev, lessonId];
    });
  };

  const extractYoutubeId = (url: string) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  useEffect(() => {
    const fetchCourseData = async () => {
      const chaptersQuery = query(collection(db, "chapters"), orderBy("order", "asc"));
      const chaptersSnap = await getDocs(chaptersQuery);
      
      const chaptersData = await Promise.all(
        chaptersSnap.docs.map(async (chapterDoc) => {
          const lessonsQuery = query(collection(db, "chapters", chapterDoc.id, "lessons"), orderBy("order", "asc"));
          const lessonsSnap = await getDocs(lessonsQuery);
          return { id: chapterDoc.id, ...chapterDoc.data(), lessons: lessonsSnap.docs.map(d => ({ id: d.id, ...d.data() })) };
        })
      );

      setChapters(chaptersData);

      let completed: string[] = [];
      if (user) {
        // Validate ownership before proceeding
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

        const progressSnap = await getDoc(doc(db, "userProgress", user.uid));
        if (progressSnap.exists()) {
          completed = progressSnap.data().completed || [];
          setCompletedLessons(completed);
        }
      }

      // Find the first uncompleted lesson
      let firstUncompleted = null;
      for (const chapter of chaptersData) {
        for (const lesson of chapter.lessons) {
          if (!completed.includes(lesson.id)) {
            firstUncompleted = lesson;
            break;
          }
        }
        if (firstUncompleted) break;
      }

      if (firstUncompleted) {
        setActiveLesson(firstUncompleted);
      } else if (chaptersData.length > 0 && chaptersData[0].lessons.length > 0) {
        setActiveLesson(chaptersData[0].lessons[0]);
      }
    };

    if (user) fetchCourseData();
  }, [user]);

  useEffect(() => {
    if (!activeLesson || !activeLesson.videoUrl) return;
    
    const videoId = extractYoutubeId(activeLesson.videoUrl);
    if (!videoId) return;

    let checkYtInterval: any;

    const initPlayer = () => {
      if (!(window as any).YT || !(window as any).YT.Player) {
        return;
      }

      clearInterval(checkYtInterval);

      if (ytPlayerRef.current) {
        try {
          ytPlayerRef.current.destroy();
        } catch (e) {}
      }

      // Verify the container exists before initializing
      if (document.getElementById('youtube-player-container')) {
        ytPlayerRef.current = new (window as any).YT.Player('youtube-player-container', {
          videoId: videoId,
          playerVars: {
            autoplay: 1,
            rel: 0
          },
          events: {
            onStateChange: (event: any) => {
              if (event.data === 0) { // 0 represents YT.PlayerState.ENDED
                markLessonAsCompleted(activeLesson.id);
              }
            }
          }
        });
      }
    };

    checkYtInterval = setInterval(initPlayer, 500);

    return () => {
      clearInterval(checkYtInterval);
    };
  }, [activeLesson]);

  const toggleNativeFullscreen = async () => {
    if (!playerRef.current) return;
    if (!isFullscreen) {
      if (playerRef.current.requestFullscreen) await playerRef.current.requestFullscreen();
      else if ((playerRef.current as any).webkitRequestFullscreen) await (playerRef.current as any).webkitRequestFullscreen();
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) await document.exitFullscreen();
      else if ((document as any).webkitExitFullscreen) await (document as any).webkitExitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const toggleComplete = async () => {
    if (!user || !activeLesson) return;
    const progressRef = doc(db, "userProgress", user.uid);
    const isCompleted = completedLessons.includes(activeLesson.id);
    try {
      if (isCompleted) {
        await updateDoc(progressRef, { completed: arrayRemove(activeLesson.id) });
        setCompletedLessons(prev => prev.filter(id => id !== activeLesson.id));
      } else {
        await setDoc(progressRef, { completed: arrayUnion(activeLesson.id) }, { merge: true });
        setCompletedLessons(prev => [...prev, activeLesson.id]);
      }
    } catch (err) { console.error(err); }
  };

  const isValidVideoUrl = (url: string) => {
    if (!url) return false;
    return url.startsWith("http") && !url.includes(window.location.host);
  };

  if (loading || !activeLesson) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex flex-col gap-4 items-center justify-center bg-slate-50 dark:bg-[#0c1222] font-sans transition-colors duration-300">
        <div className="w-10 h-10 border-4 border-blue-600 dark:border-sky-400 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-sm font-bold text-black dark:text-white animate-pulse">טוען את תוכנית הלימודים...</span>
      </div>
    );
  }

  const isYouTube = !!extractYoutubeId(activeLesson.videoUrl);

  return (
    <div className="flex h-[calc(100vh-80px)] bg-slate-50/30 dark:bg-[#0c1222] overflow-hidden font-sans animate-page-enter transition-colors duration-300" dir="rtl">
      
      {/* Sidebar - Lessons List */}
      <aside 
        className={`bg-white dark:bg-slate-900 border-l border-slate-200/60 dark:border-slate-800 transition-all duration-300 ease-in-out flex flex-col shadow-xl dark:shadow-slate-950/50 z-20 relative overflow-hidden ${
          isSidebarOpen ? 'w-96 opacity-100' : 'w-0 opacity-0 pointer-events-none'
        }`}
      >
        <div className="w-96 flex flex-col h-full">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
            <h2 className="text-lg font-black text-black dark:text-white dark:text-slate-100 flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg flex items-center justify-center"><BookOpen size={16} /></div>
              <span>סילבוס השיעורים</span>
            </h2>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {chapters.map((chapter) => (
              <div key={chapter.id} className="space-y-2 mb-6">
                <h3 className="px-4 py-2 mt-2 mb-3 text-sm md:text-base font-black tracking-wide text-black dark:text-white bg-slate-100 dark:bg-slate-800/80 border-r-4 border-blue-500 rounded-l-xl mr-1 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.1)]">{chapter.title}</h3>
                <div className="space-y-1.5 px-1">
                  {chapter.lessons.map((lesson: any) => {
                    const isDone = completedLessons.includes(lesson.id);
                    const isActive = activeLesson.id === lesson.id;
                    return (
                      <button 
                        key={lesson.id} 
                        onClick={() => setActiveLesson(lesson)} 
                        className={`w-full text-right px-4 py-3.5 rounded-2xl transition-all duration-200 flex items-center justify-between group active:scale-98 cursor-pointer ${
                          isDone && isActive ? "bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-500/10" : 
                          isActive ? "bg-gradient-to-r from-blue-600 to-sky-500 text-white shadow-lg shadow-blue-500/15" : 
                          isDone ? "bg-emerald-50/50 dark:bg-emerald-500/10 border border-emerald-100/50 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/15" : 
                          "text-black dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800/70 border border-transparent"
                        }`}
                      >
                        <div className="flex items-center gap-3 max-w-[80%]">
                          {isDone ? (
                            <CheckCircle2 size={18} className={isActive ? 'text-white' : 'text-emerald-500 dark:text-emerald-400'} />
                          ) : (
                            <PlayCircle size={18} className={isActive ? 'text-white' : 'text-black dark:text-white group-hover:text-blue-500 dark:group-hover:text-blue-400'} />
                          )}
                          <span className="font-bold text-sm leading-tight truncate">{lesson.title}</span>
                        </div>
                        {lesson.duration && (
                          <span className={`text-[11px] font-extrabold px-2 py-1 rounded-lg ${
                            isActive ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-black dark:text-white'
                          }`}>
                            {lesson.duration}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-y-auto bg-slate-50/30 dark:bg-[#0c1222] transition-all duration-300">
        <header className="sticky top-0 glass dark:bg-slate-900/80 dark:backdrop-blur-xl z-10 p-4 border-b border-slate-200/50 dark:border-slate-800/60 flex items-center gap-6 px-8 shrink-0">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
            className="p-2.5 bg-slate-50 dark:bg-slate-800 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 rounded-xl transition-all shadow-sm border border-slate-200/60 dark:border-slate-700 flex items-center gap-2 group cursor-pointer active:scale-95 text-black dark:text-white"
          >
            {isSidebarOpen ? (
              <>
                <ChevronRight size={18} />
                <span className="text-xs font-bold hidden group-hover:block transition-all pl-1">הסתר סילבוס</span>
              </>
            ) : (
              <>
                <Menu size={18} />
                <span className="text-xs font-bold pl-1">הצג סילבוס השיעורים</span>
              </>
            )}
          </button>
          
          <div className="h-5 w-px bg-slate-200 dark:bg-slate-700"></div>
          <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-2.5 py-1 rounded-full shrink-0">שיעור פעיל</span>
          <h1 className="text-lg font-black text-black dark:text-white dark:text-slate-100 truncate tracking-tight">{activeLesson.title}</h1>
        </header>

        <div className="p-6 md:p-10 max-w-5xl mx-auto w-full transition-all flex-1">
          {/* Cinema Frame Video Player */}
          <div 
            ref={playerRef} 
            className="aspect-video bg-slate-950 rounded-3xl overflow-hidden shadow-[0_20px_50px_-12px_rgba(15,23,42,0.15)] dark:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] hover:shadow-[0_25px_60px_-12px_rgba(37,99,235,0.15)] dark:hover:shadow-[0_25px_60px_-12px_rgba(37,99,235,0.25)] border border-slate-200/80 dark:border-slate-700/50 mb-8 relative group transition-all duration-500"
          >
            {isValidVideoUrl(activeLesson.videoUrl) ? (
              isYouTube ? (
                <div id="youtube-player-container" className="w-full h-full border-none pointer-events-auto z-10 relative"></div>
              ) : (
                <iframe src={activeLesson.videoUrl} className="w-full h-full border-none relative z-10" allowFullScreen allow="autoplay; fullscreen"></iframe>
              )
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-white p-10 text-center gap-4 bg-slate-900 relative">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-900 to-slate-950 opacity-90"></div>
                <div className="relative z-10 flex flex-col items-center gap-4">
                  <div className="w-16 h-16 bg-blue-500/10 text-blue-400 rounded-full flex items-center justify-center border border-blue-500/20 mb-2">
                    <AlertTriangle size={32} />
                  </div>
                  <p className="text-xl font-black tracking-tight text-slate-100">ממתין להעלאת סרטון שיעור</p>
                  <p className="text-sm text-black dark:text-white max-w-sm leading-relaxed font-medium">
                    שיעור זה נמצא כרגע בעריכה ועריכת וידאו במערכת כמותיקס. פרטי הקישור יעודכנו בקרוב על ידי האדמין.
                  </p>
                </div>
              </div>
            )}
            
            <button 
              onClick={toggleNativeFullscreen} 
              className="absolute bottom-6 left-6 p-3.5 bg-slate-950/60 backdrop-blur-md text-white rounded-xl hover:bg-slate-950/80 transition-all z-30 opacity-0 group-hover:opacity-100 shadow-xl cursor-pointer active:scale-95"
            >
              {isFullscreen ? <Minimize size={20} /> : <Expand size={20} />}
            </button>
          </div>

          {/* Completion Status Area */}
          <div className="flex flex-col md:flex-row items-center justify-between bg-white dark:bg-slate-900 p-8 sm:p-10 rounded-3xl shadow-[0_4px_25px_-5px_rgba(15,23,42,0.02)] dark:shadow-[0_4px_25px_-5px_rgba(0,0,0,0.2)] border border-slate-100 dark:border-slate-800 gap-8 transition-colors duration-300">
            <div className="text-center md:text-right">
              <div className="flex items-center justify-center md:justify-start gap-2 text-emerald-600 dark:text-emerald-400 font-extrabold mb-2 uppercase tracking-widest text-xs">
                <CheckCircle2 size={15} />
                <span>התקדמות אישית בכמותיקס</span>
              </div>
              <h2 className="text-2xl font-black text-black dark:text-white dark:text-slate-100 mb-2 tracking-tight">סיימתם לצפות בשיעור?</h2>
              <p className="text-black dark:text-white text-sm font-medium max-w-sm leading-relaxed">
                סמנו אותו כהושלם כדי לעדכן את אחוזי ההתקדמות שלכם בלוח הבקרה ולעבור לפרק הבא. {isYouTube && "השיעור יסומן כהושלם גם אוטומטית כשתסיימו לצפות בו."}
              </p>
            </div>
            
            <button 
              onClick={toggleComplete}
              className={`flex items-center gap-3 px-10 py-5 rounded-2xl font-black text-base sm:text-lg transition-all shadow-md active:scale-95 cursor-pointer border ${
                completedLessons.includes(activeLesson.id) 
                  ? "bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-600 dark:border-emerald-500 shadow-emerald-500/15" 
                  : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-black dark:text-white dark:text-slate-200 hover:border-blue-500 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50/10 dark:hover:bg-blue-500/10 shadow-slate-100/50 dark:shadow-slate-950/50"
              }`}
            >
              {completedLessons.includes(activeLesson.id) ? (
                <>
                  <CheckCircle2 size={24} />
                  <span>שיעור הושלם!</span>
                </>
              ) : (
                <>
                  <Circle size={24} className="stroke-[1.5]" />
                  <span>סמן כהושלם</span>
                </>
              )}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}