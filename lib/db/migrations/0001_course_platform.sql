-- Quizme course platform: initial schema.
-- Applied once by scripts/src/migrate.ts and recorded in _migrations.

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  clerk_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL DEFAULT 'Learner',
  email TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE IF NOT EXISTS courses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  subject TEXT,
  difficulty TEXT NOT NULL DEFAULT 'medium',
  price_kobo INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'NGN',
  pass_score INTEGER NOT NULL DEFAULT 50,
  max_attempts INTEGER,
  duration_minutes INTEGER,
  question_count INTEGER NOT NULL DEFAULT 0,
  is_published INTEGER NOT NULL DEFAULT 1,
  featured INTEGER NOT NULL DEFAULT 0,
  cover_image_url TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE INDEX IF NOT EXISTS courses_published_idx ON courses (is_published, featured);
CREATE INDEX IF NOT EXISTS courses_subject_idx ON courses (subject);

CREATE TABLE IF NOT EXISTS questions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  course_id INTEGER NOT NULL REFERENCES courses (id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  options TEXT NOT NULL,
  correct_index INTEGER NOT NULL DEFAULT 0,
  explanation TEXT,
  reference TEXT,
  image_url TEXT,
  marks INTEGER NOT NULL DEFAULT 1,
  order_index INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS questions_course_idx ON questions (course_id, order_index);

CREATE TABLE IF NOT EXISTS payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reference TEXT NOT NULL UNIQUE,
  user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  course_id INTEGER NOT NULL REFERENCES courses (id) ON DELETE CASCADE,
  amount_kobo INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'NGN',
  status TEXT NOT NULL DEFAULT 'pending',
  provider TEXT NOT NULL DEFAULT 'paystack',
  provider_reference TEXT,
  paid_at TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE INDEX IF NOT EXISTS payments_user_idx ON payments (user_id);
CREATE INDEX IF NOT EXISTS payments_course_idx ON payments (course_id);

CREATE TABLE IF NOT EXISTS purchases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  course_id INTEGER NOT NULL REFERENCES courses (id) ON DELETE CASCADE,
  payment_id INTEGER REFERENCES payments (id) ON DELETE SET NULL,
  amount_kobo INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'NGN',
  purchased_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE UNIQUE INDEX IF NOT EXISTS purchases_user_course_unique ON purchases (user_id, course_id);
CREATE INDEX IF NOT EXISTS purchases_course_idx ON purchases (course_id);

CREATE TABLE IF NOT EXISTS attempts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  course_id INTEGER NOT NULL REFERENCES courses (id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'in_progress',
  started_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  expires_at TEXT,
  duration_minutes INTEGER,
  question_ids TEXT NOT NULL DEFAULT '[]',
  answers TEXT NOT NULL DEFAULT '[]',
  departures INTEGER NOT NULL DEFAULT 0,
  last_departure_at TEXT,
  last_seen_at TEXT,
  violation_log TEXT NOT NULL DEFAULT '[]',
  submitted_at TEXT,
  score INTEGER NOT NULL DEFAULT 0,
  total_marks INTEGER NOT NULL DEFAULT 0,
  percentage INTEGER NOT NULL DEFAULT 0,
  passed INTEGER NOT NULL DEFAULT 0,
  time_taken_seconds INTEGER,
  termination_reason TEXT
);

CREATE INDEX IF NOT EXISTS attempts_user_course_idx ON attempts (user_id, course_id);
CREATE INDEX IF NOT EXISTS attempts_user_status_idx ON attempts (user_id, status);
CREATE INDEX IF NOT EXISTS attempts_status_idx ON attempts (status);
