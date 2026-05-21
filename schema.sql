-- ─────────────────────────────────────────────────────────────────────────────
-- PROF. MARCOS · Tutor de Psiquiatría
-- Script SQL completo para Supabase
-- Ejecutar en: Supabase Dashboard → SQL Editor → New query → Run
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. DOCUMENTOS
-- Cada PDF que sube Nati. El PDF se guarda como base64 en la columna pdf_base64.
create table if not exists documents (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users(id) on delete cascade not null,
  title        text not null,
  mentor_role  text not null default 'socratico',
  notes        text,
  pdf_base64   text,          -- PDF completo en base64 para enviar a Claude
  file_name    text,
  file_size    bigint,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- 2. MENSAJES DE CHAT
-- Historial de conversación por documento
create table if not exists messages (
  id           uuid primary key default gen_random_uuid(),
  document_id  uuid references documents(id) on delete cascade not null,
  user_id      uuid references auth.users(id) on delete cascade not null,
  role         text not null check (role in ('user', 'assistant')),
  content      text not null,
  created_at   timestamptz default now()
);

-- 3. TAREAS
-- Asignadas por el mentor, respondidas y corregidas acá
create table if not exists tasks (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid references auth.users(id) on delete cascade not null,
  document_id        uuid references documents(id) on delete set null,
  title              text not null,
  description        text,
  criteria           text,
  estimated_minutes  int,
  due_date           date,
  status             text not null default 'pending' check (status in ('pending', 'submitted', 'graded')),
  student_answer     text,
  correction         text,
  grade              int check (grade >= 1 and grade <= 10),
  graded_at          timestamptz,
  created_at         timestamptz default now(),
  updated_at         timestamptz default now()
);

-- ─── ÍNDICES ──────────────────────────────────────────────────────────────────
create index if not exists documents_user_id_idx  on documents(user_id);
create index if not exists documents_updated_idx  on documents(updated_at desc);
create index if not exists messages_document_idx  on messages(document_id);
create index if not exists messages_user_idx      on messages(user_id);
create index if not exists messages_created_idx   on messages(created_at);
create index if not exists tasks_user_id_idx      on tasks(user_id);
create index if not exists tasks_status_idx       on tasks(status);
create index if not exists tasks_due_date_idx     on tasks(due_date);

-- ─── ROW LEVEL SECURITY ───────────────────────────────────────────────────────
alter table documents enable row level security;
alter table messages  enable row level security;
alter table tasks     enable row level security;

-- Policies: cada usuario solo ve y modifica sus propios datos
create policy "documents_own" on documents
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "messages_own" on messages
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "tasks_own" on tasks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─── FUNCIÓN: updated_at automático ──────────────────────────────────────────
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger documents_updated_at before update on documents
  for each row execute function update_updated_at();

create trigger tasks_updated_at before update on tasks
  for each row execute function update_updated_at();

-- ─── VERIFICACIÓN ─────────────────────────────────────────────────────────────
-- Corrés esto al final para confirmar que todo está bien:
select table_name from information_schema.tables
where table_schema = 'public'
  and table_name in ('documents', 'messages', 'tasks');

-- ─── CHAT LIBRE ───────────────────────────────────────────────────────────────
-- Tabla separada para el chat espontáneo (sin document_id UUID)
create table if not exists free_chat_messages (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade not null,
  role        text not null check (role in ('user', 'assistant')),
  content     text not null,
  pdf_name    text,
  created_at  timestamptz default now()
);

create index if not exists free_chat_user_idx on free_chat_messages(user_id);
create index if not exists free_chat_created_idx on free_chat_messages(created_at);

alter table free_chat_messages enable row level security;

create policy "free_chat_own" on free_chat_messages
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
