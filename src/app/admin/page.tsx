"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, query, orderBy, deleteDoc, doc, updateDoc, writeBatch } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { 
  PlusCircle, Video, ListOrdered, CheckCircle2, 
  AlertCircle, Clock, HelpCircle, BarChart3, 
  BookOpen, Save, Loader2, Edit, Trash2, X,
  Settings, Database, FileText, ArrowRight, Award, Layers, GripVertical
} from "lucide-react";
import Link from "next/link";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// --- Sortable Item Component ---
function SortableLessonItem({ lesson, onDelete }: { lesson: any, onDelete: (id: string) => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: lesson.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-3 p-4 bg-slate-50/50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-700 rounded-2xl mb-3 shadow-sm hover:border-blue-300 dark:hover:border-blue-500/50 transition-colors">
      <div {...attributes} {...listeners} className="cursor-grab text-black dark:text-white hover:text-blue-500 dark:hover:text-blue-400 p-2">
        <GripVertical size={20} />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-bold text-black dark:text-white dark:text-slate-200 truncate">{lesson.title}</h4>
        <div className="flex items-center gap-4 text-xs text-black dark:text-white mt-1">
          <span className="flex items-center gap-1"><Clock size={12} /> {lesson.duration || "--:--"}</span>
          <span className="truncate max-w-[200px]" dir="ltr">{lesson.videoUrl}</span>
        </div>
      </div>
      <button
        type="button"
        onClick={() => onDelete(lesson.id)}
        className="p-2 text-red-500 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-xl transition-colors shrink-0"
      >
        <Trash2 size={18} />
      </button>
    </div>
  );
}

export default function AdminPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'course' | 'questions' | 'manage'>('course');
  const [chapters, setChapters] = useState<any[]>([]);
  
  // --- States לניהול קורס ---
  const [newChapterTitle, setNewChapterTitle] = useState("");
  const [selectedChapterId, setSelectedChapterId] = useState("");
  const [lessons, setLessons] = useState<any[]>([]);
  const [lessonTitle, setLessonTitle] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [duration, setDuration] = useState("");
  const [isFetchingDuration, setIsFetchingDuration] = useState(false);

  // --- States לבנק שאלות (הוספה) ---
  const [qText, setQText] = useState("");
  const [options, setOptions] = useState(["", "", "", ""]);
  const [correctIndex, setCorrectIndex] = useState(0);
  const [topic, setTopic] = useState("algebra");
  const [difficulty, setDifficulty] = useState(1);
  const [isDataInterpretation, setIsDataInterpretation] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [explanation, setExplanation] = useState("");

  // --- States לניהול מאגר קיים ---
  const [allQuestions, setAllQuestions] = useState<any[]>([]);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState({ text: "", type: "" });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      }
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (!loading && !user) router.push("/login");
    fetchChapters();
    if (activeTab === 'manage') fetchAllQuestions();
  }, [user, loading, router, activeTab]);

  useEffect(() => {
    if (selectedChapterId) {
      fetchLessons(selectedChapterId);
    } else {
      setLessons([]);
    }
  }, [selectedChapterId]);

  // Load YouTube API
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

  const fetchChapters = async () => {
    const q = query(collection(db, "chapters"), orderBy("order", "asc"));
    const querySnapshot = await getDocs(q);
    setChapters(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  const fetchLessons = async (chapterId: string) => {
    if (!chapterId) return;
    const q = query(collection(db, "chapters", chapterId, "lessons"), orderBy("order", "asc"));
    const querySnapshot = await getDocs(q);
    setLessons(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  const fetchAllQuestions = async () => {
    try {
      const q = query(collection(db, "questions"));
      const querySnapshot = await getDocs(q);
      const fetchedQuestions = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAllQuestions(fetchedQuestions);
    } catch (error) {
      console.error("Error fetching questions:", error);
    }
  };

  const showStatus = (text: string, type: "success" | "error") => {
    setStatus({ text, type });
    setTimeout(() => setStatus({ text: "", type: "" }), 4000);
  };

  const addChapter = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "chapters"), { title: newChapterTitle, order: chapters.length + 1 });
      setNewChapterTitle("");
      fetchChapters();
      showStatus("הפרק נוסף בהצלחה!", "success");
    } catch (err) { showStatus("שגיאה בהוספת הפרק", "error"); }
    setIsSubmitting(false);
  };

  const extractYoutubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const handleVideoUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value;
    setVideoUrl(newUrl);
    
    const videoId = extractYoutubeId(newUrl);
    if (videoId) {
      setIsFetchingDuration(true);
      let attempts = 0;
      
      const checkYT = setInterval(() => {
        attempts++;
        if ((window as any).YT && (window as any).YT.Player) {
          clearInterval(checkYT);
          
          const divId = 'yt-player-' + Date.now();
          const div = document.createElement('div');
          div.id = divId;
          div.style.display = 'none';
          document.body.appendChild(div);

          let player: any = new (window as any).YT.Player(divId, {
            videoId: videoId,
            events: {
              onReady: (event: any) => {
                const durationSeconds = event.target.getDuration();
                if (durationSeconds) {
                  const m = Math.floor(durationSeconds / 60).toString().padStart(2, '0');
                  const s = Math.floor(durationSeconds % 60).toString().padStart(2, '0');
                  setDuration(`${m}:${s}`);
                }
                player.destroy();
                div.remove();
                setIsFetchingDuration(false);
              },
              onError: () => {
                player.destroy();
                div.remove();
                setIsFetchingDuration(false);
              }
            }
          });
        } else if (attempts > 20) {
          clearInterval(checkYT);
          setIsFetchingDuration(false);
        }
      }, 500);
    }
  };

  const addLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChapterId) return showStatus("חובה לבחור פרק", "error");
    setIsSubmitting(true);
    try {
      let finalEmbedUrl = videoUrl;
      const videoId = extractYoutubeId(videoUrl);
      if (videoId && !videoUrl.includes('/embed/')) {
        finalEmbedUrl = `https://www.youtube.com/embed/${videoId}`;
      }

      const newOrder = lessons.length + 1;
      await addDoc(collection(db, "chapters", selectedChapterId, "lessons"), {
        title: lessonTitle, videoUrl: finalEmbedUrl, duration: duration, order: newOrder,
      });
      setLessonTitle(""); setVideoUrl(""); setDuration("");
      fetchLessons(selectedChapterId);
      showStatus("השיעור נוסף בהצלחה!", "success");
    } catch (err) { showStatus("שגיאה בהוספת השיעור", "error"); }
    setIsSubmitting(false);
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (!selectedChapterId) return;
    if (!confirm("האם אתה בטוח שברצונך למחוק סרטון זה?")) return;
    try {
      await deleteDoc(doc(db, "chapters", selectedChapterId, "lessons", lessonId));
      setLessons(prev => prev.filter(l => l.id !== lessonId));
      showStatus("הסרטון נמחק בהצלחה", "success");
    } catch (error) {
      showStatus("שגיאה במחיקת הסרטון", "error");
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !selectedChapterId) return;

    const oldIndex = lessons.findIndex((l) => l.id === active.id);
    const newIndex = lessons.findIndex((l) => l.id === over.id);

    const newLessons = arrayMove(lessons, oldIndex, newIndex);
    setLessons(newLessons);

    try {
      const batch = writeBatch(db);
      newLessons.forEach((lesson, index) => {
        const lessonRef = doc(db, "chapters", selectedChapterId, "lessons", lesson.id);
        batch.update(lessonRef, { order: index + 1 });
      });
      await batch.commit();
      showStatus("סדר הסרטונים עודכן בהצלחה", "success");
    } catch (error) {
      showStatus("שגיאה בעדכון הסדר", "error");
      fetchLessons(selectedChapterId); 
    }
  };

  const saveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingQuestionId) {
        const questionRef = doc(db, "questions", editingQuestionId);
        await updateDoc(questionRef, {
          text: qText, 
          options, 
          correctIndex: Number(correctIndex), 
          topic,
          difficulty: Number(difficulty),
          isDataInterpretation, 
          imageUrl: isDataInterpretation ? imageUrl : null,
          explanation
        });
        showStatus("השאלה עודכנה בהצלחה!", "success");
        setEditingQuestionId(null);
        setActiveTab('manage'); 
      } else {
        await addDoc(collection(db, "questions"), {
          text: qText, 
          options, 
          correctIndex: Number(correctIndex), 
          topic,
          difficulty: Number(difficulty),
          isDataInterpretation, 
          imageUrl: isDataInterpretation ? imageUrl : null,
          explanation, 
          createdAt: new Date(),
        });
        showStatus("השאלה נוספה לבנק!", "success");
      }
      resetQuestionForm();
    } catch (err) { showStatus("שגיאה בשמירת השאלה", "error"); }
    setIsSubmitting(false);
  };

  const resetQuestionForm = () => {
    setQText(""); setOptions(["", "", "", ""]); setCorrectIndex(0); setImageUrl(""); setExplanation(""); setEditingQuestionId(null);
  };

  const handleDeleteQuestion = async (id: string) => {
    if (!confirm("האם אתה בטוח שברצונך למחוק שאלה זו? הפעולה בלתי הפיכה.")) return;
    try {
      await deleteDoc(doc(db, "questions", id));
      showStatus("השאלה נמחקה בהצלחה", "success");
      fetchAllQuestions();
    } catch (error) {
      showStatus("שגיאה במחיקת השאלה", "error");
    }
  };

  const startEditQuestion = (q: any) => {
    setEditingQuestionId(q.id);
    setQText(q.text);
    setOptions(q.options || ["", "", "", ""]);
    setCorrectIndex(q.correctIndex || 0);
    setTopic(q.topic || "algebra");
    setDifficulty(q.difficulty || 1);
    setIsDataInterpretation(q.isDataInterpretation || false);
    setImageUrl(q.imageUrl || "");
    setExplanation(q.explanation || "");
    setActiveTab('questions');
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-[#0c1222] font-sans" dir="rtl">
      <div className="relative flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-blue-500/20 dark:border-blue-400/20 border-t-blue-600 dark:border-t-blue-400 rounded-full animate-spin"></div>
        <Loader2 className="absolute text-blue-600 dark:text-blue-400 animate-pulse" size={24} />
      </div>
      <h3 className="mt-6 text-lg font-black text-black dark:text-white dark:text-slate-200 animate-pulse">טוען מרכז ניהול כמותיקס...</h3>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-[#0c1222] pb-20 font-sans relative overflow-hidden animate-page-enter" dir="rtl">
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
      
      <div className="max-w-6xl mx-auto px-6 pt-12 relative">
        
        <div className="mb-6">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-black dark:text-white hover:text-blue-600 dark:hover:text-blue-400 font-bold transition-colors group">
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            <span>חזרה ללוח הבקרה של התלמיד</span>
          </Link>
        </div>

        <header className="mb-10 text-right">
          <div className="flex items-center gap-3 mb-2">
            <span className="p-2 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl border border-blue-100/50 dark:border-blue-500/20">
              <Settings size={22} className="animate-spin-slow" />
            </span>
            <span className="text-sm font-black tracking-widest text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-500/10 px-3 py-1 rounded-full border border-blue-100/20 dark:border-blue-500/20">
              מערכת בקרה וניהול תוכן
            </span>
          </div>
          
          <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-8 tracking-tight">כמותיקס Admin Center</h1>
          
          <div className="flex gap-2 p-1.5 bg-slate-200/50 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl w-fit border border-slate-200/20 dark:border-slate-700/50 shadow-sm flex-wrap">
            <button 
              onClick={() => setActiveTab('course')} 
              className={`flex items-center gap-2 px-6 py-3.5 rounded-xl font-black transition-all duration-300 text-sm sm:text-base ${
                activeTab === 'course' 
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-[0_4px_15px_-3px_rgba(15,23,42,0.05)] dark:shadow-[0_4px_15px_-3px_rgba(0,0,0,0.3)] border border-slate-100 dark:border-slate-600' 
                  : 'text-black dark:text-white hover:text-black dark:hover:text-white dark:hover:text-slate-200'
              }`}
            >
              <BookOpen size={18} /> 
              <span>ניהול קורס וידאו</span>
            </button>
            
            <button 
              onClick={() => {setActiveTab('questions'); resetQuestionForm();}} 
              className={`flex items-center gap-2 px-6 py-3.5 rounded-xl font-black transition-all duration-300 text-sm sm:text-base ${
                activeTab === 'questions' 
                  ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-[0_4px_15px_-3px_rgba(15,23,42,0.05)] dark:shadow-[0_4px_15px_-3px_rgba(0,0,0,0.3)] border border-slate-100 dark:border-slate-600' 
                  : 'text-black dark:text-white hover:text-black dark:hover:text-white dark:hover:text-slate-200'
              }`}
            >
              <PlusCircle size={18} /> 
              <span>הוספת שאלות לסימולטור</span>
            </button>
            
            <button 
              onClick={() => setActiveTab('manage')} 
              className={`flex items-center gap-2 px-6 py-3.5 rounded-xl font-black transition-all duration-300 text-sm sm:text-base ${
                activeTab === 'manage' 
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-[0_4px_15px_-3px_rgba(15,23,42,0.05)] dark:shadow-[0_4px_15px_-3px_rgba(0,0,0,0.3)] border border-slate-100 dark:border-slate-600' 
                  : 'text-black dark:text-white hover:text-black dark:hover:text-white dark:hover:text-slate-200'
              }`}
            >
              <Database size={18} /> 
              <span>ניהול מאגר קיים</span>
            </button>
          </div>
        </header>

        {status.text && (
          <div className={`mb-8 p-5 rounded-[1.5rem] flex items-center gap-3 border shadow-sm animate-in slide-in-from-top-2 duration-300 ${
            status.type === "success" 
              ? "bg-emerald-500/10 dark:bg-emerald-500/15 border-emerald-500/20 dark:border-emerald-500/30 text-emerald-950 dark:text-emerald-300" 
              : "bg-rose-500/10 dark:bg-rose-500/15 border-rose-500/20 dark:border-rose-500/30 text-rose-950 dark:text-rose-300"
          }`}>
            <AlertCircle size={20} className={status.type === "success" ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"} /> 
            <span className="font-bold text-sm sm:text-base">{status.text}</span>
          </div>
        )}

        {/* --- ניהול קורס --- */}
        {activeTab === 'course' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in duration-500">
            {/* הוספת פרק */}
            <section className="bg-white dark:bg-slate-800/70 p-8 sm:p-10 rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.015)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.15)] border border-slate-100/80 dark:border-slate-700/50">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-amber-50 dark:bg-amber-500/10 rounded-xl flex items-center justify-center border border-amber-100/50 dark:border-amber-500/20 text-amber-500 dark:text-amber-400">
                  <ListOrdered size={20} />
                </div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">הוספת פרק לימודי חדש</h2>
              </div>
              
              <form onSubmit={addChapter} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-black text-black dark:text-white mr-2 uppercase">שם הפרק הלימודי</label>
                  <input 
                    type="text" 
                    value={newChapterTitle} 
                    onChange={(e) => setNewChapterTitle(e.target.value)} 
                    className="w-full bg-slate-50/50 dark:bg-slate-900/50 border-2 border-slate-100 dark:border-slate-600 px-5 py-4 rounded-2xl font-bold text-black dark:text-white dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:border-blue-500 dark:focus:border-blue-400 focus:bg-white dark:focus:bg-slate-900 transition-all duration-200" 
                    placeholder="לדוגמה: יסודות האלגברה..." 
                    required 
                  />
                </div>
                <button 
                  disabled={isSubmitting} 
                  className="w-full bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-700 hover:to-sky-600 text-white py-4.5 rounded-2xl font-black text-base shadow-lg shadow-blue-500/10 dark:shadow-blue-500/20 hover:-translate-y-0.5 transition-all duration-200 flex justify-center items-center"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" /> : "צור פרק חדש במערכת"}
                </button>
              </form>
            </section>

            {/* ניהול שיעורים בפרק */}
            <section className="bg-white dark:bg-slate-800/70 p-8 sm:p-10 rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.015)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.15)] border border-slate-100/80 dark:border-slate-700/50 flex flex-col h-full">
              <div className="flex items-center gap-3 mb-8 shrink-0">
                <div className="w-10 h-10 bg-blue-50 dark:bg-blue-500/10 rounded-xl flex items-center justify-center border border-blue-100/50 dark:border-blue-500/20 text-blue-500 dark:text-blue-400">
                  <Video size={20} />
                </div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">ניהול שיעורי וידאו בפרק</h2>
              </div>
              
              <div className="space-y-6 flex-1 flex flex-col">
                <div className="space-y-2 shrink-0">
                  <label className="text-sm font-black text-black dark:text-white mr-2 uppercase">בחר פרק לניהול שיעוריו</label>
                  <select 
                    onChange={(e) => setSelectedChapterId(e.target.value)} 
                    className="w-full bg-slate-50/50 dark:bg-slate-900/50 border-2 border-slate-100 dark:border-slate-600 px-5 py-4 rounded-2xl font-bold text-black dark:text-white dark:text-slate-200 outline-none focus:border-blue-500 dark:focus:border-blue-400 focus:bg-white dark:focus:bg-slate-900 transition-all duration-200" 
                    value={selectedChapterId}
                  >
                    <option value="">בחר פרק לימודי...</option>
                    {chapters.map(ch => <option key={ch.id} value={ch.id}>{ch.title}</option>)}
                  </select>
                </div>

                {selectedChapterId && (
                  <>
                    <div className="mt-8 border-t border-slate-100 dark:border-slate-700 pt-6 flex-1 overflow-y-auto max-h-[400px] pr-2">
                      <h3 className="text-lg font-black text-black dark:text-white dark:text-slate-200 mb-4 flex items-center gap-2">
                        <ListOrdered size={18} className="text-blue-500" />
                        סדר הסרטונים בפרק (גרור כדי לשנות סדר)
                      </h3>
                      
                      {lessons.length > 0 ? (
                        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                          <SortableContext items={lessons.map(l => l.id)} strategy={verticalListSortingStrategy}>
                            <div className="space-y-1">
                              {lessons.map((lesson) => (
                                <SortableLessonItem key={lesson.id} lesson={lesson} onDelete={handleDeleteLesson} />
                              ))}
                            </div>
                          </SortableContext>
                        </DndContext>
                      ) : (
                        <div className="p-8 text-center text-black dark:text-white bg-slate-50/50 dark:bg-slate-900/30 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700">
                          אין עדיין סרטונים בפרק זה. הוסף את הסרטון הראשון למטה!
                        </div>
                      )}
                    </div>

                    <div className="mt-6 bg-blue-50/30 dark:bg-blue-900/10 p-6 rounded-3xl border border-blue-100 dark:border-blue-800/30 shrink-0">
                      <h3 className="text-lg font-black text-black dark:text-white dark:text-slate-200 mb-4 flex items-center gap-2">
                        <PlusCircle size={18} className="text-blue-500" />
                        הוספת סרטון חדש (יתווסף לסוף)
                      </h3>
                      
                      <form onSubmit={addLesson} className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-sm font-black text-black dark:text-white mr-2 uppercase">כותרת השיעור</label>
                          <input 
                            type="text" 
                            value={lessonTitle} 
                            onChange={(e) => setLessonTitle(e.target.value)} 
                            className="w-full bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-600 px-4 py-3 rounded-xl font-bold text-black dark:text-white dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-all duration-200" 
                            placeholder="לדוגמה: משוואות ממעלה ראשונה" 
                            required 
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <label className="text-sm font-black text-black dark:text-white mr-2 uppercase">קישור מוטמע של הסרטון </label>
                          <input 
                            type="text" 
                            value={videoUrl} 
                            onChange={handleVideoUrlChange} 
                            className="w-full bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-600 px-4 py-3 rounded-xl font-bold text-black dark:text-white dark:text-slate-200 font-mono text-sm outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-all duration-200" 
                            placeholder="https://www.youtube.com/watch?v=..." 
                            required 
                          />
                          <p className="text-xs text-black dark:text-white mr-2">הדבק קישור יוטיוב לקבלת אורך סרטון אוטומטי.</p>
                        </div>
                        
                        <div className="space-y-2">
                          <label className="text-sm font-black text-black dark:text-white mr-2 uppercase flex items-center gap-2">
                            משך השיעור 
                            {isFetchingDuration && <Loader2 size={14} className="animate-spin text-blue-500" />}
                          </label>
                          <input 
                            type="text" 
                            value={duration} 
                            onChange={(e) => setDuration(e.target.value)} 
                            disabled={isFetchingDuration}
                            className={`w-full bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-600 px-4 py-3 rounded-xl font-bold text-black dark:text-white dark:text-slate-200 outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-all duration-200 text-center ${isFetchingDuration ? 'opacity-60 bg-slate-100 dark:bg-slate-800' : ''}`} 
                            placeholder="----" 
                          />
                        </div>
                        
                        <button 
                          disabled={isSubmitting || isFetchingDuration} 
                          className="w-full mt-2 bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-700 hover:to-sky-600 text-white py-3.5 rounded-xl font-black text-base shadow-lg shadow-blue-500/10 dark:shadow-blue-500/20 hover:-translate-y-0.5 transition-all duration-200 flex justify-center items-center disabled:opacity-50 disabled:hover:translate-y-0"
                        >
                          {isSubmitting ? <Loader2 className="animate-spin" /> : "שמור סרטון"}
                        </button>
                      </form>
                    </div>
                  </>
                )}
              </div>
            </section>
          </div>
        )}

        {/* --- בנק שאלות (הוספה ועריכה) --- */}
        {activeTab === 'questions' && (
          <div className="animate-in fade-in duration-500">
            <section className="bg-white dark:bg-slate-800/70 p-8 sm:p-12 rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.015)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.15)] border border-slate-100/80 dark:border-slate-700/50">
              <div className="flex justify-between items-center mb-10 border-b border-slate-100 dark:border-slate-700 pb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl flex items-center justify-center border border-emerald-100/50 dark:border-emerald-500/20 text-emerald-500 dark:text-emerald-400">
                    <PlusCircle size={20} />
                  </div>
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                    {editingQuestionId ? "עריכת שאלה במאגר כמותיקס" : "הוספת שאלה חדשה לסימולטור"}
                  </h2>
                </div>
                {editingQuestionId && (
                  <button 
                    onClick={resetQuestionForm} 
                    className="text-black dark:text-white hover:text-red-500 dark:hover:text-red-400 flex items-center gap-1 font-black text-sm bg-slate-50 dark:bg-slate-700 px-4 py-2 rounded-xl transition-all"
                  >
                    <X size={16} /> 
                    <span>ביטול עריכה</span>
                  </button>
                )}
              </div>

              <form onSubmit={saveQuestion} className="space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                  
                  {/* עמוד ימין - פרטי השאלה */}
                  <div className="space-y-6">
                    <div className="space-y-2">
                       <label className="text-sm font-black text-black dark:text-white mr-2 uppercase">תוכן השאלה הכמותית (תומך בירידת שורות)</label>
                       <textarea 
                         value={qText} 
                         onChange={(e) => setQText(e.target.value)} 
                         className="w-full p-6 bg-slate-50/50 dark:bg-slate-900/50 border-2 border-slate-100 dark:border-slate-600 rounded-3xl font-bold text-black dark:text-white dark:text-slate-200 text-base sm:text-lg min-h-[180px] outline-none focus:border-emerald-400 dark:focus:border-emerald-400 focus:bg-white dark:focus:bg-slate-900 transition-all duration-200 placeholder:text-slate-400 dark:placeholder:text-slate-500" 
                         placeholder="הקלד או הדבק את השאלה כאן בצורה ברורה..." 
                         required 
                       />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-black text-black dark:text-white mr-2 uppercase">נושא השאלה</label>
                        <select 
                          value={topic} 
                          onChange={(e) => setTopic(e.target.value)} 
                          className="w-full p-4 bg-slate-50/50 dark:bg-slate-900/50 border-2 border-slate-100 dark:border-slate-600 rounded-2xl font-bold text-black dark:text-white dark:text-slate-200 outline-none focus:border-emerald-400 dark:focus:border-emerald-400 focus:bg-white dark:focus:bg-slate-900 transition-all"
                        >
                          <option value="algebra">אלגברה</option>
                          <option value="geometry">גיאומטריה</option>
                          <option value="word_problems">בעיות כמותיות</option>
                          <option value="charts">הסקה מתרשים</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-black text-black dark:text-white mr-2 uppercase">רמת קושי פסיכומטרית</label>
                        <select 
                          value={difficulty} 
                          onChange={(e) => setDifficulty(Number(e.target.value))} 
                          className="w-full p-4 bg-slate-50/50 dark:bg-slate-900/50 border-2 border-slate-100 dark:border-slate-600 rounded-2xl font-bold text-black dark:text-white dark:text-slate-200 outline-none focus:border-emerald-400 dark:focus:border-emerald-400 focus:bg-white dark:focus:bg-slate-900 transition-all"
                        >
                          <option value={1}>קושי 1 - קל מאוד (שאלות פתיחה)</option>
                          <option value={2}>קושי 2 - בינוני (ממוצע פרק)</option>
                          <option value={3}>קושי 3 - קשה (ממיין גבוה)</option>
                          <option value={4}>קושי 4 - קצה (שאלות 18-20)</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 bg-slate-50/70 dark:bg-slate-900/40 p-5 rounded-2xl border-2 border-slate-100 dark:border-slate-600">
                      <input 
                        type="checkbox" 
                        checked={isDataInterpretation} 
                        onChange={(e) => setIsDataInterpretation(e.target.checked)} 
                        className="w-5 h-5 accent-emerald-500 rounded cursor-pointer" 
                        id="isData" 
                      />
                      <label htmlFor="isData" className="font-black text-sm text-black dark:text-white cursor-pointer select-none">
                        שאלה זו דורשת תרשים/גרף עזר (הסקה מתרשים)
                      </label>
                    </div>

                    {isDataInterpretation && (
                      <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                        <label className="text-sm font-black text-amber-600 dark:text-amber-400 mr-2 uppercase">כתובת תמונת התרשים (Image URL)</label>
                        <input 
                          type="text" 
                          value={imageUrl} 
                          onChange={(e) => setImageUrl(e.target.value)} 
                          className="w-full p-4 bg-amber-50/40 dark:bg-amber-500/10 border-2 border-amber-100 dark:border-amber-500/30 rounded-2xl font-bold text-black dark:text-white dark:text-slate-200 outline-none focus:border-amber-400 dark:focus:border-amber-400 focus:bg-white dark:focus:bg-slate-900 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500" 
                          placeholder="https://..." 
                          required 
                        />
                      </div>
                    )}
                  </div>

                  {/* עמוד שמאל - תשובות והסבר */}
                  <div className="space-y-6">
                    <label className="text-sm font-black text-black dark:text-white mr-2 uppercase block">ארבע התשובות האפשריות</label>
                    
                    <div className="space-y-3">
                      {options.map((opt, i) => (
                        <div key={i} className="relative">
                          <span className={`absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-black border transition-all ${
                            correctIndex === i 
                              ? 'bg-emerald-500 border-emerald-500 text-white' 
                              : 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-black dark:text-white'
                          }`}>
                            {i + 1}
                          </span>
                          
                          <input 
                            type="text" 
                            value={opt} 
                            onChange={(e) => {
                              const n = [...options]; n[i] = e.target.value; setOptions(n);
                            }} 
                            className={`w-full pr-12 pl-4 py-4 border-2 rounded-2xl font-bold text-black dark:text-white dark:text-slate-200 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 ${
                              correctIndex === i 
                                ? 'border-emerald-400 dark:border-emerald-500/50 bg-emerald-500/5 dark:bg-emerald-500/10 focus:bg-emerald-500/10 dark:focus:bg-emerald-500/15' 
                                : 'border-slate-100 dark:border-slate-600 bg-slate-50/50 dark:bg-slate-900/50 focus:border-emerald-400 dark:focus:border-emerald-400 focus:bg-white dark:focus:bg-slate-900'
                            }`} 
                            placeholder={`כתוב אפשרות ${i+1}...`} 
                            required 
                          />
                        </div>
                      ))}
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-black text-black dark:text-white mr-2 uppercase">בחר את מספר התשובה הנכונה</label>
                      <select 
                        value={correctIndex} 
                        onChange={(e) => setCorrectIndex(Number(e.target.value))} 
                        className="w-full p-4.5 bg-slate-900 dark:bg-slate-950 hover:bg-slate-800 dark:hover:bg-slate-900 text-white rounded-2xl font-black outline-none cursor-pointer transition-all shadow-sm"
                      >
                        {options.map((_, i) => <option key={i} value={i}>אפשרות מספר {i+1} היא התשובה הנכונה</option>)}
                      </select>
                    </div>

                    <div className="space-y-2">
                       <label className="text-sm font-black text-black dark:text-white mr-2 uppercase">הסבר פתרון כמותי מפורט (יופיע בתום פתרון השאלה)</label>
                       <textarea 
                         value={explanation} 
                         onChange={(e) => setExplanation(e.target.value)} 
                         className="w-full p-5 bg-slate-50/50 dark:bg-slate-900/50 border-2 border-slate-100 dark:border-slate-600 rounded-2xl font-bold text-black dark:text-white dark:text-slate-200 min-h-[140px] outline-none focus:border-emerald-400 dark:focus:border-emerald-400 focus:bg-white dark:focus:bg-slate-900 transition-all duration-200 placeholder:text-slate-400 dark:placeholder:text-slate-500" 
                         placeholder="הסבר את דרך הפתרון בצורה אינטואיטיבית ומנצחת..." 
                       />
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-100 dark:border-slate-700 pt-8">
                  <button 
                    disabled={isSubmitting} 
                    className={`w-full text-white py-5 rounded-2xl font-black text-lg sm:text-xl flex items-center justify-center gap-3 transition-all shadow-lg active:scale-98 ${
                      editingQuestionId 
                        ? 'bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 shadow-indigo-500/10 dark:shadow-indigo-500/20' 
                        : 'bg-slate-900 dark:bg-slate-700 hover:bg-emerald-600 dark:hover:bg-emerald-600 shadow-slate-900/10 dark:shadow-slate-700/20'
                    }`}
                  >
                    {isSubmitting ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      <>
                        <Save size={20} /> 
                        <span>{editingQuestionId ? 'שמור שינויים ועדכן שאלה' : 'שמור שאלה חדשה למערכת'}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </section>
          </div>
        )}

        {/* --- ניהול מאגר (מחיקה ועריכה) --- */}
        {activeTab === 'manage' && (
          <div className="animate-in fade-in duration-500">
            <section className="bg-white dark:bg-slate-800/70 p-8 sm:p-10 rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.015)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.15)] border border-slate-100/80 dark:border-slate-700/50">
              <div className="flex items-center justify-between mb-8 border-b border-slate-100 dark:border-slate-700 pb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl flex items-center justify-center border border-indigo-100/50 dark:border-indigo-500/20 text-indigo-500 dark:text-indigo-400">
                    <Layers size={20} />
                  </div>
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">ניהול מאגר השאלות הקיים</h2>
                </div>
                
                <span className="text-sm font-black bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-4 py-2 rounded-xl border border-indigo-100/30 dark:border-indigo-500/20">
                  סה"כ שאלות במערכת: {allQuestions.length}
                </span>
              </div>
              
              {allQuestions.length === 0 ? (
                <div className="text-center p-12 bg-slate-50/50 dark:bg-slate-900/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                  <p className="text-black dark:text-white font-bold">אין שאלות במאגר כרגע.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {allQuestions.map((q, idx) => (
                    <div 
                      key={q.id} 
                      className="flex flex-col md:flex-row items-start md:items-center justify-between p-6 border border-slate-100 dark:border-slate-700/50 rounded-3xl bg-slate-50/50 dark:bg-slate-900/30 hover:bg-white dark:hover:bg-slate-700/40 hover:border-indigo-100 dark:hover:border-indigo-500/30 hover:shadow-sm transition-all duration-200 gap-4"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100/20 dark:border-indigo-500/20 px-2.5 py-1 rounded-lg uppercase">
                            {q.topic === "algebra" 
                              ? "אלגברה" 
                              : q.topic === "geometry" 
                              ? "גיאומטריה" 
                              : q.topic === "charts" 
                              ? "הסקה מתרשים" 
                              : "בעיות כמותיות"}
                          </span>
                          
                          <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100/20 dark:border-emerald-500/20 px-2.5 py-1 rounded-lg">
                            קושי {q.difficulty || 1}
                          </span>
                          
                          {q.isDataInterpretation && (
                            <span className="text-xs font-black text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-100/20 dark:border-amber-500/20 px-2.5 py-1 rounded-lg">
                              גרף/תרשים
                            </span>
                          )}
                        </div>
                        
                        <p className="font-bold text-black dark:text-white dark:text-slate-200 leading-relaxed truncate text-base">
                          {idx + 1}. {q.text}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                        <button 
                          onClick={() => startEditQuestion(q)}
                          className="p-3 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 border border-blue-100/30 dark:border-blue-500/20 hover:bg-blue-100 dark:hover:bg-blue-500/20 rounded-xl transition-all font-black flex items-center gap-1.5 text-sm active:scale-95 shadow-sm"
                        >
                          <Edit size={16} /> 
                          <span>ערוך שאלות</span>
                        </button>
                        <button 
                          onClick={() => handleDeleteQuestion(q.id)}
                          className="p-3 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-100/30 dark:border-red-500/20 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-xl transition-all font-black flex items-center gap-1.5 text-sm active:scale-95 shadow-sm"
                        >
                          <Trash2 size={16} /> 
                          <span>מחק שאלות</span>
                        </button>
                      </div>

                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

      </div>
    </div>
  );
}