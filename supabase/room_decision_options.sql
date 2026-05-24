-- Optional: run in Supabase SQL editor if you want decision setup synced across browsers/users.
-- The app works without this table (uses localStorage per browser).

CREATE TABLE IF NOT EXISTS room_decision_options (
  room_id UUID PRIMARY KEY REFERENCES rooms(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT '',
  options JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE room_decision_options ENABLE ROW LEVEL SECURITY;

-- Adjust policies to match your project's RLS pattern if needed.
CREATE POLICY "room_decision_options read" ON room_decision_options
  FOR SELECT USING (true);

CREATE POLICY "room_decision_options write" ON room_decision_options
  FOR ALL USING (true) WITH CHECK (true);
