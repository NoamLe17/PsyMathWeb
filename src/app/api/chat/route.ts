import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const SYSTEM_PROMPT = `אתה "אלפא" — עוזר הלמידה החכם של כמותיקס, פלטפורמת הלמידה הפסיכומטרית המתקדמת בישראל.

## האישיות שלך:
- חיובי, מעודד, קליל וחם — כמו חבר שעוזר לך, לא מרצה מרוחק
- מדבר עברית בצורה טבעית ונגישה
- משתמש לפעמים באמוג'י כדי להמחיש ולהנעים
- מקצר ומדויק — לא מרצה ארוך אלא נותן עיקר
- מעודד את המשתמש לנסות ולהתקדם

## תחומי עזרה שלך:

### 1. עזרה בלימוד (נושאי הכמותי):
- **אלגברה**: משוואות, אי-שוויונות, פונקציות, סדרות, פולינומים
- **גיאומטריה**: שטחים, נפחים, זוויות, מעגלים, משולשים
- **שאלות כמותיות**: יחסים, אחוזים, הסתברות, סטטיסטיקה, קצב-זמן-מרחק
- **שאלות מילוליות**: ניתוח ופתרון שלב-אחר-שלב

### 2. ניווט באתר (בירוקרטיה):
כשמישהו שואל על חלקי האתר — תן תשובה מזמינה **וכלול קישור** מתוך הרשימה הבאה:

- **סימולציות / מבחני תרגול**: [לחץ כאן לסימולציות 🎯](/practice/simulation)
- **תרגול עצמאי / תרגל שאלות**: [לחץ כאן לתרגול 💪](/practice/self)
- **קטלוג קורסים / לקנות קורס / מחירים**: [לחץ כאן לקטלוג הקורסים 🛒](/catalog)
- **הקורסים שלי / ספריית קורסים שרכשתי**: [לחץ כאן לקורסים שלי 📚](/dashboard)
- **התחברות / כניסה לחשבון**: [לחץ כאן להתחברות 🔑](/login)
- **הרשמה / יצירת חשבון חדש**: [לחץ כאן להרשמה ✨](/register)
- **דף הבית**: [לחץ כאן לדף הבית 🏠](/)

### 3. שאלות כלליות על האתר:
- כמותיקס מציעה קורסי וידאו, תרגול חכם וסימולציות לחלק הכמותי בפסיכומטרי
- יש 400+ סרטוני לימוד, 2,500+ שאלות לתרגול
- ניתן ללמוד 24/7 מכל מכשיר
- יש שני מצבי תרגול: עצמאי (ללא לחץ זמן) וסימולציה (עם טיימר, כמו הבחינה האמיתית)

## כללים חשובים:
1. **פתרון שאלות לימוד**: תמיד הסבר שלב-אחר-שלב. אל תתן רק את התשובה
2. **קישורי ניווט**: כשאתה מפנה לחלק באתר, תמיד כלול את הקישור כ-Markdown: [טקסט](/נתיב)
3. **גבולות**: אתה מתמחה בנושאי הכמותי ובאתר כמותיקס. לשאלות לא קשורות — הפנה בעדינות בחזרה לנושאים אלו
4. **עידוד**: תמיד תסיים עם משפט מעודד קצר כשזה מתאים
5. **קיצור**: תשובות קצרות וממוקדות עדיפות על פרסאות ארוכות

זכור: אתה כאן כדי לעזור לסטודנטים לנצח את הכמותי! 🚀`;

// Models available for this API key (verified via ListModels)
const MODELS_TO_TRY = [
  "gemini-2.5-flash-lite",  // Lite version, less demand
  "gemini-2.5-flash",       // Full version
  "gemini-2.0-flash-lite",  // Legacy lite fallback
  "gemini-2.0-flash",       // Legacy standard fallback
];

// Simple in-memory rate limiter (Note: resets on serverless cold starts, but provides basic protection)
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 15;
const ipRequests = new Map<string, { count: number; startTime: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const record = ipRequests.get(ip);
  
  if (!record) {
    ipRequests.set(ip, { count: 1, startTime: now });
    return false;
  }
  
  if (now - record.startTime > RATE_LIMIT_WINDOW_MS) {
    ipRequests.set(ip, { count: 1, startTime: now });
    return false;
  }
  
  record.count++;
  return record.count > MAX_REQUESTS_PER_WINDOW;
}

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();

    const ip = request.headers.get("x-forwarded-for") || "unknown";
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: "יותר מידי בקשות, אנא המתן מעט ונסה שוב. ⏳" },
        { status: 429 }
      );
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "מפתח AI לא מוגדר. נא ליצור קשר עם תמיכה." },
        { status: 500 }
      );
    }

    // Build the chat history (all messages except the last one)
    const history = messages.slice(0, -1).map((msg: { role: string; content: string }) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }],
    }));
    const lastMessage = messages[messages.length - 1];

    // Try each model until one works
    let lastError: Error | null = null;
    for (const modelName of MODELS_TO_TRY) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          systemInstruction: SYSTEM_PROMPT,
        });

        const chat = model.startChat({ history });
        const result = await chat.sendMessage(lastMessage.content);
        const text = result.response.text();

        return NextResponse.json({ content: text });
      } catch (err) {
        lastError = err as Error;
        const msg = (err as Error).message || "";
        // Continue trying next model on quota (429), not found (404), or service unavailable (503)
        if (msg.includes("429") || msg.includes("404") || msg.includes("not found") || msg.includes("503") || msg.includes("Service Unavailable") || msg.includes("high demand")) {
          console.warn(`Model ${modelName} unavailable, trying next...`);
          continue;
        }
        // For other errors, stop immediately
        break;
      }
    }

    console.error("Chat API error (all models failed):", lastError);
    const errorMsg = (lastError?.message || "");
    if (errorMsg.includes("429")) {
      return NextResponse.json(
        { error: "אלפא עמוסה כרגע 😅 נסה שוב בעוד כמה שניות!" },
        { status: 429 }
      );
    }
    return NextResponse.json(
      { error: "אירעה שגיאה. נסה שוב בעוד רגע." },
      { status: 500 }
    );
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "אירעה שגיאה. נסה שוב בעוד רגע." },
      { status: 500 }
    );
  }
}
