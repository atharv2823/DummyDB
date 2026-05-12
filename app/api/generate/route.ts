import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { columns, count, locale } = await req.json();
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "Google API Key is not configured" },
        { status: 500 }
      );
    } 

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

    const prompt = `
      You are a data generation engine. Generate exactly ${count} rows of dummy data based on this schema:
      ${JSON.stringify(columns)}
      
      Requirements:
      1. Locale: ${locale} (Ensure names, cities, and context match this language/region perfectly).
      2. Format: Return ONLY a raw JSON array of arrays (e.g., [["row1_col1", "row1_col2"], ["row2_col1", "row2_col2"]]).
      3. No Markdown: Do not wrap the response in code blocks like \`\`\`json.
      4. Consistency: Ensure data is realistic and varies across rows.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();
    
    // Clean up response if Gemini wraps it in markdown
    const cleanedText = text.replace(/^```json\n?/, "").replace(/\n?```$/, "");
    
    try {
      const data = JSON.parse(cleanedText);
      return NextResponse.json({ data });
    } catch (parseError) {
      console.error("Parse Error:", text);
      return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
    }
  } catch (error: any) {
    console.error("AI Generation Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
