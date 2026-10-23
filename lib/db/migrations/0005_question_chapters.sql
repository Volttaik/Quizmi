-- Chapter-based question organisation, following Lumio's chapter model.
--
-- questions carry the printed chapter they belong to, so a 1,000-question bank
-- can be browsed and practised chapter by chapter. An attempt records the
-- chapter it was launched from (NULL = the whole course), which keeps results
-- attributable to the chapter that was practised.
--
-- Existing rows default to chapter_number = 0 / chapter_title = '' — "no
-- chapter" — and the app hides chapter controls when no chapter exists.

ALTER TABLE questions ADD COLUMN chapter_number INTEGER NOT NULL DEFAULT 0;
ALTER TABLE questions ADD COLUMN chapter_title TEXT NOT NULL DEFAULT '';

CREATE INDEX IF NOT EXISTS questions_chapter_idx ON questions (course_id, chapter_number);

ALTER TABLE attempts ADD COLUMN chapter_number INTEGER;
