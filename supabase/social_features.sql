-- Run in Supabase SQL editor for room invites, name-change approvals, and presence status.

ALTER TABLE users ADD COLUMN IF NOT EXISTS presence_status text NOT NULL DEFAULT 'offline'
  CHECK (presence_status IN ('online', 'idle', 'offline'));

CREATE TABLE IF NOT EXISTS room_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  from_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  to_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS room_invites_pending_unique
  ON room_invites (room_id, to_user_id)
  WHERE status = 'pending';

CREATE TABLE IF NOT EXISTS room_name_change_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  proposed_name text NOT NULL,
  proposed_by_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'declined')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS room_name_change_approvals (
  request_id uuid NOT NULL REFERENCES room_name_change_requests(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  decision text NOT NULL DEFAULT 'pending' CHECK (decision IN ('pending', 'approved', 'declined')),
  decided_at timestamptz,
  PRIMARY KEY (request_id, user_id)
);

-- Row Level Security (app uses anon key + custom auth, not Supabase Auth)
ALTER TABLE room_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_name_change_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_name_change_approvals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "room_invites all" ON room_invites;
CREATE POLICY "room_invites all" ON room_invites
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "room_name_change_requests all" ON room_name_change_requests;
CREATE POLICY "room_name_change_requests all" ON room_name_change_requests
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "room_name_change_approvals all" ON room_name_change_approvals;
CREATE POLICY "room_name_change_approvals all" ON room_name_change_approvals
  FOR ALL USING (true) WITH CHECK (true);

-- Allow friend/room notification types
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check
  CHECK (type IN ('hangout', 'calendar', 'decision', 'friend', 'room'));
