import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function GET() {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
    // @ts-expect-error listModels is not in the TS types but exists at runtime
    const result = await genAI.listModels();
    const models = [];
    for await (const model of result) {
      models.push({
        name: model.name,
        displayName: model.displayName,
        supportedGenerationMethods: model.supportedGenerationMethods,
      });
    }
    return NextResponse.json({ models });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
