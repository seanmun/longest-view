-- Longest View leaderboard. Run once in the Neon SQL editor (the database
-- this Vercel project's DATABASE_URL points at). Safe to re-run.
-- The legacy `leaderboard` table belongs to the old 2D game; this is separate.
CREATE TABLE IF NOT EXISTS longest_view_scores (
  id         bigserial PRIMARY KEY,
  name       text        NOT NULL CHECK (char_length(name) BETWEEN 1 AND 12),
  score      integer     NOT NULL CHECK (score BETWEEN 0 AND 30000),
  level      smallint    NOT NULL CHECK (level IN (1, 2)),
  apostles   smallint    NOT NULL DEFAULT 0 CHECK (apostles BETWEEN 0 AND 20),
  seconds    integer     CHECK (seconds BETWEEN 0 AND 86400),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS longest_view_scores_score_idx ON longest_view_scores (score DESC, created_at);
