-- Run this if you already created the tables and get RLS policy errors.
-- Safe to re-run (drops and recreates policies).

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
