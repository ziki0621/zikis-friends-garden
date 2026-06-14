create extension if not exists pgcrypto;

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nickname text not null,
  bio text,
  avatar_config jsonb not null default '{}',
  personality_tag text,
  favorite_color text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists rooms (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles(id) on delete cascade,
  name text not null default '我的小房间',
  description text,
  theme text not null default 'cozy',
  layout jsonb not null default '{}',
  is_public boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists furniture_items (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms(id) on delete cascade,
  type text not null,
  label text,
  x integer not null default 0,
  y integer not null default 0,
  rotation integer not null default 0,
  metadata jsonb not null default '{}',
  created_at timestamptz default now()
);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references rooms(id) on delete cascade,
  author_id uuid references profiles(id) on delete set null,
  author_name text,
  content text not null,
  is_public boolean not null default true,
  created_at timestamptz default now()
);

create table if not exists visits (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references rooms(id) on delete cascade,
  visitor_id uuid references profiles(id) on delete set null,
  visitor_name text,
  created_at timestamptz default now()
);

create table if not exists chat_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete set null,
  title text default '和 ziki 的聊天',
  created_at timestamptz default now()
);

create table if not exists chat_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references chat_sessions(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  created_at timestamptz default now()
);

create index if not exists rooms_owner_id_idx on rooms(owner_id);
create index if not exists messages_room_id_created_at_idx on messages(room_id, created_at desc);
create index if not exists visits_room_id_created_at_idx on visits(room_id, created_at desc);
