-- Tracks who is physically inside each member's personal room (0 or 1 guest).
-- Approved access stays in personal_room_access; this table is presence only.

create table if not exists personal_room_active_guest (
  room_id text not null,
  owner_id text not null,
  guest_user_id text,
  primary key (room_id, owner_id)
);

alter table personal_room_active_guest enable row level security;

create policy "personal_room_active_guest_all"
  on personal_room_active_guest for all
  using (true)
  with check (true);
