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
): Promise<Array<{ question: string; options: string[]; correct: number; explanation: string; reference: string }>> {
  const client = getClient();

  const difficultyGuide = {
    easy: "straightforward recall questions — definitions, basic facts, direct quotes from text",
    medium: "application and comprehension questions — students must understand and apply concepts, not just recall",
    hard: "analysis and evaluation questions — compare/contrast, implications, edge cases, critical thinking",
  }[difficulty] ?? "application and comprehension questions";

  const directionNote = direction
    ? `\nFOCUS: Prioritize questions specifically about: "${direction}"\n`
    : "";

  const completion = await client.chat.completions.create({
    model: MODEL,
    messages: [
      {
        role: "system",
        content: "You are an expert educational assessment designer. Create precise, unambiguous multiple-choice questions that effectively test student understanding. Never use 'all of the above' or 'none of the above'. Each wrong option should be plausible but clearly incorrect to someone who studied the material.",
      },
      {
        role: "user",
        content: `Generate exactly ${questionCount} multiple-choice questions at ${difficulty} difficulty (${difficultyGuide}) based ONLY on this study material. Every question MUST be grounded in the text.
${directionNote}
STUDY MATERIAL:
${content.slice(0, 12000)}

Return ONLY a valid JSON array with no markdown wrapper:
[
  {
    "question": "Clear, specific question ending with '?'",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct": 0,
    "explanation": "Explain WHY this answer is correct, referencing the material directly. Also explain why the other options are wrong.",
    "reference": "Exact phrase or section from the material this question tests"
  }
]
"correct" is the 0-based index of the correct option. Vary which option index (0-3) is correct across questions.`,
      },
    ],
    temperature: 0.5,
    max_tokens: 6000,
  });

  const text = completion.choices[0]?.message?.content?.trim() ?? "";
  return parseJsonArray(text);
}

export async function generateQuiz(
  topic: string,
  questionCount: number,
  difficulty: string
): Promise<Array<{ question: string; options: string[]; correct: number; explanation: string; reference: string }>> {
  const client = getClient();

  const difficultyGuide = {
    easy: "basic recall and recognition — definitions, simple facts, straightforward concepts",
    medium: "understanding and application — explain relationships, apply concepts to scenarios",
    hard: "analysis, synthesis, and evaluation — compare theories, identify implications, solve complex problems",
  }[difficulty] ?? "understanding and application";

  const completion = await client.chat.completions.create({
    model: MODEL,
    messages: [
      {
        role: "system",
        content: "You are an expert educational assessment designer. Create precise, well-balanced multiple-choice questions. Distribute correct answers across all 4 option positions (A/B/C/D). Make distractors plausible but clearly wrong to someone who studied the topic.",
      },
      {
        role: "user",
        content: `Generate exactly ${questionCount} multiple-choice questions about "${topic}" at ${difficulty} difficulty (${difficultyGuide}).

Return ONLY a valid JSON array:
[
  {
    "question": "Specific, clear question ending with '?'",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct": 0,
    "explanation": "Thorough explanation of why this answer is correct and why the alternatives are wrong.",
    "reference": "The specific concept/topic area being tested (e.g. '${topic} — [specific subtopic]')"
  }
]
"correct" is the 0-based index of the correct option. Vary which index (0-3) is correct.`,
      },
    ],
    temperature: 0.6,
    max_tokens: 6000,
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
    ? `\nFOCUS: Prioritize flashcards about: "${direction}"\n`
    : "";

  const completion = await client.chat.completions.create({
    model: MODEL,
    messages: [
      {
        role: "system",
        content: "You are an expert flashcard creator trained in spaced repetition learning. Create concise, memorable flashcards where the front is a clear prompt and the back is the complete, direct answer. Use the Leitner system principle — each card should test exactly one concept.",
      },
      {
        role: "user",
        content: `Create exactly ${cardCount} flashcards from this study material. Derive all content strictly from the provided material.
${directionNote}
STUDY MATERIAL:
${content.slice(0, 12000)}

Return ONLY a valid JSON array:
[
  {
    "front": "Question, term, or concept to test",
    "back": "Precise, complete answer or definition (2-3 sentences max)"
  }
]
Vary card types: definitions, relationships, examples, processes, comparisons.`,
      },
    ],
    temperature: 0.6,
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
        role: "system",
        content: "You are an expert flashcard creator. Create concise, memorable flashcards using proven spaced repetition principles. Each card tests exactly one concept. Mix definitions, applications, comparisons, and examples.",
      },
      {
        role: "user",
        content: `Create exactly ${cardCount} flashcards about "${topic}".

Return ONLY a valid JSON array:
[
  {
    "front": "Question, term, or concept prompt",
    "back": "Clear, complete answer (2-3 sentences max)"
  }
]
Cover key terms, important relationships, processes, and applications. Vary the card types for richer learning.`,
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
      content: `You are Quizmi AI — an expert study assistant designed to help students learn faster and retain more. You have deep knowledge across all academic subjects.

Your capabilities:
- Explain complex concepts in clear, simple language with real-world analogies
- Create instant study plans, mnemonics, and memory techniques
- Break down difficult topics step by step
- Quiz students to reinforce learning
- Summarize documents and extract key insights
- Suggest the most effective study strategies for any topic
- Identify knowledge gaps and address them

Response style:
- Use **bold** for key terms and important facts
- Use bullet points (•) for lists
- Use numbered lists for processes/steps
- Use ## Headers for major sections
- Be thorough but concise — students value clarity
- Add emojis sparingly for visual anchors (📌 💡 ⚠️ ✅)
- Always end complex explanations with a "Key Takeaway:" summary
- If a student seems confused, offer an alternative explanation or analogy`,
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
    temperature: 0.65,
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
        role: "system",
        content: "You are an expert educational content writer. Create comprehensive, well-structured study summaries that help students understand and retain information effectively. Use clear hierarchy, key terms in bold, and practical examples.",
      },
      {
        role: "user",
        content: `Create a comprehensive study summary about "${topic}".

Structure it as follows:
## Overview
Brief introduction and why this topic matters (2-3 sentences)

## Key Concepts
The most important ideas, each explained clearly with **bold key terms**

## Core Principles / How It Works
Step-by-step breakdown of the main processes or principles

## Important Details
Critical facts, dates, formulas, or specifics students must know

## Common Misconceptions
What students often get wrong (if applicable)

## Quick Review
• 5-7 bullet point summary of the most essential takeaways

Use **bold** for all key terms, bullet points for lists, numbered lists for sequences. Make it educational, clear, and easy to study from. Target depth: enough to prepare for an exam.`,
      },
    ],
    temperature: 0.65,
    max_tokens: 4096,
  });

  return completion.choices[0]?.message?.content?.trim() ?? "";
}

export async function generateSummaryFromContent(content: string, topic?: string): Promise<string> {
  const client = getClient();

  const completion = await client.chat.completions.create({
    model: MODEL,
    messages: [
      {
        role: "system",
        content: "You are an expert educational content writer. Extract the most important information from provided study material and create a well-structured, comprehensive summary.",
      },
      {
        role: "user",
        content: `Summarize this study material${topic ? ` about "${topic}"` : ""} into a clear, comprehensive study guide.

STUDY MATERIAL:
${content.slice(0, 15000)}

Structure it as:
## Overview
What this material covers (2-3 sentences)

## Key Concepts
Main ideas with **bold key terms**

## Core Details
Important facts, processes, and specifics from the material

## Key Takeaways
• 5-7 essential points students must remember

Be comprehensive but focused on what matters most for studying.`,
      },
    ],
    temperature: 0.6,
    max_tokens: 3000,
  });

  return completion.choices[0]?.message?.content?.trim() ?? "";
}
