"use client";

import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import PayPalButton from "@/components/PayPalButton";

export default function PaymentPage() {
  const { user } = useAuth();
  const router = useRouter();

  // פונקציה זו רצה לאחר סיום מוצלח של ה-Capture מול פייפאל (כאשר הכסף הועבר)
  const handleSuccess = async (details: any) => {
    // 1. קבלת ה-uid של המשתמש המחובר כעת
    if (!user || !user.uid) {
      alert("שגיאה: עליך להיות מחובר למערכת כדי לבצע תשלום ולרכוש גישה.");
      return;
    }

    try {
      // 2. גישה לדוקומנט המשתמש באוסף "users" ב-Firestore
      const userRef = doc(db, "users", user.uid);
      
      // שליפת נתוני התשלום מ-details של פייפאל
      const orderId = details.id;
      const payerEmail = details.payer?.email_address || "";
      const updatedAt = new Date().toISOString();

      const paymentDetails = {
        orderId,
        payerEmail,
        updatedAt
      };

      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        // אם הדוקומנט לא קיים עדיין (נדיר אם הוא מחובר, אבל ליתר ביטחון) - ניצור אותו
        await setDoc(userRef, { 
          hasAccess: true, 
          paymentDetails, 
          email: user.email 
        }, { merge: true });
      } else {
        // 3. עדכון השדה hasAccess ופרטי התשלום (paymentDetails) בדוקומנט הקיים
        await updateDoc(userRef, {
          hasAccess: true,
          paymentDetails
        });
      }

      // 4. הצגת הודעת הצלחה חגיגית והעברה אוטומטית לעמוד דאשבורד
      alert(`תודה רבה ${details.payer.name.given_name}! התשלום התקבל בהצלחה. הגישה לקורסים נפתחה עבורך 🎉`);
      router.push("/dashboard");

    } catch (error) {
      // 5. הוספת טיפול בשגיאות למקרה שהעדכון נכשל
      console.error("Error updating user document in Firestore:", error);
      alert(`התשלום עבר בהצלחה במערכת PayPal (מזהה הזמנה: ${details.id}), אך חלה שגיאה זמנית בפתיחת ההרשאות במערכת שלנו. אנא פנה לתמיכה עם מזהה ההזמנה שלך.`);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-6">
      <div className="bg-white dark:bg-slate-900 p-8 md:p-12 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800 text-center max-w-lg w-full animate-page-enter">
        <h1 className="text-3xl font-black mb-4 text-black dark:text-white dark:text-slate-100">רכישת מנוי כמותיקס</h1>
        <p className="mb-8 text-black dark:text-white font-medium leading-relaxed">
          פתיחת גישה מלאה לכלל תכני הקורס התיאורטי והתרגול במערכת כמותיקס.<br/>מחיר מנוי: 1 ש"ח (בדיקה)
        </p>
        
        <div className="w-full flex justify-center mt-6">
          <PayPalButton 
            amount="1.00" 
            onSuccess={handleSuccess} 
          />
        </div>

        <p className="mt-8 text-xs text-black dark:text-white font-bold">
          * התשלום מאובטח ומוצפן בטכנולוגיות המתקדמות ביותר של PayPal.
        </p>
      </div>
    </main>
  );
}