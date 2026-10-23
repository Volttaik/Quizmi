-- How the learner chose to review this attempt:
--   instant = submit each answer and see correctness immediately
--   end     = answer freely and see the score only after finishing
-- Existing attempts were all graded answer-by-answer, so instant is the
-- correct default for historical rows.
ALTER TABLE attempts ADD COLUMN result_mode TEXT NOT NULL DEFAULT 'instant';
