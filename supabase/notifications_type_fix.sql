-- Allow friend and room notification types (required for friend requests, invites, renames).
-- Safe to re-run.

ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE notifications ADD CONSTRAINT notifications_type_check
  CHECK (type IN ('hangout', 'calendar', 'decision', 'friend', 'room'));
