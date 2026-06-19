import { pgTable, text, integer, timestamp, serial, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const flashcardSetsTable = pgTable("flashcard_sets", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  title: text("title").notNull(),
  topic: text("topic").notNull(),
  cards: jsonb("cards").notNull().$type<Array<{ front: string; back: string }>>(),
  count: integer("count").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertFlashcardSetSchema = createInsertSchema(flashcardSetsTable).omit({ id: true, createdAt: true });
export type InsertFlashcardSet = z.infer<typeof insertFlashcardSetSchema>;
export type FlashcardSet = typeof flashcardSetsTable.$inferSelect;
