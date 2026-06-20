import Groq from "groq-sdk";

function parseJsonArray(text: string): any[] {
  const stripped = text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();
  const match = stripped.match(/\[[\s\S]*\]/);
  if (!match) throw new Error("Invalid AI response format — no JSON array found");
  return JSON.parse(match[0]);
}

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
  difficulty: string,
  direction?: string
): Promise<Array<{ question: string; options: string[]; correct: number }>> {
  const client = getClient();

  const directionNote = direction
    ? `\nFOCUS DIRECTION: The user wants the quiz to focus specifically on: "${direction}". Prioritize questions related to this focus area within the material.\n`
    : "";

  const completion = await client.chat.completions.create({
    model: MODEL,
    messages: [
      {
        role: "user",
        content: `Based ONLY on the following study material, generate ${questionCount} multiple choice questions at ${difficulty} difficulty. All questions must be derived strictly from the provided content — do NOT use outside knowledge.
${directionNote}
STUDY MATERIAL:
${content.slice(0, 12000)}

Generate ONLY a valid JSON array with this exact format — no extra text, no markdown, just the JSON:
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
    temperature: 0.6,
    max_tokens: 4096,
  });

  const text = completion.choices[0]?.message?.content?.trim() ?? "";
  return parseJsonArray(text);
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
  return parseJsonArray(text);
}

export async function generateFlashcardsFromContent(
  content: string,
  cardCount: number,
  direction?: string
): Promise<Array<{ front: string; back: string }>> {
  const client = getClient();

  const directionNote = direction
    ? `\nFOCUS DIRECTION: Focus the flashcards specifically on: "${direction}".\n`
    : "";

  const completion = await client.chat.completions.create({
    model: MODEL,
    messages: [
      {
        role: "user",
        content: `Based ONLY on the following study material, generate ${cardCount} flashcards. Derive all content strictly from the provided material.
${directionNote}
STUDY MATERIAL:
${content.slice(0, 12000)}

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
  return parseJsonArray(text);
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
  return parseJsonArray(text);
}

export async function chatWithAI(
  message: string,
  history: Array<{ role: string; content: string }>
): Promise<string> {
  const client = getClient();

  const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
    {
      role: "system",
      content:
        "You are a helpful AI study assistant called Quizmi AI. Help students understand topics, explain concepts clearly, create study plans, summarize content, and answer questions. Keep responses concise but thorough. Use markdown formatting (bold, bullet points, headers) to make answers easy to read.",
    },
    ...history.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    { role: "user", content: message },
  ];

  const completion = await client.chat.completions.create({
    model: MODEL,
    messages,
    temperature: 0.7,
    max_tokens: 2048,
  });

  return completion.choices[0]?.message?.content?.trim() ?? "I couldn't generate a response. Please try again.";
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
