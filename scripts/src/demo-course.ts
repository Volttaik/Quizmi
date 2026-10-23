import { createClient } from "@libsql/client";
import "./env";

const DEMO_SLUG = "demo-english-usage";
const DEMO_QUESTION_COUNT = 20;

const NULL = null;

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const QUESTIONS = [
  {
    prompt: "Choose the correct word to complete the sentence: 'She is ___ student in the class.'",
    options: ["the more good", "the best", "the most good", "better"],
    correct_index: 1,
    explanation: "Superlative 'best' is used for comparing one person against a whole group.",
    marks: 1,
  },
  {
    prompt: "Choose the correct tense: 'By next year, I ___ here for five years.'",
    options: ["will work", "will have worked", "will be working", "worked"],
    correct_index: 1,
    explanation: "Future perfect 'will have + past participle' describes an action completed by a future point.",
    marks: 1,
  },
  {
    prompt: "Identify the grammatically correct sentence.",
    options: [
      "Each of the students have submitted their assignment.",
      "Each of the students has submitted his or her assignment.",
      "Each of the students has submitted their assignment.",
      "Each of the students have submitted his or her assignment.",
    ],
    correct_index: 1,
    explanation: "'Each' is singular, so it takes a singular verb 'has' and a singular pronoun.",
    marks: 1,
  },
  {
    prompt: "Choose the correct preposition: 'She is interested ___ learning French.'",
    options: ["on", "in", "at", "for"],
    correct_index: 1,
    explanation: "'Interested in' is the standard collocation for an interest in an activity.",
    marks: 1,
  },
  {
    prompt: "Choose the word with the correct spelling.",
    options: ["Accomodate", "Accommodate", "Acommodate", "Accomodate"],
    correct_index: 1,
    explanation: "Double 'c' and double 'm': accommodate.",
    marks: 1,
  },
  {
    prompt: "Pick the synonym of 'mitigate'.",
    options: ["Intensify", "Alleviate", "Exacerbate", "Complicate"],
    correct_index: 1,
    explanation: "Mitigate means to make something less severe; 'alleviate' is a close synonym.",
    marks: 1,
  },
  {
    prompt: "Choose the correct article: 'He is ___ honest man.'",
    options: ["a", "an", "the", "no article"],
    correct_index: 1,
    explanation: "'Honest' begins with a silent 'h', so the vowel sound requires 'an'.",
    marks: 1,
  },
  {
    prompt: "Select the correct passive form: 'They built the house in 1990.'",
    options: [
      "The house is built in 1990.",
      "The house was built in 1990.",
      "The house has been built in 1990.",
      "The house were built in 1990.",
    ],
    correct_index: 1,
    explanation: "Past simple passive uses 'was/were + past participle'; 'the house' is singular.",
    marks: 1,
  },
  {
    prompt: "Choose the correct conditional: 'If I ___ you, I would apologise.'",
    options: ["am", "was", "were", "be"],
    correct_index: 2,
    explanation: "Second conditional uses 'were' for all subjects in the if-clause.",
    marks: 1,
  },
  {
    prompt: "Choose the correct word: 'The meeting was ___ than expected.'",
    options: ["more short", "shorter", "most short", "shortly"],
    correct_index: 1,
    explanation: "Comparative form for a one-syllable adjective is 'shorter'.",
    marks: 1,
  },
  {
    prompt: "Pick the correct sentence.",
    options: [
      "Despite of the rain, the event continued.",
      "Despite the rain, the event continued.",
      "Although of the rain, the event continued.",
      "Although the rain, the event continued.",
    ],
    correct_index: 1,
    explanation: "'Despite' is a preposition and takes a noun phrase directly; 'despite of' is incorrect.",
    marks: 1,
  },
  {
    prompt: "Choose the correct word order: 'I ___ never ___ to Japan.'",
    options: [
      "have / been",
      "am / been",
      "have / go",
      "am / go",
    ],
    correct_index: 0,
    explanation: "Present perfect with 'never' uses 'have + past participle'.",
    marks: 1,
  },
  {
    prompt: "What is the plural of 'criterion'?",
    options: ["Criterions", "Criterias", "Criteria", "Criterion"],
    correct_index: 2,
    explanation: "'Criterion' is a Greek-derived noun whose plural is 'criteria'.",
    marks: 1,
  },
  {
    prompt: "Choose the correct relative pronoun: 'The man ___ car was stolen called the police.'",
    options: ["who", "whom", "whose", "which"],
    correct_index: 2,
    explanation: "'Whose' shows possession, linking 'the man' to 'his car'.",
    marks: 1,
  },
  {
    prompt: "Select the sentence with correct punctuation.",
    options: [
      "Its a beautiful day today.",
      "It's a beautiful day today.",
      "Its' a beautiful day today.",
      "Its a beautiful day, today.",
    ],
    correct_index: 1,
    explanation: "'It's' is the contraction for 'it is'; apostrophe goes before the 's'.",
    marks: 1,
  },
  {
    prompt: "Choose the correct verb: 'The news ___ surprising.'",
    options: ["are", "is", "were", "have been"],
    correct_index: 1,
    explanation: "'News' is uncountable and singular in English, so it takes 'is'.",
    marks: 1,
  },
  {
    prompt: "Pick the antonym of 'ubiquitous'.",
    options: ["Omnipresent", "Rare", "Common", "Universal"],
    correct_index: 1,
    explanation: "'Ubiquitous' means found everywhere; 'rare' is its nearest opposite here.",
    marks: 1,
  },
  {
    prompt: "Choose the correct form: 'I look forward to ___ from you.'",
    options: ["hear", "hearing", "heard", "hears"],
    correct_index: 1,
    explanation: "'Look forward to' is followed by the gerund 'hearing'.",
    marks: 1,
  },
  {
    prompt: "Select the correct sentence.",
    options: [
      "Neither the manager nor the staff are responsible.",
      "Neither the manager nor the staff is responsible.",
      "Neither the manager nor the staff be responsible.",
      "Neither the manager nor the staff were responsible.",
    ],
    correct_index: 1,
    explanation: "With 'neither…nor', the verb agrees with the nearer subject, 'staff' (singular collective here).",
    marks: 1,
  },
  {
    prompt: "Choose the most formal sentence.",
    options: [
      "I wanna check the results real quick.",
      "I want to check the results soon.",
      "I am writing to request the results at your earliest convenience.",
      "Can you send the results fast?",
    ],
    correct_index: 2,
    explanation: "Formal register uses complete verbs, polite phrasing and no contractions.",
    marks: 1,
  },
];

async function main() {
  console.log("connected to Turso");
  const hasTable = await client
    .execute("SELECT 1 FROM courses LIMIT 1")
    .then(() => true)
    .catch(() => false);

  if (!hasTable) {
    console.log("courses table missing; no migration run yet");
    return;
  }

  const existing = await client.execute({
    sql: "SELECT id FROM courses WHERE slug = ?",
    args: [DEMO_SLUG],
  });

  if (existing.rows.length > 0) {
    console.log(`demo course already exists (slug=${DEMO_SLUG})`);
    return;
  }

  console.log("inserting demo course…");
  const course = await client.execute({
    sql: `INSERT INTO courses (
      slug, title, description, subject, difficulty,
      price_kobo, currency, pass_score, max_attempts,
      duration_minutes, question_count, is_published, featured
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      DEMO_SLUG,
      "Demo: English Usage",
      "A free, 20-question English usage practice paper. No account or payment required — just open it and take a timed or untimed attempt to see how QUIZMI works.",
      "English",
      "easy",
      0,
      "NGN",
      50,
      NULL,
      15,
      DEMO_QUESTION_COUNT,
      1,
      0,
    ],
  });

  const [row] = course.rows;
  if (!row) throw new Error("demo course insert returned no row");
  const courseId = (row as unknown as { id: number }).id;
  console.log(`course inserted, id=${courseId}`);

  const insertOpts = JSON.stringify((q: (typeof QUESTIONS)[number]) => q.options);
  const insertCorrect = JSON.stringify((q: (typeof QUESTIONS)[number]) => q.correct_index);

  console.log("inserting questions…");
  for (let i = 0; i < QUESTIONS.length; i++) {
    const q = QUESTIONS[i];
    await client.execute({
      sql: `INSERT INTO questions (course_id, prompt, options, correct_index, explanation, marks, "order") VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [
        courseId,
        q.prompt,
        JSON.stringify(q.options),
        q.correct_index,
        q.explanation,
        q.marks,
        i + 1,
      ],
    });
  }

  await client.execute({
    sql: "UPDATE courses SET question_count = ? WHERE id = ?",
    args: [DEMO_QUESTION_COUNT, courseId],
  });

  console.log(`demo course ready: slug=${DEMO_SLUG}, questions=${DEMO_QUESTION_COUNT}`);
  client.close();
}

main().catch((error) => {
  console.error("demo course setup failed:", error);
  client.close();
  process.exit(1);
});
