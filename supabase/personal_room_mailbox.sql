-- Optional Supabase migration for persistent mailbox notes.
-- Notes also save to browser localStorage if this table is missing.

create table if not exists personal_room_mailbox_notes (
  id text primary key,
  room_id text not null,
  owner_id text not null,
  from_user_id text not null,
  body text not null,
  paper_color text not null default '#fffef0',
  envelope_color text not null default '#c4a574',
  stickers text[] not null default '{}',
  read boolean not null default false,
  in_reply_to_id text,
  created_at timestamptz not null default now()
);

create index if not exists idx_mailbox_owner_room
  on personal_room_mailbox_notes (room_id, owner_id, created_at desc);

alter table personal_room_mailbox_notes enable row level security;

create policy "mailbox read all"
  on personal_room_mailbox_notes for select using (true);

create policy "mailbox insert all"
  on personal_room_mailbox_notes for insert with check (true);

create policy "mailbox update all"
  on personal_room_mailbox_notes for update using (true);
