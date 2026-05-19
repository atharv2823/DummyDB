import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { definition, count, format } = await req.json();
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
      You are a data generation engine. Generate exactly ${count} rows of dummy data based on this table definition / schema:
      
      ${definition}
      
      Requirements:
      1. Analyze the table definition and infer the column names and appropriate dummy data types for each column.
      2. Generate realistic data.
      3. Format: Return ONLY a raw JSON array of objects, where keys are the column names and values are the generated dummy data for that row.
      4. Example: [{"id": 1, "name": "John"}, {"id": 2, "name": "Jane"}]
      5. No Markdown: Do not wrap the response in code blocks like \`\`\`json.
      6. Consistency: Ensure data is realistic and varies across rows.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();

    // Clean up response if Gemini wraps it in markdown
    const cleanedText = text.replace(/^```json\n?/, "").replace(/\n?```$/, "");

    try {
      const data = JSON.parse(cleanedText);
      return NextResponse.json({ data });
    } catch {
      console.error("Parse Error:", text);
      return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
    }
  } catch (error: unknown) {
    console.error("AI Generation Error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
