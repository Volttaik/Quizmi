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
  if (!apiKey) throw new Error("GROQ_API_KEY is not configured. Please add it in the Secrets tab.");
  return new Groq({ apiKey });
}

const MODEL = "llama-3.3-70b-versatile";

export async function generateQuizFromContent(
  content: string, questionCount: number, difficulty: string, direction?: string
): Promise<Array<{ question: string; options: string[]; correct: number; explanation: string; reference: string }>> {
  const client = getClient();
  const difficultyGuide = { easy: "straightforward recall questions", medium: "application and comprehension questions", hard: "analysis and evaluation questions" }[difficulty] ?? "application and comprehension questions";
  const directionNote = direction ? `\nFOCUS: Prioritize questions specifically about: "${direction}"\n` : "";
  const completion = await client.chat.completions.create({
    model: MODEL,
    messages: [
      { role: "system", content: "You are an expert educational assessment designer. Create precise, unambiguous multiple-choice questions. Never use 'all of the above' or 'none of the above'." },
      { role: "user", content: `Generate exactly ${questionCount} multiple-choice questions at ${difficulty} difficulty (${difficultyGuide}) based ONLY on this study material.${directionNote}\nSTUDY MATERIAL:\n${content.slice(0, 12000)}\n\nReturn ONLY a valid JSON array:\n[\n  {\n    "question": "Clear, specific question ending with '?'",\n    "options": ["Option A", "Option B", "Option C", "Option D"],\n    "correct": 0,\n    "explanation": "Why this answer is correct and others are wrong.",\n    "reference": "Exact phrase from the material"\n  }\n]\n"correct" is 0-based index. Vary which index (0-3) is correct.` },
    ],
    temperature: 0.5, max_tokens: 6000,
  });
  return parseJsonArray(completion.choices[0]?.message?.content?.trim() ?? "");
}

export async function generateQuiz(
  topic: string, questionCount: number, difficulty: string
): Promise<Array<{ question: string; options: string[]; correct: number; explanation: string; reference: string }>> {
  const client = getClient();
  const difficultyGuide = { easy: "basic recall and recognition", medium: "understanding and application", hard: "analysis, synthesis, and evaluation" }[difficulty] ?? "understanding and application";
  const completion = await client.chat.completions.create({
    model: MODEL,
    messages: [
      { role: "system", content: "You are an expert educational assessment designer. Distribute correct answers across all 4 option positions." },
      { role: "user", content: `Generate exactly ${questionCount} multiple-choice questions about "${topic}" at ${difficulty} difficulty (${difficultyGuide}).\n\nReturn ONLY a valid JSON array:\n[\n  {\n    "question": "Specific, clear question ending with '?'",\n    "options": ["Option A", "Option B", "Option C", "Option D"],\n    "correct": 0,\n    "explanation": "Thorough explanation.",\n    "reference": "The specific concept being tested"\n  }\n]\n"correct" is 0-based index. Vary which index (0-3) is correct.` },
    ],
    temperature: 0.6, max_tokens: 6000,
  });
  return parseJsonArray(completion.choices[0]?.message?.content?.trim() ?? "");
}

export async function generateFlashcardsFromContent(
  content: string, cardCount: number, direction?: string
): Promise<Array<{ front: string; back: string }>> {
  const client = getClient();
  const directionNote = direction ? `\nFOCUS: Prioritize flashcards about: "${direction}"\n` : "";
  const completion = await client.chat.completions.create({
    model: MODEL,
    messages: [
      { role: "system", content: "You are an expert flashcard creator trained in spaced repetition. Each card should test exactly one concept." },
      { role: "user", content: `Create exactly ${cardCount} flashcards from this study material. Derive all content strictly from the provided material.${directionNote}\nSTUDY MATERIAL:\n${content.slice(0, 12000)}\n\nReturn ONLY a valid JSON array:\n[\n  {\n    "front": "Question, term, or concept to test",\n    "back": "Precise, complete answer (2-3 sentences max)"\n  }\n]` },
    ],
    temperature: 0.6, max_tokens: 4096,
  });
  return parseJsonArray(completion.choices[0]?.message?.content?.trim() ?? "");
}

export async function generateFlashcards(
  topic: string, cardCount: number
): Promise<Array<{ front: string; back: string }>> {
  const client = getClient();
  const completion = await client.chat.completions.create({
    model: MODEL,
    messages: [
      { role: "system", content: "You are an expert flashcard creator. Each card tests exactly one concept." },
      { role: "user", content: `Create exactly ${cardCount} flashcards about "${topic}".\n\nReturn ONLY a valid JSON array:\n[\n  {\n    "front": "Question, term, or concept prompt",\n    "back": "Clear, complete answer (2-3 sentences max)"\n  }\n]` },
    ],
    temperature: 0.7, max_tokens: 4096,
  });
  return parseJsonArray(completion.choices[0]?.message?.content?.trim() ?? "");
}

export async function generateSummary(topic: string): Promise<string> {
  const client = getClient();
  const completion = await client.chat.completions.create({
    model: MODEL,
    messages: [
      { role: "system", content: "You are an expert educational content writer. Create comprehensive, well-structured study summaries." },
      { role: "user", content: `Create a comprehensive study summary about "${topic}".\n\nStructure:\n## Overview\nBrief introduction (2-3 sentences)\n\n## Key Concepts\nMain ideas with **bold key terms**\n\n## Core Principles / How It Works\nStep-by-step breakdown\n\n## Important Details\nCritical facts students must know\n\n## Common Misconceptions\nWhat students often get wrong\n\n## Quick Review\n• 5-7 bullet point summary` },
    ],
    temperature: 0.65, max_tokens: 4096,
  });
  return completion.choices[0]?.message?.content?.trim() ?? "";
}

export async function generateSummaryFromContent(content: string, topic?: string): Promise<string> {
  const client = getClient();
  const completion = await client.chat.completions.create({
    model: MODEL,
    messages: [
      { role: "system", content: "You are an expert educational content writer. Extract key information and create a well-structured summary." },
      { role: "user", content: `Summarize this study material${topic ? ` about "${topic}"` : ""} into a clear, comprehensive study guide.\n\nSTUDY MATERIAL:\n${content.slice(0, 15000)}\n\nStructure:\n## Overview\n## Key Concepts\n## Core Details\n## Key Takeaways\n• 5-7 essential points` },
    ],
    temperature: 0.6, max_tokens: 3000,
  });
  return completion.choices[0]?.message?.content?.trim() ?? "";
}

export async function chatWithAI(
  message: string, history: Array<{ role: string; content: string }>
): Promise<string> {
  const client = getClient();
  const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
    {
      role: "system",
      content: `You are Quizmi AI — an expert study assistant. Help students learn faster and retain more.\n\nCapabilities:\n- Explain complex concepts with real-world analogies\n- Create study plans, mnemonics, and memory techniques\n- Break down difficult topics step by step\n- Quiz students to reinforce learning\n- Summarize documents and extract key insights\n\nResponse style:\n- Use **bold** for key terms\n- Use bullet points (•) for lists\n- Use numbered lists for processes\n- Use ## Headers for major sections\n- Add emojis sparingly (📌 💡 ⚠️ ✅)\n- End complex explanations with "Key Takeaway:" summary`,
    },
    ...history.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
    { role: "user", content: message },
  ];
  const completion = await client.chat.completions.create({
    model: MODEL, messages, temperature: 0.65, max_tokens: 2048,
  });
  return completion.choices[0]?.message?.content?.trim() ?? "I couldn't generate a response. Please try again.";
}
