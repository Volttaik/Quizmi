-- One open attempt per learner per course, even if two start requests race.
CREATE UNIQUE INDEX IF NOT EXISTS attempts_open_unique
  ON attempts (user_id, course_id)
  WHERE status = 'in_progress';

CREATE INDEX IF NOT EXISTS attempts_course_idx ON attempts (course_id);
