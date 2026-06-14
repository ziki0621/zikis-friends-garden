alter table profiles enable row level security;
alter table rooms enable row level security;
alter table furniture_items enable row level security;
alter table messages enable row level security;
alter table visits enable row level security;
alter table chat_sessions enable row level security;
alter table chat_messages enable row level security;

create policy "Public profiles are readable"
on profiles for select
using (true);

create policy "Users can insert own profile"
on profiles for insert
with check (auth.uid() = id);

create policy "Users can update own profile"
on profiles for update
using (auth.uid() = id);

create policy "Public rooms are readable"
on rooms for select
using (is_public = true or auth.uid() = owner_id);

create policy "Users can create own room"
on rooms for insert
with check (auth.uid() = owner_id);

create policy "Users can update own room"
on rooms for update
using (auth.uid() = owner_id);

create policy "Users can delete own room"
on rooms for delete
using (auth.uid() = owner_id);

create policy "Public furniture is readable"
on furniture_items for select
using (
  exists (
    select 1 from rooms
    where rooms.id = furniture_items.room_id
    and (rooms.is_public = true or rooms.owner_id = auth.uid())
  )
);

create policy "Room owners can manage furniture"
on furniture_items for all
using (
  exists (
    select 1 from rooms
    where rooms.id = furniture_items.room_id
    and rooms.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from rooms
    where rooms.id = furniture_items.room_id
    and rooms.owner_id = auth.uid()
  )
);

create policy "Public messages are readable"
on messages for select
using (is_public = true);

create policy "Logged in users can create messages"
on messages for insert
with check (auth.uid() = author_id);

create policy "Authors and room owners can delete messages"
on messages for delete
using (
  auth.uid() = author_id
  or exists (
    select 1 from rooms
    where rooms.id = messages.room_id
    and rooms.owner_id = auth.uid()
  )
);

create policy "Public visits are readable"
on visits for select
using (true);

create policy "Logged in users can create visits"
on visits for insert
with check (auth.uid() = visitor_id or visitor_id is null);

create policy "Users can read own chat sessions"
on chat_sessions for select
using (auth.uid() = user_id);

create policy "Users can manage own chat sessions"
on chat_sessions for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can read own chat messages"
on chat_messages for select
using (
  exists (
    select 1 from chat_sessions
    where chat_sessions.id = chat_messages.session_id
    and chat_sessions.user_id = auth.uid()
  )
);

create policy "Users can manage own chat messages"
on chat_messages for all
using (
  exists (
    select 1 from chat_sessions
    where chat_sessions.id = chat_messages.session_id
    and chat_sessions.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from chat_sessions
    where chat_sessions.id = chat_messages.session_id
    and chat_sessions.user_id = auth.uid()
  )
);
