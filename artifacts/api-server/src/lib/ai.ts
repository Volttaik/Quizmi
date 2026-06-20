import Groq from "groq-sdk";

function getClient(): Groq {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY is not configured. Please add it in the Secrets tab.");
  }
  return new Groq({ apiKey });
}

const MODEL = "llama-3.3-70b-versatile";

export async function generateQuizFromContent(
  content: string,
  questionCount: number,
  difficulty: string
): Promise<Array<{ question: string; options: string[]; correct: number }>> {
  const client = getClient();

  const completion = await client.chat.completions.create({
    model: MODEL,
    messages: [
      {
        role: "user",
        content: `Based on the following study material, generate ${questionCount} multiple choice questions at ${difficulty} difficulty.

STUDY MATERIAL:
${content.slice(0, 8000)}

Generate ONLY a valid JSON array with this exact format — no extra text, just the JSON:
[
  {
    "question": "Question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct": 0
  }
]
Where "correct" is the index (0-3) of the correct answer.`,
      },
    ],
    temperature: 0.7,
    max_tokens: 4096,
  });

  const text = completion.choices[0]?.message?.content?.trim() ?? "";
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error("Invalid AI response format");
  return JSON.parse(jsonMatch[0]);
}

export async function generateQuiz(
  topic: string,
  questionCount: number,
  difficulty: string
): Promise<Array<{ question: string; options: string[]; correct: number }>> {
  const client = getClient();

  const completion = await client.chat.completions.create({
    model: MODEL,
    messages: [
      {
        role: "user",
        content: `Generate ${questionCount} multiple choice questions about "${topic}" at ${difficulty} difficulty.
Return ONLY a valid JSON array with this exact format:
[
  {
    "question": "Question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct": 0
  }
]
Where "correct" is the index (0-3) of the correct answer. No extra text, just the JSON array.`,
      },
    ],
    temperature: 0.7,
    max_tokens: 4096,
  });

  const text = completion.choices[0]?.message?.content?.trim() ?? "";
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error("Invalid AI response format");
  return JSON.parse(jsonMatch[0]);
}

export async function generateFlashcardsFromContent(
  content: string,
  cardCount: number
): Promise<Array<{ front: string; back: string }>> {
  const client = getClient();

  const completion = await client.chat.completions.create({
    model: MODEL,
    messages: [
      {
        role: "user",
        content: `Based on the following study material, generate ${cardCount} flashcards.

STUDY MATERIAL:
${content.slice(0, 8000)}

Return ONLY a valid JSON array with this exact format — no extra text:
[
  {
    "front": "Question or term on the front",
    "back": "Answer or definition on the back"
  }
]`,
      },
    ],
    temperature: 0.7,
    max_tokens: 4096,
  });

  const text = completion.choices[0]?.message?.content?.trim() ?? "";
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error("Invalid AI response format");
  return JSON.parse(jsonMatch[0]);
}

export async function generateFlashcards(
  topic: string,
  cardCount: number
): Promise<Array<{ front: string; back: string }>> {
  const client = getClient();

  const completion = await client.chat.completions.create({
    model: MODEL,
    messages: [
      {
        role: "user",
        content: `Generate ${cardCount} flashcards about "${topic}".
Return ONLY a valid JSON array with this exact format:
[
  {
    "front": "Question or term on the front",
    "back": "Answer or definition on the back"
  }
]
No extra text, just the JSON array.`,
      },
    ],
    temperature: 0.7,
    max_tokens: 4096,
  });

  const text = completion.choices[0]?.message?.content?.trim() ?? "";
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error("Invalid AI response format");
  return JSON.parse(jsonMatch[0]);
}

export async function generateSummary(topic: string): Promise<string> {
  const client = getClient();

  const completion = await client.chat.completions.create({
    model: MODEL,
    messages: [
      {
        role: "user",
        content: `Create a comprehensive study summary about "${topic}".
Format it with:
- ## Main Section Headers
- ### Sub-section Headers
- **Bold** for key terms
- Bullet points for lists
- Numbered lists where appropriate
Keep it educational, clear, and easy to study from.`,
      },
    ],
    temperature: 0.7,
    max_tokens: 4096,
  });

  return completion.choices[0]?.message?.content?.trim() ?? "";
}
