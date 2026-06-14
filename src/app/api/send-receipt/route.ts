import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const { buyerEmail, buyerName, courseTitle, orderId, price } = await request.json();

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({ error: "Resend API key is not configured" }, { status: 500 });
    }

    const adminEmail = process.env.ADMIN_EMAIL || "noamhemo2001@gmail.com";
    
    // ב-Resend חובה לשלוח מדומיין מאומת, או מ-onboarding@resend.dev במידה ועדיין לא אומת דומיין (ואז אפשר לשלוח רק למייל של הבעלים).
    // מומלץ בהמשך לשנות ל- info@yourdomain.com
    const fromEmail = "onboarding@resend.dev"; 

    // 1. שליחת מייל ללקוח (קבלת רכישה)
    const customerEmailPromise = resend.emails.send({
      from: `PsyMath <${fromEmail}>`,
      to: buyerEmail,
      subject: `אישור רכישה: ${courseTitle} - כמותיקס`,
      html: `
        <div dir="rtl" style="font-family: Arial, sans-serif; color: #333;">
          <h2 style="color: #0284c7;">תודה על הרכישה, ${buyerName}! 🎉</h2>
          <p>התשלום שלך על סך <strong>₪${price}</strong> התקבל בהצלחה (מספר הזמנה: ${orderId}).</p>
          <p>הגישה לקורס <strong>"${courseTitle}"</strong> פתוחה כעת עבורך.</p>
          <br/>
          <a href="https://psymath.co.il/dashboard" style="background-color: #0284c7; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">היכנס למערכת והתחל ללמוד</a>
          <br/><br/>
          <p>בהצלחה בלימודים!<br/>צוות כמותיקס</p>
        </div>
      `
    });

    // 2. שליחת מייל למנהל (התראת רכישה)
    const adminEmailPromise = resend.emails.send({
      from: `PsyMath Alerts <${fromEmail}>`,
      to: adminEmail,
      subject: `🔥 רכישה חדשה באתר: ${courseTitle}`,
      html: `
        <div dir="rtl" style="font-family: Arial, sans-serif; color: #333;">
          <h2 style="color: #16a34a;">בוצעה רכישה חדשה!</h2>
          <ul>
            <li><strong>שם הלקוח:</strong> ${buyerName}</li>
            <li><strong>אימייל:</strong> ${buyerEmail}</li>
            <li><strong>קורס:</strong> ${courseTitle}</li>
            <li><strong>סכום:</strong> ₪${price}</li>
            <li><strong>מספר הזמנה (PayPal):</strong> ${orderId}</li>
          </ul>
        </div>
      `
    });

    // נמתין ששני המיילים יישלחו
    const [customerResult, adminResult] = await Promise.allSettled([customerEmailPromise, adminEmailPromise]);

    // רישום שגיאות אם היו
    if (customerResult.status === "rejected") {
      console.error("Failed to send customer email:", customerResult.reason);
    }
    if (adminResult.status === "rejected") {
      console.error("Failed to send admin email:", adminResult.reason);
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Error in send-receipt API:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
