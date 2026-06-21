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

export async function generateSocialQuiz(
  quizType: string,
  subjectName: string,
  description: string,
  questionCount: number,
): Promise<Array<{ question: string; options: string[]; correct: number; explanation: string }>> {
  const client = getClient();

  const typePrompts: Record<string, string> = {
    love: `You are creating a LOVE quiz about a person named "${subjectName}". The quiz will be taken by people who want to test how well they know ${subjectName}. Generate fun, romantic, personal multiple-choice questions based on the description provided. Questions should feel warm, affectionate, and personal.`,
    friendship: `You are creating a FRIENDSHIP quiz about a person named "${subjectName}". The quiz will be taken by friends who want to test how well they know ${subjectName}. Generate fun, friendly, personal multiple-choice questions based on the description provided. Questions should feel warm and celebratory of friendship.`,
    family: `You are creating a FAMILY quiz about a person named "${subjectName}". The quiz will test how well family members know ${subjectName}. Generate warm, family-oriented multiple-choice questions based on the description provided.`,
    classroom: `You are creating a CLASSROOM quiz about "${subjectName}". Generate educational, engaging multiple-choice questions suitable for classroom use based on the description provided.`,
  };

  const systemPrompt = typePrompts[quizType] ?? typePrompts.friendship;

  const completion = await client.chat.completions.create({
    model: MODEL,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: `ABOUT ${subjectName.toUpperCase()}:\n${description}\n\nGenerate exactly ${questionCount} multiple-choice questions. Each question should be based on the details provided above. Make the wrong options plausible but clearly different from the correct answer.\n\nReturn ONLY a valid JSON array:\n[\n  {\n    "question": "Clear question about ${subjectName} ending with '?'",\n    "options": ["Option A", "Option B", "Option C", "Option D"],\n    "correct": 0,\n    "explanation": "Why this is the correct answer based on what was shared."\n  }\n]\n"correct" is 0-based index (0, 1, 2, or 3). Vary which option is correct.` },
    ],
    temperature: 0.7, max_tokens: 6000,
  });
  return parseJsonArray(completion.choices[0]?.message?.content?.trim() ?? "");
}

export async function generateSocialQuizFromPrompt(
  quizType: string,
  subjectName: string,
  prompt: string,
  questionCount: number,
): Promise<Array<{ question: string; options: string[]; correct: number; explanation: string }>> {
  const client = getClient();

  const completion = await client.chat.completions.create({
    model: MODEL,
    messages: [
      { role: "system", content: `You are creating a creative ${quizType} quiz. The user has described what they want in natural language. Generate exactly ${questionCount} engaging multiple-choice questions based on their description. Make questions fun, personal, and relevant to the context.` },
      { role: "user", content: `Quiz subject: ${subjectName}\n\nUser's description of what they want:\n${prompt}\n\nGenerate exactly ${questionCount} fun multiple-choice questions.\n\nReturn ONLY a valid JSON array:\n[\n  {\n    "question": "Clear, engaging question ending with '?'",\n    "options": ["Option A", "Option B", "Option C", "Option D"],\n    "correct": 0,\n    "explanation": "Why this answer is correct."\n  }\n]\n"correct" is 0-based index. Vary which option is correct.` },
    ],
    temperature: 0.75, max_tokens: 6000,
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

export async function generateSummary(
  topic: string
): Promise<string> {
  const client = getClient();
  const completion = await client.chat.completions.create({
    model: MODEL,
    messages: [
      { role: "system", content: "You are an expert educator. Create comprehensive, well-structured summaries." },
      { role: "user", content: `Create a comprehensive summary about "${topic}". Include key concepts, important facts, and essential information. Use clear headings and bullet points where appropriate. Keep it concise but thorough (400-600 words).` },
    ],
    temperature: 0.5, max_tokens: 2048,
  });
  return completion.choices[0]?.message?.content?.trim() ?? "";
}

export async function chatWithAI(
  message: string,
  history: Array<{ role: string; content: string }>
): Promise<string> {
  const client = getClient();
  const messages: Groq.Chat.ChatCompletionMessageParam[] = [
    {
      role: "system",
      content: "You are a helpful AI study assistant. You help students understand concepts, summarize materials, explain topics clearly, and answer academic questions. Be concise, accurate, and encouraging.",
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

export async function generateSummaryFromContent(
  content: string, direction?: string
): Promise<string> {
  const client = getClient();
  const directionNote = direction ? `\nFOCUS: Emphasize content about: "${direction}"\n` : "";
  const completion = await client.chat.completions.create({
    model: MODEL,
    messages: [
      { role: "system", content: "You are an expert educator. Create comprehensive, well-structured summaries from provided material." },
      { role: "user", content: `Create a comprehensive summary of the following study material. Highlight key concepts, important facts, and essential information.${directionNote}\nMATERIAL:\n${content.slice(0, 12000)}\n\nProvide a clear, structured summary (400-600 words) with headings and bullet points where appropriate.` },
    ],
    temperature: 0.5, max_tokens: 2048,
  });
  return completion.choices[0]?.message?.content?.trim() ?? "";
}
