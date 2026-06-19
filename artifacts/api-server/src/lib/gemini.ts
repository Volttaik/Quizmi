import { GoogleGenerativeAI } from "@google/generative-ai";

function getClient(): GoogleGenerativeAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured. Please add it in the Secrets tab.");
  }
  return new GoogleGenerativeAI(apiKey);
}

export async function generateQuiz(
  topic: string,
  questionCount: number,
  difficulty: string
): Promise<Array<{ question: string; options: string[]; correct: number }>> {
  const ai = getClient();
  const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `Generate ${questionCount} multiple choice questions about "${topic}" at ${difficulty} difficulty.
Return ONLY a valid JSON array with this exact format:
[
  {
    "question": "Question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct": 0
  }
]
Where "correct" is the index (0-3) of the correct answer. No extra text, just the JSON array.`;

  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error("Invalid AI response format");
  return JSON.parse(jsonMatch[0]);
}

export async function generateFlashcards(
  topic: string,
  cardCount: number
): Promise<Array<{ front: string; back: string }>> {
  const ai = getClient();
  const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `Generate ${cardCount} flashcards about "${topic}".
Return ONLY a valid JSON array with this exact format:
[
  {
    "front": "Question or term on the front",
    "back": "Answer or definition on the back"
  }
]
No extra text, just the JSON array.`;

  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error("Invalid AI response format");
  return JSON.parse(jsonMatch[0]);
}

export async function generateSummary(topic: string): Promise<string> {
  const ai = getClient();
  const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `Create a comprehensive study summary about "${topic}".
Format it with:
- ## Main Section Headers
- ### Sub-section Headers
- **Bold** for key terms
- Bullet points for lists
- Numbered lists where appropriate
Keep it educational, clear, and easy to study from.`;

  const result = await model.generateContent(prompt);
  return result.response.text().trim();
}
